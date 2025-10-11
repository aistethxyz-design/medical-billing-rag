import { billingCodeService, BillingCode, OptimizationSuggestion, EncounterAnalysis } from './billingCodeService';
import { aiService } from './aiService';
import { logger } from '../utils/logger';

export interface RAGQuery {
  clinicalText: string;
  encounterType?: string;
  patientAge?: string;
  timeOfDay?: string;
  specialty?: string;
  existingCodes?: string[];
  maxSuggestions?: number;
}

export interface RAGResponse {
  query: RAGQuery;
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
}

export interface CodeContext {
  code: BillingCode;
  relevanceScore: number;
  clinicalIndicators: string[];
  billingRules: string[];
  similarCases: string[];
}

class RAGBillingAgent {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await billingCodeService.initialize();
      this.isInitialized = true;
      logger.info('RAGBillingAgent initialized successfully');
    }
  }

  async processQuery(query: RAGQuery): Promise<RAGResponse> {
    await this.initialize();

    try {
      // Step 1: Extract clinical entities and context
      const clinicalContext = await this.extractClinicalContext(query);
      
      // Step 2: Find relevant codes using semantic search
      const relevantCodes = await this.findRelevantCodes(clinicalContext, query);
      
      // Step 3: Generate optimization suggestions
      const optimizations = await this.generateOptimizations(relevantCodes, query);
      
      // Step 4: Calculate revenue impact
      const revenueAnalysis = this.calculateRevenueAnalysis(optimizations, query);
      
      // Step 5: Assess risk and compliance
      const riskAssessment = this.assessRisk(optimizations, query);
      
      // Step 6: Generate documentation requirements
      const documentation = this.generateDocumentationRequirements(optimizations, query);
      
      // Step 7: Generate AI explanation
      const explanation = await this.generateExplanation(query, optimizations, revenueAnalysis);
      
      // Step 8: Calculate overall confidence
      const confidence = this.calculateConfidence(optimizations, clinicalContext);

      return {
        query,
        suggestedCodes: optimizations.map(opt => opt.suggestedCode),
        optimizations,
        revenueAnalysis,
        riskAssessment,
        documentation,
        explanation,
        confidence
      };

    } catch (error) {
      logger.error('RAG query processing failed:', error);
      throw new Error('Failed to process billing query');
    }
  }

  private async extractClinicalContext(query: RAGQuery): Promise<any> {
    // Use AI service to extract clinical entities
    const clinicalEntities = await aiService.extractClinicalEntities(query.clinicalText);
    
    return {
      chiefComplaint: clinicalEntities.chiefComplaint || '',
      symptoms: clinicalEntities.symptoms || [],
      diagnoses: clinicalEntities.diagnoses || [],
      procedures: clinicalEntities.procedures || [],
      medications: clinicalEntities.medications || [],
      vitalSigns: clinicalEntities.vitalSigns || {},
      timeOfDay: query.timeOfDay || this.determineTimeOfDay(),
      encounterType: query.encounterType || 'Emergency',
      patientAge: query.patientAge || 'Adult',
      specialty: query.specialty || 'Emergency Medicine'
    };
  }

  private determineTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 17) return 'Day';
    if (hour >= 17 && hour < 24) return 'Evening';
    return 'Night';
  }

  private async findRelevantCodes(clinicalContext: any, query: RAGQuery): Promise<CodeContext[]> {
    const searchTerms = this.buildSearchTerms(clinicalContext);
    const searchQuery = searchTerms.join(' ');
    
    // Search for codes using the billing code service
    const matchingCodes = await billingCodeService.searchCodes(searchQuery, {
      timeOfDay: clinicalContext.timeOfDay,
      category: this.determinePrimaryCategory(clinicalContext)
    });

    // Create code contexts with relevance scoring
    const codeContexts: CodeContext[] = [];
    
    for (const code of matchingCodes) {
      const relevanceScore = await this.calculateRelevanceScore(code, clinicalContext);
      const clinicalIndicators = this.extractClinicalIndicators(code, clinicalContext);
      const billingRules = this.extractBillingRules(code);
      const similarCases = await this.findSimilarCases(code, clinicalContext);
      
      codeContexts.push({
        code,
        relevanceScore,
        clinicalIndicators,
        billingRules,
        similarCases
      });
    }

    // Sort by relevance score
    return codeContexts.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private buildSearchTerms(clinicalContext: any): string[] {
    const terms = new Set<string>();
    
    // Add chief complaint
    if (clinicalContext.chiefComplaint) {
      terms.add(clinicalContext.chiefComplaint);
    }
    
    // Add symptoms
    clinicalContext.symptoms.forEach((symptom: string) => terms.add(symptom));
    
    // Add diagnoses
    clinicalContext.diagnoses.forEach((diagnosis: string) => terms.add(diagnosis));
    
    // Add procedures
    clinicalContext.procedures.forEach((procedure: string) => terms.add(procedure));
    
    // Add specialty-specific terms
    if (clinicalContext.specialty === 'Emergency Medicine') {
      terms.add('emergency');
      terms.add('trauma');
      terms.add('critical');
      terms.add('urgent');
    }
    
    return Array.from(terms);
  }

  private determinePrimaryCategory(clinicalContext: any): string | undefined {
    if (clinicalContext.procedures.length > 0) return 'Procedure';
    if (clinicalContext.diagnoses.length > 0) return 'Assessment';
    return undefined;
  }

  private async calculateRelevanceScore(code: BillingCode, clinicalContext: any): Promise<number> {
    let score = 0;
    
    // Check description match
    const descriptionMatch = this.calculateTextSimilarity(
      code.description.toLowerCase(),
      clinicalContext.chiefComplaint.toLowerCase()
    );
    score += descriptionMatch * 0.3;
    
    // Check symptom matches
    const symptomMatches = clinicalContext.symptoms.filter((symptom: string) =>
      code.description.toLowerCase().includes(symptom.toLowerCase()) ||
      code.howToUse.toLowerCase().includes(symptom.toLowerCase())
    );
    score += (symptomMatches.length / clinicalContext.symptoms.length) * 0.2;
    
    // Check procedure matches
    const procedureMatches = clinicalContext.procedures.filter((procedure: string) =>
      code.description.toLowerCase().includes(procedure.toLowerCase()) ||
      code.howToUse.toLowerCase().includes(procedure.toLowerCase())
    );
    score += (procedureMatches.length / clinicalContext.procedures.length) * 0.3;
    
    // Check time appropriateness
    if (code.timeOfDay === clinicalContext.timeOfDay) {
      score += 0.1;
    }
    
    // Check encounter type appropriateness
    if (this.isEncounterTypeAppropriate(code, clinicalContext.encounterType)) {
      score += 0.1;
    }
    
    return Math.min(score, 1);
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private isEncounterTypeAppropriate(code: BillingCode, encounterType: string): boolean {
    const emergencyCodes = ['H', 'G', 'A'];
    const isEmergencyCode = emergencyCodes.some(prefix => code.code.startsWith(prefix));
    
    return encounterType === 'Emergency' ? isEmergencyCode : !isEmergencyCode;
  }

  private extractClinicalIndicators(code: BillingCode, clinicalContext: any): string[] {
    const indicators = [];
    
    // Check for specific medical conditions
    const conditions = this.extractMedicalTerms(code.description + ' ' + code.howToUse);
    const matchingConditions = conditions.filter(condition =>
      clinicalContext.symptoms.includes(condition) ||
      clinicalContext.diagnoses.includes(condition)
    );
    
    indicators.push(...matchingConditions);
    
    // Check for procedure indicators
    if (code.category === 'Procedure') {
      const procedureIndicators = this.extractProcedureIndicators(clinicalContext);
      indicators.push(...procedureIndicators);
    }
    
    return indicators;
  }

  private extractMedicalTerms(text: string): string[] {
    const medicalTerms = [
      'chest pain', 'shortness of breath', 'abdominal pain', 'headache', 'fever',
      'nausea', 'vomiting', 'diarrhea', 'dizziness', 'syncope', 'seizure',
      'stroke', 'heart attack', 'pneumonia', 'asthma', 'hypertension',
      'diabetes', 'infection', 'trauma', 'fracture', 'laceration', 'burn',
      'allergic reaction', 'shock', 'cardiac arrest', 'respiratory distress'
    ];
    
    return medicalTerms.filter(term => text.toLowerCase().includes(term));
  }

  private extractProcedureIndicators(clinicalContext: any): string[] {
    const procedureKeywords = [
      'performed', 'completed', 'administered', 'injected', 'aspirated',
      'drained', 'removed', 'repaired', 'sutured', 'casted', 'splinted'
    ];
    
    return procedureKeywords.filter(keyword =>
      clinicalContext.procedures.some((proc: string) => 
        proc.toLowerCase().includes(keyword)
      )
    );
  }

  private extractBillingRules(code: BillingCode): string[] {
    const rules = [];
    
    if (code.timeOfDay) {
      rules.push(`Time-based billing: ${code.timeOfDay}`);
    }
    
    if (code.modifiers && code.modifiers.length > 0) {
      rules.push(`Required modifiers: ${code.modifiers.join(', ')}`);
    }
    
    if (code.bundlingRules && code.bundlingRules.length > 0) {
      rules.push(`Bundling restrictions: ${code.bundlingRules.join(', ')}`);
    }
    
    return rules;
  }

  private async findSimilarCases(code: BillingCode, clinicalContext: any): Promise<string[]> {
    // This would typically query a database of similar cases
    // For now, return mock similar cases based on code category
    const similarCases = [];
    
    if (code.category === 'Assessment') {
      similarCases.push('Similar assessment complexity cases');
    } else if (code.category === 'Procedure') {
      similarCases.push('Similar procedure complexity cases');
    }
    
    return similarCases;
  }

  private async generateOptimizations(codeContexts: CodeContext[], query: RAGQuery): Promise<OptimizationSuggestion[]> {
    const optimizations: OptimizationSuggestion[] = [];
    
    for (const context of codeContexts) {
      if (context.relevanceScore > 0.3) { // Only consider relevant codes
        const optimization: OptimizationSuggestion = {
          suggestedCode: context.code,
          reason: this.generateOptimizationReason(context, query),
          revenueImpact: this.calculateRevenueImpact(context.code, query),
          confidence: context.relevanceScore,
          riskLevel: this.assessCodeRisk(context.code, query),
          documentation: this.getRequiredDocumentation(context.code, query)
        };
        
        optimizations.push(optimization);
      }
    }
    
    // Sort by revenue impact and confidence
    return optimizations.sort((a, b) => {
      const scoreA = a.revenueImpact * a.confidence;
      const scoreB = b.revenueImpact * b.confidence;
      return scoreB - scoreA;
    }).slice(0, query.maxSuggestions || 10);
  }

  private generateOptimizationReason(context: CodeContext, query: RAGQuery): string {
    const reasons = [];
    
    if (context.clinicalIndicators.length > 0) {
      reasons.push(`Clinical indicators: ${context.clinicalIndicators.join(', ')}`);
    }
    
    if (context.billingRules.length > 0) {
      reasons.push(`Billing rules: ${context.billingRules.join(', ')}`);
    }
    
    if (context.code.timeOfDay && context.code.timeOfDay === query.timeOfDay) {
      reasons.push(`Time-appropriate billing for ${context.code.timeOfDay.toLowerCase()}`);
    }
    
    return reasons.join('; ') || 'Code matches clinical documentation';
  }

  private calculateRevenueImpact(code: BillingCode, query: RAGQuery): number {
    let baseAmount = code.amount;
    
    // Apply time-based multipliers
    if (code.timeOfDay === 'Evening') baseAmount *= 1.2;
    if (code.timeOfDay === 'Weekend') baseAmount *= 1.5;
    if (code.timeOfDay === 'Night') baseAmount *= 1.8;
    
    // Apply encounter type multipliers
    if (query.encounterType === 'Emergency') baseAmount *= 1.3;
    if (query.encounterType === 'Trauma') baseAmount *= 1.5;
    
    return baseAmount;
  }

  private assessCodeRisk(code: BillingCode, query: RAGQuery): 'LOW' | 'MEDIUM' | 'HIGH' {
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
    
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private getRequiredDocumentation(code: BillingCode, query: RAGQuery): string[] {
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
    
    return requirements;
  }

  private calculateRevenueAnalysis(optimizations: OptimizationSuggestion[], query: RAGQuery): any {
    const currentRevenue = 0; // Would be calculated from existing codes
    const potentialRevenue = optimizations.reduce((sum, opt) => sum + opt.revenueImpact, 0);
    const revenueIncrease = potentialRevenue - currentRevenue;
    const percentageIncrease = currentRevenue > 0 ? (revenueIncrease / currentRevenue) * 100 : 0;
    
    return {
      currentRevenue,
      potentialRevenue,
      revenueIncrease,
      percentageIncrease
    };
  }

  private assessRisk(optimizations: OptimizationSuggestion[], query: RAGQuery): any {
    const highRiskCodes = optimizations.filter(opt => opt.riskLevel === 'HIGH');
    const mediumRiskCodes = optimizations.filter(opt => opt.riskLevel === 'MEDIUM');
    
    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (highRiskCodes.length > 2) overallRisk = 'HIGH';
    else if (highRiskCodes.length > 0 || mediumRiskCodes.length > 3) overallRisk = 'MEDIUM';
    
    const riskFactors = [];
    if (highRiskCodes.length > 0) {
      riskFactors.push(`${highRiskCodes.length} high-risk codes`);
    }
    if (optimizations.length > 5) {
      riskFactors.push('Multiple code suggestions may increase audit risk');
    }
    
    const complianceScore = this.calculateComplianceScore(optimizations);
    
    return {
      overallRisk,
      riskFactors,
      complianceScore
    };
  }

  private calculateComplianceScore(optimizations: OptimizationSuggestion[]): number {
    let score = 100;
    
    // Deduct points for high-risk codes
    const highRiskCount = optimizations.filter(opt => opt.riskLevel === 'HIGH').length;
    score -= highRiskCount * 10;
    
    // Deduct points for too many suggestions
    if (optimizations.length > 5) {
      score -= (optimizations.length - 5) * 5;
    }
    
    return Math.max(score, 0);
  }

  private generateDocumentationRequirements(optimizations: OptimizationSuggestion[], query: RAGQuery): any {
    const required = new Set<string>();
    const recommended = new Set<string>();
    const missing = new Set<string>();
    
    optimizations.forEach(opt => {
      opt.documentation.forEach(doc => required.add(doc));
    });
    
    // Add specialty-specific documentation
    if (query.specialty === 'Emergency Medicine') {
      recommended.add('Document vital signs');
      recommended.add('Document pain scale');
      recommended.add('Document disposition');
    }
    
    return {
      required: Array.from(required),
      recommended: Array.from(recommended),
      missing: Array.from(missing)
    };
  }

  private async generateExplanation(query: RAGQuery, optimizations: OptimizationSuggestion[], revenueAnalysis: any): Promise<string> {
    const prompt = `
    Based on the clinical text: "${query.clinicalText}"
    
    I've identified ${optimizations.length} potential billing codes with a total revenue impact of $${revenueAnalysis.revenueIncrease.toFixed(2)}.
    
    Top suggestions:
    ${optimizations.slice(0, 3).map(opt => 
      `- ${opt.suggestedCode.code}: ${opt.suggestedCode.description} ($${opt.revenueImpact.toFixed(2)})`
    ).join('\n')}
    
    Please provide a clear, concise explanation of the billing recommendations, focusing on:
    1. Clinical justification for each code
    2. Revenue optimization opportunities
    3. Documentation requirements
    4. Risk considerations
    `;
    
    try {
      return await aiService.chatbotResponse(prompt);
    } catch (error) {
      logger.error('Failed to generate explanation:', error);
      return 'Unable to generate detailed explanation at this time.';
    }
  }

  private calculateConfidence(optimizations: OptimizationSuggestion[], clinicalContext: any): number {
    if (optimizations.length === 0) return 0;
    
    const avgConfidence = optimizations.reduce((sum, opt) => sum + opt.confidence, 0) / optimizations.length;
    const clinicalMatchScore = this.calculateClinicalMatchScore(clinicalContext);
    
    return (avgConfidence + clinicalMatchScore) / 2;
  }

  private calculateClinicalMatchScore(clinicalContext: any): number {
    let score = 0;
    
    // Check for chief complaint
    if (clinicalContext.chiefComplaint) score += 0.3;
    
    // Check for symptoms
    if (clinicalContext.symptoms.length > 0) score += 0.2;
    
    // Check for diagnoses
    if (clinicalContext.diagnoses.length > 0) score += 0.2;
    
    // Check for procedures
    if (clinicalContext.procedures.length > 0) score += 0.3;
    
    return Math.min(score, 1);
  }
}

export const ragBillingAgent = new RAGBillingAgent();
