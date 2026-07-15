import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

// The project's Google OAuth Client ID. Client IDs are public (they ship in the
// browser bundle), so this is a safe fallback that lets Google sign-in work even
// when VITE_GOOGLE_CLIENT_ID isn't set on the Worker. Override via env to change.
export const DEFAULT_GOOGLE_CLIENT_ID =
  '466874169226-2b3djknc7p69k4e8k45e54o7ltb4i5i0.apps.googleusercontent.com';

export function googleClientId(env) {
  return env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID;
}

function secretKey(env) {
  const s = env.JWT_SECRET || 'aisteth-secret-key-change-in-production';
  return new TextEncoder().encode(s);
}

export async function signToken(env, payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer('aisteth')
    .setAudience('aisteth-users')
    .sign(secretKey(env));
}

export async function verifyToken(env, token) {
  const { payload } = await jwtVerify(token, secretKey(env), {
    issuer: 'aisteth',
    audience: 'aisteth-users',
  });
  const id = payload.id || payload.userId;
  if (!id) throw new Error('Invalid token');
  return {
    id: String(id),
    email: String(payload.email || ''),
    role: payload.role,
    emCopilot: payload.emCopilot === true,
    firstName: payload.firstName ? String(payload.firstName) : '',
    lastName: payload.lastName ? String(payload.lastName) : '',
  };
}

export async function verifyGoogleIdToken(env, idToken) {
  const clientId = googleClientId(env);
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured');

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    audience: clientId,
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
  });

  if (!payload.sub || !payload.email) throw new Error('Invalid Google token payload');
  const nameParts = String(payload.name || '').trim().split(/\s+/).filter(Boolean);

  return {
    googleId: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    firstName: String(payload.given_name || nameParts[0] || 'User'),
    lastName: String(payload.family_name || nameParts.slice(1).join(' ') || ''),
    picture: payload.picture ? String(payload.picture) : undefined,
    emailVerified: payload.email_verified === true,
  };
}
