import { handleApiRequest } from './worker/api.js';

/** SPA + API + runtime config on one Cloudflare Worker (wiserdoc.com). */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/app/runtime-config.json') {
      const googleClientId = env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || '';
      const apiUrlRaw = env.VITE_API_URL || '';
      const apiUrl = !apiUrlRaw || apiUrlRaw.includes('YOUR-BACKEND') ? url.origin : apiUrlRaw.replace(/\/$/, '');
      return Response.json(
        { googleClientId, apiUrl, googleConfigured: Boolean(googleClientId) },
        { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
      );
    }

    if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
      const apiResponse = await handleApiRequest(request, env);
      if (apiResponse) return apiResponse;
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
