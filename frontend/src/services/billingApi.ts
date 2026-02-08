/**
 * Billing API service — connects the frontend to the backend
 * /api/billing/* endpoints, with full LOCAL FALLBACK when backend
 * is unreachable (e.g. frontend deployed on Cloudflare Pages).
 *
 * The local fallback loads Codes_by_class.csv from /data/billing-codes.csv
 * and performs TF-IDF search + time-of-day logic entirely in the browser.
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Types ──

export interface BillingCode {
  code: string;
  description: string;
  amount: number;
  category: string;
  timeOfDay?: string;
  howToUse: string;
  isPrimary?: boolean;
  isAddOn?: boolean;
}

export interface OptimizationSuggestion {
  suggestedCode: BillingCode;
  reason: string;
  revenueImpact: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  documentation: string[];
  codeRole: 'PRIMARY' | 'ADD_ON' | 'PREMIUM';
}

export interface BillingAnalysis {
  suggestedCodes: BillingCode[];
  optimizations: OptimizationSuggestion[];
  revenueAnalysis: {
    currentRevenue: number;
    potentialRevenue: number;
    revenueIncrease: number;
    percentageIncrease: number;
  };
  riskAssessment: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    complianceScore: number;
  };
  documentation: {
    required: string[];
    recommended: string[];
    missing: string[];
  };
  explanation: string;
  confidence: number;
  timeSlot: string;
  primaryCode: BillingCode | null;
  addOnCodes: BillingCode[];
  premiumCodes: BillingCode[];
}

export interface AnalyzeRequest {
  clinicalText: string;
  encounterType?: string;
  patientAge?: string;
  timeOfDay?: string;
  specialty?: string;
  existingCodes?: string[];
  maxSuggestions?: number;
}

export interface SearchRequest {
  q: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  timeOfDay?: string;
}

// ════════════════════════════════════════════════════════
// LOCAL CSV FALLBACK ENGINE
// ════════════════════════════════════════════════════════

let localCodes: BillingCode[] = [];
let localLoaded = false;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(raw: string): number {
  if (!raw) return 0;
  const m = raw.match(/\$?([\d,]+(?:\.\d+)?)/);
  return m ? parseFloat(m[1].replace(/,/g, '')) : 0;
}

function categorizeCode(code: string): string {
  const p = code.charAt(0);
  switch (p) {
    case 'A': return 'Assessment';
    case 'H': return 'Emergency';
    case 'G': return 'Critical Care / Procedure';
    case 'K': return 'Consultation / Forms';
    case 'E': return 'Premium';
    case 'B': return 'Telemedicine';
    case 'Z': return 'Procedure / Surgery';
    case 'F': return 'Fracture';
    case 'D': return 'Dislocation';
    case 'R': return 'Repair';
    case 'M': return 'Major Surgery';
    case 'P': return 'Obstetrics';
    default: return 'Other';
  }
}

function detectTimeOfDay(howToUse: string, desc: string): string | undefined {
  const text = `${howToUse} ${desc}`.toLowerCase();
  if (text.includes('weekend') || text.includes('holiday')) return 'Weekend';
  if (text.includes('night') || text.includes('0000-0800') || text.includes('midnight')) return 'Night';
  if (text.includes('evening') || text.includes('1700-0000') || text.includes('after hours') || text.includes('17:00')) return 'Evening';
  if (text.includes('0800-1700') || text.includes('mon-fri') || text.includes('weekday') || text.includes('daytime')) return 'Day';
  return undefined;
}

function determineCodeRole(code: string): 'PRIMARY' | 'ADD_ON' | 'PREMIUM' {
  const upper = code.toUpperCase();
  if (upper.startsWith('E')) return 'PREMIUM';
  if (/^H1[0-5]\d$/.test(upper)) return 'PRIMARY';
  if (/^G(521|523|522|395|391)$/.test(upper)) return 'PRIMARY';
  if (/^A\d{3}/.test(upper)) return 'PRIMARY';
  return 'ADD_ON';
}

async function loadLocalCodes(): Promise<BillingCode[]> {
  if (localLoaded) return localCodes;

  const paths = ['/app/data/billing-codes.csv', '/data/billing-codes.csv'];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (res.ok) {
        const text = await res.text();
        localCodes = parseCSV(text);
        localLoaded = true;
        return localCodes;
      }
    } catch { /* try next */ }
  }

  console.warn('[BillingAPI] Could not load billing codes CSV');
  localCodes = [];
  localLoaded = true;
  return localCodes;
}

function parseCSV(csvText: string): BillingCode[] {
  const lines = csvText.split('\n');
  const codes: BillingCode[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCSVLine(line);
    if (vals.length >= 2 && vals[0] && vals[1]) {
      const codeStr = vals[0].trim();
      const description = vals[1].trim();
      const howToUse = vals[2]?.trim() || '';
      const amount = parseAmount(vals[3] || '');
      if (!codeStr) continue;
      codes.push({
        code: codeStr,
        description,
        howToUse,
        amount,
        category: categorizeCode(codeStr),
        timeOfDay: detectTimeOfDay(howToUse, description),
        isPrimary: determineCodeRole(codeStr) === 'PRIMARY',
        isAddOn: determineCodeRole(codeStr) === 'ADD_ON',
      });
    }
  }
  return codes;
}

export function getCurrentTimeSlot(): string {
  const now = new Date();
  const h = now.getHours();
  const d = now.getDay();
  if (d === 0 || d === 6) return 'Weekend';
  if (h >= 0 && h < 8) return 'Night';
  if (h >= 8 && h < 17) return 'Day';
  return 'Evening';
}

/** Simple relevance scoring */
function scoreMatch(code: BillingCode, queryWords: string[]): number {
  const text = `${code.code} ${code.description} ${code.howToUse} ${code.category}`.toLowerCase();
  let score = 0;
  for (const w of queryWords) {
    if (w.length < 2) continue;
    if (text.includes(w)) {
      score += 1;
      // Boost exact code match
      if (code.code.toLowerCase() === w) score += 5;
      // Boost description match
      if (code.description.toLowerCase().includes(w)) score += 0.5;
    }
  }
  return score;
}

async function localSearch(params: SearchRequest): Promise<BillingCode[]> {
  const codes = await loadLocalCodes();
  const words = params.q.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return codes.slice(0, 30);

  let results = codes
    .map(c => ({ code: c, score: scoreMatch(c, words) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.code);

  if (params.category) {
    results = results.filter(c => c.category.toLowerCase().includes(params.category!.toLowerCase()));
  }
  if (params.timeOfDay) {
    results = results.filter(c => c.timeOfDay === params.timeOfDay || !c.timeOfDay);
  }

  return results.slice(0, 30);
}

async function localAnalyze(request: AnalyzeRequest): Promise<BillingAnalysis> {
  const codes = await loadLocalCodes();
  const timeSlot = request.timeOfDay || getCurrentTimeSlot();
  const words = request.clinicalText.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  // Score all codes
  const scored = codes
    .map(c => ({ code: c, score: scoreMatch(c, words) }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, request.maxSuggestions || 10);

  // Filter for time-appropriate H-codes
  const timeFiltered = scored.map(s => {
    if (s.code.code.startsWith('H') && s.code.timeOfDay && s.code.timeOfDay !== timeSlot) {
      const baseDesc = s.code.description.toLowerCase();
      const better = codes.find(c =>
        c.code.startsWith('H') &&
        c.timeOfDay === timeSlot &&
        c.description.toLowerCase().includes(baseDesc.substring(0, 20))
      );
      if (better) return { code: better, score: s.score };
    }
    return s;
  });

  // Deduplicate
  const seen = new Set<string>();
  const unique = timeFiltered.filter(s => {
    if (seen.has(s.code.code)) return false;
    seen.add(s.code.code);
    return true;
  });

  // Split into primary / add-on / premium
  const primaryItems = unique.filter(s => determineCodeRole(s.code.code) === 'PRIMARY');
  const addOnItems = unique.filter(s => determineCodeRole(s.code.code) === 'ADD_ON');
  const premiumItems = unique.filter(s => determineCodeRole(s.code.code) === 'PREMIUM');

  const allSuggested = unique.map(s => s.code);
  const totalRevenue = allSuggested.reduce((sum, c) => sum + c.amount, 0);

  const optimizations: OptimizationSuggestion[] = unique.map(s => ({
    suggestedCode: s.code,
    reason: buildReason(s.code, words),
    revenueImpact: s.code.amount,
    confidence: Math.min(s.score / Math.max(words.length, 1), 1),
    riskLevel: s.score > 2 ? 'LOW' as const : s.score > 1 ? 'MEDIUM' as const : 'HIGH' as const,
    documentation: getDocRequirements(s.code),
    codeRole: determineCodeRole(s.code.code),
  }));

  // Risk assessment
  const riskFactors: string[] = [];
  if (primaryItems.length > 1) {
    riskFactors.push(`${primaryItems.length} primary codes — typically only one primary per encounter`);
  }
  if (words.length < 5) {
    riskFactors.push('Clinical notes are brief — add more detail for accurate coding');
  }

  return {
    suggestedCodes: allSuggested,
    optimizations,
    revenueAnalysis: {
      currentRevenue: 0,
      potentialRevenue: totalRevenue,
      revenueIncrease: totalRevenue,
      percentageIncrease: 100,
    },
    riskAssessment: {
      overallRisk: riskFactors.length > 1 ? 'MEDIUM' : 'LOW',
      riskFactors,
      complianceScore: riskFactors.length === 0 ? 95 : 80,
    },
    documentation: {
      required: getRequiredDocs(allSuggested),
      recommended: ['Time in/out for all assessments', 'Detailed clinical impression'],
      missing: [],
    },
    explanation: buildExplanation(allSuggested, timeSlot, totalRevenue),
    confidence: unique.length > 0 ? Math.min(unique[0].score / Math.max(words.length, 1), 0.95) : 0.1,
    timeSlot,
    primaryCode: primaryItems.length > 0 ? primaryItems[0].code : null,
    addOnCodes: addOnItems.map(s => s.code),
    premiumCodes: premiumItems.map(s => s.code),
  };
}

function buildReason(code: BillingCode, queryWords: string[]): string {
  const matches = queryWords.filter(w =>
    `${code.code} ${code.description} ${code.howToUse}`.toLowerCase().includes(w)
  );
  if (matches.length > 0) {
    return `Matched: ${matches.slice(0, 3).join(', ')}. ${code.howToUse || code.description}`;
  }
  return code.description;
}

function getDocRequirements(code: BillingCode): string[] {
  const docs: string[] = [];
  const c = code.code.toUpperCase();
  if (c.startsWith('H')) docs.push('Document time in/out', 'Specify assessment complexity');
  if (c.startsWith('G')) docs.push('Document critical care minutes', 'Record interventions performed');
  if (c.startsWith('K')) docs.push('Record consultation duration', 'Document referring physician');
  if (c.startsWith('Z')) docs.push('Procedure note required', 'Document findings');
  if (c.startsWith('E')) docs.push('Document qualifying time period');
  return docs;
}

function getRequiredDocs(codes: BillingCode[]): string[] {
  const set = new Set<string>();
  set.add('Patient identification and date of service');
  for (const c of codes) {
    for (const d of getDocRequirements(c)) set.add(d);
  }
  return Array.from(set);
}

function buildExplanation(codes: BillingCode[], timeSlot: string, totalRevenue: number): string {
  const primary = codes.find(c => determineCodeRole(c.code) === 'PRIMARY');
  const addOns = codes.filter(c => determineCodeRole(c.code) === 'ADD_ON');
  const premiums = codes.filter(c => determineCodeRole(c.code) === 'PREMIUM');

  let explanation = `Based on the clinical notes, the analysis identified ${codes.length} applicable OHIP billing code(s) for a ${timeSlot} encounter.\n\n`;

  if (primary) {
    explanation += `Primary assessment: ${primary.code} — ${primary.description} ($${primary.amount.toFixed(2)}).\n`;
  }
  if (addOns.length > 0) {
    explanation += `Add-on codes: ${addOns.map(c => `${c.code} ($${c.amount.toFixed(2)})`).join(', ')}.\n`;
  }
  if (premiums.length > 0) {
    explanation += `Applicable premiums: ${premiums.map(c => `${c.code} ($${c.amount.toFixed(2)})`).join(', ')}.\n`;
  }
  explanation += `\nEstimated total: $${totalRevenue.toFixed(2)} CAD.`;
  return explanation;
}

// ════════════════════════════════════════════════════════
// API Functions (try backend, fallback to local)
// ════════════════════════════════════════════════════════

export async function analyzeClinicalText(request: AnalyzeRequest): Promise<BillingAnalysis> {
  // Try backend first
  try {
    const res = await fetch(`${API_BASE}/api/billing/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.analysis;
    }
  } catch {
    // Backend unreachable
  }

  // Local fallback
  console.info('[BillingAPI] Using local CSV fallback for analysis');
  return localAnalyze(request);
}

export async function searchBillingCodes(params: SearchRequest): Promise<BillingCode[]> {
  try {
    const query = new URLSearchParams();
    query.set('q', params.q);
    if (params.category) query.set('category', params.category);
    if (params.minAmount) query.set('minAmount', String(params.minAmount));
    if (params.maxAmount) query.set('maxAmount', String(params.maxAmount));
    if (params.timeOfDay) query.set('timeOfDay', params.timeOfDay);

    const res = await fetch(`${API_BASE}/api/billing/search?${query.toString()}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.codes;
    }
  } catch {
    // Backend unreachable
  }

  console.info('[BillingAPI] Using local CSV fallback for search');
  return localSearch(params);
}

export async function getCategories(): Promise<Array<{ name: string; count: number; avgAmount: number }>> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/categories`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.categories || [];
    }
  } catch { /* fallback */ }

  const codes = await loadLocalCodes();
  const catMap = new Map<string, { count: number; total: number }>();
  for (const c of codes) {
    const cat = c.category || 'Other';
    const entry = catMap.get(cat) || { count: 0, total: 0 };
    entry.count++;
    entry.total += c.amount;
    catMap.set(cat, entry);
  }
  return Array.from(catMap.entries()).map(([name, { count, total }]) => ({
    name,
    count,
    avgAmount: count > 0 ? total / count : 0,
  }));
}

export async function getCodeDetails(code: string): Promise<BillingCode | null> {
  try {
    const res = await fetch(`${API_BASE}/api/billing/code/${encodeURIComponent(code)}`, {
      headers: getAuthHeaders(),
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.code || null;
    }
  } catch { /* fallback */ }

  const codes = await loadLocalCodes();
  return codes.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
}

/** Quick lookup used by NavbarAIAgent — always local, fast */
export async function quickSearch(query: string): Promise<BillingCode[]> {
  return localSearch({ q: query });
}
