import type { User } from '@/stores/authStore';
import { getApiBase, getGoogleClientId } from '@/services/runtimeConfig';

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: User['role'];
    practiceId?: string;
    npi?: string;
    specialty?: string;
  };
  token: string;
  practice?: {
    id: string;
    name: string;
    specialties: string[];
  } | null;
}

export interface AuthMeResponse {
  success: boolean;
  user: LoginResponse['user'];
  practice?: LoginResponse['practice'];
}

function mapUser(raw: LoginResponse['user']): User {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    role: raw.role,
    practiceId: raw.practiceId,
    npi: raw.npi,
    province: raw.specialty || undefined,
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.error === 'string') return data.error;
    if (Array.isArray(data.details) && data.details[0]?.msg) return data.details[0].msg;
    return 'Authentication failed';
  } catch {
    return res.status === 401 ? 'Invalid email or password' : 'Authentication failed';
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Cannot reach the server. Start the backend: cd backend && npm run dev:auth');
    }
    throw new Error('Cannot reach the server. Start the backend: cd backend && npm run dev:auth');
  } finally {
    clearTimeout(timer);
  }
}

export async function login(email: string, password: string): Promise<{ user: User; token: string; practice?: LoginResponse['practice'] }> {
  const res = await fetchWithTimeout(`${getApiBase()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data: LoginResponse = await res.json();
  return { user: mapUser(data.user), token: data.token, practice: data.practice ?? undefined };
}

export async function getMe(token: string): Promise<{ user: User; practice?: LoginResponse['practice'] }> {
  const res = await fetchWithTimeout(`${getApiBase()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }, 8000);

  if (!res.ok) {
    throw new Error('Session expired');
  }

  const data: AuthMeResponse = await res.json();
  return { user: mapUser(data.user), practice: data.practice ?? undefined };
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  specialty?: string;
}): Promise<{ user: User; token: string }> {
  const res = await fetchWithTimeout(`${getApiBase()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, role: 'PROVIDER' }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const body = await res.json();
  return { user: mapUser(body.user), token: body.token };
}

export async function getAuthConfig(): Promise<{ googleClientId: string; googleConfigured: boolean }> {
  const runtimeId = getGoogleClientId();
  if (runtimeId) {
    return { googleClientId: runtimeId, googleConfigured: true };
  }

  const res = await fetchWithTimeout(`${getApiBase()}/api/auth/config`, {}, 5000);
  if (!res.ok) {
    return { googleClientId: '', googleConfigured: false };
  }
  const data = await res.json();
  return {
    googleClientId: data.googleClientId || '',
    googleConfigured: Boolean(data.googleConfigured),
  };
}

export async function loginWithGoogle(credential: string): Promise<{ user: User; token: string; practice?: LoginResponse['practice'] }> {
  const res = await fetchWithTimeout(`${getApiBase()}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data: LoginResponse = await res.json();
  return { user: mapUser(data.user), token: data.token, practice: data.practice ?? undefined };
}

export async function logout(token?: string): Promise<void> {
  if (!token) return;
  try {
    await fetch(`${getApiBase()}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore network errors on logout
  }
}
