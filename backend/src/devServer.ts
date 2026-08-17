/**
 * Minimal dev server — auth + analytics only, no Prisma required.
 * Use when the full backend cannot start due to Prisma engine issues.
 *
 *   npm run dev:auth
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import analyticsRoutes from './routes/analytics';
import encounterRoutes from './routes/encounters';
import documentRoutes from './routes/documents';
import { authenticate, AuthenticatedRequest } from './middleware/auth';
import { isEmCopilotAllowed } from './services/fileAuthService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5173',
];

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || DEV_ORIGINS,
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: 'dev-auth', fileAuth: true });
});

app.use('/api/auth', authRoutes);

// EM Copilot proxy — same contract as the Worker: verify JWT + allowlist,
// then forward to the RAG backend with the server-to-server shared secret.
for (const [route, upstreamPath] of [['/api/copilot', '/copilot'], ['/api/snapshot', '/snapshot']] as const) {
  app.post(route, authenticate, async (req: AuthenticatedRequest, res) => {
    if (!isEmCopilotAllowed(req.user?.email || '')) {
      return res.status(403).json({ error: 'Not authorized for the EM Copilot' });
    }
    const base = (process.env.EM_COPILOT_URL || 'https://em-copilot.aisteth.xyz').replace(/\/$/, '');
    const secret = process.env.COPILOT_SHARED_SECRET;
    if (!secret) {
      return res.status(503).json({ error: 'EM Copilot backend is not configured (set COPILOT_SHARED_SECRET in backend/.env).' });
    }
    try {
      const upstream = await fetch(`${base}${upstreamPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Copilot-Secret': secret },
        body: JSON.stringify(req.body),
        signal: AbortSignal.timeout(60000),
      });
      res.status(upstream.status).type('application/json').send(await upstream.text());
    } catch {
      res.status(502).json({ error: 'EM Copilot backend is unavailable. Please try again.' });
    }
  });
}
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/encounters', authenticate, encounterRoutes);
app.use('/api/documents', authenticate, documentRoutes);

app.listen(PORT, () => {
  console.log(`Auth dev server running on http://localhost:${PORT}`);
  if (process.env.GOOGLE_CLIENT_ID) {
    console.log('Google sign-in enabled');
  } else {
    console.log('Add GOOGLE_CLIENT_ID to backend/.env for Google sign-in');
  }
});
