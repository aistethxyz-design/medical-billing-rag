import React from 'react';
import { BarChart3, TrendingUp, DollarSign, Shield } from 'lucide-react';

// ── Inline SVG charts (no chart-library dependency) ──────────────────────────

interface AreaChartProps {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, color, height = 220 }) => {
  const w = 720;
  const h = height;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const max = Math.max(...data.map((d) => d.value), 1);
  const min = 0;
  const range = max - min || 1;

  const x = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const y = (v: number) => padT + (1 - (v - min) / range) * innerH;

  const points = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  const area = `${padL},${padT + innerH} ${points} ${padL + innerW},${padT + innerH}`;

  const ticks = 4;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => min + ((max - min) / ticks) * i);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} y1={y(t)} x2={padL + innerW} y2={y(t)} stroke="#f1f5f9" strokeWidth={1} />
          <text x={padL - 6} y={y(t) + 4} fontSize={10} fill="#94a3b8" textAnchor="end">
            ${(t / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
      <polygon points={area} fill="url(#area-fill)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r={3} fill={color} />
          <text x={x(i)} y={h - 8} fontSize={11} fill="#64748b" textAnchor="middle">
            {d.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  formatValue?: (n: number) => string;
}

const HBarChart: React.FC<BarChartProps> = ({ data, formatValue }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-gray-700">{d.label}</span>
            <span className="text-gray-500">{formatValue ? formatValue(d.value) : d.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || '#3b82f6' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

const Analytics: React.FC = () => {
  const trend = [
    { label: 'Oct', value: 28500 },
    { label: 'Nov', value: 32100 },
    { label: 'Dec', value: 35200 },
    { label: 'Jan', value: 33800 },
    { label: 'Feb', value: 38600 },
    { label: 'Mar', value: 41200 },
    { label: 'Apr', value: 45280 },
  ];

  const topCodes = [
    { label: 'H152 — Comprehensive ER assessment', value: 12450, color: '#3b82f6' },
    { label: 'A004 — General reassessment', value: 9320, color: '#8b5cf6' },
    { label: 'H153 — Multiple systems assessment', value: 7680, color: '#06b6d4' },
    { label: 'G522 — Critical care, first hour', value: 5410, color: '#f59e0b' },
    { label: 'H113 — After-hours premium', value: 4220, color: '#10b981' },
  ];

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 px-6 py-5 rounded-xl shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Analytics & Reporting
          </h1>
          <p className="text-gray-600 text-sm mt-1">Billing optimization and compliance metrics</p>
        </div>
        <select className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white" title="Date range">
          <option>Last 7 months</option>
          <option>Last 30 days</option>
          <option>Year to date</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-green-400 to-emerald-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Billing Revenue</p>
              <div className="text-2xl font-bold text-green-600 mt-1">$45,280</div>
              <p className="text-xs text-gray-500 mt-0.5">+12% from last month</p>
            </div>
            <div className="stat-icon bg-green-50 text-green-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-blue-400 to-blue-600" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Optimization Rate</p>
              <div className="text-2xl font-bold text-blue-600 mt-1">78%</div>
              <p className="text-xs text-gray-500 mt-0.5">Above specialty average</p>
            </div>
            <div className="stat-icon bg-blue-50 text-blue-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-purple-400 to-fuchsia-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance Score</p>
              <div className="text-2xl font-bold text-purple-600 mt-1">94%</div>
              <p className="text-xs text-gray-500 mt-0.5">Audit ready</p>
            </div>
            <div className="stat-icon bg-purple-50 text-purple-600">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="stat-card p-5">
          <div className="stat-card-accent bg-gradient-to-r from-orange-400 to-amber-500" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Claims Processed</p>
              <div className="text-2xl font-bold text-orange-600 mt-1">1,247</div>
              <p className="text-xs text-gray-500 mt-0.5">This month</p>
            </div>
            <div className="stat-icon bg-orange-50 text-orange-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Billing Optimization Trends</h2>
              <p className="text-xs text-gray-500">Monthly OHIP billing impact (CAD)</p>
            </div>
            <span className="text-xs font-medium text-green-600">+58.9% vs. 7 months ago</span>
          </div>
          <AreaChart data={trend} color="#10b981" />
        </div>

        <div className="panel p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Top billed OHIP codes</h2>
          <p className="text-xs text-gray-500 mb-4">Last 30 days, by revenue</p>
          <HBarChart data={topCodes} formatValue={formatCurrency} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
