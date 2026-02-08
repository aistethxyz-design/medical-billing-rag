import { logger } from '../utils/logger';
import { pineconeService, VectorDocument } from './pineconeService';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export interface BillingCode {
  code: string;
  description: string;
  howToUse: string;
  amount: number;
  category: string;
  timeOfDay?: string;
  codeGroup?: string;
  isPrimary?: boolean;
  isAddOn?: boolean;
  modifiers?: string[];
  bundlingRules?: string[];
  exclusions?: string[];
}

export interface CodeMatch {
  code: BillingCode;
  confidence: number;
  reason: string;
  revenueImpact: number;
}

export interface OptimizationSuggestion {
  originalCode?: string;
  suggestedCode: BillingCode;
  reason: string;
  revenueImpact: number;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  documentation: string[];
  codeRole: 'PRIMARY' | 'ADD_ON' | 'PREMIUM';
}

export interface EncounterAnalysis {
  encounterId: string;
  clinicalText: string;
  suggestedCodes: BillingCode[];
  optimizations: OptimizationSuggestion[];
  totalRevenue: number;
  potentialRevenue: number;
  revenueIncrease: number;
  riskAssessment: {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    highRiskCodes: string[];
    complianceIssues: string[];
  };
}

// ── TF-IDF Implementation for local semantic search fallback ──
class TFIDFIndex {
  private documents: Map<string, string> = new Map();
  private idfScores: Map<string, number> = new Map();
  private tfidfVectors: Map<string, Map<string, number>> = new Map();

  addDocument(id: string, text: string): void {
    this.documents.set(id, text.toLowerCase());
  }

  build(): void {
    const N = this.documents.size;
    const df: Map<string, number> = new Map();

    for (const [, text] of this.documents) {
      const uniqueTerms = new Set(this.tokenize(text));
      for (const term of uniqueTerms) {
        df.set(term, (df.get(term) || 0) + 1);
      }
    }

    for (const [term, freq] of df) {
      this.idfScores.set(term, Math.log((N + 1) / (freq + 1)) + 1);
    }

    for (const [id, text] of this.documents) {
      const terms = this.tokenize(text);
      const tf: Map<string, number> = new Map();
      for (const term of terms) {
        tf.set(term, (tf.get(term) || 0) + 1);
      }

      const tfidf: Map<string, number> = new Map();
      for (const [term, count] of tf) {
        const idf = this.idfScores.get(term) || 1;
        tfidf.set(term, (count / terms.length) * idf);
      }
      this.tfidfVectors.set(id, tfidf);
    }
  }

  search(query: string, topK: number = 10): Array<{ id: string; score: number }> {
    const queryTerms = this.tokenize(query.toLowerCase());
    const queryTF: Map<string, number> = new Map();
    for (const term of queryTerms) {
      queryTF.set(term, (queryTF.get(term) || 0) + 1);
    }

    const queryVector: Map<string, number> = new Map();
    for (const [term, count] of queryTF) {
      const idf = this.idfScores.get(term) || 1;
      queryVector.set(term, (count / queryTerms.length) * idf);
    }

    const scores: Array<{ id: string; score: number }> = [];
    for (const [id, docVector] of this.tfidfVectors) {
      const score = this.cosineSimilarity(queryVector, docVector);
      if (score > 0.01) {
        scores.push({ id, score });
      }
    }

    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1)
      .map(w => w.toLowerCase());
  }

  private cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const [term, val] of a) {
      normA += val * val;
      if (b.has(term)) {
        dotProduct += val * b.get(term)!;
      }
    }
    for (const [, val] of b) {
      normB += val * val;
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom > 0 ? dotProduct / denom : 0;
  }
}

// ── Proper CSV parser that handles quoted fields with commas ──
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (ch === '"') {
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

function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[$,CAD\s]/g, '');
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// ── Time-of-day helpers ──
export function getCurrentTimeSlot(): string {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (day === 0 || day === 6) return 'Weekend';
  if (hour >= 0 && hour < 8) return 'Night';
  if (hour >= 8 && hour < 17) return 'Day';
  return 'Evening';
}

function extractTimeOfDay(howToUse: string, description: string): string | undefined {
  const text = (howToUse + ' ' + description).toLowerCase();

  if (/night|0000-0800|midnight/i.test(text)) return 'Night';
  if (/weekend|holiday/i.test(text)) return 'Weekend';
  if (/evening|1700-0000|mon-fri 17/i.test(text)) return 'Evening';
  if (/mon-fri 0800-1700|0800-1700|weekday/i.test(text)) return 'Day';
  return undefined;
}

function categorizeCode(code: string): string {
  const prefix = code.charAt(0).toUpperCase();
  const categories: Record<string, string> = {
    A: 'Assessment',
    H: 'Emergency',
    G: 'Critical Care / Procedure',
    K: 'Consultation / Forms',
    E: 'Premium',
    Z: 'Procedure / Surgery',
    R: 'Repair',
    F: 'Fracture',
    D: 'Dislocation',
    B: 'Telemedicine',
    M: 'Major Surgery',
    P: 'Obstetrics',
    J: 'Imaging',
  };
  return categories[prefix] || 'Other';
}

function determineCodeRole(code: string): { isPrimary: boolean; isAddOn: boolean } {
  const upper = code.toUpperCase().trim();
  const prefix = upper.charAt(0);

  // H-codes: H10x, H13x, H15x are primary assessment codes
  if (prefix === 'H') {
    if (/^H1[0-5]\d$/.test(upper) && !['H100', 'H105', 'H107', 'H109', 'H110', 'H113'].includes(upper)) {
      return { isPrimary: true, isAddOn: false };
    }
    return { isPrimary: false, isAddOn: true };
  }
  // G-codes: critical care first/subsequent are primary
  if (prefix === 'G' && /^G(521|523|522|395|391)$/.test(upper)) {
    return { isPrimary: true, isAddOn: false };
  }
  // A-codes: assessments are primary
  if (prefix === 'A' && !['A888', 'A901', 'A903', 'A771', 'A777'].includes(upper)) {
    return { isPrimary: true, isAddOn: false };
  }
  return { isPrimary: false, isAddOn: true };
}

// ── H-code time variant groups ──
const H_CODE_TIME_GROUPS: Record<string, Record<string, string>> = {
  minor_assessment:   { Day: 'H101', Evening: 'H131', Weekend: 'H151', Night: 'H151' },
  comprehensive:      { Day: 'H102', Evening: 'H132', Weekend: 'H152', Night: 'H152' },
  multiple_systems:   { Day: 'H103', Evening: 'H133', Weekend: 'H153', Night: 'H153' },
  reassessment:       { Day: 'H104', Evening: 'H134', Weekend: 'H154', Night: 'H154' },
};

export function getHCodeForTimeSlot(assessmentType: string, timeSlot?: string): string | undefined {
  const slot = timeSlot || getCurrentTimeSlot();
  const group = H_CODE_TIME_GROUPS[assessmentType];
  return group ? group[slot] : undefined;
}

// ── Main Service ──
class BillingCodeService {
  private billingCodes: Map<string, BillingCode> = new Map();
  private codesByCategory: Map<string, BillingCode[]> = new Map();
  private tfidfIndex: TFIDFIndex = new TFIDFIndex();
  private pineconeIndexed = false;
  private initialized = false;

  private searchCache: Map<string, { result: BillingCode[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.loadBillingCodes();
      this.buildTFIDFIndex();
      await this.indexInPinecone();
      this.initialized = true;
      logger.info('BillingCodeService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BillingCodeService:', error);
      throw error;
    }
  }

  private async loadBillingCodes(): Promise<void> {
    const possiblePaths = [
      path.join(process.cwd(), 'Codes by class.csv'),
      path.join(process.cwd(), 'Codes_by_class.csv'),
      path.join(process.cwd(), '..', 'Codes_by_class.csv'),
      path.join(process.cwd(), '..', 'Codes by class.csv'),
    ];

    let csvContent = '';
    for (const csvPath of possiblePaths) {
      try {
        csvContent = fs.readFileSync(csvPath, 'utf-8');
        logger.info(`Loaded CSV from: ${csvPath}`);
        break;
      } catch { continue; }
    }

    if (!csvContent) {
      throw new Error('Could not find billing codes CSV file');
    }

    // Handle multi-line quoted fields
    const rawLines = csvContent.split('\n');
    const completeLines: string[] = [];
    let currentLine = '';
    let inQuotes = false;

    for (const rawLine of rawLines) {
      const quoteCount = (rawLine.match(/"/g) || []).length;
      if (inQuotes) {
        currentLine += '\n' + rawLine;
        if (quoteCount % 2 !== 0) {
          inQuotes = false;
          completeLines.push(currentLine);
          currentLine = '';
        }
      } else {
        if (quoteCount % 2 !== 0) {
          inQuotes = true;
          currentLine = rawLine;
        } else {
          completeLines.push(rawLine);
        }
      }
    }
    if (currentLine) completeLines.push(currentLine);

    let loadedCount = 0;
    for (let i = 1; i < completeLines.length; i++) {
      const line = completeLines[i].trim();
      if (!line) continue;

      const fields = parseCSVLine(line);
      const code = fields[0]?.trim();
      const description = fields[1]?.trim();
      const howToUse = fields[2]?.trim() || '';
      const amountStr = fields[3]?.trim() || '';

      if (!code || !description) continue;
      if (!code.match(/^[A-Za-z]/)) continue;

      const amount = parseAmount(amountStr);
      const category = categorizeCode(code);
      const timeOfDay = extractTimeOfDay(howToUse, description);
      const { isPrimary, isAddOn } = determineCodeRole(code);

      const billingCode: BillingCode = {
        code: code.toUpperCase().trim(),
        description,
        howToUse,
        amount,
        category,
        timeOfDay,
        isPrimary,
        isAddOn,
        modifiers: this.extractModifiers(howToUse),
        bundlingRules: this.extractBundlingRules(howToUse),
        exclusions: this.extractExclusions(howToUse),
      };

      const key = timeOfDay ? `${billingCode.code}-${timeOfDay}` : billingCode.code;
      this.billingCodes.set(key, billingCode);

      if (!this.billingCodes.has(billingCode.code) || !timeOfDay) {
        this.billingCodes.set(billingCode.code, billingCode);
      }

      if (!this.codesByCategory.has(category)) {
        this.codesByCategory.set(category, []);
      }
      this.codesByCategory.get(category)!.push(billingCode);

      loadedCount++;
    }

    logger.info(`Loaded ${loadedCount} billing codes across ${this.codesByCategory.size} categories`);
  }

  private buildTFIDFIndex(): void {
    const seen = new Set<string>();
    for (const [key, code] of this.billingCodes) {
      if (seen.has(key)) continue;
      seen.add(key);

      const searchText = [code.code, code.description, code.howToUse, code.category, code.timeOfDay || ''].join(' ');
      this.tfidfIndex.addDocument(key, searchText);
    }
    this.tfidfIndex.build();
    logger.info('TF-IDF index built');
  }

  private async indexInPinecone(): Promise<void> {
    if (this.pineconeIndexed) return;

    try {
      await pineconeService.initialize();

      if (!pineconeService.isPineconeAvailable()) {
        logger.info('Pinecone not available, using TF-IDF only');
        return;
      }

      const documents: VectorDocument[] = [];
      const seen = new Set<string>();

      for (const [key, code] of this.billingCodes) {
        if (seen.has(key)) continue;
        seen.add(key);

        documents.push({
          id: key,
          text: `OHIP Code ${code.code}: ${code.description}. ${code.howToUse}. Category: ${code.category}. Amount: $${code.amount}`,
          metadata: {
            code: code.code,
            description: code.description,
            category: code.category,
            amount: code.amount,
            timeOfDay: code.timeOfDay || 'any',
            isPrimary: code.isPrimary || false,
            isAddOn: code.isAddOn || false,
          },
        });
      }

      await pineconeService.upsertDocuments(documents);
      this.pineconeIndexed = true;
      logger.info('Billing codes indexed in Pinecone');
    } catch (error) {
      logger.error('Failed to index in Pinecone, using TF-IDF:', error);
    }
  }

  // ── Semantic search: Pinecone first, TF-IDF fallback ──
  async semanticSearch(query: string, topK: number = 15, filter?: Record<string, any>): Promise<CodeMatch[]> {
    const cacheKey = `${query}|${topK}|${JSON.stringify(filter || {})}`;
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result.map(code => ({
        code,
        confidence: 0.8,
        reason: 'Cached result',
        revenueImpact: code.amount,
      }));
    }

    let results: CodeMatch[] = [];

    if (pineconeService.isPineconeAvailable()) {
      try {
        const pineconeResults = await pineconeService.semanticSearch(query, topK, filter);
        results = pineconeResults
          .map(r => {
            const code = this.billingCodes.get(r.id);
            if (!code) return null;
            return {
              code,
              confidence: r.score,
              reason: `Semantic match (${Math.round(r.score * 100)}% similarity)`,
              revenueImpact: code.amount,
            };
          })
          .filter((r): r is CodeMatch => r !== null);

        if (results.length > 0) {
          this.searchCache.set(cacheKey, { result: results.map(r => r.code), timestamp: Date.now() });
          return results;
        }
      } catch (error) {
        logger.warn('Pinecone search failed, falling back to TF-IDF:', error);
      }
    }

    // Fallback: TF-IDF
    const tfidfResults = this.tfidfIndex.search(query, topK);
    results = tfidfResults
      .map(r => {
        const code = this.billingCodes.get(r.id);
        if (!code) return null;
        return {
          code,
          confidence: Math.min(r.score, 1),
          reason: `TF-IDF match (${Math.round(Math.min(r.score, 1) * 100)}% relevance)`,
          revenueImpact: code.amount,
        };
      })
      .filter((r): r is CodeMatch => r !== null);

    if (results.length > 0) {
      this.searchCache.set(cacheKey, { result: results.map(r => r.code), timestamp: Date.now() });
    }

    return results;
  }

  // ── Keyword search ──
  async searchCodes(query: string, filters?: {
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    timeOfDay?: string;
  }): Promise<BillingCode[]> {
    const queryLower = query.toLowerCase();
    const seen = new Set<string>();
    let results: BillingCode[] = [];

    for (const [, code] of this.billingCodes) {
      const uniqueKey = code.code + (code.timeOfDay || '');
      if (seen.has(uniqueKey)) continue;
      seen.add(uniqueKey);

      const text = `${code.code} ${code.description} ${code.howToUse} ${code.category}`.toLowerCase();
      if (text.includes(queryLower) || queryLower.split(/\s+/).some(w => w.length > 2 && text.includes(w))) {
        results.push(code);
      }
    }

    if (filters) {
      if (filters.category) results = results.filter(c => c.category.toLowerCase().includes(filters.category!.toLowerCase()));
      if (filters.minAmount !== undefined) results = results.filter(c => c.amount >= filters.minAmount!);
      if (filters.maxAmount !== undefined) results = results.filter(c => c.amount <= filters.maxAmount!);
      if (filters.timeOfDay) results = results.filter(c => c.timeOfDay === filters.timeOfDay || !c.timeOfDay);
    }

    results.sort((a, b) => b.amount - a.amount);
    return results.slice(0, 30);
  }

  // ── Smart time-of-day H-code selection ──
  getTimeAppropriateHCode(assessmentLevel: 'minor' | 'comprehensive' | 'multiple_systems' | 'reassessment', timeSlot?: string): BillingCode | undefined {
    const slot = timeSlot || getCurrentTimeSlot();
    const groupMap: Record<string, string> = {
      minor: 'minor_assessment',
      comprehensive: 'comprehensive',
      multiple_systems: 'multiple_systems',
      reassessment: 'reassessment',
    };

    const targetCode = getHCodeForTimeSlot(groupMap[assessmentLevel], slot);
    if (!targetCode) return undefined;

    const key = `${targetCode}-${slot}`;
    return this.billingCodes.get(key) || this.billingCodes.get(targetCode);
  }

  // ── Primary + Add-on suggestion ──
  async suggestPrimaryAndAddOns(clinicalText: string, timeSlot?: string): Promise<{
    primary: BillingCode | null;
    addOns: BillingCode[];
    premiums: BillingCode[];
  }> {
    const slot = timeSlot || getCurrentTimeSlot();
    const matches = await this.semanticSearch(clinicalText, 20);

    let primary: BillingCode | null = null;
    const addOns: BillingCode[] = [];
    const premiums: BillingCode[] = [];

    for (const match of matches) {
      const code = match.code;

      if (code.isPrimary && !primary) {
        if (code.code.startsWith('H') && /^H1[0-5]\d$/.test(code.code)) {
          const level = this.getAssessmentLevel(code);
          const timeCode = this.getTimeAppropriateHCode(level, slot);
          primary = timeCode || code;
        } else {
          primary = code;
        }
      } else if (code.category === 'Premium' || code.code.startsWith('E4') || code.code.startsWith('H11') || code.code.startsWith('H96') || code.code.startsWith('H98')) {
        premiums.push(code);
      } else if (code.isAddOn) {
        addOns.push(code);
      }
    }

    if ((slot === 'Evening' || slot === 'Weekend' || slot === 'Night')) {
      const premium = this.getTimePremium(slot);
      if (premium && !premiums.some(p => p.code === premium.code)) {
        premiums.push(premium);
      }
    }

    return { primary, addOns: addOns.slice(0, 8), premiums: premiums.slice(0, 4) };
  }

  private getAssessmentLevel(code: BillingCode): 'minor' | 'comprehensive' | 'multiple_systems' | 'reassessment' {
    const c = code.code;
    if (c.endsWith('01') || c.endsWith('31') || c.endsWith('51')) return 'minor';
    if (c.endsWith('03') || c.endsWith('33') || c.endsWith('53')) return 'multiple_systems';
    if (c.endsWith('04') || c.endsWith('34') || c.endsWith('54')) return 'reassessment';
    return 'comprehensive';
  }

  private getTimePremium(timeSlot: string): BillingCode | undefined {
    const map: Record<string, string> = { Evening: 'E412', Weekend: 'E412', Night: 'E413' };
    return map[timeSlot] ? this.billingCodes.get(map[timeSlot]) : undefined;
  }

  getCodeByCode(code: string): BillingCode | undefined {
    return this.billingCodes.get(code.toUpperCase().trim());
  }

  getAllCodes(): BillingCode[] {
    const seen = new Set<string>();
    const codes: BillingCode[] = [];
    for (const [, code] of this.billingCodes) {
      const key = code.code + (code.timeOfDay || '');
      if (!seen.has(key)) {
        seen.add(key);
        codes.push(code);
      }
    }
    return codes;
  }

  getCodesByCategory(category: string): BillingCode[] {
    return this.codesByCategory.get(category) || [];
  }

  private extractModifiers(howToUse: string): string[] {
    if (!howToUse) return [];
    const matches = howToUse.match(/modifier\s*([A-Z0-9]+)/gi);
    return matches ? matches.map(m => m.replace(/modifier\s*/i, '')) : [];
  }

  private extractBundlingRules(howToUse: string): string[] {
    if (!howToUse) return [];
    const matches = howToUse.match(/(?:cannot|can't|do not|don't|Can NOT)\s+bill\s+(?:with|in addition to)\s+([^.]+)/gi);
    return matches ? matches.map(m => m.trim()) : [];
  }

  private extractExclusions(howToUse: string): string[] {
    if (!howToUse) return [];
    const matches = howToUse.match(/(?:except|unless|not\s+if)\s+([^.]+)/gi);
    return matches ? matches.map(m => m.trim()) : [];
  }

  // ── Encounter analysis (used by billing routes) ──
  async analyzeEncounter(encounterId: string, clinicalText: string): Promise<EncounterAnalysis> {
    const prisma = new PrismaClient();
    try {
      const encounter = await prisma.encounter.findUnique({
        where: { id: encounterId },
        include: { diagnoses: true, procedures: true },
      });

      if (!encounter) {
        throw new Error('Encounter not found');
      }

      // Find optimal codes via semantic search
      const optimizations = await this.findOptimalCodes(clinicalText, encounter.type);

      // Calculate current revenue
      const currentRevenue = encounter.procedures.reduce(
        (sum: number, proc: any) => sum + (proc.chargeAmount || 0),
        0
      );

      // Calculate potential revenue
      const potentialRevenue = optimizations.reduce((sum, opt) => sum + opt.revenueImpact, 0);

      // Assess risk
      const highRiskCodes = optimizations
        .filter((opt) => opt.riskLevel === 'HIGH')
        .map((opt) => opt.suggestedCode.code);

      const complianceIssues = this.identifyComplianceIssues(optimizations);

      return {
        encounterId,
        clinicalText,
        suggestedCodes: optimizations.map((opt) => opt.suggestedCode),
        optimizations,
        totalRevenue: currentRevenue,
        potentialRevenue,
        revenueIncrease: potentialRevenue - currentRevenue,
        riskAssessment: {
          overallRisk:
            highRiskCodes.length > 2 ? 'HIGH' : highRiskCodes.length > 0 ? 'MEDIUM' : 'LOW',
          highRiskCodes,
          complianceIssues,
        },
      };
    } finally {
      await prisma.$disconnect();
    }
  }

  async findOptimalCodes(clinicalText: string, encounterType?: string): Promise<OptimizationSuggestion[]> {
    await this.initialize();
    const matches = await this.semanticSearch(clinicalText, 10);

    return matches.map((match) => {
      const role = determineCodeRole(match.code.code);
      const codeRole: 'PRIMARY' | 'ADD_ON' | 'PREMIUM' = role.isPrimary ? 'PRIMARY'
        : match.code.code.startsWith('E') ? 'PREMIUM' : 'ADD_ON';

      return {
        suggestedCode: match.code,
        reason: `Matched "${match.code.description}" with ${Math.round(match.confidence * 100)}% relevance`,
        revenueImpact: match.code.amount,
        confidence: match.confidence,
        riskLevel: match.confidence > 0.8 ? 'LOW' as const : match.confidence > 0.5 ? 'MEDIUM' as const : 'HIGH' as const,
        documentation: [],
        codeRole,
      };
    });
  }

  private identifyComplianceIssues(optimizations: OptimizationSuggestion[]): string[] {
    const issues: string[] = [];
    const codes = optimizations.map((opt) => opt.suggestedCode.code);

    // Check for multiple primary codes
    const primaryCodes = codes.filter((c) => /^H1\d{2}/.test(c) || /^G\d{3}/.test(c) || /^A\d{3}/.test(c));
    if (primaryCodes.length > 1) {
      issues.push(`Multiple primary codes billed: ${primaryCodes.join(', ')} — only one primary assessment per encounter`);
    }

    return issues;
  }
}

export const billingCodeService = new BillingCodeService();
