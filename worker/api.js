import { verifyToken, verifyGoogleIdToken, googleClientId } from './jwt.js';
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
  isAllowed,
  getAllowlist,
  addAllowed,
  removeAllowed,
} from './store.js';

// Owner(s) who may edit the copilot allowlist. Comma-separated ADMIN_EMAILS env
// var, plus a hardcoded fallback so the owner is never locked out.
function adminEmails(env) {
  const fromEnv = (env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return new Set([...fromEnv, 'aistethxyz@gmail.com']);
}

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
    const clientId = googleClientId(env);
    return json({ success: true, googleClientId: clientId, googleConfigured: Boolean(clientId), fileAuth: true });
  }

  // Endpoints that must work even when KV isn't bound yet (auth + copilot use a
  // KV-optional path). Only the KV-backed billing endpoints hard-require storage.
  const KV_OPTIONAL = ['/api/auth/config', '/api/auth/google', '/api/auth/me', '/api/auth/logout',
    '/api/copilot', '/api/snapshot', '/api/admin/allowlist'];
  if (!hasStorage(env) && path.startsWith('/api/') && !KV_OPTIONAL.includes(path)) {
    return err('Add KV namespace binding named AISTETH_KV in Cloudflare Worker settings', 503);
  }

  if (path === '/api/auth/google' && method === 'POST') {
    const body = await readBody(request);
    if (!body.credential) return err('Google credential is required', 400);
    const clientId = googleClientId(env);
    if (!clientId) return err('Google sign-in is not configured on the server', 503);
    try {
      const profile = await verifyGoogleIdToken(env, body.credential);
      if (!profile.emailVerified) return err('Google account email is not verified', 401);
      // Allowlist gate: only approved emails (or admins) may sign in during the trial.
      const permitted = adminEmails(env).has(profile.email) || (await isAllowed(env, profile.email));
      if (!permitted) {
        return err('This account is not authorized for the wiserdoc trial. Contact the administrator to be added.', 403);
      }
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
    // Without KV, reconstruct the profile from the signed token claims so the
    // session stays valid (the JWT is the source of truth for identity here).
    if (!hasStorage(env)) {
      return json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || (user.email ? user.email.split('@')[0] : 'User'),
          lastName: user.lastName || '',
          role: user.role || 'PROVIDER',
          emCopilot: user.emCopilot === true || (await isAllowed(env, user.email)),
        },
        practice: null,
      });
    }
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

  // ── EM Copilot: allowlist admin (owner only) ───────────────────────────────
  if (path === '/api/admin/allowlist') {
    if (!adminEmails(env).has(user.email)) return err('Admins only', 403);
    if (method === 'GET') {
      return json({ success: true, allowlist: await getAllowlist(env) });
    }
    if (method === 'POST') {
      const body = await readBody(request);
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return err('email is required', 400);
      const action = body.action === 'remove' ? 'remove' : 'add';
      const allowlist = action === 'remove' ? await removeAllowed(env, email) : await addAllowed(env, email);
      return json({ success: true, action, allowlist });
    }
    return err('Method not allowed', 405);
  }

  // ── EM Copilot: authenticated proxy to the RAG backend on Hetzner ──────────
  // Residents never reach the backend directly. We verify the JWT + allowlist
  // here, then forward with the server-to-server shared secret.
  if ((path === '/api/copilot' || path === '/api/snapshot') && method === 'POST') {
    if (!(user.emCopilot || (await isAllowed(env, user.email)))) {
      return err('Not authorized for the EM Copilot', 403);
    }
    const base = (env.EM_COPILOT_URL || 'https://em-copilot.aisteth.xyz').replace(/\/$/, '');
    if (!env.COPILOT_SHARED_SECRET) {
      return err('EM Copilot backend is not configured yet (set COPILOT_SHARED_SECRET on the Worker).', 503);
    }
    const upstreamPath = path === '/api/copilot' ? '/copilot' : '/snapshot';
    const body = await readBody(request);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const upstream = await fetch(`${base}${upstreamPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Copilot-Secret': env.COPILOT_SHARED_SECRET },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch {
      return err('EM Copilot backend is unavailable. Please try again.', 502);
    } finally {
      clearTimeout(timer);
    }
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
