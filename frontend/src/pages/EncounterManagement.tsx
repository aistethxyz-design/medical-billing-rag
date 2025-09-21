import React from 'react';
import { Users, Calendar, FileText } from 'lucide-react';

const EncounterManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 text-blue-600 mr-3" />
          Encounter Management
        </h1>
        <p className="text-gray-600">Manage patient encounters and clinical documentation</p>
      </div>

      <div className="medical-card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Encounters</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Patient #{item}001</h3>
                    <p className="text-sm text-gray-600">Office Visit - Internal Medicine</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Jan {15 + item}, 2024
                      </span>
                      <span>Dr. Smith</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Coded
                  </span>
                  <div className="text-sm text-gray-500 mt-1">99214, M79.89</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EncounterManagement; 