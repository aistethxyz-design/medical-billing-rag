import { BillingCode, SearchResult, SearchParams } from '../types';

// CSV data loader
let billingCodesData: BillingCode[] = [];
let dataLoaded = false;

const loadCSVData = async (): Promise<BillingCode[]> => {
  if (dataLoaded && billingCodesData.length > 0) {
    return billingCodesData;
  }

  try {
    const response = await fetch('/data/billing-codes.csv');
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n');
    // const headers = lines[0].split(',').map(h => h.trim()); // Available if needed
    
    const codes: BillingCode[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.split(',').every(cell => !cell.trim())) continue;
      
      const values = parseCSVLine(line);
      if (values.length >= 3 && values[0] && values[1]) {
        const code: BillingCode = {
          code: values[0].trim(),
          description: values[1].trim(),
          howToUse: values[2]?.trim() || '',
          amount: values[3]?.trim() || '',
          category: categorizeCode(values[0].trim()),
          codeType: getCodeType(values[0].trim(), values[1].trim())
        };
        codes.push(code);
      }
    }
    
    billingCodesData = codes;
    dataLoaded = true;
    return codes;
  } catch (error) {
    console.error('Failed to load CSV data:', error);
    // Fallback to sample data
    return getSampleData();
  }
};

const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

const categorizeCode = (code: string): string => {
  const prefix = code.substring(0, 1);
  switch (prefix) {
    case 'A': return 'Assessment';
    case 'H': return 'Emergency Department';
    case 'G': return 'Critical Care';
    case 'K': return 'Procedures';
    case 'E': return 'Premiums';
    case 'B': return 'Telemedicine';
    default: return 'Other';
  }
};

const getCodeType = (_code: string, description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('assessment') || desc.includes('reassess')) return 'Assessment';
  if (desc.includes('critical care') || desc.includes('life threatening')) return 'Critical Care';
  if (desc.includes('procedure') || desc.includes('surgical')) return 'Procedure';
  if (desc.includes('premium') || desc.includes('bonus')) return 'Premium';
  if (desc.includes('consultation') || desc.includes('consult')) return 'Consultation';
  if (desc.includes('emergency')) return 'Emergency';
  if (desc.includes('telemedicine') || desc.includes('telestroke')) return 'Telemedicine';
  if (desc.includes('ambulance') || desc.includes('transfer')) return 'Transport';
  
  return 'General';
};

const getSampleData = (): BillingCode[] => [
  {
    code: "A003",
    description: "General assessment",
    howToUse: "Used for full assessments when time and complexity justify; less common in ER vs. H-codes",
    amount: "$77.20",
    category: "Assessment",
    codeType: "General"
  },
  {
    code: "H152",
    description: "Comprehensive assessment - Default for most ER patients requiring moderate evaluation",
    howToUse: "Weekend and Holiday",
    amount: "$63.30",
    category: "Emergency Department",
    codeType: "Assessment"
  },
  {
    code: "G521",
    description: "Life Threatening Critical Care – First 15 min",
    howToUse: "up to 3 MDs can bill ( encounters which Includes IVs, arterial lines, endotracheal or NG intubations, urinary catheters, defibrillations, & cardioversions)",
    amount: "$110.55",
    category: "Critical Care",
    codeType: "Critical Care"
  }
];

export class BillingCodesService {
  private static codes: BillingCode[] = [];
  private static initialized = false;

  private static async ensureInitialized() {
    if (!this.initialized) {
      this.codes = await loadCSVData();
      this.initialized = true;
    }
  }

  static async getAllCodes(): Promise<BillingCode[]> {
    await this.ensureInitialized();
    return [...this.codes];
  }

  static async searchCodes(params: SearchParams): Promise<SearchResult[]> {
    await this.ensureInitialized();
    
    const { query, filters, limit = 50 } = params;
    let results = [...this.codes];

    // Filter by search query
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      results = results.filter(code => 
        code.code.toLowerCase().includes(searchTerm) ||
        code.description.toLowerCase().includes(searchTerm) ||
        (code.howToUse && code.howToUse.toLowerCase().includes(searchTerm)) ||
        (code.category && code.category.toLowerCase().includes(searchTerm))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        results = results.filter(code => 
          code.category?.toLowerCase() === filters.category?.toLowerCase()
        );
      }
      
      if (filters.codeType) {
        results = results.filter(code =>
          code.codeType?.toLowerCase() === filters.codeType?.toLowerCase()
        );
      }

      if (filters.minAmount || filters.maxAmount) {
        results = results.filter(code => {
          const amount = this.extractAmount(code.amount);
          if (amount === null) return true; // Keep if can't parse
          
          if (filters.minAmount && amount < filters.minAmount) return false;
          if (filters.maxAmount && amount > filters.maxAmount) return false;
          return true;
        });
      }
    }

    // Convert to SearchResult with relevance scoring
    const searchResults: SearchResult[] = results
      .slice(0, limit)
      .map(code => ({
        code,
        relevanceScore: this.calculateRelevance(code, query),
        highlightedText: this.highlightText(code.description, query)
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    return searchResults;
  }

  static async getCodeByCode(codeValue: string): Promise<BillingCode | null> {
    await this.ensureInitialized();
    const code = this.codes.find(c => c.code === codeValue);
    return code || null;
  }

  static async getCategories(): Promise<string[]> {
    await this.ensureInitialized();
    const categories = new Set(this.codes.map(code => code.category).filter(Boolean));
    return Array.from(categories) as string[];
  }

  static async getCodeTypes(): Promise<string[]> {
    await this.ensureInitialized();
    const types = new Set(this.codes.map(code => code.codeType).filter(Boolean));
    return Array.from(types) as string[];
  }

  private static extractAmount(amountStr: string): number | null {
    if (!amountStr) return null;
    
    // Extract first number from string
    const match = amountStr.match(/\$?(\d+(?:\.\d{2})?)/);
    return match ? parseFloat(match[1]) : null;
  }

  private static calculateRelevance(code: BillingCode, query: string): number {
    if (!query.trim()) return 0;
    
    const searchTerm = query.toLowerCase();
    let score = 0;

    // Exact code match gets highest score
    if (code.code.toLowerCase() === searchTerm) {
      score += 100;
    } else if (code.code.toLowerCase().includes(searchTerm)) {
      score += 50;
    }

    // Description matches
    if (code.description.toLowerCase().includes(searchTerm)) {
      score += 30;
    }

    // Category matches
    if (code.category && code.category.toLowerCase().includes(searchTerm)) {
      score += 20;
    }

    // How to use matches
    if (code.howToUse && code.howToUse.toLowerCase().includes(searchTerm)) {
      score += 15;
    }

    return score;
  }

  private static highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Statistics methods for dashboard
  static async getStats() {
    await this.ensureInitialized();
    
    const totalCodes = this.codes.length;
    const categories = new Set(this.codes.map(code => code.category).filter(Boolean));
    
    const amounts = this.codes
      .map(code => this.extractAmount(code.amount))
      .filter(amount => amount !== null && amount > 0) as number[];
    
    const avgAmount = amounts.length > 0 ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length : 0;

    return {
      totalCodes,
      totalCategories: categories.size,
      averageAmount: avgAmount.toFixed(2),
      highestAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
      lowestAmount: amounts.length > 0 ? Math.min(...amounts) : 0
    };
  }

  // Quick search for common codes
  static async getCommonCodes(): Promise<BillingCode[]> {
    await this.ensureInitialized();
    
    const commonCodeNames = ['A003', 'H152', 'H102', 'G521', 'A001', 'H101', 'A007'];
    return this.codes.filter(code => commonCodeNames.includes(code.code));
  }

  // Get codes by category
  static async getCodesByCategory(category: string): Promise<BillingCode[]> {
    await this.ensureInitialized();
    return this.codes.filter(code => code.category?.toLowerCase() === category.toLowerCase());
  }
}
