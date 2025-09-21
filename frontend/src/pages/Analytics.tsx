import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Shield } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="w-8 h-8 text-blue-600 mr-3" />
          Analytics & Reporting
        </h1>
        <p className="text-gray-600">Revenue optimization and compliance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold">Monthly billing revenue</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">$45,280</div>
          <p className="text-sm text-gray-600">+12% from last month</p>
        </div>

        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">billing optimization rate</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">78%</div>
          <p className="text-sm text-gray-600">Above specialty average</p>
        </div>

        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Compliance Score</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600">94%</div>
          <p className="text-sm text-gray-600">Audit ready</p>
        </div>

        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold"># of Codes Processed</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600">1,247</div>
          <p className="text-sm text-gray-600">Processed this month</p>
        </div>
      </div>

      <div className="medical-card p-6">
        <h2 className="text-xl font-semibold mb-4">Revenue Optimization Trends</h2>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">Chart visualization would be rendered here</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 