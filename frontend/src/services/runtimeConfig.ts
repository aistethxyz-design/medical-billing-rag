/** Runtime config from Cloudflare Worker env vars (via /app/runtime-config.json). */
let apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
let googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function getApiBase(): string {
  return apiUrl;
}

export function getGoogleClientId(): string {
  return googleClientId;
}

export async function initRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}runtime-config.json`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as { apiUrl?: string; googleClientId?: string };
    if (data.apiUrl && !data.apiUrl.includes('YOUR-BACKEND')) {
      apiUrl = data.apiUrl.replace(/\/$/, '');
    } else if (typeof window !== 'undefined') {
      apiUrl = window.location.origin;
    }
    if (data.googleClientId) {
      googleClientId = data.googleClientId;
    }
  } catch {
    // build-time env or local dev proxy
  }
}
