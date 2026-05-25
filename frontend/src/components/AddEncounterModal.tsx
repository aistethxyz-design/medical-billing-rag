import React, { useEffect, useState, useCallback, useRef } from 'react';
import { X, Plus, Trash2, Sparkles, Loader2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createEncounter,
  fetchPatients,
  suggestCodesFromComplaint,
  type BillingLine,
  type PatientRecord,
} from '@/services/encountersApi';

interface AddEncounterModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  onSaved: () => void;
  preselectedPatientId?: string;
}

interface CodeSuggestion {
  code: string;
  description: string;
  amount: number;
  timeOfDay?: string;
  howToUse?: string;
}

const emptyLine = (): BillingLine => ({ code: '', description: '', amount: 0, units: 1 });

function timeSlotFromVisitDate(isoLocal: string): string {
  const d = new Date(isoLocal);
  const day = d.getDay();
  const h = d.getHours();
  if (day === 0 || day === 6) return 'Weekend';
  if (h >= 0 && h < 8) return 'Night';
  if (h >= 8 && h < 17) return 'Day';
  return 'Evening';
}

function suggestionsToLines(codes: CodeSuggestion[]): BillingLine[] {
  if (!codes.length) return [emptyLine()];
  return codes.map((s) => ({
    code: s.code,
    description: s.description,
    amount: s.amount,
    timeOfDay: s.timeOfDay,
    units: 1,
  }));
}

const AddEncounterModal: React.FC<AddEncounterModalProps> = ({ open, onClose, token, onSaved, preselectedPatientId }) => {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [healthNumber, setHealthNumber] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 16));
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [lines, setLines] = useState<BillingLine[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<CodeSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(false);
  const billingTouchedRef = useRef(false);
  const lastAutoComplaintRef = useRef('');

  const fetchSuggestions = useCallback(async (text: string, visitIso: string) => {
    if (!token || text.trim().length < 3) {
      setSuggestions([]);
      setSuggestError(false);
      return;
    }
    setSuggestLoading(true);
    setSuggestError(false);
    try {
      const codes = await suggestCodesFromComplaint(token, text, timeSlotFromVisitDate(visitIso));
      setSuggestions(codes);
      const canAutoFill =
        !billingTouchedRef.current &&
        (lastAutoComplaintRef.current === '' || lastAutoComplaintRef.current === text.trim());
      if (canAutoFill && codes.length > 0) {
        setLines(suggestionsToLines(codes.slice(0, 4)));
        lastAutoComplaintRef.current = text.trim();
      }
    } catch {
      setSuggestions([]);
      setSuggestError(true);
    } finally {
      setSuggestLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => fetchSuggestions(chiefComplaint, visitDate), 450);
    return () => clearTimeout(timer);
  }, [chiefComplaint, visitDate, open, fetchSuggestions]);

  useEffect(() => {
    if (!open) {
      billingTouchedRef.current = false;
      lastAutoComplaintRef.current = '';
      setSuggestError(false);
      return;
    }

    setPatientsLoading(true);
    fetchPatients(token)
      .then((list) => {
        setPatients(list);
        if (preselectedPatientId && list.some((p) => p.id === preselectedPatientId)) {
          setMode('existing');
          setPatientId(preselectedPatientId);
        } else if (list.length > 0) {
          setMode('existing');
          setPatientId('');
        } else {
          setMode('new');
          setPatientId('');
        }
      })
      .catch(() => setPatients([]))
      .finally(() => setPatientsLoading(false));
  }, [open, token, preselectedPatientId]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const updateLine = (i: number, field: keyof BillingLine, value: string | number) => {
    billingTouchedRef.current = true;
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };

  const addSuggestion = (s: CodeSuggestion) => {
    billingTouchedRef.current = true;
    setLines((prev) => {
      const emptyIdx = prev.findIndex((l) => !l.code.trim());
      const line: BillingLine = {
        code: s.code,
        description: s.description,
        amount: s.amount,
        timeOfDay: s.timeOfDay,
        units: 1,
      };
      if (emptyIdx >= 0) {
        return prev.map((l, i) => (i === emptyIdx ? line : l));
      }
      return [...prev, line];
    });
    toast.success(`Added ${s.code}`);
  };

  const addAllSuggestions = () => {
    if (!suggestions.length) return;
    billingTouchedRef.current = true;
    setLines(suggestionsToLines(suggestions));
    toast.success(`Added ${suggestions.length} suggested codes`);
  };

  const resetForm = () => {
    setPatientId('');
    setPatientName('');
    setHealthNumber('');
    setChiefComplaint('');
    setVisitDate(new Date().toISOString().slice(0, 16));
    setLines([emptyLine()]);
    setSuggestions([]);
    billingTouchedRef.current = false;
    lastAutoComplaintRef.current = '';
    setSuggestError(false);
  };

  const handleSave = async () => {
    if (mode === 'existing') {
      if (!patientId) {
        toast.error('Select a patient');
        return;
      }
    } else if (!patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    const billingCodes = lines.filter((l) => l.code.trim());
    if (!billingCodes.length) {
      toast.error('Add at least one billing code');
      return;
    }
    setSaving(true);
    try {
      await createEncounter(token, {
        ...(mode === 'existing'
          ? { patientId }
          : { patientName: patientName.trim(), healthNumber: healthNumber || undefined }),
        date: new Date(visitDate).toISOString(),
        chiefComplaint: chiefComplaint || undefined,
        billingCodes: billingCodes.map((l) => ({
          ...l,
          code: l.code.toUpperCase(),
          amount: Number(l.amount) || 0,
          units: l.units ?? 1,
        })),
      });
      toast.success('Encounter added');
      onSaved();
      onClose();
      resetForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Add encounter</h3>
          <button type="button" onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('existing')}
              disabled={patients.length === 0 && !patientsLoading}
              className={`flex-1 py-2 text-sm rounded-lg border ${
                mode === 'existing' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Existing patient
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-2 text-sm rounded-lg border flex items-center justify-center gap-1 ${
                mode === 'new' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4" /> New patient
            </button>
          </div>

          {mode === 'existing' ? (
            <div className="space-y-3">
              <div>
                <label className="medical-label">Patient</label>
                <select
                  className="medical-input"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  disabled={patientsLoading}
                >
                  <option value="">
                    {patientsLoading ? 'Loading patients…' : 'Select patient…'}
                  </option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.healthNumber ? ` · ${p.healthNumber}` : ''}
                    </option>
                  ))}
                </select>
                {!patientsLoading && patients.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">No patients yet — use New patient to create one.</p>
                )}
              </div>
              {selectedPatient && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  Adding a new visit for <span className="font-medium text-gray-900">{selectedPatient.name}</span>
                  {selectedPatient.healthNumber && (
                    <span className="ml-1">· OHIP {selectedPatient.healthNumber}</span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="medical-label">Patient name</label>
                <input className="medical-input" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="medical-label">OHIP # (optional)</label>
                <input className="medical-input" value={healthNumber} onChange={(e) => setHealthNumber(e.target.value)} />
              </div>
            </div>
          )}
          <div>
            <label className="medical-label">Visit date & time</label>
            <input type="datetime-local" className="medical-input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label className="medical-label">Chief complaint</label>
            <input
              className="medical-input"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="e.g. Chest pain, laceration, abdominal pain…"
            />
            {chiefComplaint.trim().length >= 3 && (suggestLoading || suggestions.length > 0 || suggestError) && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-800 flex items-center gap-1">
                    {suggestLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Finding codes…</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Suggested OHIP codes</>
                    )}
                  </span>
                  {!suggestLoading && suggestions.length > 0 && (
                    <button type="button" onClick={addAllSuggestions} className="text-xs text-blue-600 hover:underline font-medium">
                      Add all
                    </button>
                  )}
                </div>
                {suggestError && (
                  <p className="text-xs text-amber-700">Could not load suggestions — check that the backend is running.</p>
                )}
                {!suggestLoading && !suggestError && suggestions.length === 0 && (
                  <p className="text-xs text-blue-700">No matches — try more detail (e.g. &quot;chest pain with ECG&quot;)</p>
                )}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => addSuggestion(s)}
                      className="w-full text-left flex items-center justify-between gap-2 p-2 rounded-md bg-white border border-blue-100 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-sm"
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-blue-700">{s.code}</span>
                        <span className="text-gray-700 ml-2 truncate">{s.description}</span>
                        {s.timeOfDay && (
                          <span className="ml-1 text-xs text-gray-400">· {s.timeOfDay}</span>
                        )}
                      </div>
                      <span className="text-green-700 font-medium whitespace-nowrap text-xs">{fmt(s.amount)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="medical-label mb-0">Billing codes</label>
              <button type="button" onClick={() => { billingTouchedRef.current = true; setLines((p) => [...p, emptyLine()]); }} className="text-xs text-blue-600 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add code
              </button>
            </div>
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <input placeholder="Code" className="col-span-2 medical-input font-mono text-sm" value={line.code} onChange={(e) => updateLine(i, 'code', e.target.value)} />
                <input placeholder="Description" className="col-span-4 medical-input text-sm" value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} />
                <input placeholder="$" type="number" step="0.01" className="col-span-2 medical-input text-sm" value={line.amount || ''} onChange={(e) => updateLine(i, 'amount', parseFloat(e.target.value) || 0)} />
                <input placeholder="Qty" type="number" min={1} className="col-span-2 medical-input text-sm" value={line.units ?? 1} onChange={(e) => updateLine(i, 'units', parseInt(e.target.value, 10) || 1)} />
                <button type="button" onClick={() => { billingTouchedRef.current = true; setLines((p) => p.filter((_, j) => j !== i)); }} className="col-span-1 p-2 text-red-500" disabled={lines.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg hover:bg-gray-100">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save encounter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEncounterModal;
