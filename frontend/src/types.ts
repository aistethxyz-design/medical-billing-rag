export type UserRole = 'admin' | 'doctor' | 'billing' | 'provider' | 'staff';

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface BillingCode {
  code: string;
  description: string;
  howToUse?: string;
  amount: string;
  category?: string;
  codeType?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface DashboardStats {
  totalUsers?: number;
  totalCodes?: number;
  systemStatus?: string;
  patientsToday?: number;
  casesCompleted?: number;
  revenueToday?: string;
  revenueWeek?: string;
  revenueMonth?: string;
  growth?: string;
}

export interface SearchResult {
  code: BillingCode;
  relevanceScore?: number;
  highlightedText?: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

// Navigation types
export interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType;
  requiredRoles?: UserRole[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Search types
export interface SearchFilters {
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  codeType?: string;
}

export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}
