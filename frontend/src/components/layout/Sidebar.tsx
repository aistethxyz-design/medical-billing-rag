import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Upload, 
  Brain, 
  Users, 
  BarChart3, 
  Settings,
  FileText,
  MessageSquare,
  Shield,
  DollarSign
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/000000vnox38/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and metrics'
  },
  {
    name: 'Upload Documents',
    href: '/000000vnox38/upload',
    icon: Upload,
    description: 'Upload medical documents'
  },
  {
    name: 'AI Code Analysis',
    href: '/000000vnox38/coding',
    icon: Brain,
    description: 'Review AI suggestions'
  },
  {
    name: 'Billing Assistant',
    href: '/000000vnox38/billing',
    icon: DollarSign,
    description: 'Find optimal billing codes'
  },
  {
    name: 'Encounters',
    href: '/000000vnox38/encounters',
    icon: Users,
    description: 'Manage patient encounters'
  },
  {
    name: 'Analytics',
    href: '/000000vnox38/analytics',
    icon: BarChart3,
    description: 'Revenue and compliance'
  },
  {
    name: 'Settings',
    href: '/000000vnox38/settings',
    icon: Settings,
    description: 'Application settings'
  }
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white w-64 min-h-screen border-r border-gray-200 fixed left-0 top-16 z-30">
      <div className="flex flex-col h-full">
        {/* Navigation Links */}
        <div className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {item.description}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Quick Stats
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">Revenue Impact</span>
              </div>
              <span className="font-semibold text-green-600">+$12.4K</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Documents</span>
              </div>
              <span className="font-semibold text-gray-900">247</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-gray-600">Compliance</span>
              </div>
              <span className="font-semibold text-purple-600">94%</span>
            </div>
          </div>
        </div>

        {/* AI Assistant Shortcut */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
            <MessageSquare className="w-5 h-5" />
            <div className="text-left">
              <div className="text-sm font-medium">AI Assistant</div>
              <div className="text-xs opacity-90">Ask coding questions</div>
            </div>
          </button>
        </div>

        {/* Version Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <div>AISteth v1.0.0</div>
            <div className="mt-1">HIPAA Compliant</div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar; 