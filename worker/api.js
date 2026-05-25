import { verifyToken, verifyGoogleIdToken } from './jwt.js';
import { matchCodesFromText } from './ohip.js';
import {
  hasStorage,
  fileGoogleLogin,
  fileGetUser,
  listEncounters,
  getBillingSummary,
  groupByPatient,
  createEncounterWithPatient,
  appendCodesToEncounter,
  getProviderDashboard,
} from './store.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function authUser(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return await verifyToken(env, header.slice(7));
  } catch {
    return null;
  }
}

export async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (path === '/health') {
    return json({ status: 'ok', mode: 'cloudflare-worker', fileAuth: true, storage: hasStorage(env) });
  }

  if (path === '/api/auth/config') {
    const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '';
    return json({ success: true, googleClientId, googleConfigured: Boolean(googleClientId), fileAuth: true });
  }

  if (!hasStorage(env) && path.startsWith('/api/') && path !== '/api/auth/config') {
    return err('Add KV namespace binding named AISTETH_KV in Cloudflare Worker settings', 503);
  }

  if (path === '/api/auth/google' && method === 'POST') {
    const body = await readBody(request);
    if (!body.credential) return err('Google credential is required', 400);
    const clientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '';
    if (!clientId) return err('Google sign-in is not configured on the server', 503);
    try {
      const profile = await verifyGoogleIdToken(env, body.credential);
      if (!profile.emailVerified) return err('Google account email is not verified', 401);
      const result = await fileGoogleLogin(env, profile);
      return json({ success: true, ...result });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Google sign-in failed';
      return err(msg.includes('audience') ? 'Google Client ID mismatch' : msg, 401);
    }
  }

  const user = await authUser(request, env);

  if (path === '/api/auth/me' && method === 'GET') {
    if (!user) return err('Access denied. Invalid token.', 401);
    const result = await fileGetUser(env, user.id);
    if (!result) return err('User not found', 404);
    return json({ success: true, ...result });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return json({ success: true, message: 'Logged out successfully' });
  }

  if (!user && path.startsWith('/api/')) {
    return err('Access denied. No valid token provided.', 401);
  }

  if (path === '/api/analytics/dashboard' && method === 'GET') {
    const dashboard = await getProviderDashboard(env, user.id);
    return json({ success: true, dashboard });
  }

  if (path === '/api/encounters/suggest-codes' && method === 'POST') {
    const body = await readBody(request);
    if (!body.text?.trim()) return json({ success: true, codes: [] });
    const matches = matchCodesFromText(body.text, 8, body.timeSlot);
    return json({
      success: true,
      codes: matches.map((m) => ({
        code: m.code,
        description: m.description,
        amount: m.amount,
        howToUse: m.how_to_use,
        timeOfDay: m.timeOfDay,
        score: m.score,
      })),
    });
  }

  if (path === '/api/encounters/by-patient' && method === 'GET') {
    const groups = await groupByPatient(env, user.id);
    return json({ success: true, groups });
  }

  if (path === '/api/encounters/summary' && method === 'GET') {
    const summary = await getBillingSummary(env, user.id);
    return json({ success: true, summary });
  }

  if (path === '/api/encounters' && method === 'GET') {
    const data = await listEncounters(env, user.id);
    return json({ success: true, ...data });
  }

  if (path === '/api/encounters' && method === 'POST') {
    const body = await readBody(request);
    if (!body.date) return err('date is required', 400);
    if (!body.patientId && !body.patientName) return err('patientId or patientName is required', 400);
    try {
      const encounter = await createEncounterWithPatient(env, user.id, body);
      return json({ success: true, encounter }, 201);
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Failed to create encounter', 400);
    }
  }

  const codesMatch = path.match(/^\/api\/encounters\/([^/]+)\/codes$/);
  if (codesMatch && method === 'POST') {
    const body = await readBody(request);
    if (!body.billingCodes?.length) return err('billingCodes required', 400);
    try {
      const encounter = await appendCodesToEncounter(env, user.id, codesMatch[1], body.billingCodes);
      return json({ success: true, encounter });
    } catch (e) {
      return err(e instanceof Error ? e.message : 'Not found', 404);
    }
  }

  if (path === '/api/documents/analyze' && method === 'POST') {
    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    let text = '';
    if (file && typeof file.text === 'function') {
      text = await file.text();
    } else {
      const body = await readBody(request);
      text = body.text || '';
    }
    const codes = matchCodesFromText(text, 12);
    return json({ success: true, codes: codes.map((m) => ({ code: m.code, description: m.description, amount: m.amount, score: m.score })) });
  }

  return null;
}
