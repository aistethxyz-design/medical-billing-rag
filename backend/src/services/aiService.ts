import OpenAI from 'openai';
import { logger } from '../utils/logger';

interface MedicalCodeAnalysis {
  originalCodes: MedicalCode[];
  suggestedCodes: MedicalCode[];
  optimizations: CodeOptimization[];
  riskAssessment: RiskAssessment;
  revenueImpact: RevenueImpact;
}

interface MedicalCode {
  code: string;
  type: 'CPT' | 'ICD10' | 'HCPCS' | 'MODIFIER';
  description: string;
  confidence: number;
  reasoning?: string;
}

interface CodeOptimization {
  type: 'UPCODE' | 'DOWNCODE' | 'MODIFIER_ADD' | 'BUNDLE_FIX';
  originalCode: string;
  suggestedCode: string;
  reason: string;
  potentialGain: number;
  auditRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  documentation?: string;
}

interface RiskAssessment {
  auditProbability: number;
  complianceScore: number;
  riskFactors: string[];
  recommendations: string[];
}

interface RevenueImpact {
  originalAmount: number;
  optimizedAmount: number;
  potentialGain: number;
  percentageIncrease: number;
}

class AIService {
  private openai: OpenAI;
  private _isInitialized = false;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }

  // Public getter for initialization status
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  async initialize(): Promise<void> {
    try {
      // Test OpenAI connection
      await this.openai.models.list();
      this._isInitialized = true;
      logger.info('OpenAI service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize OpenAI service:', error);
      throw new Error('OpenAI initialization failed');
    }
  }

  async analyzeMedicalCodes(clinicalText: string, specialty?: string): Promise<MedicalCodeAnalysis> {
    if (!this._isInitialized) {
      throw new Error('AI service not initialized');
    }

    try {
      const prompt = this.buildCodingPrompt(clinicalText, specialty);
      
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert medical coding AI assistant specializing in CPT, ICD-10, and HCPCS codes. 
            You help healthcare providers optimize their billing by suggesting appropriate codes while ensuring compliance with CMS and NCCI guidelines.
            Always prioritize accuracy and compliance over revenue optimization.
            Provide detailed reasoning for all suggestions and flag any potential audit risks.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for medical accuracy
        max_tokens: 2000,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('Empty response from OpenAI');
      }

      return this.parseAIResponse(aiResponse);
    } catch (error) {
      logger.error('Medical code analysis failed:', error);
      throw new Error('AI analysis failed');
    }
  }

  async generateCodingExplanation(originalCode: string, suggestedCode: string, reason: string): Promise<string> {
    try {
      const prompt = `
        Explain why medical code ${originalCode} should be changed to ${suggestedCode}.
        Reason: ${reason}
        
        Please provide:
        1. Clinical justification based on medical documentation
        2. Relevant CMS or AMA guidelines
        3. Revenue impact explanation
        4. Documentation requirements
        5. Potential audit considerations
        
        Keep the explanation professional and cite specific coding guidelines where applicable.
      `;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical coding educator explaining coding decisions to healthcare providers.'
          },
          {
            role: 'user',
            content: prompt
          }
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

  async chatbotResponse(question: string, context?: string): Promise<string> {
    try {
      const systemPrompt = `
        You are CodeMax AI, an expert medical coding assistant. You help healthcare providers with:
        - CPT, ICD-10, and HCPCS coding questions
        - CMS and NCCI compliance guidance
        - Billing optimization strategies
        - Documentation requirements
        - Audit protection advice
        
        Always provide accurate, evidence-based answers with specific code references when applicable.
        If unsure, recommend consulting official CMS guidelines or a certified coding specialist.
      `;

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

      return response.choices[0]?.message?.content || 'I apologize, but I cannot provide an answer at this time.';
    } catch (error) {
      logger.error('Chatbot response failed:', error);
      return 'I apologize, but I cannot provide an answer at this time due to a technical issue.';
    }
  }

  async extractClinicalEntities(text: string): Promise<any> {
    try {
      const prompt = `
        Extract the following medical entities from the clinical text:
        1. Symptoms and complaints
        2. Diagnoses
        3. Procedures performed
        4. Medications
        5. Physical examination findings
        6. Duration and severity indicators
        
        Return the response in JSON format with these categories.
        
        Clinical Text: ${text}
      `;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a medical NLP specialist extracting clinical entities from medical text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return {};

      try {
        return JSON.parse(content);
      } catch {
        // If JSON parsing fails, return structured text
        return { extractedText: content };
      }
    } catch (error) {
      logger.error('Clinical entity extraction failed:', error);
      return {};
    }
  }

  private buildCodingPrompt(clinicalText: string, specialty?: string): string {
    return `
      Analyze the following clinical documentation and provide medical coding recommendations:
      
      Clinical Text: ${clinicalText}
      ${specialty ? `Provider Specialty: ${specialty}` : ''}
      
      Please provide:
      1. Appropriate ICD-10 diagnosis codes with descriptions
      2. Recommended CPT procedure codes with modifiers if needed
      3. Any applicable HCPCS codes
      4. Bundling considerations and NCCI edits
      5. Revenue optimization opportunities (higher-level codes if justified)
      6. Audit risk assessment
      7. Documentation improvement suggestions
      
      Format your response as JSON with the following structure:
      {
        "originalCodes": [{"code": "", "type": "", "description": "", "confidence": 0.0}],
        "suggestedCodes": [{"code": "", "type": "", "description": "", "confidence": 0.0}],
        "optimizations": [{"type": "", "originalCode": "", "suggestedCode": "", "reason": "", "potentialGain": 0, "auditRisk": ""}],
        "riskAssessment": {"auditProbability": 0.0, "complianceScore": 0.0, "riskFactors": [], "recommendations": []},
        "revenueImpact": {"originalAmount": 0, "optimizedAmount": 0, "potentialGain": 0, "percentageIncrease": 0}
      }
    `;
  }

  private parseAIResponse(response: string): MedicalCodeAnalysis {
    try {
      // Attempt to parse JSON response
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      // If JSON parsing fails, create a basic structure
      logger.warn('Failed to parse AI response as JSON, creating fallback structure');
      
      return {
        originalCodes: [],
        suggestedCodes: [],
        optimizations: [],
        riskAssessment: {
          auditProbability: 0,
          complianceScore: 0.8,
          riskFactors: [],
          recommendations: ['Review AI response manually']
        },
        revenueImpact: {
          originalAmount: 0,
          optimizedAmount: 0,
          potentialGain: 0,
          percentageIncrease: 0
        }
      };
    }
  }
}

// Medical Code Validation Service
export class CodeValidationService {
  static validateCPTCode(code: string): boolean {
    // CPT codes are 5 digits
    return /^\d{5}$/.test(code);
  }

  static validateICD10Code(code: string): boolean {
    // ICD-10 codes: 3-7 characters, start with letter
    return /^[A-Z]\d{2}(\.[A-Z0-9]{1,4})?$/.test(code);
  }

  static validateHCPCSCode(code: string): boolean {
    // HCPCS codes: letter followed by 4 digits
    return /^[A-Z]\d{4}$/.test(code);
  }

  static validateModifierCode(code: string): boolean {
    // Modifier codes: 2 digits or 2 letters
    return /^(\d{2}|[A-Z]{2})$/.test(code);
  }

  static getCodeType(code: string): string {
    if (this.validateCPTCode(code)) return 'CPT';
    if (this.validateICD10Code(code)) return 'ICD10';
    if (this.validateHCPCSCode(code)) return 'HCPCS';
    if (this.validateModifierCode(code)) return 'MODIFIER';
    return 'UNKNOWN';
  }
}

// NCCI Bundling Rules Service
export class NCCIService {
  static checkBundling(code1: string, code2: string): { bundled: boolean; reason?: string } {
    // Simplified bundling check - in production, this would query actual NCCI tables
    const commonBundles = [
      { primary: '99213', bundled: ['36415'], reason: 'Venipuncture bundled with office visit' },
      { primary: '99214', bundled: ['36415'], reason: 'Venipuncture bundled with office visit' },
      // Add more bundling rules as needed
    ];

    for (const bundle of commonBundles) {
      if (bundle.primary === code1 && bundle.bundled.includes(code2)) {
        return { bundled: true, reason: bundle.reason };
      }
    }

    return { bundled: false };
  }

  static getMutuallyExclusiveCodes(code: string): string[] {
    // Return codes that cannot be billed together
    const exclusions: Record<string, string[]> = {
      '99213': ['99214', '99215'], // Same day E/M codes
      '99214': ['99213', '99215'],
      // Add more exclusions as needed
    };

    return exclusions[code] || [];
  }
}

const aiService = new AIService();

export async function initializeAI(): Promise<void> {
  await aiService.initialize();
}

export { aiService, AIService }; 