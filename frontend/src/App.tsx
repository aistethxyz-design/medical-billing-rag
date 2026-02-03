import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

// Layout components
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';

// Page components
import LoginPage from '@/pages/LoginPage';
import Dashboard from '@/pages/Dashboard';
import DocumentUpload from '@/pages/DocumentUpload';
import CodingAnalysis from '@/pages/CodingAnalysis';
import EncounterManagement from '@/pages/EncounterManagement';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';
import BillingAssistant from '@/pages/BillingAssistant';
import ChatBot from '@/components/ChatBot';

// RAG Components
import RAGSearchPage from '@/pages/RAGSearchPage';
import RAGLoginPage from '@/components/RAGLoginPage';

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
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">
          {children}
        </main>
      </div>
      <ChatBot />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes - redirect to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
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
              path="/coding"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CodingAnalysis />
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
                <AppLayout>
                  <BillingAssistant />
                </AppLayout>
              }
            />

            {/* Secret RAG Route */}
            <Route
              path="/RAG/000000vnox38"
              element={
                <AppLayout>
                  <BillingAssistant />
                </AppLayout>
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
            <Route path="*" element={<Navigate to="/" replace />} />
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
    </QueryClientProvider>
  );
}

export default App; 