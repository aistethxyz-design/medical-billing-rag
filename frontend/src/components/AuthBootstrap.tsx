import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import * as authApi from '@/services/authApi';

/** Waits for persisted auth, then validates JWT with the backend. */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, login, logout } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => {
      const { token: t, isAuthenticated: authed } = useAuthStore.getState();
      if (!authed || !t) {
        setReady(true);
        return;
      }
      authApi
        .getMe(t)
        .then(({ user, practice }) => login(user, t, practice?.name))
        .catch(() => logout())
        .finally(() => setReady(true));
    };

    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }
    return useAuthStore.persist.onFinishHydration(finish);
  }, [login, logout]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
