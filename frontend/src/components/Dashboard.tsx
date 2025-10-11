import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileText, 
  Activity, 
  User, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Shield,
  Server
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BillingCodesService } from '../services/billingCodesService';
import { AuthService } from '../services/authService';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [billingStats, setBillingStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  const loadDashboardData = async () => {
    // Load billing codes statistics
    const billingData = await BillingCodesService.getStats();
    setBillingStats(billingData);

    // Set role-specific stats
    const baseStats: DashboardStats = {
      totalUsers: AuthService.getAllUsers().length,
      totalCodes: billingData.totalCodes,
      systemStatus: 'Online'
    };

    if (user?.role === 'doctor') {
      setStats({
        ...baseStats,
        patientsToday: 12,
        casesCompleted: 8,
        revenueToday: '$2,450'
      });
    } else if (user?.role === 'billing') {
      setStats({
        ...baseStats,
        revenueToday: '$3,450',
        revenueWeek: '$18,200',
        revenueMonth: '$67,800',
        growth: '+5.2%'
      });
    } else {
      setStats(baseStats);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ComponentType<any>;
    color: string;
    description?: string;
  }> = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers || 0}
          icon={Users}
          color="bg-blue-500"
          description="Active system users"
        />
        <StatCard
          title="Billing Codes"
          value={stats.totalCodes || 0}
          icon={FileText}
          color="bg-green-500"
          description="Available codes"
        />
        <StatCard
          title="System Status"
          value={stats.systemStatus || 'Unknown'}
          icon={Server}
          color="bg-green-500"
          description="All systems operational"
        />
      </div>

      {/* User Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          User Management
        </h3>
        <div className="space-y-3">
          {AuthService.getAllUsers().map((userData, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">{userData.name}</p>
                  <p className="text-sm text-gray-500">{userData.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userData.role === 'admin' ? 'bg-red-100 text-red-800' :
                  userData.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                  userData.role === 'billing' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userData.role}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {userData.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Analytics */}
      {billingStats && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            System Analytics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-xl font-bold text-gray-900">{billingStats.totalCategories}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg Amount</p>
              <p className="text-xl font-bold text-gray-900">${billingStats.averageAmount}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Highest Code</p>
              <p className="text-xl font-bold text-gray-900">${billingStats.highestAmount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDoctorDashboard = () => (
    <div className="space-y-6">
      {/* Doctor Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Patients Today"
          value={stats.patientsToday || 0}
          icon={Users}
          color="bg-blue-500"
          description="Scheduled appointments"
        />
        <StatCard
          title="Cases Completed"
          value={stats.casesCompleted || 0}
          icon={Calendar}
          color="bg-green-500"
          description="Today's completed cases"
        />
        <StatCard
          title="Revenue Today"
          value={stats.revenueToday || '$0'}
          icon={DollarSign}
          color="bg-purple-500"
          description="Billing generated"
        />
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900">Common Assessment Codes</h4>
            <p className="text-sm text-blue-700 mt-2">A003, H152, A007 - Quick access to frequently used assessment codes</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900">Emergency Codes</h4>
            <p className="text-sm text-green-700 mt-2">A888, G004 - Emergency department and critical care codes</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillingDashboard = () => (
    <div className="space-y-6">
      {/* Billing Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Today's Revenue"
          value={stats.revenueToday || '$0'}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="This Week"
          value={stats.revenueWeek || '$0'}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          title="This Month"
          value={stats.revenueMonth || '$0'}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <StatCard
          title="Growth"
          value={stats.growth || '0%'}
          icon={TrendingUp}
          color="bg-orange-500"
          description="vs last month"
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-600" />
          Revenue Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900">Assessments</h4>
            <p className="text-2xl font-bold text-green-800">$12,450</p>
            <p className="text-sm text-green-600">65% of total</p>
          </div>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900">Procedures</h4>
            <p className="text-2xl font-bold text-blue-800">$8,200</p>
            <p className="text-sm text-blue-600">25% of total</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-900">Critical Care</h4>
            <p className="text-2xl font-bold text-purple-800">$3,150</p>
            <p className="text-sm text-purple-600">10% of total</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100 mt-1">
              {user?.role === 'admin' && 'System Administration Dashboard'}
              {user?.role === 'doctor' && 'Clinical Dashboard - Focus on Patient Care'}
              {user?.role === 'billing' && 'Billing Dashboard - Revenue Management'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">Last login</p>
            <p className="text-white font-medium">
              {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>
      </div>

      {/* Role-specific Dashboard */}
      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'doctor' && renderDoctorDashboard()}
      {user?.role === 'billing' && renderBillingDashboard()}
    </div>
  );
};

export default Dashboard;
