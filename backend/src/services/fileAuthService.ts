import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth';
import { ensureProviderData } from './fileEncounterService';

export interface FileUser {
  id: string;
  email: string;
  password?: string;
  googleId?: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'PRACTICE_MANAGER' | 'PROVIDER' | 'CODER' | 'BILLER';
  practiceId?: string;
  practiceName?: string;
  npi?: string;
  specialty?: string;
  picture?: string;
}

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureStore(): FileUser[] {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    const seed: FileUser[] = [
      {
        id: 'user-demo-1',
        email: 'demo@aisteth.com',
        password: '$2a$12$yRHWP/x65bT22AUIBObbz.d/bZKdkgU.nxMS49JlnBqnFqeUgOtyC',
        firstName: 'Mehul',
        lastName: 'Patel',
        role: 'PROVIDER',
        practiceId: 'practice-1',
        practiceName: 'Toronto General ER',
        npi: '1234567890',
        specialty: 'Ontario',
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as FileUser[];
}

function saveUsers(users: FileUser[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function isFileAuthEnabled(): boolean {
  return process.env.USE_FILE_AUTH === 'true' || process.env.NODE_ENV === 'development';
}

export async function fileLogin(email: string, password: string) {
  const users = ensureStore();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.password) return null;
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return null;
  ensureProviderData(user.id);
  return buildAuthResponse(user);
}

export async function fileRegister(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: FileUser['role'];
  npi?: string;
  specialty?: string;
}) {
  const users = ensureStore();
  if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { error: 'User already exists with this email' as const };
  }

  const hash = await bcrypt.hash(data.password, 12);
  const user: FileUser = {
    id: `user-${Date.now()}`,
    email: data.email.toLowerCase(),
    password: hash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role || 'PROVIDER',
    specialty: data.specialty || 'Ontario',
    npi: data.npi,
  };
  users.push(user);
  saveUsers(users);
  ensureProviderData(user.id);

  const token = generateToken({
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
      npi: user.npi,
      specialty: user.specialty,
    },
  };
}

function buildAuthResponse(user: FileUser) {
  const token = generateToken({
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

export async function fileGoogleLogin(profile: {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}) {
  const users = ensureStore();
  let user = users.find((u) => u.googleId === profile.googleId)
    ?? users.find((u) => u.email.toLowerCase() === profile.email.toLowerCase());

  if (user) {
    if (!user.googleId) user.googleId = profile.googleId;
    if (profile.picture) user.picture = profile.picture;
    if (!user.firstName && profile.firstName) user.firstName = profile.firstName;
    if (!user.lastName && profile.lastName) user.lastName = profile.lastName;
    saveUsers(users);
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
    saveUsers(users);
  }

  ensureProviderData(user.id);
  return buildAuthResponse(user);
}

export function fileGetUser(userId: string) {
  const users = ensureStore();
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
