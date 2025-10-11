// Medical Billing RAG Service
// Implements the core RAG functionality from the Python backend

export interface BillingCode {
  code: string;
  description: string;
  category: string;
  amount: number;
  rvu?: number;
  specialty?: string;
  modifier?: string;
}

export interface RAGResponse {
  query: string;
  results: BillingCode[];
  confidence: number;
  processingTime: number;
  totalResults: number;
}

export interface RevenueAnalysis {
  currentCodes: BillingCode[];
  suggestedCodes: BillingCode[];
  potentialIncrease: number;
  optimizationOpportunities: string[];
}

// Mock medical billing codes database (simulates the CSV data)
const BILLING_CODES_DB: BillingCode[] = [
  // Primary Care
  { code: "99213", description: "Office visit, established patient, low complexity", category: "Evaluation & Management", amount: 150.00, rvu: 1.3, specialty: "Primary Care" },
  { code: "99214", description: "Office visit, established patient, moderate complexity", category: "Evaluation & Management", amount: 210.00, rvu: 1.9, specialty: "Primary Care" },
  { code: "99215", description: "Office visit, established patient, high complexity", category: "Evaluation & Management", amount: 280.00, rvu: 2.8, specialty: "Primary Care" },
  { code: "99203", description: "Office visit, new patient, low complexity", category: "Evaluation & Management", amount: 180.00, rvu: 1.6, specialty: "Primary Care" },
  { code: "99204", description: "Office visit, new patient, moderate complexity", category: "Evaluation & Management", amount: 275.00, rvu: 2.4, specialty: "Primary Care" },
  
  // Cardiology
  { code: "93306", description: "Echocardiography, complete", category: "Cardiovascular", amount: 850.00, rvu: 4.2, specialty: "Cardiology" },
  { code: "93000", description: "Electrocardiogram, routine ECG with 12 leads", category: "Cardiovascular", amount: 125.00, rvu: 0.8, specialty: "Cardiology" },
  { code: "93015", description: "Cardiovascular stress test", category: "Cardiovascular", amount: 420.00, rvu: 2.1, specialty: "Cardiology" },
  { code: "93224", description: "24-hour Holter monitor", category: "Cardiovascular", amount: 380.00, rvu: 1.9, specialty: "Cardiology" },
  
  // Radiology
  { code: "73721", description: "MRI of lower extremity", category: "Radiology", amount: 1200.00, rvu: 6.0, specialty: "Radiology" },
  { code: "71250", description: "CT scan of thorax without contrast", category: "Radiology", amount: 650.00, rvu: 3.2, specialty: "Radiology" },
  { code: "72148", description: "MRI of lumbar spine", category: "Radiology", amount: 1100.00, rvu: 5.5, specialty: "Radiology" },
  { code: "76700", description: "Abdominal ultrasound", category: "Radiology", amount: 380.00, rvu: 1.9, specialty: "Radiology" },
  
  // Surgery
  { code: "47562", description: "Laparoscopic cholecystectomy", category: "Surgery", amount: 3200.00, rvu: 16.0, specialty: "Surgery" },
  { code: "44970", description: "Laparoscopic appendectomy", category: "Surgery", amount: 2800.00, rvu: 14.0, specialty: "Surgery" },
  { code: "29827", description: "Arthroscopy, shoulder, surgical", category: "Surgery", amount: 2100.00, rvu: 10.5, specialty: "Orthopedics" },
  
  // Laboratory
  { code: "80053", description: "Comprehensive metabolic panel", category: "Laboratory", amount: 85.00, rvu: 0.4, specialty: "Laboratory" },
  { code: "85025", description: "Complete blood count with differential", category: "Laboratory", amount: 65.00, rvu: 0.3, specialty: "Laboratory" },
  { code: "84443", description: "Thyroid stimulating hormone (TSH)", category: "Laboratory", amount: 120.00, rvu: 0.6, specialty: "Laboratory" },
  
  // Specialty Procedures
  { code: "45378", description: "Diagnostic colonoscopy", category: "Gastroenterology", amount: 1800.00, rvu: 9.0, specialty: "Gastroenterology" },
  { code: "52000", description: "Cystoscopy", category: "Urology", amount: 950.00, rvu: 4.8, specialty: "Urology" },
  { code: "92004", description: "Comprehensive eye exam, new patient", category: "Ophthalmology", amount: 280.00, rvu: 1.4, specialty: "Ophthalmology" },
];

class MedicalBillingRAG {
  private codes: BillingCode[];
  
  constructor() {
    this.codes = [...BILLING_CODES_DB];
  }

  // Semantic search for billing codes
  async searchCodes(query: string): Promise<RAGResponse> {
    const startTime = Date.now();
    
    // Simulate AI-powered semantic search
    const normalizedQuery = query.toLowerCase();
    const results: Array<{code: BillingCode, score: number}> = [];
    
    // Search algorithm that considers:
    // 1. Direct code matches
    // 2. Description keyword matches
    // 3. Category matches
    // 4. Semantic similarity (simulated)
    
    this.codes.forEach(code => {
      let score = 0;
      
      // Direct code match (highest priority)
      if (code.code.toLowerCase().includes(normalizedQuery)) {
        score += 100;
      }
      
      // Description keyword matching
      const descWords = code.description.toLowerCase().split(' ');
      const queryWords = normalizedQuery.split(' ');
      
      queryWords.forEach(queryWord => {
        if (queryWord.length < 3) return; // Skip short words
        
        descWords.forEach(descWord => {
          if (descWord.includes(queryWord) || queryWord.includes(descWord)) {
            score += 10;
          }
        });
      });
      
      // Category matching
      if (code.category.toLowerCase().includes(normalizedQuery)) {
        score += 20;
      }
      
      // Specialty matching
      if (code.specialty && code.specialty.toLowerCase().includes(normalizedQuery)) {
        score += 15;
      }
      
      // Medical term matching (enhanced semantic understanding)
      const medicalTerms: Record<string, string[]> = {
        'heart': ['cardio', 'cardiac', 'cardiovascular', 'echo', 'ecg', 'ekg'],
        'chest': ['thorax', 'lung', 'pulmonary', 'respiratory'],
        'pain': ['ache', 'discomfort', 'soreness'],
        'surgery': ['surgical', 'operation', 'procedure', 'laparoscopic'],
        'scan': ['imaging', 'radiology', 'ct', 'mri', 'ultrasound'],
        'blood': ['hematology', 'laboratory', 'lab', 'complete blood count', 'cbc'],
        'exam': ['examination', 'evaluation', 'assessment', 'visit'],
      };
      
      Object.entries(medicalTerms).forEach(([term, synonyms]) => {
        if (normalizedQuery.includes(term)) {
          synonyms.forEach(synonym => {
            if (code.description.toLowerCase().includes(synonym)) {
              score += 8;
            }
          });
        }
      });
      
      if (score > 0) {
        results.push({ code, score });
      }
    });
    
    // Sort by score and return top results
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(item => item.code);
    
    const processingTime = Date.now() - startTime;
    const confidence = results.length > 0 ? Math.min(results[0].score / 100, 1) : 0;
    
    return {
      query,
      results: sortedResults,
      confidence,
      processingTime,
      totalResults: results.length
    };
  }

  // Revenue optimization analysis
  async analyzeRevenue(currentCodes: string[], patientCondition: string): Promise<RevenueAnalysis> {
    const current = this.codes.filter(code => currentCodes.includes(code.code));
    
    // Suggest higher-value alternatives
    const suggested: BillingCode[] = [];
    const opportunities: string[] = [];
    
    current.forEach(code => {
      // Look for higher-complexity versions
      if (code.code.startsWith('992')) { // E&M codes
        const baseCode = code.code.substring(0, 4);
        const higherCodes = this.codes.filter(c => 
          c.code.startsWith(baseCode) && 
          c.amount > code.amount
        );
        
        if (higherCodes.length > 0) {
          suggested.push(higherCodes[0]);
          opportunities.push(`Consider ${higherCodes[0].code} for higher complexity: ${higherCodes[0].description}`);
        }
      }
      
      // Category-based suggestions
      const relatedCodes = this.codes.filter(c => 
        c.category === code.category && 
        c.amount > code.amount &&
        !currentCodes.includes(c.code)
      );
      
      if (relatedCodes.length > 0) {
        suggested.push(relatedCodes[0]);
      }
    });
    
    // Calculate potential revenue increase
    const currentRevenue = current.reduce((sum, code) => sum + code.amount, 0);
    const potentialRevenue = suggested.reduce((sum, code) => sum + code.amount, 0);
    const potentialIncrease = potentialRevenue - currentRevenue;
    
    // Add condition-specific suggestions
    if (patientCondition.toLowerCase().includes('diabetes')) {
      opportunities.push("Consider diabetes management codes (99490-99491) for chronic care");
    }
    if (patientCondition.toLowerCase().includes('hypertension')) {
      opportunities.push("Remote monitoring codes (99453-99458) may apply for hypertension management");
    }
    
    return {
      currentCodes: current,
      suggestedCodes: suggested.slice(0, 5), // Top 5 suggestions
      potentialIncrease,
      optimizationOpportunities: opportunities
    };
  }

  // Get codes by category
  getCodesByCategory(category: string): BillingCode[] {
    return this.codes.filter(code => 
      code.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Get high-value codes
  getHighValueCodes(minAmount: number = 500): BillingCode[] {
    return this.codes
      .filter(code => code.amount >= minAmount)
      .sort((a, b) => b.amount - a.amount);
  }

  // Chat-like interface for natural language queries
  async chatQuery(message: string, context?: string[]): Promise<{
    response: string;
    suggestedCodes: BillingCode[];
    followUpQuestions: string[];
  }> {
    const searchResults = await this.searchCodes(message);
    
    let response = "";
    const followUpQuestions: string[] = [];
    
    if (searchResults.results.length === 0) {
      response = "I couldn't find specific billing codes for that query. Could you provide more details about the procedure or condition?";
      followUpQuestions.push(
        "What type of medical specialty is involved?",
        "Is this a diagnostic or therapeutic procedure?",
        "What is the primary condition being treated?"
      );
    } else {
      const topCode = searchResults.results[0];
      response = `I found ${searchResults.results.length} relevant billing codes. The top match is **${topCode.code}** - ${topCode.description} (${topCode.category}, $${topCode.amount.toFixed(2)}).`;
      
      if (searchResults.confidence > 0.8) {
        response += ` This appears to be a high-confidence match.`;
      } else {
        response += ` You might want to review the other suggestions as well.`;
      }
      
      followUpQuestions.push(
        "Would you like to see revenue optimization suggestions?",
        "Should I check for related procedures?",
        "Do you need modifier or documentation requirements?"
      );
    }
    
    return {
      response,
      suggestedCodes: searchResults.results.slice(0, 3),
      followUpQuestions
    };
  }
}

// Export singleton instance
export const medicalRAG = new MedicalBillingRAG();

export default MedicalBillingRAG;
