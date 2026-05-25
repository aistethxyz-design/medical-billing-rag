export interface DocumentCodeMatch {
  code: string;
  description: string;
  amount: number;
  howToUse: string;
  timeOfDay?: string;
  score: number;
}

import { getApiBase } from '@/services/runtimeConfig';

export async function analyzeDocument(token: string, file: File): Promise<{
  fileName: string;
  extractedPreview: string;
  codes: DocumentCodeMatch[];
}> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${getApiBase()}/api/documents/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Document analysis failed');
  }

  const data = await res.json();
  return { fileName: data.fileName, extractedPreview: data.extractedPreview, codes: data.codes };
}
