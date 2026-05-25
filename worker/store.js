import { signToken } from './jwt.js';

const USERS_KEY = 'users';

function kv(env) {
  return env.AISTETH_KV || env.KV;
}

export function hasStorage(env) {
  return Boolean(kv(env));
}

async function getJson(env, key, fallback) {
  const store = kv(env);
  if (!store) return fallback;
  const raw = await store.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function putJson(env, key, value) {
  const store = kv(env);
  if (!store) throw new Error('Storage not configured — add AISTETH_KV binding in Cloudflare');
  await store.put(key, JSON.stringify(value));
}

async function getUsers(env) {
  const users = await getJson(env, USERS_KEY, null);
  if (users) return users;
  const seed = [{
    id: 'user-demo-1',
    email: 'demo@aisteth.com',
    firstName: 'Mehul',
    lastName: 'Patel',
    role: 'PROVIDER',
    practiceId: 'practice-1',
    practiceName: 'Toronto General ER',
    npi: '1234567890',
    specialty: 'Ontario',
  }];
  await putJson(env, USERS_KEY, seed);
  return seed;
}

async function saveUsers(env, users) {
  await putJson(env, USERS_KEY, users);
}

function encountersKey(userId) {
  return `encounters:${userId}`;
}

function demoEncounters(providerId) {
  const patients = [
    { id: 'pt-001', name: 'James Okonkwo', healthNumber: '4521-883-901' },
    { id: 'pt-002', name: 'Maria Santos', healthNumber: '3310-224-778' },
  ];
  const encounters = [
    {
      id: 'enc-001', providerId, patientId: 'pt-001', date: '2026-05-20T21:30:00.000Z',
      type: 'Emergency', location: 'Toronto General ER', chiefComplaint: 'Chest pain',
      status: 'coded',
      billingCodes: [{ code: 'H132', description: 'Comprehensive assessment', amount: 46.3, timeOfDay: 'Evening', units: 1 }],
    },
  ];
  return { patients, encounters };
}

async function getEncounterStore(env, providerId) {
  const key = encountersKey(providerId);
  const existing = await getJson(env, key, null);
  if (existing) return existing;
  const seed = providerId === 'user-demo-1' ? demoEncounters(providerId) : { patients: [], encounters: [] };
  await putJson(env, key, seed);
  return seed;
}

async function saveEncounterStore(env, providerId, store) {
  await putJson(env, encountersKey(providerId), store);
}

function lineTotal(line) {
  return line.amount * (line.units ?? 1);
}

function visitTotal(codes) {
  return codes.reduce((sum, c) => sum + lineTotal(c), 0);
}

export async function ensureProviderData(env, providerId) {
  await getEncounterStore(env, providerId);
}

export async function fileGoogleLogin(env, profile) {
  const users = await getUsers(env);
  let user = users.find((u) => u.googleId === profile.googleId)
    ?? users.find((u) => u.email.toLowerCase() === profile.email.toLowerCase());

  if (user) {
    if (!user.googleId) user.googleId = profile.googleId;
    if (profile.picture) user.picture = profile.picture;
    await saveUsers(env, users);
  } else {
    user = {
      id: `user-${Date.now()}`,
      email: profile.email.toLowerCase(),
      googleId: profile.googleId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: 'PROVIDER',
      specialty: 'Ontario',
      picture: profile.picture,
    };
    users.push(user);
    await saveUsers(env, users);
  }

  await ensureProviderData(env, user.id);
  return buildAuthResponse(env, user);
}

export async function fileGetUser(env, userId) {
  const users = await getUsers(env);
  const user = users.find((u) => u.id === userId);
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      practiceId: user.practiceId,
      npi: user.npi,
      specialty: user.specialty,
    },
    practice: user.practiceName
      ? { id: user.practiceId || 'practice-1', name: user.practiceName, specialties: ['Emergency Medicine'] }
      : null,
  };
}

async function buildAuthResponse(env, user) {
  const token = await signToken(env, {
    id: user.id,
    email: user.email,
    role: user.role,
    practiceId: user.practiceId,
  });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      practiceId: user.practiceId,
      npi: user.npi,
      specialty: user.specialty,
      picture: user.picture,
    },
    practice: user.practiceName
      ? { id: user.practiceId || 'practice-1', name: user.practiceName, specialties: ['Emergency Medicine'] }
      : null,
  };
}

export async function listEncounters(env, providerId) {
  const store = await getEncounterStore(env, providerId);
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

export async function getBillingSummary(env, providerId) {
  const { encounters } = await listEncounters(env, providerId);
  const codeMap = new Map();
  for (const enc of encounters) {
    for (const line of enc.billingCodes) {
      const units = line.units ?? 1;
      const existing = codeMap.get(line.code);
      if (existing) {
        existing.count += units;
        existing.totalAmount += lineTotal(line);
      } else {
        codeMap.set(line.code, { code: line.code, description: line.description, count: units, totalAmount: lineTotal(line) });
      }
    }
  }
  const codes = [...codeMap.values()].sort((a, b) => b.totalAmount - a.totalAmount);
  return {
    codes,
    totalVisits: encounters.length,
    totalBilled: encounters.reduce((sum, e) => sum + e.visitTotal, 0),
    uniquePatients: new Set(encounters.map((e) => e.patientId)).size,
  };
}

export async function groupByPatient(env, providerId) {
  const { encounters, patients } = await listEncounters(env, providerId);
  const patientMap = new Map(patients.map((p) => [p.id, p]));
  const groups = new Map();
  for (const enc of encounters) {
    const patient = patientMap.get(enc.patientId) ?? { id: enc.patientId, name: enc.patientName };
    const group = groups.get(enc.patientId) ?? { patient, visits: [], patientTotal: 0 };
    group.visits.push(enc);
    group.patientTotal += enc.visitTotal;
    groups.set(enc.patientId, group);
  }
  return [...groups.values()].sort((a, b) => b.patientTotal - a.patientTotal);
}

export async function createEncounterWithPatient(env, providerId, data) {
  const store = await getEncounterStore(env, providerId);
  let patientId = data.patientId;
  if (!patientId) {
    if (!data.patientName?.trim()) throw new Error('patientName is required for new patients');
    const patient = { id: `pt-${Date.now()}`, name: data.patientName.trim(), healthNumber: data.healthNumber };
    store.patients.push(patient);
    patientId = patient.id;
  }
  const encounter = {
    id: `enc-${Date.now()}`,
    providerId,
    patientId,
    date: data.date,
    type: data.type || 'Emergency',
    location: data.location || 'Toronto General ER',
    chiefComplaint: data.chiefComplaint,
    status: data.status ?? 'coded',
    billingCodes: (data.billingCodes || []).map((b) => ({ ...b, units: b.units ?? 1 })),
  };
  store.encounters.push(encounter);
  await saveEncounterStore(env, providerId, store);
  return encounter;
}

export async function appendCodesToEncounter(env, providerId, encounterId, billingCodes) {
  const store = await getEncounterStore(env, providerId);
  const encounter = store.encounters.find((e) => e.id === encounterId && e.providerId === providerId);
  if (!encounter) throw new Error('Encounter not found');
  for (const line of billingCodes) {
    const units = line.units ?? 1;
    const existing = encounter.billingCodes.find((b) => b.code === line.code);
    if (existing) existing.units = (existing.units ?? 1) + units;
    else encounter.billingCodes.push({ ...line, units });
  }
  await saveEncounterStore(env, providerId, store);
  return encounter;
}

export async function getProviderDashboard(env, providerId) {
  const summary = await getBillingSummary(env, providerId);
  const { encounters } = await listEncounters(env, providerId);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const thisMonth = encounters.filter((e) => new Date(e.date) >= monthStart);
  return {
    pendingReviews: encounters.filter((e) => e.status === 'draft').length,
    monthlyBillingImpact: thisMonth.reduce((sum, e) => sum + e.visitTotal, 0),
    claimsOptimized: encounters.filter((e) => e.status === 'paid' || e.status === 'submitted').length,
    recentOptimizations: encounters.slice(0, 5).map((e) => ({
      id: e.id,
      encounterId: e.id,
      originalCode: e.billingCodes[0]?.code ?? '—',
      suggestedCode: e.billingCodes.map((b) => `${b.code}${(b.units ?? 1) > 1 ? `×${b.units}` : ''}`).join(', '),
      potentialGain: e.visitTotal,
      status: e.status,
      date: e.date.slice(0, 10),
    })),
    totalBilledAllTime: summary.totalBilled,
    topCode: summary.codes[0] ?? null,
    totalVisits: summary.totalVisits,
    uniquePatients: summary.uniquePatients,
  };
}
