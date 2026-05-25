import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
  emailVerified: boolean;
}

function getClientId(): string {
  return process.env.GOOGLE_CLIENT_ID || '';
}

export function isGoogleAuthConfigured(): boolean {
  return Boolean(getClientId());
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const client = new OAuth2Client(clientId);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Invalid Google token payload');
  }

  const nameParts = (payload.name || '').trim().split(/\s+/).filter(Boolean);

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: payload.given_name || nameParts[0] || 'User',
    lastName: payload.family_name || nameParts.slice(1).join(' ') || '',
    picture: payload.picture,
    emailVerified: payload.email_verified === true,
  };
}
