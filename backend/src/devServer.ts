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
import { authenticate } from './middleware/auth';

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
