import { getApiBase } from '@/services/runtimeConfig';

export interface BillingLine {
  code: string;
  description: string;
  amount: number;
  units?: number;
  timeOfDay?: string;
}

export interface EncounterVisit {
  id: string;
  patientId: string;
  patientName: string;
  healthNumber?: string;
  date: string;
  type: string;
  location: string;
  chiefComplaint?: string;
  status: 'draft' | 'coded' | 'submitted' | 'paid';
  billingCodes: BillingLine[];
  visitTotal: number;
}

export interface PatientRecord {
  id: string;
  name: string;
  healthNumber?: string;
}

export interface PatientGroup {
  patient: PatientRecord;
  visits: EncounterVisit[];
  patientTotal: number;
}

export interface CodeSummaryLine {
  code: string;
  description: string;
  count: number;
  totalAmount: number;
}

export interface BillingSummary {
  codes: CodeSummaryLine[];
  totalVisits: number;
  totalBilled: number;
  uniquePatients: number;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function authFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers: { ...authHeaders(token), ...init?.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function fetchEncountersByPatient(token: string): Promise<PatientGroup[]> {
  const data = await authFetch('/api/encounters/by-patient', token);
  return data.groups ?? [];
}

export async function fetchPatients(token: string): Promise<PatientRecord[]> {
  const data = await authFetch('/api/encounters', token);
  return data.patients ?? [];
}

export async function fetchBillingSummary(token: string): Promise<BillingSummary> {
  const data = await authFetch('/api/encounters/summary', token);
  return data.summary ?? { codes: [], totalVisits: 0, totalBilled: 0, uniquePatients: 0 };
}

export async function suggestCodesFromComplaint(
  token: string,
  text: string,
  timeSlot?: string
): Promise<Array<{ code: string; description: string; amount: number; howToUse?: string; timeOfDay?: string }>> {
  const data = await authFetch('/api/encounters/suggest-codes', token, {
    method: 'POST',
    body: JSON.stringify({ text, timeSlot }),
  });
  return data.codes ?? [];
}

export async function createEncounter(
  token: string,
  body: {
    patientId?: string;
    patientName?: string;
    healthNumber?: string;
    date: string;
    type?: string;
    location?: string;
    chiefComplaint?: string;
    billingCodes: BillingLine[];
    status?: string;
  }
) {
  return authFetch('/api/encounters', token, { method: 'POST', body: JSON.stringify(body) });
}

export async function addCodesToEncounter(
  token: string,
  encounterId: string,
  billingCodes: BillingLine[]
) {
  return authFetch(`/api/encounters/${encounterId}/codes`, token, {
    method: 'POST',
    body: JSON.stringify({ billingCodes }),
  });
}

export function exportSummaryCsv(summary: BillingSummary, groups: PatientGroup[]): string {
  const lines: string[] = ['OHIP Billing Summary', ''];
  lines.push('CODE SUMMARY');
  lines.push('Code,Description,Times Used,Total Amount');
  for (const c of summary.codes) {
    lines.push(`${c.code},"${c.description.replace(/"/g, '""')}",${c.count},${c.totalAmount.toFixed(2)}`);
  }
  lines.push('', `Total visits,${summary.totalVisits}`, `Total billed,$${summary.totalBilled.toFixed(2)}`, '');
  lines.push('VISITS BY PATIENT');
  lines.push('Patient,Date,Visit Type,Codes,Visit Total,Status');
  for (const g of groups) {
    for (const v of g.visits) {
      const codes = v.billingCodes.map((b) => `${b.code}${(b.units ?? 1) > 1 ? `×${b.units}` : ''}`).join('; ');
      lines.push(`"${g.patient.name}",${new Date(v.date).toLocaleDateString('en-CA')},${v.type},"${codes}",${v.visitTotal.toFixed(2)},${v.status}`);
    }
  }
  return lines.join('\n');
}
