import fs from 'fs';
import path from 'path';

export interface BillingLine {
  code: string;
  description: string;
  amount: number;
  units?: number;
  timeOfDay?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  healthNumber?: string;
}

export interface EncounterRecord {
  id: string;
  providerId: string;
  patientId: string;
  date: string;
  type: string;
  location: string;
  chiefComplaint?: string;
  status: 'draft' | 'coded' | 'submitted' | 'paid';
  billingCodes: BillingLine[];
}

interface EncounterStore {
  patients: PatientRecord[];
  encounters: EncounterRecord[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_DATA_DIR = path.join(DATA_DIR, 'users');

function userStorePath(providerId: string): string {
  return path.join(USERS_DATA_DIR, providerId, 'encounters.json');
}

function demoSeed(providerId: string): EncounterStore {
  const patients: PatientRecord[] = [
    { id: 'pt-001', name: 'James Okonkwo', healthNumber: '4521-883-901' },
    { id: 'pt-002', name: 'Maria Santos', healthNumber: '3310-224-778' },
    { id: 'pt-003', name: 'Robert Kim', healthNumber: '8892-110-445' },
  ];

  const encounters: EncounterRecord[] = [
    {
      id: 'enc-001',
      providerId,
      patientId: 'pt-001',
      date: '2026-05-20T21:30:00.000Z',
      type: 'Emergency',
      location: 'Toronto General ER',
      chiefComplaint: 'Chest pain, rule out ACS',
      status: 'coded',
      billingCodes: [
        { code: 'H132', description: 'Comprehensive assessment', amount: 46.3, timeOfDay: 'Evening' },
        { code: 'K002', description: 'IV initiation', amount: 20.15, timeOfDay: 'Evening' },
      ],
    },
    {
      id: 'enc-002',
      providerId,
      patientId: 'pt-002',
      date: '2026-05-21T10:45:00.000Z',
      type: 'Emergency',
      location: 'Toronto General ER',
      chiefComplaint: 'Upper respiratory symptoms',
      status: 'submitted',
      billingCodes: [
        { code: 'H101', description: 'Minor assessment', amount: 15.0, timeOfDay: 'Day' },
        { code: 'K022', description: 'Smoking cessation (Initial)', amount: 15.9 },
      ],
    },
    {
      id: 'enc-003',
      providerId,
      patientId: 'pt-003',
      date: '2026-05-19T03:20:00.000Z',
      type: 'Emergency',
      location: 'Toronto General ER',
      chiefComplaint: 'Abdominal pain',
      status: 'paid',
      billingCodes: [
        { code: 'H153', description: 'Multiple systems assessment', amount: 38.6, timeOfDay: 'Night' },
        { code: 'A004', description: 'Medical specific assessment', amount: 43.1 },
      ],
    },
  ];

  return { patients, encounters };
}

function ensureUserStore(providerId: string): EncounterStore {
  const filePath = userStorePath(providerId);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(filePath)) {
    // Demo account gets sample data; every other account starts empty
    const seed = providerId === 'user-demo-1' ? demoSeed(providerId) : { patients: [], encounters: [] };
    fs.writeFileSync(filePath, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as EncounterStore;
}

function saveUserStore(providerId: string, store: EncounterStore) {
  const filePath = userStorePath(providerId);
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf-8');
}

function lineTotal(line: BillingLine): number {
  return line.amount * (line.units ?? 1);
}

function visitTotal(codes: BillingLine[]): number {
  return codes.reduce((sum, c) => sum + lineTotal(c), 0);
}

export function isFileEncountersEnabled(): boolean {
  return process.env.USE_FILE_AUTH === 'true' || process.env.NODE_ENV === 'development';
}

/** Call on first login to create an empty data folder for a new Google user. */
export function ensureProviderData(providerId: string) {
  ensureUserStore(providerId);
}

export function listEncounters(providerId: string) {
  const store = ensureUserStore(providerId);
  const patientMap = new Map(store.patients.map((p) => [p.id, p]));

  const encounters = store.encounters
    .filter((e) => e.providerId === providerId)
    .map((e) => {
      const patient = patientMap.get(e.patientId);
      const total = visitTotal(e.billingCodes);
      return {
        ...e,
        patientName: patient?.name ?? 'Unknown patient',
        healthNumber: patient?.healthNumber,
        visitTotal: total,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { encounters, patients: store.patients };
}

export function getBillingSummary(providerId: string) {
  const { encounters } = listEncounters(providerId);

  const codeMap = new Map<string, { code: string; description: string; count: number; totalAmount: number }>();

  for (const enc of encounters) {
    for (const line of enc.billingCodes) {
      const units = line.units ?? 1;
      const existing = codeMap.get(line.code);
      if (existing) {
        existing.count += units;
        existing.totalAmount += lineTotal(line);
      } else {
        codeMap.set(line.code, {
          code: line.code,
          description: line.description,
          count: units,
          totalAmount: lineTotal(line),
        });
      }
    }
  }

  const codes = [...codeMap.values()].sort((a, b) => b.totalAmount - a.totalAmount);
  const totalVisits = encounters.length;
  const totalBilled = encounters.reduce((sum, e) => sum + e.visitTotal, 0);
  const uniquePatients = new Set(encounters.map((e) => e.patientId)).size;

  return { codes, totalVisits, totalBilled, uniquePatients };
}

export function groupByPatient(providerId: string) {
  const { encounters, patients } = listEncounters(providerId);
  const patientMap = new Map(patients.map((p) => [p.id, p]));

  const groups = new Map<string, {
    patient: PatientRecord;
    visits: typeof encounters;
    patientTotal: number;
  }>();

  for (const enc of encounters) {
    const patient = patientMap.get(enc.patientId) ?? { id: enc.patientId, name: enc.patientName };
    const group = groups.get(enc.patientId) ?? { patient, visits: [], patientTotal: 0 };
    group.visits.push(enc);
    group.patientTotal += enc.visitTotal;
    groups.set(enc.patientId, group);
  }

  return [...groups.values()].sort((a, b) => b.patientTotal - a.patientTotal);
}

export function addEncounter(
  providerId: string,
  data: {
    patientId: string;
    date: string;
    type: string;
    location: string;
    chiefComplaint?: string;
    billingCodes: BillingLine[];
  }
) {
  const store = ensureUserStore(providerId);
  const encounter: EncounterRecord = {
    id: `enc-${Date.now()}`,
    providerId,
    patientId: data.patientId,
    date: data.date,
    type: data.type,
    location: data.location,
    chiefComplaint: data.chiefComplaint,
    status: 'coded',
    billingCodes: data.billingCodes,
  };
  store.encounters.push(encounter);
  saveUserStore(providerId, store);
  return encounter;
}

export function createPatient(providerId: string, name: string, healthNumber?: string): PatientRecord {
  const store = ensureUserStore(providerId);
  const patient: PatientRecord = {
    id: `pt-${Date.now()}`,
    name,
    healthNumber,
  };
  store.patients.push(patient);
  saveUserStore(providerId, store);
  return patient;
}

export function createEncounterWithPatient(
  providerId: string,
  data: {
    patientId?: string;
    patientName?: string;
    healthNumber?: string;
    date: string;
    type: string;
    location: string;
    chiefComplaint?: string;
    billingCodes: BillingLine[];
    status?: EncounterRecord['status'];
  }
) {
  const store = ensureUserStore(providerId);
  let patientId = data.patientId;

  if (!patientId) {
    if (!data.patientName?.trim()) throw new Error('patientName is required for new patients');
    const patient: PatientRecord = {
      id: `pt-${Date.now()}`,
      name: data.patientName.trim(),
      healthNumber: data.healthNumber,
    };
    store.patients.push(patient);
    patientId = patient.id;
  }

  const encounter: EncounterRecord = {
    id: `enc-${Date.now()}`,
    providerId,
    patientId: patientId!,
    date: data.date,
    type: data.type,
    location: data.location,
    chiefComplaint: data.chiefComplaint,
    status: data.status ?? 'coded',
    billingCodes: data.billingCodes.map((b) => ({ ...b, units: b.units ?? 1 })),
  };
  store.encounters.push(encounter);
  saveUserStore(providerId, store);
  return encounter;
}

export function appendCodesToEncounter(
  providerId: string,
  encounterId: string,
  billingCodes: BillingLine[]
) {
  const store = ensureUserStore(providerId);
  const encounter = store.encounters.find((e) => e.id === encounterId && e.providerId === providerId);
  if (!encounter) throw new Error('Encounter not found');

  for (const line of billingCodes) {
    const units = line.units ?? 1;
    const existing = encounter.billingCodes.find((b) => b.code === line.code);
    if (existing) {
      existing.units = (existing.units ?? 1) + units;
    } else {
      encounter.billingCodes.push({ ...line, units });
    }
  }
  saveUserStore(providerId, store);
  return encounter;
}

/** Dashboard metrics derived from this provider's encounters only. */
export function getProviderDashboard(providerId: string) {
  const summary = getBillingSummary(providerId);
  const { encounters } = listEncounters(providerId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thisMonth = encounters.filter((e) => new Date(e.date) >= monthStart);
  const monthlyBillingImpact = thisMonth.reduce((sum, e) => sum + e.visitTotal, 0);
  const pendingReviews = encounters.filter((e) => e.status === 'draft').length;
  const claimsOptimized = encounters.filter((e) => e.status === 'paid' || e.status === 'submitted').length;

  const topCode = summary.codes[0] ?? null;

  const recentOptimizations = encounters.slice(0, 5).map((e) => ({
    id: e.id,
    encounterId: e.id,
    originalCode: e.billingCodes[0]?.code ?? '—',
    suggestedCode: e.billingCodes.map((b) => `${b.code}${(b.units ?? 1) > 1 ? `×${b.units}` : ''}`).join(', '),
    potentialGain: e.visitTotal,
    status: e.status,
    date: e.date.slice(0, 10),
  }));

  return {
    pendingReviews,
    monthlyBillingImpact,
    claimsOptimized,
    recentOptimizations,
    totalBilledAllTime: summary.totalBilled,
    topCode,
    totalVisits: summary.totalVisits,
    uniquePatients: summary.uniquePatients,
  };
}
