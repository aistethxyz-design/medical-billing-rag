// Global type definitions for the AISteth Medical Billing Platform
import React from 'react';

export interface User {
  id: string;
  username?: string;
  email: string;
  name: string;
  role: 'admin' | 'provider' | 'staff' | 'doctor' | 'billing';
  organization?: string;
  passwordHash?: string;
  isActive?: boolean;
  createdAt?: Date;
  lastLogin?: Date;
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
  [key: string]: any; // Allow additional props
}

// File upload specific types
export interface DropzoneOptions {
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number;
  onDrop?: (acceptedFiles: File[], rejectedFiles: any[]) => void;
}

export interface FileWithPath extends File {
  path?: string;
}

// Fix for refKey and HTMLProps issues
export interface CustomHTMLProps extends React.HTMLAttributes<HTMLElement> {
  refKey?: string;
  [key: string]: any;
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
