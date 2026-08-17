import React from 'react';
import { Settings as SettingsIcon, User, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/layout/PageHeader';

const Settings: React.FC = () => {
  const { user, practiceName } = useAuthStore();

  const handleSave = () => {
    toast.success('Profile saved');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        subtitle="Manage your account and application preferences"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physician profile */}
        <div className="panel p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Physician Profile</h3>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="medical-label">First Name</label>
                <input type="text" className="medical-input" defaultValue={user?.firstName ?? ''} />
              </div>
              <div>
                <label className="medical-label">Last Name</label>
                <input type="text" className="medical-input" defaultValue={user?.lastName ?? ''} />
              </div>
            </div>
            <div>
              <label className="medical-label">Email</label>
              <input type="email" className="medical-input bg-gray-50 text-gray-500" value={user?.email ?? ''} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="medical-label">Province</label>
                <input type="text" className="medical-input" defaultValue={user?.province ?? 'Ontario'} />
              </div>
              <div>
                <label className="medical-label">Practice</label>
                <input type="text" className="medical-input" defaultValue={practiceName ?? ''} placeholder="Practice name" />
              </div>
            </div>
            <div>
              <label className="medical-label">CPSO (license) number</label>
              <input type="text" className="medical-input" placeholder="Enter CPSO number" />
            </div>
            <div>
              <label className="medical-label">CMPA (legal liability) number</label>
              <input type="text" className="medical-input" placeholder="Enter CMPA number" />
            </div>
            <button onClick={handleSave} className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save profile
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="panel p-6 h-fit">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Billing suggestions</span>
              <input type="checkbox" defaultChecked className="rounded" title="Billing suggestions" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Revenue alerts</span>
              <input type="checkbox" defaultChecked className="rounded" title="Revenue alerts" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Compliance warnings</span>
              <input type="checkbox" defaultChecked className="rounded" title="Compliance warnings" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
