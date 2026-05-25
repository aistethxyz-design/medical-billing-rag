import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Stethoscope,
  Sun,
  Sunset,
  Moon,
  Calendar,
  Sparkles,
  ArrowRight,
  Send,
  ClipboardList,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchDashboard,
  billingWindowGuide,
  displayName,
  type DashboardSummary,
} from '@/services/dashboardApi';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

function currentBillingSlot(): { label: string; key: string; icon: React.ReactNode; tone: string } {
  const now = new Date();
  const h = now.getHours();
  const d = now.getDay();
  if (d === 0 || d === 6) {
    return { label: 'Weekend / Holiday', key: 'Weekend', icon: <Calendar className="w-4 h-4" />, tone: 'bg-purple-50 text-purple-700 border-purple-200' };
  }
  if (h >= 0 && h < 8) {
    return { label: 'Night · 0000–0800', key: 'Night', icon: <Moon className="w-4 h-4" />, tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (h >= 8 && h < 17) {
    return { label: 'Day · 0800–1700', key: 'Day', icon: <Sun className="w-4 h-4" />, tone: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: 'Evening · 1700–0000', key: 'Evening', icon: <Sunset className="w-4 h-4" />, tone: 'bg-orange-50 text-orange-700 border-orange-200' };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, practiceName } = useAuthStore();
  const slot = useMemo(currentBillingSlot, []);
  const guide = useMemo(() => billingWindowGuide(slot.key, user?.province), [slot.key, user?.province]);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [askQuery, setAskQuery] = useState('');

  useEffect(() => {
    if (!token) return;
    fetchDashboard(token).then(setSummary);
  }, [token]);

  const pending = summary?.pendingReviews ?? 0;
  const totalBilled = summary?.totalBilledAllTime ?? 0;
  const totalVisits = summary?.totalVisits ?? 0;
  const topCode = summary?.topCode;
  const recent = summary?.recentOptimizations ?? [];

  const submitAsk = (q: string) => {
    if (!q.trim()) return;
    navigate('/billing', { state: { searchQuery: q.trim() } });
    setAskQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Header — user & practice specific */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
              {practiceName ? ` · ${practiceName}` : ''}
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              Welcome back, {displayName(user)}
            </h1>
            {user?.province && (
              <p className="text-xs text-gray-500 mt-0.5">Location of practice: {user.province}</p>
            )}
          </div>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${slot.tone}`}>
          {slot.icon}
          <span>{slot.label}</span>
        </div>
      </div>

      {/* Actionable metrics only — no duplicate sidebar stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-green-400 to-emerald-500" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total billed (all encounters)</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(totalBilled)}</p>
          <p className="text-xs text-gray-500 mt-1">Your OHIP billing to date</p>
        </div>
        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-blue-400 to-blue-600" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Most used code</p>
          {topCode ? (
            <>
              <p className="text-2xl font-bold text-blue-600 mt-1 font-mono">{topCode.code}</p>
              <p className="text-xs text-gray-600 truncate">{topCode.description}</p>
              <p className="text-xs text-gray-500 mt-1">Used {topCode.count}× · {formatCurrency(topCode.totalAmount)}</p>
            </>
          ) : (
            <p className="text-lg text-gray-400 mt-2">No codes yet</p>
          )}
        </div>
        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-indigo-400 to-purple-500" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total visits</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{totalVisits}</p>
          <p className="text-xs text-gray-500 mt-1">{summary?.uniquePatients ?? 0} patients</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent work — user-specific from API */}
        <div className="lg:col-span-2 panel">
          <div className="panel-header">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Recent encounters</h2>
              <p className="text-xs text-gray-500">Billing codes per visit</p>
            </div>
            {pending > 0 && (
              <button
                onClick={() => navigate('/encounters')}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {pending} draft visit{pending !== 1 ? 's' : ''} <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No encounters yet.</p>
              <button
                onClick={() => navigate('/encounters')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Add your first encounter →
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recent.map((o) => (
                <li key={o.id} className="px-6 py-3.5 hover:bg-gray-50/60">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded">{o.originalCode}</span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="font-mono text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded ring-1 ring-blue-100">{o.suggestedCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        o.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">+{formatCurrency(o.potentialGain)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{o.encounterId} · {o.date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Shift guide — unique to dashboard */}
        <div className="panel p-5">
          <h2 className="text-base font-semibold text-gray-900">{guide.title}</h2>
          <p className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded mt-2 inline-block">{guide.codes}</p>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{guide.tip}</p>
          <button
            onClick={() => navigate('/billing')}
            className="mt-4 w-full text-sm font-medium py-2.5 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Open Billing Assistant
          </button>
        </div>
      </div>

      {/* Single ask bar — replaces duplicate assistant cards */}
      <div className="panel p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-gray-900">Ask about OHIP billing</h2>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitAsk(askQuery);
          }}
          className="flex gap-2"
        >
          <input
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            placeholder={`e.g. best code for comprehensive assessment during ${slot.key.toLowerCase()} shift`}
            className="flex-1 medical-input text-sm"
          />
          <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors" aria-label="Search">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {pending > 0 && (
        <div className="panel p-4 border-l-4 border-l-amber-400 bg-amber-50/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pending} billing {pending === 1 ? 'suggestion needs' : 'suggestions need'} your review
            </p>
            <button onClick={() => navigate('/encounters')} className="text-sm text-amber-800 underline hover:no-underline mt-0.5">
              View encounters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
