import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from '@/stores/authStore';
import * as authApi from '@/services/authApi';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import toast from 'react-hot-toast';

const LoginPageContent: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setError('');

    try {
      const { user, token, practice } = await authApi.loginWithGoogle(credential);
      login(user, token, practice?.name);
      toast.success(`Welcome, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to AISteth</h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure access to your OHIP billing workspace
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {error && (
            <div className="flex items-center space-x-2 p-3 mb-6 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-600">Signing you in with Google…</p>
            </div>
          ) : (
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(message) => {
                setError(message);
                toast.error(message);
              }}
              disabled={isLoading}
            />
          )}

          <p className="mt-6 text-center text-xs text-slate-500">
            Use your Google account. Only verified emails are accepted.
          </p>
        </div>
      </div>
    </div>
  );
};

const SetupInstructions: React.FC = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3002';
  const isLocal = /localhost|127\.0\.0\.1/.test(origin);

  return (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
    <div className="max-w-lg w-full bg-white py-8 px-6 shadow-lg rounded-lg space-y-4">
      <div className="text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900 mt-2">Google sign-in not configured</h2>
        <p className="text-sm text-gray-600 mt-1">
          The app needs a Google OAuth Client ID at build time{isLocal ? ' and a running backend' : ' and a deployed API'}.
        </p>
      </div>

      {isLocal ? (
        <>
          <p className="text-sm text-gray-600">
            Add to <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">backend/.env</code> and{' '}
            <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">frontend/.env</code>:
          </p>
          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto">{`GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com\nVITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`}</pre>
          <p className="text-xs text-slate-500">Then restart: <span className="font-mono">npm run dev:auth</span> (backend) and <span className="font-mono">npm run dev</span> (frontend)</p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600 font-medium">Cloudflare Worker variables</p>
          <p className="text-sm text-gray-600">
            In Workers → Settings → <strong>Variables and Secrets</strong>, set:
          </p>
          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto">{`VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com\nVITE_API_URL=https://your-real-api-url.com`}</pre>
          <p className="text-sm text-amber-700">
            Replace <code className="text-xs bg-amber-50 px-1 rounded">YOUR-BACKEND-URL</code> with your live API URL, then redeploy the worker.
          </p>
          <p className="text-sm text-gray-600">
            Your API server also needs <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">GOOGLE_CLIENT_ID</code> set
            (same value) and must allow CORS from this site.
          </p>
        </>
      )}

      <p className="text-xs text-slate-500">
        In{' '}
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
          Google Cloud Console
        </a>
        , add this <strong>Authorized JavaScript origin</strong>:
      </p>
      <pre className="text-xs bg-slate-100 text-slate-800 p-2 rounded font-mono">{origin}</pre>
    </div>
  </div>
  );
};

const LoginPage: React.FC = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    authApi.getAuthConfig()
      .then((config) => {
        // Prefer build-time env (static Cloudflare deploy); API config when backend is reachable
        setClientId(envClientId || config.googleClientId || '');
      })
      .catch(() => {
        setClientId(envClientId || '');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!clientId) {
    return <SetupInstructions />;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <LoginPageContent clientId={clientId} />
    </GoogleOAuthProvider>
  );
};

export default LoginPage;
