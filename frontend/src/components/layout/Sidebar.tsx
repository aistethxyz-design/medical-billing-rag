import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Users,
  BarChart3,
  Settings,
  DollarSign,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import * as authApi from '@/services/authApi';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Upload Documents', href: '/upload', icon: Upload },
  { name: 'Billing Assistant', href: '/billing', icon: DollarSign },
  { name: 'Encounters', href: '/encounters', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, practiceName, logout } = useAuthStore();

  const handleLogout = async () => {
    await authApi.logout(token);
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white w-64 min-h-screen border-r border-gray-200 fixed left-0 top-16 z-30">
      <div className="flex flex-col h-full">
        <div className="flex-1 px-3 py-5 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`group nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
              >
                <Icon className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Signed-in user — replaces duplicate quick stats */}
        {user && (
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
                {user.province ? ` · ${user.province}` : ''}
              </p>
              {practiceName && (
                <p className="text-xs text-gray-400 truncate mt-1">{practiceName}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-red-600 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-[11px] text-gray-400 text-center inline-flex items-center justify-center gap-1 w-full">
            <Shield className="w-3 h-3" />
            <span>HIPAA compliant · v1.0</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
