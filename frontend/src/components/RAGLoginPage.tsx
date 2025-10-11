import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { AuthService } from '../services/authService';

const RAGLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/rag-search');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      const user = await AuthService.login(username, password);
      
      // Convert our user format to the existing auth store format
      const authUser = {
        id: user.id,
        email: user.email,
        firstName: user.name.split(' ')[0] || user.name,
        lastName: user.name.split(' ').slice(1).join(' ') || '',
        role: user.role.toUpperCase() as 'ADMIN' | 'PRACTICE_MANAGER' | 'PROVIDER' | 'CODER' | 'BILLER',
        practiceId: 'medical-billing-rag',
        npi: undefined,
        specialty: user.role === 'doctor' ? 'Emergency Medicine' : undefined
      };

      login(authUser, 'mock-jwt-token');
      navigate('/rag-search');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { label: 'Primary Admin', username: 'aistethxyz@gmail.com', password: 'bestaisteth' },
    { label: 'Admin', username: 'admin', password: 'admin123' },
    { label: 'Doctor', username: 'doctor', password: 'doctor456' },
    { label: 'Billing', username: 'billing', password: 'billing789' }
  ];

  const fillCredentials = (creds: typeof demoCredentials[0]) => {
    setUsername(creds.username);
    setPassword(creds.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Medical Billing RAG Assistant
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure Login Required
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">❌ {error}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
                <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Login
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">🧪 Demo Credentials</h3>
            <div className="space-y-2">
              {demoCredentials.map((creds, index) => (
                <button
                  key={index}
                  onClick={() => fillCredentials(creds)}
                  className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
                >
                  <div className="font-medium text-gray-700">{creds.label}</div>
                  <div className="text-gray-500">
                    {creds.username} / {creds.password}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RAGLoginPage;
