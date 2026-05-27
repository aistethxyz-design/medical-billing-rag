/** Runtime config from Cloudflare Worker env vars (via /app/runtime-config.json). */
const buildApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
let apiUrl = buildApiUrl;
let googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function sameOriginApi(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function resolveApiUrl(candidate?: string): string {
  const raw = (candidate ?? apiUrl).replace(/\/$/, '');
  if (!raw || raw.includes('YOUR-BACKEND')) return sameOriginApi();
  return raw;
}

export function getApiBase(): string {
  return resolveApiUrl();
}

export function getGoogleClientId(): string {
  return googleClientId;
}

export async function initRuntimeConfig(): Promise<void> {
  apiUrl = resolveApiUrl(buildApiUrl);

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}runtime-config.json`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { apiUrl?: string; googleClientId?: string };
    apiUrl = resolveApiUrl(data.apiUrl);
    if (data.googleClientId) {
      googleClientId = data.googleClientId;
    }
  } catch {
    // build-time env or local dev proxy
  }
}
