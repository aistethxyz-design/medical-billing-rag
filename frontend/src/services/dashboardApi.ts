import type { User } from '@/stores/authStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export interface DashboardOptimization {
  id: string;
  encounterId: string;
  originalCode: string;
  suggestedCode: string;
  potentialGain: number;
  status: string;
  date: string;
}

export interface DashboardSummary {
  pendingReviews: number;
  monthlyBillingImpact: number;
  claimsOptimized: number;
  recentOptimizations: DashboardOptimization[];
  totalBilledAllTime?: number;
  totalVisits?: number;
  uniquePatients?: number;
  topCode?: { code: string; description: string; count: number; totalAmount: number } | null;
}

export async function fetchDashboard(token: string): Promise<DashboardSummary | null> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/dashboard`, {
      headers: authHeaders(token),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.dashboard as DashboardSummary;
  } catch {
    return null;
  }
}

/** OHIP billing guidance for the current shift — unique to dashboard, not duplicated elsewhere */
export function billingWindowGuide(slot: string, province?: string): { title: string; codes: string; tip: string } {
  const region = province || 'Ontario';
  const guides: Record<string, { title: string; codes: string; tip: string }> = {
    Day: {
      title: 'Day shift (Mon–Fri 0800–1700)',
      codes: 'H101 · H102 · H103 · H104',
      tip: 'Use H102 for a standard comprehensive ER assessment. Add premiums only when documentation supports them.',
    },
    Evening: {
      title: 'Evening shift (Mon–Fri 1700–0000)',
      codes: 'H131 · H132 · H133 · H134',
      tip: 'Evening H-codes pay higher than daytime. Check for E412 after-hours bonus on eligible procedures.',
    },
    Night: {
      title: 'Night shift (0000–0800)',
      codes: 'H152 · H153 · H154 + E413',
      tip: 'Night comprehensive assessment is H152 ($73.90). Consider H986/H987 special-visit premiums if called in.',
    },
    Weekend: {
      title: 'Weekend / holiday',
      codes: 'H151 · H152 · H153 · H154',
      tip: 'Weekend rates differ from weekday night rates. Verify the encounter timestamp before selecting H-prefix codes.',
    },
  };
  const guide = guides[slot] || guides.Day;
  return { ...guide, title: `${region} — ${guide.title}` };
}

export function displayName(user: User | null): string {
  if (!user) return 'there';
  const title = user.role === 'PROVIDER' ? 'Dr.' : '';
  return `${title} ${user.lastName}`.trim();
}
