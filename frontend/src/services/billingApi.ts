/**
 * Billing API service — connects the frontend to the backend
 * /api/billing/* endpoints.
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

// ── Types matching backend RAGResponse ──

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

// ── API Functions ──

export async function analyzeClinicalText(request: AnalyzeRequest): Promise<BillingAnalysis> {
  const res = await fetch(`${API_BASE}/api/billing/analyze`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Analysis failed' }));
    throw new Error(error.message || `Analysis failed (${res.status})`);
  }

  const data = await res.json();
  return data.analysis;
}

export async function searchBillingCodes(params: SearchRequest): Promise<BillingCode[]> {
  const query = new URLSearchParams();
  query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.minAmount) query.set('minAmount', String(params.minAmount));
  if (params.maxAmount) query.set('maxAmount', String(params.maxAmount));
  if (params.timeOfDay) query.set('timeOfDay', params.timeOfDay);

  const res = await fetch(`${API_BASE}/api/billing/search?${query.toString()}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Search failed' }));
    throw new Error(error.message || `Search failed (${res.status})`);
  }

  const data = await res.json();
  return data.codes;
}

export async function getCategories(): Promise<Array<{ name: string; count: number; avgAmount: number }>> {
  const res = await fetch(`${API_BASE}/api/billing/categories`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.categories || [];
}

export async function getCodeDetails(code: string): Promise<BillingCode | null> {
  const res = await fetch(`${API_BASE}/api/billing/code/${encodeURIComponent(code)}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.code || null;
}
