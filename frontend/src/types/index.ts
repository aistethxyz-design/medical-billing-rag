// Global type definitions for the AISteth Medical Billing Platform

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'provider' | 'staff';
  organization?: string;
}

export interface BillingCode {
  code: string;
  description: string;
  category: string;
  rvuWork?: number;
  rvuPractice?: number;
  rvuMalpractice?: number;
  totalRvu?: number;
  nationalPayment?: number;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
  extractedText?: string;
  suggestedCodes?: BillingCode[];
}

export interface Encounter {
  id: string;
  patientId: string;
  providerId: string;
  date: string;
  diagnosis: string[];
  procedures: string[];
  documents: Document[];
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: BillingCode[];
}

// Common component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchResponse {
  codes: BillingCode[];
  total: number;
  query: string;
  processingTime: number;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface DocumentUploadForm {
  file: File;
  type: 'clinical_note' | 'lab_result' | 'imaging' | 'other';
  description?: string;
}

// Analytics types
export interface RevenueMetrics {
  totalRevenue: number;
  averageReimbursement: number;
  topCodes: BillingCode[];
  monthlyTrend: Array<{
    month: string;
    revenue: number;
    encounters: number;
  }>;
}

export interface PerformanceMetrics {
  accuracy: number;
  processingTime: number;
  userSatisfaction: number;
  codesGenerated: number;
}
