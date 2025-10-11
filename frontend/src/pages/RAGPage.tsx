import React from 'react';
import RAGSearch from '../components/RAGSearch';
import Dashboard from '../components/Dashboard';
import { useAuth } from '../contexts/AuthContext';

const RAGPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🏥 Medical Billing RAG Assistant
            </h1>
            <p className="text-gray-600 mt-2">
              Advanced AI-powered billing code search and analysis system
            </p>
          </div>
          {user && (
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  user.role === 'admin' ? 'bg-red-500' :
                  user.role === 'doctor' ? 'bg-blue-500' :
                  user.role === 'billing' ? 'bg-green-500' :
                  'bg-gray-500'
                }`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {user.name} ({user.role})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Logged in • System Active
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <Dashboard />

      {/* RAG Search Interface */}
      <RAGSearch />
    </div>
  );
};

export default RAGPage;
