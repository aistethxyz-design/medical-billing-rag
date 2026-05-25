import fs from 'fs';
import path from 'path';

export interface OhipCodeEntry {
  code: string;
  description: string;
  how_to_use: string;
  amount: number;
  time_of_day: string[];
}

let cache: OhipCodeEntry[] | null = null;

function loadCodes(): OhipCodeEntry[] {
  if (cache) return cache;
  const codesPath = path.join(__dirname, '../../../RAG/Codes_by_class.json');
  if (!fs.existsSync(codesPath)) {
    cache = [];
    return cache;
  }
  const raw = JSON.parse(fs.readFileSync(codesPath, 'utf-8')) as OhipCodeEntry[];
  // Merge duplicate codes — keep highest amount variant
  const byCode = new Map<string, OhipCodeEntry>();
  for (const entry of raw) {
    const existing = byCode.get(entry.code);
    if (!existing || entry.amount > existing.amount) {
      byCode.set(entry.code, entry);
    }
  }
  cache = [...byCode.values()];
  return cache;
}

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'with', 'is', 'was', 'are', 'be', 'by', 'at', 'from', 'as', 'if', 'during', 'visit', 'encounter', 'patient', 'bill', 'code']);

function tokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t));
}

function currentTimeSlot(): string {
  const h = new Date().getHours();
  const d = new Date().getDay();
  if (d === 0 || d === 6) return 'Weekend';
  if (h >= 0 && h < 8) return 'Night';
  if (h >= 8 && h < 17) return 'Day';
  return 'Evening';
}

function complaintBoost(code: OhipCodeEntry, docText: string): number {
  const h = `${code.description} ${code.how_to_use} ${code.code}`.toLowerCase();
  let boost = 0;

  const rules: [RegExp, () => number][] = [
    [/chest\s*pain|cardiac|acs|angina|troponin|mi\b|stemi|nstemi/i, () => {
      if (/^H1[0-9]{2}/.test(code.code)) return 12;
      if (code.code === 'K005' || h.includes('ecg')) return 10;
      if (h.includes('cardiovascular') || h.includes('comprehensive')) return 8;
      return 0;
    }],
    [/abdominal|abdomen|belly|nausea|vomit/i, () => (/^H1[0-9]{2}/.test(code.code) ? 10 : 0)],
    [/laceration|lacerat|suture|wound|cut\b|repair/i, () => (h.includes('suture') || h.includes('laceration') || h.includes('repair') || code.code.startsWith('Z') ? 12 : 0)],
    [/fracture|broken\s+bone|dislocation/i, () => (code.code.startsWith('F') || code.code.startsWith('D') ? 12 : 0)],
    [/respiratory|uri| cough|shortness|breath|sob\b/i, () => (/^H10[0-9]/.test(code.code) || h.includes('respiratory') ? 8 : 0)],
    [/psych|form\s*1|mental|suicidal/i, () => (code.code === 'K623' || h.includes('form 1') ? 15 : 0)],
    [/smoking|tobacco|cessation/i, () => (code.code.startsWith('K02') ? 12 : 0)],
    [/iv\b|intravenous|fluid/i, () => (code.code === 'K002' || h.includes('iv') ? 10 : 0)],
  ];

  for (const [re, fn] of rules) {
    if (re.test(docText)) boost += fn();
  }
  return boost;
}

function scoreCode(code: OhipCodeEntry, docTokens: Set<string>, docText: string, timeSlot?: string): number {
  let score = 0;
  const haystack = `${code.description} ${code.how_to_use} ${code.code}`.toLowerCase();

  for (const t of docTokens) {
    if (haystack.includes(t)) score += 2;
  }

  if (docText.toUpperCase().includes(code.code)) score += 15;

  score += complaintBoost(code, docText);

  const boosts: [RegExp, string][] = [
    [/assessment|examined|evaluation/i, 'assessment'],
    [/laceration|suture|repair/i, 'suture'],
    [/form\s*1|psychiatric/i, 'form'],
    [/smoking|cessation/i, 'smoking'],
    [/iv\b|intravenous/i, 'iv'],
    [/ecg|electrocardiogram/i, 'ecg'],
    [/telemedicine|virtual|video/i, 'telemedicine'],
    [/fracture/i, 'fracture'],
    [/consult/i, 'consult'],
  ];
  for (const [re, keyword] of boosts) {
    if (re.test(docText) && haystack.includes(keyword)) score += 5;
  }

  const slot = timeSlot || currentTimeSlot();
  if (code.time_of_day.length === 0) score += 1;
  else if (code.time_of_day.some((t) => t.toLowerCase() === slot.toLowerCase())) score += 6;

  return score;
}

export function matchCodesFromText(
  text: string,
  limit = 12,
  timeSlot?: string
): Array<OhipCodeEntry & { score: number; timeOfDay?: string }> {
  if (!text.trim()) return [];
  const codes = loadCodes();
  const docTokens = new Set(tokens(text));
  const docText = text;

  const scored = codes
    .map((c) => ({
      ...c,
      score: scoreCode(c, docTokens, docText, timeSlot),
      timeOfDay: c.time_of_day[0],
    }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || b.amount - a.amount)
    .slice(0, limit);

  return scored;
}

export function lookupCode(code: string): OhipCodeEntry | undefined {
  return loadCodes().find((c) => c.code.toUpperCase() === code.toUpperCase());
}
