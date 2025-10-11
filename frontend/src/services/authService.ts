import { User, UserRole } from '../types';

// Hash function for passwords (simple implementation for demo)
const hashPassword = (password: string): string => {
  // In a real app, use proper hashing like bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// User database (in real app, this would be on backend)
const users: Record<string, User> = {
  'aistethxyz@gmail.com': {
    id: '1',
    username: 'aistethxyz@gmail.com',
    email: 'aistethxyz@gmail.com',
    name: 'AI Steth Admin',
    role: 'admin',
    passwordHash: hashPassword('bestaisteth'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  },
  'admin': {
    id: '2',
    username: 'admin',
    email: 'admin@medical.com',
    name: 'Administrator',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  },
  'doctor': {
    id: '3',
    username: 'doctor',
    email: 'doctor@medical.com',
    name: 'Dr. Smith',
    role: 'doctor',
    passwordHash: hashPassword('doctor456'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  },
  'billing': {
    id: '4',
    username: 'billing',
    email: 'billing@medical.com',
    name: 'Billing Specialist',
    role: 'billing',
    passwordHash: hashPassword('billing789'),
    isActive: true,
    createdAt: new Date('2024-01-01'),
    lastLogin: new Date()
  }
};

export class AuthService {
  private static readonly TOKEN_KEY = 'medical_billing_token';
  private static readonly USER_KEY = 'medical_billing_user';

  static login(username: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = users[username];
        if (user && user.passwordHash === hashPassword(password)) {
          const updatedUser = { ...user, lastLogin: new Date() };
          localStorage.setItem(this.TOKEN_KEY, 'mock-jwt-token');
          localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
          resolve(updatedUser);
        } else {
          reject(new Error('Invalid username or password'));
        }
      }, 500); // Simulate network delay
    });
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getCurrentUser(): User | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const userStr = localStorage.getItem(this.USER_KEY);
    
    if (token && userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  static hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  static hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  static getAllUsers(): User[] {
    return Object.values(users);
  }
}
