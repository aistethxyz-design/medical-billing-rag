import OpenAI from 'openai';
import { logger } from '../utils/logger';

class AIService {
  private openai: OpenAI;
  private isInitialized = false;

  // Response cache for identical prompts
  private responseCache: Map<string, { response: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }

  async initialize(): Promise<void> {
    try {
      this.isInitialized = true;
      logger.info('OpenAI service initialized');
    } catch (error) {
      logger.error('Failed to initialize OpenAI service:', error);
      throw new Error('OpenAI initialization failed');
    }
  }

  async extractClinicalEntities(text: string): Promise<any> {
    // Check cache
    const cacheKey = `entities:${text.substring(0, 200)}`;
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      try { return JSON.parse(cached.response); } catch { /* fall through */ }
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a medical NLP specialist for Canadian Emergency Medicine.
Extract clinical entities from the text and return valid JSON only.

Return format:
{
  "chiefComplaint": "main reason for visit",
  "symptoms": ["symptom1", "symptom2"],
  "diagnoses": ["diagnosis1"],
  "procedures": ["procedure1"],
  "medications": ["medication1"],
  "vitalSigns": {},
  "assessmentComplexity": "minor|comprehensive|multiple_systems|critical",
  "isCriticalCare": false,
  "isTrauma": false
}

Be concise and accurate. Only return JSON, no explanation.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content || '{}';
      this.responseCache.set(cacheKey, { response: content, timestamp: Date.now() });

      try {
        return JSON.parse(content);
      } catch {
        return { extractedText: content };
      }
    } catch (error) {
      logger.error('Clinical entity extraction failed:', error);
      return {
        chiefComplaint: '',
        symptoms: [],
        diagnoses: [],
        procedures: [],
        medications: [],
        vitalSigns: {},
        assessmentComplexity: 'comprehensive',
        isCriticalCare: false,
        isTrauma: false,
      };
    }
  }

  async chatbotResponse(question: string, context?: string): Promise<string> {
    // Check cache
    const cacheKey = `chat:${question.substring(0, 200)}`;
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }

    try {
      const systemPrompt = `You are WiserDoc AI, an expert OHIP (Ontario Health Insurance Plan) billing assistant for Canadian emergency physicians.

You help with:
- OHIP billing code selection (H-codes, G-codes, A-codes, Z-codes, K-codes, E-premiums, etc.)
- Time-of-day billing optimization (Day 0800-1700, Evening 1700-0000, Night 0000-0800, Weekend/Holiday)
- Primary assessment code + add-on procedure/premium code combinations
- OHIP Schedule of Benefits compliance
- Documentation requirements for OHIP billing
- Revenue optimization within OHIP rules

Key OHIP rules:
- H-codes are ER assessment codes with time-of-day variants (H10x=Day, H13x=Evening, H15x=Weekend/Night)
- G-codes cover critical care (G521=first 15min, G523=additional 15min) and procedures
- E-codes are premiums (E412=after-hours 20%, E413=night 40%, E420=trauma 50%)
- Z-codes are surgical/procedural add-ons
- K-codes cover consultations, counseling, and forms
- Only ONE primary assessment code per encounter (H or A code)
- Multiple add-on codes (Z, K, G procedure codes) can be added

Always cite specific OHIP codes and amounts. Be concise and practical.`;

      const userPrompt = context ?
        `Context: ${context}\n\nQuestion: ${question}` :
        question;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate response.';
      this.responseCache.set(cacheKey, { response: content, timestamp: Date.now() });
      return content;
    } catch (error) {
      logger.error('Chatbot response failed:', error);
      return 'Unable to generate response at this time.';
    }
  }

  async generateBillingExplanation(
    clinicalText: string,
    suggestedCodes: Array<{ code: string; description: string; amount: number; role: string }>,
    totalRevenue: number
  ): Promise<string> {
    const cacheKey = `explain:${clinicalText.substring(0, 100)}:${suggestedCodes.map(c => c.code).join(',')}`;
    const cached = this.responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }

    try {
      const codesText = suggestedCodes.map(c =>
        `- ${c.code} (${c.role}): ${c.description} — $${c.amount.toFixed(2)}`
      ).join('\n');

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an OHIP billing expert. Provide a concise 2-3 paragraph explanation of why these OHIP codes are recommended for the given clinical scenario. Mention time-of-day considerations, add-on code opportunities, and documentation requirements. Be practical and specific.`
          },
          {
            role: 'user',
            content: `Clinical notes: "${clinicalText}"\n\nSuggested OHIP codes:\n${codesText}\n\nTotal estimated revenue: $${totalRevenue.toFixed(2)}\n\nExplain the billing recommendations.`
          }
        ],
        temperature: 0.3,
        max_tokens: 600,
      });

      const content = response.choices[0]?.message?.content || 'Unable to generate explanation.';
      this.responseCache.set(cacheKey, { response: content, timestamp: Date.now() });
      return content;
    } catch (error) {
      logger.error('Billing explanation failed:', error);
      return 'Unable to generate explanation at this time.';
    }
  }

  // ── Legacy methods used by coding.ts routes ──

  async analyzeMedicalCodes(clinicalText: string, specialty?: string): Promise<MedicalCodeAnalysis> {
    if (!this.isInitialized) {
      throw new Error('AI service not initialized');
    }
    try {
      const prompt = `Analyze the following clinical documentation and provide OHIP billing code recommendations:\n\nClinical Text: ${clinicalText}\n${specialty ? `Provider Specialty: ${specialty}` : ''}\n\nReturn JSON with: originalCodes, suggestedCodes, optimizations, riskAssessment, revenueImpact.`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert medical coding AI specializing in OHIP billing codes. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '';
      try {
        return JSON.parse(content);
      } catch {
        return {
          originalCodes: [], suggestedCodes: [], optimizations: [],
          riskAssessment: { auditProbability: 0, complianceScore: 0.8, riskFactors: [], recommendations: [] },
          revenueImpact: { originalAmount: 0, optimizedAmount: 0, potentialGain: 0, percentageIncrease: 0 }
        };
      }
    } catch (error) {
      logger.error('Medical code analysis failed:', error);
      throw new Error('AI analysis failed');
    }
  }

  async generateCodingExplanation(originalCode: string, suggestedCode: string, reason: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a medical coding educator explaining OHIP billing code decisions.' },
          { role: 'user', content: `Explain why code ${originalCode} should be changed to ${suggestedCode}. Reason: ${reason}. Include clinical justification and documentation requirements.` }
        ],
        temperature: 0.2,
        max_tokens: 800,
      });
      return response.choices[0]?.message?.content || 'Unable to generate explanation';
    } catch (error) {
      logger.error('Failed to generate coding explanation:', error);
      return 'Unable to generate explanation at this time';
    }
  }
}

interface MedicalCodeAnalysis {
  originalCodes: any[];
  suggestedCodes: any[];
  optimizations: any[];
  riskAssessment: {
    auditProbability: number;
    complianceScore: number;
    riskFactors: string[];
    recommendations: string[];
  };
  revenueImpact: {
    originalAmount: number;
    optimizedAmount: number;
    potentialGain: number;
    percentageIncrease: number;
  };
}

// OHIP Code Validation Service
export class CodeValidationService {
  static validateOHIPCode(code: string): boolean {
    return /^[A-Z]\d{3}[A-Z]?$/.test(code);
  }

  static getCodeType(code: string): string {
    if (/^H\d{3}/.test(code)) return 'EMERGENCY_ASSESSMENT';
    if (/^G\d{3}/.test(code)) return 'CRITICAL_CARE';
    if (/^A\d{3}/.test(code)) return 'ASSESSMENT';
    if (/^Z\d{3}/.test(code)) return 'PROCEDURE';
    if (/^K\d{3}/.test(code)) return 'CONSULTATION';
    if (/^E\d{3}/.test(code)) return 'PREMIUM';
    if (/^F\d{3}/.test(code)) return 'FRACTURE';
    if (/^D\d{3}/.test(code)) return 'DISLOCATION';
    if (/^B\d{3}/.test(code)) return 'TELEMEDICINE';
    if (/^R\d{3}/.test(code)) return 'REPAIR';
    return 'UNKNOWN';
  }
}

// OHIP Bundling Rules Service
export class NCCIService {
  static checkBundling(code1: string, code2: string): { bundled: boolean; reason?: string } {
    // Multiple H-codes in same encounter are bundled
    if (/^H1\d{2}/.test(code1) && /^H1\d{2}/.test(code2)) {
      return { bundled: true, reason: 'Only one ER assessment code (H-code) per encounter' };
    }
    return { bundled: false };
  }

  static getMutuallyExclusiveCodes(code: string): string[] {
    // Day/Evening/Night H-code variants are mutually exclusive
    const hCodeGroups: Record<string, string[]> = {
      'H101': ['H131', 'H151'],
      'H131': ['H101', 'H151'],
      'H151': ['H101', 'H131'],
      'H102': ['H132', 'H152'],
      'H132': ['H102', 'H152'],
      'H152': ['H102', 'H132'],
    };
    return hCodeGroups[code] || [];
  }
}

const aiService = new AIService();

export async function initializeAI(): Promise<void> {
  await aiService.initialize();
}

export { aiService, AIService };
