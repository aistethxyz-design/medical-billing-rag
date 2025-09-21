import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Users,
  Activity,
  Send
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  description 
}) => {
  const changeColor = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }[changeType];

  return (
    <div className="medical-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {change && (
              <span className={`text-sm font-medium ${changeColor}`}>
                {change}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentOptimizations: React.FC = () => {
  const optimizations = [
    {
      id: 1,
      encounterId: 'ENC-001',
      originalCode: '99213',
      suggestedCode: '99214',
      potentialGain: 45.00,
      status: 'pending',
      provider: 'Dr. Smith',
      date: '2024-01-15'
    },
    {
      id: 2,
      encounterId: 'ENC-002',
      originalCode: '99212',
      suggestedCode: '99213',
      potentialGain: 32.00,
      status: 'approved',
      provider: 'Dr. Johnson',
      date: '2024-01-15'
    },
    {
      id: 3,
      encounterId: 'ENC-003',
      originalCode: '99214',
      suggestedCode: '99215',
      potentialGain: 67.00,
      status: 'pending',
      provider: 'Dr. Brown',
      date: '2024-01-14'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      approved: 'bg-green-100 text-green-800 border border-green-200',
      rejected: 'bg-red-100 text-red-800 border border-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="medical-card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Code Optimizations</h3>
        <p className="text-sm text-gray-600">Latest AI-powered coding suggestions</p>
        <p className="text-xs text-gray-500 mt-1">old code to suggested codes(may be more than one)</p>
      </div>
      <div className="divide-y divide-gray-200">
        {optimizations.map((opt) => (
          <div key={opt.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="code-badge code-badge-cpt">{opt.originalCode}</span>
                  <span className="text-gray-400">→</span>
                  <span className="code-badge code-badge-cpt">{opt.suggestedCode}</span>
                  {getStatusBadge(opt.status)}
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-600 space-x-4">
                  <span>{opt.provider}</span>
                  <span>•</span>
                  <span>{opt.encounterId}</span>
                  <span>•</span>
                  <span>{opt.date}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="revenue-impact-positive">
                  +${opt.potentialGain.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 bg-gray-50">
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all optimizations →
        </button>
      </div>
    </div>
  );
};

const QuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Upload Documents',
      description: 'Upload encounter notes for AI analysis',
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      href: '/upload',
      color: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'Analyze Codes',
      description: 'Review AI coding suggestions',
      icon: <BarChart3 className="w-6 h-6 text-purple-600" />,
      href: '/coding',
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'View Analytics',
      description: 'Revenue and compliance metrics',
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      href: '/analytics',
      color: 'bg-green-50 hover:bg-green-100'
    },
    {
      title: 'Manage Encounters',
      description: 'Review patient encounters',
      icon: <Users className="w-6 h-6 text-orange-600" />,
      href: '/encounters',
      color: 'bg-orange-50 hover:bg-orange-100'
    }
  ];

  return (
    <div className="medical-card">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-600">Common tasks and workflows</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              className={`block p-4 rounded-lg border border-gray-200 transition-colors ${action.color}`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {action.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your practice overview.</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Monthly Revenue Impact"
          value="$12,450"
          change="+15.3%"
          changeType="positive"
          icon={<DollarSign className="w-6 h-6 text-green-600" />} 
          description="From AI optimizations"
        />
        <MetricCard
          title="Billing Codes Processed"
          value="247"
          change="+8.2%"
          changeType="positive"
          icon={<FileText className="w-6 h-6 text-blue-600" />} 
          description="Documents Processed This month"
        />
        <MetricCard
          title="Optimization Rate"
          value="78%"
          change="+5.1%"
          changeType="positive"
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />} 
          description="Codes improved"
        />
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentOptimizations />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Alert Section */}
      <div className="medical-card p-6 border-l-4 border-l-yellow-400 bg-yellow-50">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">
              Pending Code Reviews
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              You have 3 code optimizations waiting for review. 
              <a href="/coding" className="font-medium underline hover:no-underline ml-1">
                Review now
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Input */}
      <div className="medical-card p-6 bg-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">AISteth Assistant</h3>
            <p className="text-purple-100 mt-1">
              Ask me anything about medical coding, billing optimization, or clinical guidelines.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Ask about medical coding, OHIP billing, or clinical guidelines..."
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
            <button className="bg-white text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 