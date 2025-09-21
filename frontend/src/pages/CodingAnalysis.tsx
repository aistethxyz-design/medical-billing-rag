import React from 'react';
import { Brain, CheckCircle, AlertTriangle, DollarSign } from 'lucide-react';

const CodingAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Brain className="w-8 h-8 text-blue-600 mr-3" />
          AI Code Analysis
        </h1>
        <p className="text-gray-600">Review and approve AI-powered coding suggestions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold">Approved</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">23</div>
          <p className="text-sm text-gray-600">Optimizations this week</p>
        </div>

        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold">Pending Review</h3>
          </div>
          <div className="text-2xl font-bold text-yellow-600">8</div>
          <p className="text-sm text-gray-600">Awaiting approval</p>
        </div>

        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <DollarSign className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Revenue Impact</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">$2,840</div>
          <p className="text-sm text-gray-600">This week's optimization</p>
        </div>
      </div>

      <div className="medical-card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Coding Suggestions</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="code-badge code-badge-cpt">99213</span>
                    <span className="text-gray-400">→</span>
                    <span className="code-badge code-badge-cpt">99214</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Suggested upgrade based on complexity and time documented
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">+$45</div>
                  <div className="text-sm text-gray-500">Potential gain</div>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="medical-button-primary text-sm">Approve</button>
                <button className="medical-button-secondary text-sm">Review</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CodingAnalysis; 