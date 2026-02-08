import { billingCodeService, BillingCode, OptimizationSuggestion, getCurrentTimeSlot } from './billingCodeService';
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
  timeSlot: string;
  primaryCode: BillingCode | null;
  addOnCodes: BillingCode[];
  premiumCodes: BillingCode[];
}

// Response cache
const queryCache: Map<string, { response: RAGResponse; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class RAGBillingAgent {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (!this.isInitialized) {
      await billingCodeService.initialize();
      this.isInitialized = true;
      logger.info('RAGBillingAgent initialized');
    }
  }

  async processQuery(query: RAGQuery): Promise<RAGResponse> {
    await this.initialize();

    // Check cache
    const cacheKey = `${query.clinicalText.substring(0, 200)}|${query.timeOfDay || ''}|${query.encounterType || ''}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info('Returning cached RAG response');
      return cached.response;
    }

    try {
      // Step 1: Determine time slot (auto-detect or from query)
      const timeSlot = query.timeOfDay || getCurrentTimeSlot();

      // Step 2: Extract clinical entities using AI
      const clinicalContext = await aiService.extractClinicalEntities(query.clinicalText);

      // Step 3: Semantic search for relevant codes (Pinecone → TF-IDF fallback)
      const searchQuery = this.buildSearchQuery(query.clinicalText, clinicalContext);
      const semanticMatches = await billingCodeService.semanticSearch(searchQuery, 20);

      // Step 4: Get primary + add-on structure
      const { primary, addOns, premiums } = await billingCodeService.suggestPrimaryAndAddOns(
        query.clinicalText, timeSlot
      );

      // Step 5: Build optimizations with proper roles
      const optimizations = this.buildOptimizations(
        primary, addOns, premiums, semanticMatches, query, clinicalContext, timeSlot
      );

      // Step 6: Revenue analysis
      const revenueAnalysis = this.calculateRevenue(optimizations, query);

      // Step 7: Risk assessment
      const riskAssessment = this.assessRisk(optimizations);

      // Step 8: Documentation requirements
      const documentation = this.getDocumentationRequirements(optimizations, clinicalContext);

      // Step 9: AI explanation
      const explanation = await this.generateExplanation(query, optimizations, revenueAnalysis, timeSlot);

      // Step 10: Confidence
      const confidence = this.calculateConfidence(optimizations, clinicalContext);

      const allSuggestedCodes = optimizations.map(o => o.suggestedCode);

      const response: RAGResponse = {
        query,
        suggestedCodes: allSuggestedCodes,
        optimizations,
        revenueAnalysis,
        riskAssessment,
        documentation,
        explanation,
        confidence,
        timeSlot,
        primaryCode: primary,
        addOnCodes: addOns,
        premiumCodes: premiums,
      };

      // Cache
      queryCache.set(cacheKey, { response, timestamp: Date.now() });

      return response;
    } catch (error) {
      logger.error('RAG query processing failed:', error);
      throw new Error('Failed to process billing query');
    }
  }

  private buildSearchQuery(clinicalText: string, context: any): string {
    const parts: string[] = [clinicalText];

    if (context.chiefComplaint) parts.push(context.chiefComplaint);
    if (context.symptoms?.length) parts.push(context.symptoms.join(' '));
    if (context.diagnoses?.length) parts.push(context.diagnoses.join(' '));
    if (context.procedures?.length) parts.push(context.procedures.join(' '));

    if (context.isCriticalCare) parts.push('critical care life threatening');
    if (context.isTrauma) parts.push('trauma emergency');

    return parts.join(' ');
  }

  private buildOptimizations(
    primary: BillingCode | null,
    addOns: BillingCode[],
    premiums: BillingCode[],
    semanticMatches: Array<{ code: BillingCode; confidence: number; reason: string }>,
    query: RAGQuery,
    clinicalContext: any,
    timeSlot: string
  ): OptimizationSuggestion[] {
    const optimizations: OptimizationSuggestion[] = [];
    const usedCodes = new Set<string>();

    // 1. Primary code (always first)
    if (primary) {
      optimizations.push({
        suggestedCode: primary,
        reason: `Primary ${timeSlot} assessment code. ${this.getTimeDescription(timeSlot)}`,
        revenueImpact: primary.amount,
        confidence: 0.95,
        riskLevel: 'LOW',
        documentation: this.getCodeDocumentation(primary),
        codeRole: 'PRIMARY',
      });
      usedCodes.add(primary.code);
    }

    // 2. Add-on codes
    for (const addon of addOns) {
      if (usedCodes.has(addon.code)) continue;
      usedCodes.add(addon.code);

      const matchInfo = semanticMatches.find(m => m.code.code === addon.code);
      optimizations.push({
        suggestedCode: addon,
        reason: matchInfo?.reason || `Add-on procedure/service matching clinical documentation`,
        revenueImpact: addon.amount,
        confidence: matchInfo?.confidence || 0.7,
        riskLevel: this.assessCodeRisk(addon),
        documentation: this.getCodeDocumentation(addon),
        codeRole: 'ADD_ON',
      });
    }

    // 3. Premium codes
    for (const premium of premiums) {
      if (usedCodes.has(premium.code)) continue;
      usedCodes.add(premium.code);

      optimizations.push({
        suggestedCode: premium,
        reason: `${timeSlot} premium — auto-applied based on current time`,
        revenueImpact: premium.amount,
        confidence: 0.9,
        riskLevel: 'LOW',
        documentation: [`Document time of encounter: ${timeSlot}`],
        codeRole: 'PREMIUM',
      });
    }

    // 4. Additional semantic matches not already included
    for (const match of semanticMatches) {
      if (usedCodes.has(match.code.code)) continue;
      if (optimizations.length >= (query.maxSuggestions || 10)) break;
      if (match.confidence < 0.3) continue;
      usedCodes.add(match.code.code);

      optimizations.push({
        suggestedCode: match.code,
        reason: match.reason,
        revenueImpact: match.code.amount,
        confidence: match.confidence,
        riskLevel: this.assessCodeRisk(match.code),
        documentation: this.getCodeDocumentation(match.code),
        codeRole: match.code.isPrimary ? 'PRIMARY' : match.code.category === 'Premium' ? 'PREMIUM' : 'ADD_ON',
      });
    }

    // Sort: PRIMARY first, then ADD_ON by confidence, then PREMIUM
    optimizations.sort((a, b) => {
      const roleOrder = { PRIMARY: 0, ADD_ON: 1, PREMIUM: 2 };
      const orderDiff = roleOrder[a.codeRole] - roleOrder[b.codeRole];
      if (orderDiff !== 0) return orderDiff;
      return (b.revenueImpact * b.confidence) - (a.revenueImpact * a.confidence);
    });

    return optimizations.slice(0, query.maxSuggestions || 10);
  }

  private getTimeDescription(timeSlot: string): string {
    const descriptions: Record<string, string> = {
      Day: 'Mon-Fri 0800-1700',
      Evening: 'Mon-Fri 1700-0000 (20% premium eligible)',
      Night: '0000-0800 (40% premium eligible)',
      Weekend: 'Weekend/Holiday (higher base rates)',
    };
    return descriptions[timeSlot] || '';
  }

  private assessCodeRisk(code: BillingCode): 'LOW' | 'MEDIUM' | 'HIGH' {
    let risk = 0;
    if (code.amount > 200) risk += 2;
    else if (code.amount > 100) risk += 1;
    if (code.category === 'Premium') risk += 1;
    if (code.description.toLowerCase().includes('critical')) risk += 2;
    if (code.bundlingRules && code.bundlingRules.length > 0) risk += 1;

    if (risk >= 4) return 'HIGH';
    if (risk >= 2) return 'MEDIUM';
    return 'LOW';
  }

  private getCodeDocumentation(code: BillingCode): string[] {
    const docs: string[] = [];

    if (code.timeOfDay) docs.push(`Document time of encounter (${code.timeOfDay})`);
    if (code.category.includes('Procedure') || code.category.includes('Surgery')) {
      docs.push('Document procedure performed');
      docs.push('Document indication for procedure');
    }
    if (code.isPrimary) {
      docs.push('Document assessment level and complexity');
    }
    if (code.description.toLowerCase().includes('critical')) {
      docs.push('Document critical care time (start/stop)');
      docs.push('Document interventions performed');
    }
    if (code.code.startsWith('K7')) {
      docs.push('Document consultation start/stop time');
      docs.push('Document name of consultant');
    }
    if (code.bundlingRules && code.bundlingRules.length > 0) {
      docs.push(`Bundling note: ${code.bundlingRules.join('; ')}`);
    }

    return docs;
  }

  private calculateRevenue(optimizations: OptimizationSuggestion[], query: RAGQuery): {
    currentRevenue: number;
    potentialRevenue: number;
    revenueIncrease: number;
    percentageIncrease: number;
  } {
    const currentRevenue = 0;
    const potentialRevenue = optimizations.reduce((sum, opt) => sum + opt.revenueImpact, 0);
    return {
      currentRevenue,
      potentialRevenue,
      revenueIncrease: potentialRevenue,
      percentageIncrease: 0,
    };
  }

  private assessRisk(optimizations: OptimizationSuggestion[]): {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: string[];
    complianceScore: number;
  } {
    const highRisk = optimizations.filter(o => o.riskLevel === 'HIGH').length;
    const mediumRisk = optimizations.filter(o => o.riskLevel === 'MEDIUM').length;

    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    const riskFactors: string[] = [];

    if (highRisk > 2) {
      overallRisk = 'HIGH';
      riskFactors.push(`${highRisk} high-risk codes`);
    } else if (highRisk > 0 || mediumRisk > 3) {
      overallRisk = 'MEDIUM';
    }

    if (optimizations.length > 6) {
      riskFactors.push('Many codes — ensure each is documented');
    }

    // Check for multiple primary codes (billing error)
    const primaryCount = optimizations.filter(o => o.codeRole === 'PRIMARY').length;
    if (primaryCount > 1) {
      riskFactors.push('Multiple primary assessment codes — only one allowed per encounter');
      overallRisk = 'HIGH';
    }

    const complianceScore = Math.max(0, 100 - highRisk * 15 - mediumRisk * 5 - (primaryCount > 1 ? 20 : 0));

    return { overallRisk, riskFactors, complianceScore };
  }

  private getDocumentationRequirements(optimizations: OptimizationSuggestion[], context: any): {
    required: string[];
    recommended: string[];
    missing: string[];
  } {
    const required = new Set<string>();
    const recommended = new Set<string>();

    for (const opt of optimizations) {
      opt.documentation.forEach(d => required.add(d));
    }

    recommended.add('Document vital signs');
    recommended.add('Document patient disposition');
    recommended.add('Document clinical decision making');

    if (context.isCriticalCare) {
      required.add('Document critical care start and stop times');
      required.add('Document all interventions performed');
    }

    return {
      required: Array.from(required),
      recommended: Array.from(recommended),
      missing: [],
    };
  }

  private async generateExplanation(
    query: RAGQuery,
    optimizations: OptimizationSuggestion[],
    revenueAnalysis: any,
    timeSlot: string
  ): Promise<string> {
    try {
      const codes = optimizations.map(o => ({
        code: o.suggestedCode.code,
        description: o.suggestedCode.description,
        amount: o.revenueImpact,
        role: o.codeRole,
      }));

      return await aiService.generateBillingExplanation(
        query.clinicalText,
        codes,
        revenueAnalysis.potentialRevenue
      );
    } catch (error) {
      logger.error('Failed to generate explanation:', error);

      // Fallback: generate a simple explanation
      const primary = optimizations.find(o => o.codeRole === 'PRIMARY');
      const addOnCount = optimizations.filter(o => o.codeRole === 'ADD_ON').length;
      const premiumCount = optimizations.filter(o => o.codeRole === 'PREMIUM').length;

      return `Based on the clinical documentation, the recommended primary code is ${primary?.suggestedCode.code || 'N/A'} ` +
        `(${primary?.suggestedCode.description || ''}) for this ${timeSlot.toLowerCase()} encounter. ` +
        `${addOnCount} add-on codes and ${premiumCount} premiums are also recommended, ` +
        `bringing the total estimated revenue to $${revenueAnalysis.potentialRevenue.toFixed(2)} CAD.`;
    }
  }

  private calculateConfidence(optimizations: OptimizationSuggestion[], context: any): number {
    if (optimizations.length === 0) return 0;

    const avgConfidence = optimizations.reduce((sum, o) => sum + o.confidence, 0) / optimizations.length;

    let contextBonus = 0;
    if (context.chiefComplaint) contextBonus += 0.1;
    if (context.symptoms?.length > 0) contextBonus += 0.05;
    if (context.diagnoses?.length > 0) contextBonus += 0.1;
    if (context.procedures?.length > 0) contextBonus += 0.1;

    return Math.min((avgConfidence + contextBonus), 1);
  }
}

export const ragBillingAgent = new RAGBillingAgent();
