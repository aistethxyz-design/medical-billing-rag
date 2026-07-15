import { handleApiRequest } from './worker/api.js';
import { googleClientId } from './worker/jwt.js';

function isAppStaticAsset(pathname) {
  return pathname.startsWith('/app/assets/') || /\.[a-zA-Z0-9]+$/.test(pathname);
}

async function serveAppSpa(request, env) {
  const appIndex = new URL('/app/index.html', request.url);
  return env.ASSETS.fetch(new Request(appIndex, request));
}

/** SPA + API + runtime config on one Cloudflare Worker (wiserdoc.com). */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/app/runtime-config.json') {
      const clientId = googleClientId(env);
      const apiUrlRaw = env.VITE_API_URL || '';
      const apiUrl = !apiUrlRaw || apiUrlRaw.includes('YOUR-BACKEND') ? url.origin : apiUrlRaw.replace(/\/$/, '');
      return Response.json(
        { googleClientId: clientId, apiUrl, googleConfigured: Boolean(clientId) },
        { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
      );
    }

    if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
      const apiResponse = await handleApiRequest(request, env);
      if (apiResponse) return apiResponse;
    }

    // Root /login → Google sign-in (skip the /app landing page)
    if (url.pathname === '/login' || url.pathname === '/login/') {
      const redirect = url.searchParams.get('redirect') || '/dashboard';
      const target = new URL('/app/login', url.origin);
      target.searchParams.set('redirect', redirect);
      return Response.redirect(target.toString(), 302);
    }

    // /app or /app/ → login, not the old in-app landing page
    if (url.pathname === '/app' || url.pathname === '/app/') {
      return Response.redirect(`${url.origin}/app/login?redirect=/dashboard`, 302);
    }

    // React SPA routes under /app/* (e.g. /app/login, /app/dashboard)
    if (url.pathname.startsWith('/app/') && !isAppStaticAsset(url.pathname)) {
      return serveAppSpa(request, env);
    }

    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    const fallback = url.pathname.startsWith('/app')
      ? new URL('/app/index.html', url.origin)
      : new URL('/index.html', url.origin);

    return env.ASSETS.fetch(new Request(fallback, request));
  },
};
