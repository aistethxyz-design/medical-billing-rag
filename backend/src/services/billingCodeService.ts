import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export interface BillingCode {
  code: string;
  description: string;
  howToUse: string;
  amount: number;
  category: string;
  timeOfDay?: string;
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

class BillingCodeService {
  private prisma: PrismaClient;
  private billingCodes: Map<string, BillingCode> = new Map();
  private codeIndex: Map<string, string[]> = new Map(); // keyword -> codes

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initialize(): Promise<void> {
    try {
      await this.loadBillingCodes();
      await this.buildSearchIndex();
      logger.info('BillingCodeService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BillingCodeService:', error);
      throw error;
    }
  }

  private async loadBillingCodes(): Promise<void> {
    try {
      const csvPath = path.join(process.cwd(), 'Codes by class.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line || line.startsWith(',,,')) continue; // Skip empty lines

        const [code, description, howToUse, amountStr] = line.split(',');
        
        if (!code || !description) continue;

        const amount = this.parseAmount(amountStr);
        const category = this.categorizeCode(code);
        
        const billingCode: BillingCode = {
          code: code.trim(),
          description: description.trim(),
          howToUse: howToUse?.trim() || '',
          amount,
          category,
          timeOfDay: this.extractTimeOfDay(howToUse),
          modifiers: this.extractModifiers(howToUse),
          bundlingRules: this.extractBundlingRules(howToUse),
          exclusions: this.extractExclusions(howToUse)
        };

        this.billingCodes.set(code.trim(), billingCode);
      }

      logger.info(`Loaded ${this.billingCodes.size} billing codes`);
    } catch (error) {
      logger.error('Failed to load billing codes:', error);
      throw error;
    }
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    
    // Remove currency symbols and extract numeric value
    const cleanAmount = amountStr.replace(/[$,CAD]/g, '').trim();
    const match = cleanAmount.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private categorizeCode(code: string): string {
    if (code.startsWith('A')) return 'Assessment';
    if (code.startsWith('H')) return 'Emergency';
    if (code.startsWith('G')) return 'Procedure';
    if (code.startsWith('K')) return 'Consultation';
    if (code.startsWith('E')) return 'Premium';
    if (code.startsWith('Z')) return 'Surgery';
    if (code.startsWith('R')) return 'Repair';
    if (code.startsWith('F')) return 'Fracture';
    if (code.startsWith('D')) return 'Dislocation';
    if (code.startsWith('B')) return 'Telemedicine';
    if (code.startsWith('M')) return 'Major Surgery';
    if (code.startsWith('P')) return 'Obstetrics';
    return 'Other';
  }

  private extractTimeOfDay(howToUse: string): string | undefined {
    if (!howToUse) return undefined;
    
    const timePatterns = [
      { pattern: /Mon-Fri 0800-1700/i, time: 'Day' },
      { pattern: /Mon-Fri 1700-0000/i, time: 'Evening' },
      { pattern: /Weekend|Holiday/i, time: 'Weekend' },
      { pattern: /Night|0000-0800/i, time: 'Night' }
    ];

    for (const { pattern, time } of timePatterns) {
      if (pattern.test(howToUse)) return time;
    }
    return undefined;
  }

  private extractModifiers(howToUse: string): string[] {
    if (!howToUse) return [];
    
    const modifierPattern = /modifier\s*([A-Z0-9]+)/gi;
    const matches = howToUse.match(modifierPattern);
    return matches ? matches.map(m => m.replace(/modifier\s*/i, '')) : [];
  }

  private extractBundlingRules(howToUse: string): string[] {
    if (!howToUse) return [];
    
    const bundlingPattern = /(?:cannot|can't|do not|don't)\s+bill\s+with\s+([A-Z0-9\s,]+)/gi;
    const matches = howToUse.match(bundlingPattern);
    return matches ? matches.map(m => m.replace(/(?:cannot|can't|do not|don't)\s+bill\s+with\s+/i, '').trim()) : [];
  }

  private extractExclusions(howToUse: string): string[] {
    if (!howToUse) return [];
    
    const exclusionPattern = /(?:except|unless|not\s+if)\s+([A-Z0-9\s,]+)/gi;
    const matches = howToUse.match(exclusionPattern);
    return matches ? matches.map(m => m.replace(/(?:except|unless|not\s+if)\s+/i, '').trim()) : [];
  }

  private async buildSearchIndex(): Promise<void> {
    for (const [code, billingCode] of this.billingCodes) {
      const keywords = this.extractKeywords(billingCode);
      
      for (const keyword of keywords) {
        if (!this.codeIndex.has(keyword)) {
          this.codeIndex.set(keyword, []);
        }
        this.codeIndex.get(keyword)!.push(code);
      }
    }

    logger.info(`Built search index with ${this.codeIndex.size} keywords`);
  }

  private extractKeywords(billingCode: BillingCode): string[] {
    const keywords = new Set<string>();
    
    // Add code itself
    keywords.add(billingCode.code.toLowerCase());
    
    // Add description words
    const descWords = billingCode.description.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^\w]/g, ''));
    
    descWords.forEach(word => keywords.add(word));
    
    // Add how to use keywords
    const useWords = billingCode.howToUse.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^\w]/g, ''));
    
    useWords.forEach(word => keywords.add(word));
    
    // Add medical terms
    const medicalTerms = this.extractMedicalTerms(billingCode.description + ' ' + billingCode.howToUse);
    medicalTerms.forEach(term => keywords.add(term));
    
    return Array.from(keywords);
  }

  private extractMedicalTerms(text: string): string[] {
    const medicalTerms = [
      'assessment', 'consultation', 'procedure', 'surgery', 'fracture', 'dislocation',
      'laceration', 'repair', 'injection', 'aspiration', 'drainage', 'removal',
      'reduction', 'anesthesia', 'critical', 'emergency', 'trauma', 'burn',
      'cardiac', 'respiratory', 'neurological', 'orthopedic', 'dermatology',
      'ophthalmology', 'otolaryngology', 'urology', 'gynecology', 'pediatric',
      'geriatric', 'telemedicine', 'telehealth', 'ultrasound', 'xray', 'ct',
      'mri', 'lab', 'blood', 'urine', 'stool', 'culture', 'biopsy'
    ];
    
    const foundTerms = medicalTerms.filter(term => 
      text.toLowerCase().includes(term)
    );
    
    return foundTerms;
  }

  async searchCodes(query: string, filters?: {
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    timeOfDay?: string;
  }): Promise<BillingCode[]> {
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    const matchingCodes = new Set<string>();
    
    // Find codes by keyword matching
    for (const word of queryWords) {
      for (const [keyword, codes] of this.codeIndex) {
        if (keyword.includes(word) || word.includes(keyword)) {
          codes.forEach(code => matchingCodes.add(code));
        }
      }
    }
    
    // Convert to BillingCode objects and apply filters
    let results = Array.from(matchingCodes)
      .map(code => this.billingCodes.get(code))
      .filter((code): code is BillingCode => code !== undefined);
    
    // Apply filters
    if (filters) {
      if (filters.category) {
        results = results.filter(code => code.category === filters.category);
      }
      if (filters.minAmount !== undefined) {
        results = results.filter(code => code.amount >= filters.minAmount!);
      }
      if (filters.maxAmount !== undefined) {
        results = results.filter(code => code.amount <= filters.maxAmount!);
      }
      if (filters.timeOfDay) {
        results = results.filter(code => code.timeOfDay === filters.timeOfDay);
      }
    }
    
    // Sort by relevance (exact matches first, then by amount)
    results.sort((a, b) => {
      const aExact = queryWords.some(word => 
        a.description.toLowerCase().includes(word) || 
        a.code.toLowerCase().includes(word)
      );
      const bExact = queryWords.some(word => 
        b.description.toLowerCase().includes(word) || 
        b.code.toLowerCase().includes(word)
      );
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      return b.amount - a.amount; // Higher amounts first
    });
    
    return results.slice(0, 20); // Limit results
  }

  async findOptimalCodes(clinicalText: string, encounterType: string = 'Emergency'): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];
    
    // Extract key clinical terms
    const clinicalTerms = this.extractClinicalTerms(clinicalText);
    
    // Search for relevant codes
    const searchQuery = clinicalTerms.join(' ');
    const matchingCodes = await this.searchCodes(searchQuery);
    
    // Analyze each code for optimization potential
    for (const code of matchingCodes) {
      const confidence = this.calculateConfidence(clinicalText, code);
      const revenueImpact = this.calculateRevenueImpact(code, encounterType);
      
      if (confidence > 0.3) { // Only suggest codes with reasonable confidence
        suggestions.push({
          suggestedCode: code,
          reason: this.generateReason(clinicalText, code),
          revenueImpact,
          confidence,
          riskLevel: this.assessRisk(code, clinicalText),
          documentation: this.getRequiredDocumentation(code)
        });
      }
    }
    
    // Sort by revenue impact and confidence
    suggestions.sort((a, b) => {
      const scoreA = a.revenueImpact * a.confidence;
      const scoreB = b.revenueImpact * b.confidence;
      return scoreB - scoreA;
    });
    
    return suggestions.slice(0, 10); // Top 10 suggestions
  }

  private extractClinicalTerms(text: string): string[] {
    const terms = new Set<string>();
    
    // Common medical terms
    const medicalTerms = [
      'chest pain', 'shortness of breath', 'abdominal pain', 'headache', 'fever',
      'nausea', 'vomiting', 'diarrhea', 'constipation', 'dizziness', 'syncope',
      'seizure', 'stroke', 'heart attack', 'pneumonia', 'asthma', 'copd',
      'hypertension', 'diabetes', 'infection', 'trauma', 'fracture', 'laceration',
      'burn', 'allergic reaction', 'anaphylaxis', 'shock', 'cardiac arrest',
      'respiratory distress', 'altered mental status', 'confusion', 'delirium'
    ];
    
    const lowerText = text.toLowerCase();
    medicalTerms.forEach(term => {
      if (lowerText.includes(term)) {
        terms.add(term);
      }
    });
    
    // Extract individual words
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.replace(/[^\w]/g, ''));
    
    words.forEach(word => terms.add(word));
    
    return Array.from(terms);
  }

  private calculateConfidence(clinicalText: string, code: BillingCode): number {
    let confidence = 0;
    const text = clinicalText.toLowerCase();
    const description = code.description.toLowerCase();
    const howToUse = code.howToUse.toLowerCase();
    
    // Check description match
    const descWords = description.split(/\s+/);
    const matchingDescWords = descWords.filter(word => 
      text.includes(word) && word.length > 3
    );
    confidence += (matchingDescWords.length / descWords.length) * 0.4;
    
    // Check how to use match
    const useWords = howToUse.split(/\s+/);
    const matchingUseWords = useWords.filter(word => 
      text.includes(word) && word.length > 3
    );
    confidence += (matchingUseWords.length / useWords.length) * 0.3;
    
    // Check for specific medical conditions
    const conditions = this.extractMedicalTerms(description + ' ' + howToUse);
    const matchingConditions = conditions.filter(condition => 
      text.includes(condition)
    );
    confidence += (matchingConditions.length / conditions.length) * 0.3;
    
    return Math.min(confidence, 1);
  }

  private calculateRevenueImpact(code: BillingCode, encounterType: string): number {
    let baseAmount = code.amount;
    
    // Apply time-based multipliers
    if (code.timeOfDay === 'Evening') baseAmount *= 1.2;
    if (code.timeOfDay === 'Weekend') baseAmount *= 1.5;
    if (code.timeOfDay === 'Night') baseAmount *= 1.8;
    
    // Apply encounter type multipliers
    if (encounterType === 'Emergency') baseAmount *= 1.3;
    if (encounterType === 'Trauma') baseAmount *= 1.5;
    
    return baseAmount;
  }

  private generateReason(clinicalText: string, code: BillingCode): string {
    const reasons = [];
    
    // Check for specific conditions mentioned
    const conditions = this.extractMedicalTerms(clinicalText);
    const matchingConditions = conditions.filter(condition => 
      code.description.toLowerCase().includes(condition) ||
      code.howToUse.toLowerCase().includes(condition)
    );
    
    if (matchingConditions.length > 0) {
      reasons.push(`Clinical presentation matches: ${matchingConditions.join(', ')}`);
    }
    
    // Check for procedure indicators
    if (code.category === 'Procedure' && this.hasProcedureIndicators(clinicalText)) {
      reasons.push('Procedure performed as documented');
    }
    
    // Check for assessment level
    if (code.category === 'Assessment' && this.hasAssessmentIndicators(clinicalText)) {
      reasons.push('Assessment level appropriate for complexity');
    }
    
    // Check for time-based billing
    if (code.timeOfDay && this.isTimeAppropriate(code.timeOfDay)) {
      reasons.push(`Time-based billing appropriate for ${code.timeOfDay.toLowerCase()} encounter`);
    }
    
    return reasons.join('; ') || 'Code matches clinical documentation';
  }

  private hasProcedureIndicators(text: string): boolean {
    const procedureKeywords = [
      'performed', 'completed', 'administered', 'injected', 'aspirated',
      'drained', 'removed', 'repaired', 'sutured', 'casted', 'splinted'
    ];
    
    return procedureKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private hasAssessmentIndicators(text: string): boolean {
    const assessmentKeywords = [
      'examined', 'assessed', 'evaluated', 'reviewed', 'analyzed',
      'comprehensive', 'detailed', 'thorough', 'extensive'
    ];
    
    return assessmentKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private isTimeAppropriate(timeOfDay: string): boolean {
    const now = new Date();
    const hour = now.getHours();
    
    switch (timeOfDay) {
      case 'Day': return hour >= 8 && hour < 17;
      case 'Evening': return hour >= 17 && hour < 24;
      case 'Night': return hour >= 0 && hour < 8;
      case 'Weekend': return now.getDay() === 0 || now.getDay() === 6;
      default: return true;
    }
  }

  private assessRisk(code: BillingCode, clinicalText: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;
    
    // High-value codes have higher risk
    if (code.amount > 200) riskScore += 2;
    else if (code.amount > 100) riskScore += 1;
    
    // Time-based billing increases risk
    if (code.timeOfDay) riskScore += 1;
    
    // Premium codes have higher risk
    if (code.category === 'Premium') riskScore += 2;
    
    // Critical care codes have higher risk
    if (code.description.toLowerCase().includes('critical')) riskScore += 2;
    
    // Check for documentation requirements
    const docRequirements = this.getRequiredDocumentation(code);
    if (docRequirements.length > 3) riskScore += 1;
    
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private getRequiredDocumentation(code: BillingCode): string[] {
    const requirements = [];
    
    // Time-based documentation
    if (code.timeOfDay) {
      requirements.push(`Document time of encounter (${code.timeOfDay})`);
    }
    
    // Procedure documentation
    if (code.category === 'Procedure') {
      requirements.push('Document procedure performed');
      requirements.push('Document indication for procedure');
    }
    
    // Assessment documentation
    if (code.category === 'Assessment') {
      requirements.push('Document assessment level');
      requirements.push('Document complexity of case');
    }
    
    // Critical care documentation
    if (code.description.toLowerCase().includes('critical')) {
      requirements.push('Document critical care time');
      requirements.push('Document interventions performed');
    }
    
    // Modifier documentation
    if (code.modifiers && code.modifiers.length > 0) {
      requirements.push(`Document justification for modifiers: ${code.modifiers.join(', ')}`);
    }
    
    return requirements;
  }

  async analyzeEncounter(encounterId: string, clinicalText: string): Promise<EncounterAnalysis> {
    const encounter = await this.prisma.encounter.findUnique({
      where: { id: encounterId },
      include: {
        diagnoses: true,
        procedures: true
      }
    });

    if (!encounter) {
      throw new Error('Encounter not found');
    }

    // Find optimal codes
    const optimizations = await this.findOptimalCodes(clinicalText, encounter.type);
    
    // Calculate current revenue
    const currentRevenue = encounter.procedures.reduce((sum, proc) => 
      sum + (proc.chargeAmount || 0), 0
    );
    
    // Calculate potential revenue
    const potentialRevenue = optimizations.reduce((sum, opt) => 
      sum + opt.revenueImpact, 0
    );
    
    // Assess risk
    const highRiskCodes = optimizations
      .filter(opt => opt.riskLevel === 'HIGH')
      .map(opt => opt.suggestedCode.code);
    
    const complianceIssues = this.identifyComplianceIssues(optimizations);
    
    return {
      encounterId,
      clinicalText,
      suggestedCodes: optimizations.map(opt => opt.suggestedCode),
      optimizations,
      totalRevenue: currentRevenue,
      potentialRevenue,
      revenueIncrease: potentialRevenue - currentRevenue,
      riskAssessment: {
        overallRisk: highRiskCodes.length > 2 ? 'HIGH' : 
                    highRiskCodes.length > 0 ? 'MEDIUM' : 'LOW',
        highRiskCodes,
        complianceIssues
      }
    };
  }

  private identifyComplianceIssues(optimizations: OptimizationSuggestion[]): string[] {
    const issues = [];
    
    // Check for bundling issues
    const codes = optimizations.map(opt => opt.suggestedCode.code);
    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        const code1 = this.billingCodes.get(codes[i]);
        const code2 = this.billingCodes.get(codes[j]);
        
        if (code1 && code2) {
          // Check if codes have bundling restrictions
          if (code1.bundlingRules?.some(rule => 
            code2.description.toLowerCase().includes(rule.toLowerCase())
          )) {
            issues.push(`Potential bundling issue: ${code1.code} and ${code2.code}`);
          }
        }
      }
    }
    
    // Check for high-risk combinations
    const highRiskCodes = optimizations.filter(opt => opt.riskLevel === 'HIGH');
    if (highRiskCodes.length > 3) {
      issues.push('Multiple high-risk codes may increase audit probability');
    }
    
    return issues;
  }

  getCodeByCode(code: string): BillingCode | undefined {
    return this.billingCodes.get(code);
  }

  getAllCodes(): BillingCode[] {
    return Array.from(this.billingCodes.values());
  }

  getCodesByCategory(category: string): BillingCode[] {
    return Array.from(this.billingCodes.values())
      .filter(code => code.category === category);
  }
}

export const billingCodeService = new BillingCodeService();
