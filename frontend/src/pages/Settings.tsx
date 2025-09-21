import React from 'react';
import { Settings as SettingsIcon, User, Shield, Bell, Upload, FileText } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <SettingsIcon className="w-8 h-8 text-blue-600 mr-3" />
          Settings
        </h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Physician Profile Section */}
        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">My Physician Profile</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="medical-label">First Name</label>
              <input type="text" className="medical-input" defaultValue="Dr." />
            </div>
            <div>
              <label className="medical-label">Last Name</label>
              <input type="text" className="medical-input" defaultValue="Smith" />
            </div>
            <div>
              <label className="medical-label">NPI Number</label>
              <input type="text" className="medical-input" defaultValue="1234567890" />
            </div>
            
            {/* License Fields with Red Underlines */}
            <div>
              <label className="medical-label text-red-600">CPSO (license) number</label>
              <input 
                type="text" 
                className="medical-input border-red-300 focus:border-red-500 focus:ring-red-500" 
                placeholder="Enter CPSO number"
              />
            </div>
            <div>
              <label className="medical-label text-red-600">CMPA (legal liability) number</label>
              <input 
                type="text" 
                className="medical-input border-red-300 focus:border-red-500 focus:ring-red-500" 
                placeholder="Enter CMPA number"
              />
            </div>

            {/* Document Upload Section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 mb-3">
                <Upload className="w-5 h-5 text-red-500" />
                <h4 className="text-sm font-medium text-red-600">Document Upload</h4>
              </div>
              <div className="border-2 border-dashed border-red-300 rounded-lg p-4 text-center bg-red-50">
                <FileText className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-medium">Add section for document upload here</p>
                <p className="text-xs text-red-500 mt-1">Upload license documents, certifications, etc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold">Security</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="medical-label">Current Password</label>
              <input type="password" className="medical-input" />
            </div>
            <div>
              <label className="medical-label">New Password</label>
              <input type="password" className="medical-input" />
            </div>
            <button className="medical-button-primary">Update Password</button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="medical-card p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Code suggestions</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Revenue alerts</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Compliance warnings</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 