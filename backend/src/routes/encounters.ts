import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import {
  listEncounters,
  getBillingSummary,
  groupByPatient,
  createEncounterWithPatient,
  appendCodesToEncounter,
  createPatient,
  isFileEncountersEnabled,
} from '../services/fileEncounterService';
import { matchCodesFromText } from '../services/ohipCodeMatcher';

const router = express.Router();

// POST /api/encounters/suggest-codes — OHIP suggestions from chief complaint
router.post('/suggest-codes', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { text, timeSlot } = req.body;
  if (!text?.trim()) {
    return res.json({ success: true, codes: [] });
  }
  const matches = matchCodesFromText(text, 8, timeSlot);
  return res.json({
    success: true,
    codes: matches.map((m) => ({
      code: m.code,
      description: m.description,
      amount: m.amount,
      howToUse: m.how_to_use,
      timeOfDay: m.timeOfDay,
      score: m.score,
    })),
  });
}));

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const providerId = req.user!.id;
  if (isFileEncountersEnabled()) {
    const data = listEncounters(providerId);
    return res.json({ success: true, ...data });
  }
  res.json({ success: true, encounters: [], patients: [] });
}));

router.get('/summary', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const providerId = req.user!.id;
  if (isFileEncountersEnabled()) {
    return res.json({ success: true, summary: getBillingSummary(providerId) });
  }
  res.json({ success: true, summary: { codes: [], totalVisits: 0, totalBilled: 0, uniquePatients: 0 } });
}));

router.get('/by-patient', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const providerId = req.user!.id;
  if (isFileEncountersEnabled()) {
    return res.json({ success: true, groups: groupByPatient(providerId) });
  }
  res.json({ success: true, groups: [] });
}));

// POST /api/encounters/patients
router.post('/patients', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const providerId = req.user!.id;
  const { name, healthNumber } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Patient name is required' });
  if (!isFileEncountersEnabled()) return res.status(503).json({ error: 'Unavailable' });
  const patient = createPatient(providerId, name.trim(), healthNumber);
  return res.status(201).json({ success: true, patient });
}));

// POST /api/encounters — new visit (optionally new patient)
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const providerId = req.user!.id;
  const { patientId, patientName, healthNumber, date, type, location, chiefComplaint, billingCodes, status } = req.body;

  if (!date) return res.status(400).json({ error: 'date is required' });
  if (!patientId && !patientName) return res.status(400).json({ error: 'patientId or patientName is required' });

  if (isFileEncountersEnabled()) {
    try {
      const encounter = createEncounterWithPatient(providerId, {
        patientId,
        patientName,
        healthNumber,
        date,
        type: type || 'Emergency',
        location: location || 'Toronto General ER',
        chiefComplaint,
        billingCodes: billingCodes || [],
        status,
      });
      return res.status(201).json({ success: true, encounter });
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : 'Failed to create encounter' });
    }
  }
  res.status(503).json({ error: 'Encounters storage unavailable' });
}));

// POST /api/encounters/:id/codes — add billing codes to existing visit
router.post('/:id/codes', asyncHandler(async (req: AuthenticatedRequest, res) => {
  const providerId = req.user!.id;
  const { billingCodes } = req.body;
  if (!billingCodes?.length) return res.status(400).json({ error: 'billingCodes required' });

  if (isFileEncountersEnabled()) {
    try {
      const encounter = appendCodesToEncounter(providerId, req.params.id, billingCodes);
      return res.json({ success: true, encounter });
    } catch (e) {
      return res.status(404).json({ error: e instanceof Error ? e.message : 'Not found' });
    }
  }
  res.status(503).json({ error: 'Unavailable' });
}));

export default router;
