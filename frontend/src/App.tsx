import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { AuthBootstrap } from '@/components/AuthBootstrap';

// Layout components
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

// Page components
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import DocumentUpload from '@/pages/DocumentUpload';
import EncounterManagement from '@/pages/EncounterManagement';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import BillingAssistant from '@/pages/BillingAssistant';
import EmCopilot from '@/pages/EmCopilot';

// Styles
import '@/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  
  return <>{children}</>;
};

const AllowlistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  if (!user?.emCopilot) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

const AppHome: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/login?redirect=/dashboard" replace />;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="ml-64 p-6 min-w-0">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthBootstrap>
          <Router basename="/app">
          <div className="App">
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<AppHome />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes - require login */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Other protected routes */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DocumentUpload />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/encounters"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <EncounterManagement />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BillingAssistant />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* EM Copilot — allowlisted trial users only */}
            <Route
              path="/em-copilot"
              element={
                <ProtectedRoute>
                  <AllowlistRoute>
                    <AppLayout>
                      <EmCopilot />
                    </AppLayout>
                  </AllowlistRoute>
                </ProtectedRoute>
              }
            />

            {/* Secret RAG Route */}
            <Route
              path="/RAG/000000vnox38"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <BillingAssistant />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/login?redirect=/dashboard" replace />} />
          </Routes>
          
          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          </div>
        </Router>
        </AuthBootstrap>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;