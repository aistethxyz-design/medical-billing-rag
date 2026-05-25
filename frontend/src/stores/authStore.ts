import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PRACTICE_MANAGER' | 'PROVIDER' | 'CODER' | 'BILLER';
  practiceId?: string;
  npi?: string;
  province?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  practiceName: string | null;
  login: (user: User, token: string, practiceName?: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const TOKEN_KEY = 'auth_token';

function syncToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      practiceName: null,

      login: (user: User, token: string, practiceName?: string) => {
        syncToken(token);
        set({
          user,
          token,
          isAuthenticated: true,
          practiceName: practiceName ?? null,
        });
      },

      logout: () => {
        syncToken(null);
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          practiceName: null,
        });
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },
    }),
    {
      name: 'codemax-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        practiceName: state.practiceName,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) syncToken(state.token);
      },
    }
  )
); 