import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { matchCodesFromText } from '../services/ohipCodeMatcher';
import { isFileEncountersEnabled } from '../services/fileEncounterService';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function extractText(file: Express.Multer.File): Promise<string> {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    const data = await pdfParse(file.buffer);
    return data.text || '';
  }
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    || file.originalname.toLowerCase().endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || '';
  }
  return file.buffer.toString('utf-8');
}

// POST /api/documents/analyze — extract text and suggest OHIP codes
router.post(
  '/analyze',
  upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!isFileEncountersEnabled()) {
      return res.status(503).json({ error: 'Document analysis unavailable' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const text = await extractText(file);
      if (!text.trim()) {
        return res.status(422).json({ error: 'Could not extract text from this document' });
      }

      const matches = matchCodesFromText(text, 15);
      const codes = matches.map((m) => ({
        code: m.code,
        description: m.description,
        amount: m.amount,
        howToUse: m.how_to_use,
        timeOfDay: m.timeOfDay,
        score: m.score,
      }));

      return res.json({
        success: true,
        fileName: file.originalname,
        extractedPreview: text.slice(0, 500),
        codes,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to analyze document' });
    }
  })
);

export default router;
