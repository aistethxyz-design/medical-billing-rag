"""
OHIP billing RAG — hybrid retrieval (BM25 + TF-IDF) + Cohere generation.

Stages:
  1) Augmentation — merge duplicate codes across time-of-day, build search corpus.
  2) Retrieval    — BM25 + TF-IDF fused with Reciprocal Rank Fusion, plus a
                    direct-code-match boost and an optional time-of-day filter.
  3) Generation   — Cohere chat-with-documents using a strict, grounded prompt.
  4) Presentation — Rich-formatted panels, tables and citations in the terminal.

Run modes:
  python cohere_RAG.py                 # interactive REPL
  python cohere_RAG.py "your question" # one-shot
  python cohere_RAG.py --json "..."    # JSON output (good for the web app)

API key: set COHERE_API_KEY in the environment or RAG/.env (never commit .env).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import cohere
import numpy as np
from dotenv import load_dotenv
from rank_bm25 import BM25Okapi
from rich.console import Console

# Make sure Unicode (rich box drawing) prints on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:  # noqa: BLE001
        pass
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
HERE = Path(__file__).resolve().parent
CODES_PATH = HERE / "Codes_by_class.json"
ENV_PATH = HERE / ".env"

TOP_K_RETRIEVE = 30   # candidates from each retriever before fusion
TOP_K_FINAL = 8       # merged docs passed to the LLM
MODEL = "command-a-03-2025"

console = Console()

# ─────────────────────────────────────────────────────────────────────────────
# Cohere client
# ─────────────────────────────────────────────────────────────────────────────
load_dotenv(ENV_PATH)
_API_KEY = (os.environ.get("COHERE_API_KEY") or "").strip()
if not _API_KEY:
    console.print(
        Panel.fit(
            f"[red]Missing COHERE_API_KEY[/red]\n\n"
            f"Create [bold]{ENV_PATH}[/bold] with:\n"
            f"  COHERE_API_KEY=your_key\n\n"
            "Keys: https://dashboard.cohere.com/api-keys",
            title="Configuration error",
            border_style="red",
        )
    )
    sys.exit(1)

co = cohere.ClientV2(_API_KEY)


# ─────────────────────────────────────────────────────────────────────────────
# 1) Augmentation — merge by code, normalize time-slot, build text corpus
# ─────────────────────────────────────────────────────────────────────────────
TIME_SLOT_PRIORITY = ["Day", "Evening", "Night", "Weekend", "Holiday", "AfterHours"]

# A loose code pattern: letter(s) + digits, e.g. A003, H152, E412, K198, Z176
CODE_RE = re.compile(r"\b([A-Z]{1,2}\d{2,4}[A-Z]?)\b")

_TOKEN_RE = re.compile(r"[a-z0-9]+", re.IGNORECASE)
_STOP = {
    "the", "and", "for", "with", "from", "this", "that", "a", "an", "of", "to",
    "in", "on", "at", "by", "or", "is", "are", "be", "as", "it", "i", "we",
    "my", "you", "your", "use", "used", "when", "how", "what", "which", "ohip",
    "code", "codes", "billing", "bill", "patient", "patients",
}


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_RE.findall(text or "") if t.lower() not in _STOP]


@dataclass
class Rate:
    slot: str           # "Day" | "Evening" | "Night" | "Weekend" | "Holiday" | "Unspecified"
    amount: float | None
    amount_raw: str
    note: str           # how_to_use for this row
    bonus: dict | None = None


@dataclass
class MergedDoc:
    code: str
    description: str
    how_to_use: str           # union of unique how-to-use notes
    rates: list[Rate] = field(default_factory=list)
    category: str = ""        # rough class derived from code letter
    search_text: str = ""     # flattened text used for BM25 / TF-IDF


def _pick_slot_label(row: dict) -> str:
    tod = row.get("time_of_day") or []
    if not tod:
        return "Unspecified"
    # Prefer the most specific labels first
    for label in TIME_SLOT_PRIORITY:
        if label in tod:
            return label
    return tod[0]


def _category_for(code: str) -> str:
    if not code:
        return "Other"
    head = code[0].upper()
    return {
        "A": "Assessment",
        "B": "Telemedicine",
        "C": "Anesthesia",
        "D": "Dislocation",
        "E": "Premium / Bonus",
        "F": "Fracture",
        "G": "Critical Care / Procedure",
        "H": "Emergency Assessment",
        "J": "Imaging / Investigation",
        "K": "Consultation / Forms",
        "M": "Maternity",
        "P": "Pediatric",
        "R": "Repair",
        "S": "Surgery",
        "T": "Therapy",
        "Z": "Procedure / Surgery",
    }.get(head, "Other")


def load_and_merge(path: Path) -> list[MergedDoc]:
    raw_rows = json.loads(path.read_text(encoding="utf-8"))
    by_code: dict[str, MergedDoc] = {}

    for row in raw_rows:
        code = (row.get("code") or "").strip()
        if not code:
            continue
        desc = (row.get("description") or "").strip()
        how = (row.get("how_to_use") or "").strip()
        amount = row.get("amount")
        amount_raw = row.get("amount_raw") or ""
        bonus = row.get("bonus")
        slot = _pick_slot_label(row)

        doc = by_code.get(code)
        if doc is None:
            doc = MergedDoc(
                code=code,
                description=desc,
                how_to_use=how,
                category=_category_for(code),
            )
            by_code[code] = doc
        else:
            # Prefer the longest description (more informative)
            if len(desc) > len(doc.description):
                doc.description = desc
            # Accumulate distinct how-to-use notes
            if how and how not in doc.how_to_use:
                doc.how_to_use = (doc.how_to_use + " | " + how).strip(" |") if doc.how_to_use else how

        doc.rates.append(
            Rate(
                slot=slot,
                amount=float(amount) if isinstance(amount, (int, float)) else None,
                amount_raw=amount_raw,
                note=how,
                bonus=bonus if isinstance(bonus, dict) else None,
            )
        )

    # Build the search corpus for each doc
    merged = list(by_code.values())
    for d in merged:
        parts = [d.code, d.description, d.how_to_use, d.category]
        for r in d.rates:
            parts.append(r.slot)
            parts.append(r.note)
        d.search_text = " ".join(p for p in parts if p)

    return merged


# ─────────────────────────────────────────────────────────────────────────────
# 2) Retrieval — BM25 + TF-IDF, fused with RRF
# ─────────────────────────────────────────────────────────────────────────────
class HybridRetriever:
    def __init__(self, docs: list[MergedDoc]):
        self.docs = docs
        self.code_index: dict[str, int] = {d.code.upper(): i for i, d in enumerate(docs)}

        tokens = [tokenize(d.search_text) for d in docs]
        self.bm25 = BM25Okapi(tokens)

        self.tfidf = TfidfVectorizer(
            lowercase=True,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.9,
        )
        self.tfidf_matrix = self.tfidf.fit_transform([d.search_text for d in docs])

    def _bm25_top(self, query: str, k: int) -> list[int]:
        scores = self.bm25.get_scores(tokenize(query))
        return list(np.argsort(scores)[::-1][:k])

    def _tfidf_top(self, query: str, k: int) -> list[int]:
        qv = self.tfidf.transform([query])
        sims = cosine_similarity(qv, self.tfidf_matrix).ravel()
        return list(np.argsort(sims)[::-1][:k])

    @staticmethod
    def _rrf(rankings: list[list[int]], k: int = 60) -> dict[int, float]:
        """Reciprocal Rank Fusion: well-known, simple, robust."""
        scores: dict[int, float] = {}
        for ranking in rankings:
            for rank, idx in enumerate(ranking):
                scores[idx] = scores.get(idx, 0.0) + 1.0 / (k + rank + 1)
        return scores

    def retrieve(
        self,
        query: str,
        top_k: int = TOP_K_FINAL,
        candidates: int = TOP_K_RETRIEVE,
        time_slot: str | None = None,
    ) -> list[tuple[MergedDoc, float, list[str]]]:
        """Return [(doc, fused_score, ['why' tags])] sorted desc."""
        # 1) Both retrievers
        bm = self._bm25_top(query, candidates)
        tf = self._tfidf_top(query, candidates)
        fused = self._rrf([bm, tf])

        why: dict[int, list[str]] = {i: [] for i in fused}
        for i in bm[:5]:
            why.setdefault(i, []).append("BM25")
        for i in tf[:5]:
            why.setdefault(i, []).append("TF-IDF")

        # 2) Direct code-match boost
        for token in CODE_RE.findall(query.upper()):
            idx = self.code_index.get(token)
            if idx is not None:
                fused[idx] = fused.get(idx, 0.0) + 1.0  # large bump
                why.setdefault(idx, []).append(f"exact:{token}")

        # 3) Time-of-day soft boost
        if time_slot:
            ts = time_slot.lower()
            for idx in list(fused.keys()):
                if any(r.slot.lower() == ts for r in self.docs[idx].rates):
                    fused[idx] += 0.15
                    why.setdefault(idx, []).append(f"slot:{time_slot}")

        ranked = sorted(fused.items(), key=lambda kv: kv[1], reverse=True)[:top_k]
        return [(self.docs[i], s, why.get(i, [])) for i, s in ranked]


# ─────────────────────────────────────────────────────────────────────────────
# Query understanding — extract time-of-day, code mentions
# ─────────────────────────────────────────────────────────────────────────────
_TIME_KEYWORDS = {
    "Night": [
        r"\bnight\b", r"\bovernight\b", r"\bmidnight\b",
        r"\bafter\s+midnight\b", r"\b(?:past|after)\s+\d{1,2}\s*(?:am)\b",
        r"\b0000\s*-\s*0[78]00\b", r"\b2400\s*-\s*0700\b",
    ],
    "Evening": [r"\bevening\b", r"\bafter[- ]?hours?\b", r"\b1700\s*-\s*0000\b", r"\b1800\s*-\s*2400\b"],
    "Weekend": [r"\bweekend\b", r"\bsaturday\b", r"\bsunday\b"],
    "Holiday": [r"\bholidays?\b", r"\bstat holiday\b"],
    "Day": [r"\bday(?:time)?\b", r"\bweekday(?:s)?\b", r"\b0800\s*-\s*1700\b", r"\bmon[-\s]?fri\b"],
}


def detect_time_slot(query: str) -> str | None:
    q = query.lower()
    # Priority order: more specific first
    for slot in ["Night", "Weekend", "Holiday", "Evening", "Day"]:
        for pat in _TIME_KEYWORDS[slot]:
            if re.search(pat, q):
                return slot
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Rendering — turn merged docs into LLM-friendly natural language
# ─────────────────────────────────────────────────────────────────────────────
def render_doc_for_llm(doc: MergedDoc) -> dict:
    """Return a Cohere V2 document {id, data:{...}} with prose fields."""
    rate_lines: list[str] = []
    for r in sorted(doc.rates, key=lambda x: TIME_SLOT_PRIORITY.index(x.slot) if x.slot in TIME_SLOT_PRIORITY else 99):
        amt = f"${r.amount:.2f} CAD" if r.amount is not None else r.amount_raw or "(no fee listed)"
        bonus = ""
        if r.bonus and isinstance(r.bonus, dict) and r.bonus.get("value") is not None:
            bonus = f" ({r.bonus.get('value')}% bonus)"
        line = f"  - {r.slot}: {amt}{bonus}"
        if r.note and r.note.lower() not in doc.how_to_use.lower():
            line += f" — {r.note}"
        rate_lines.append(line)

    body = (
        f"OHIP code {doc.code} — {doc.description}\n"
        f"Category: {doc.category}\n"
        f"How to use: {doc.how_to_use or '(no extra notes)'}\n"
        f"Rates:\n" + "\n".join(rate_lines)
    )
    return {
        "id": doc.code,
        "data": {
            "code": doc.code,
            "description": doc.description,
            "category": doc.category,
            "text": body,
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3) Generation
# ─────────────────────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an Ontario (OHIP) medical-billing assistant for emergency physicians.

RULES
1. Answer ONLY from the provided documents. If the documents do not contain the answer, say so plainly — do not invent codes or rates.
2. Always cite by the OHIP code (e.g. H152) when stating a recommendation.
3. Prefer the rate matching the user's time-of-day if specified; if multiple slots apply, show a small comparison.
4. Structure every answer as Markdown with this skeleton:

   ## Primary recommendation
   <one-sentence answer with the code(s)>

   ## Rate(s)
   | Code | Description | Time | Amount |
   |------|-------------|------|--------|
   | ...  | ...         | ...  | ...    |

   ## Why this code
   <one short paragraph grounded in the documents>

   ## Add-ons / premiums to consider
   - bullet list of optional codes (only if the documents mention them as add-ons or after-hours premiums)

   ## Documentation notes
   <if the documents mention what to chart; otherwise omit this section>

5. Keep the total response under ~250 words. Be precise, not verbose.
"""


def generate(query: str, retrieved: list[tuple[MergedDoc, float, list[str]]]) -> tuple[str, list]:
    documents = [render_doc_for_llm(d) for d, _, _ in retrieved]
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": query},
    ]
    response = co.chat(
        model=MODEL,
        messages=messages,
        documents=documents,
        temperature=0.2,
    )
    text = response.message.content[0].text if response.message.content else ""
    citations = response.message.citations or []
    return text, citations


# ─────────────────────────────────────────────────────────────────────────────
# 4) Presentation
# ─────────────────────────────────────────────────────────────────────────────
def show_results(
    query: str,
    time_slot: str | None,
    retrieved: list[tuple[MergedDoc, float, list[str]]],
    answer: str,
    citations: list,
) -> None:
    header = f"[bold]{query}[/bold]"
    if time_slot:
        header += f"\n[dim]Detected time-of-day:[/dim] [cyan]{time_slot}[/cyan]"
    console.print(Panel(header, title="Question", border_style="cyan"))

    console.print(Panel(Markdown(answer or "(no answer returned)"), title="Answer", border_style="green"))

    # Retrieval table
    rtable = Table(title=f"Retrieved context (top {len(retrieved)})", show_lines=False)
    rtable.add_column("Code", style="bold magenta")
    rtable.add_column("Description", overflow="fold", max_width=42)
    rtable.add_column("Category", style="cyan")
    rtable.add_column("Slots", style="yellow")
    rtable.add_column("Score", justify="right")
    rtable.add_column("Why", style="dim")
    for doc, score, why in retrieved:
        slots = ", ".join(sorted({r.slot for r in doc.rates}))
        rtable.add_row(
            doc.code,
            doc.description[:80] + ("…" if len(doc.description) > 80 else ""),
            doc.category,
            slots,
            f"{score:.3f}",
            ", ".join(why) or "-",
        )
    console.print(rtable)

    # Citations
    if citations:
        cited_codes: dict[str, dict] = {}
        for c in citations:
            for s in c.sources or []:
                doc = getattr(s, "document", {}) or {}
                cid = doc.get("id") or doc.get("code") or ""
                if cid and cid not in cited_codes:
                    cited_codes[cid] = doc
        if cited_codes:
            ctable = Table(title="Cited by the model", show_lines=False)
            ctable.add_column("Code", style="bold magenta")
            ctable.add_column("Description", overflow="fold")
            for cid, doc in cited_codes.items():
                ctable.add_row(cid, doc.get("description", ""))
            console.print(ctable)


def show_json(
    query: str,
    time_slot: str | None,
    retrieved: list[tuple[MergedDoc, float, list[str]]],
    answer: str,
    citations: list,
) -> None:
    payload = {
        "query": query,
        "time_slot": time_slot,
        "answer_markdown": answer,
        "retrieved": [
            {
                "code": d.code,
                "description": d.description,
                "category": d.category,
                "score": round(s, 4),
                "why": why,
                "rates": [
                    {"slot": r.slot, "amount": r.amount, "amount_raw": r.amount_raw, "note": r.note}
                    for r in d.rates
                ],
            }
            for d, s, why in retrieved
        ],
        "citations": [
            {
                "text": c.text,
                "sources": [
                    {"id": (getattr(s, "document", {}) or {}).get("id", "")}
                    for s in (c.sources or [])
                ],
            }
            for c in citations
        ],
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def answer_query(retriever: HybridRetriever, query: str, slot_override: str | None = None) -> tuple[
    str | None,
    list[tuple[MergedDoc, float, list[str]]],
    str,
    list,
]:
    slot = slot_override or detect_time_slot(query)
    retrieved = retriever.retrieve(query, top_k=TOP_K_FINAL, time_slot=slot)
    text, citations = generate(query, retrieved)
    return slot, retrieved, text, citations


def main() -> None:
    parser = argparse.ArgumentParser(description="OHIP billing RAG (Cohere)")
    parser.add_argument("query", nargs="?", help="Question. Omit to enter interactive mode.")
    parser.add_argument("--slot", help="Force time slot: Day | Evening | Night | Weekend | Holiday")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of pretty terminal output")
    parser.add_argument("--top-k", type=int, default=TOP_K_FINAL, help=f"Docs passed to LLM (default {TOP_K_FINAL})")
    args = parser.parse_args()

    with console.status("[cyan]Loading and indexing OHIP codebook…", spinner="dots"):
        docs = load_and_merge(CODES_PATH)
        retriever = HybridRetriever(docs)
    if not args.json:
        console.print(f"[green]Indexed[/green] [bold]{len(docs)}[/bold] unique OHIP codes from [dim]{CODES_PATH.name}[/dim]\n")

    def run_one(q: str) -> None:
        if args.json:
            slot, retrieved, text, citations = answer_query(retriever, q, args.slot)
            show_json(q, slot, retrieved, text, citations)
        else:
            with console.status("[blue]Retrieving and asking the model…", spinner="dots"):
                slot, retrieved, text, citations = answer_query(retriever, q, args.slot)
            show_results(q, slot, retrieved, text, citations)

    if args.query:
        run_one(args.query)
        return

    # Interactive REPL
    console.print(
        Panel(
            "Type an OHIP billing question. Examples:\n"
            "  • Best code for a comprehensive ER assessment on a weekend night\n"
            "  • What add-on premiums apply for H152 after midnight?\n"
            "  • Which code do I bill for a cardiac arrest?\n\n"
            "Commands: [bold]:quit[/bold] to exit",
            title="OHIP RAG — interactive",
            border_style="cyan",
        )
    )
    while True:
        try:
            q = console.input("[bold cyan]?[/bold cyan] ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]bye[/dim]")
            return
        if not q:
            continue
        if q.lower() in {":quit", ":q", "quit", "exit"}:
            console.print("[dim]bye[/dim]")
            return
        try:
            run_one(q)
        except Exception as e:  # noqa: BLE001
            console.print(Panel(f"[red]{type(e).__name__}: {e}[/red]", title="Error", border_style="red"))


if __name__ == "__main__":
    main()
