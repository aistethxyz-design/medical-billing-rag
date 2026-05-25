import React, { useEffect, useState } from 'react';
import { X, Plus, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchEncountersByPatient,
  createEncounter,
  addCodesToEncounter,
  type BillingLine,
  type PatientGroup,
} from '@/services/encountersApi';

export interface CodeToAdd {
  code: string;
  description: string;
  amount: number;
  timeOfDay?: string;
}

interface AddToEncounterModalProps {
  open: boolean;
  onClose: () => void;
  token: string;
  codes: CodeToAdd[];
  onSaved: () => void;
}

const AddToEncounterModal: React.FC<AddToEncounterModalProps> = ({
  open,
  onClose,
  token,
  codes,
  onSaved,
}) => {
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [patientId, setPatientId] = useState('');
  const [encounterId, setEncounterId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [healthNumber, setHealthNumber] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 16));
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [units, setUnits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !token) return;
    fetchEncountersByPatient(token).then(setGroups).catch(() => {});
    const initUnits: Record<string, number> = {};
    codes.forEach((c) => { initUnits[c.code] = 1; });
    setUnits(initUnits);
  }, [open, token, codes]);

  const selectedPatient = groups.find((g) => g.patient.id === patientId);
  const visits = selectedPatient?.visits ?? [];

  const buildLines = (): BillingLine[] =>
    codes.map((c) => ({
      code: c.code,
      description: c.description,
      amount: c.amount,
      timeOfDay: c.timeOfDay,
      units: units[c.code] ?? 1,
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const billingCodes = buildLines();
      if (mode === 'new') {
        if (!patientName.trim()) {
          toast.error('Patient name is required');
          return;
        }
        await createEncounter(token, {
          patientName: patientName.trim(),
          healthNumber: healthNumber || undefined,
          date: new Date(visitDate).toISOString(),
          chiefComplaint: chiefComplaint || undefined,
          billingCodes,
        });
      } else if (encounterId) {
        await addCodesToEncounter(token, encounterId, billingCodes);
      } else if (patientId) {
        await createEncounter(token, {
          patientId,
          date: new Date(visitDate).toISOString(),
          chiefComplaint: chiefComplaint || undefined,
          billingCodes,
        });
      } else {
        toast.error('Select a patient or session');
        return;
      }
      toast.success('Billing codes saved to encounter');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Add to patient encounter</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`flex-1 py-2 text-sm rounded-lg border ${mode === 'existing' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200'}`}
            >
              Existing patient
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`flex-1 py-2 text-sm rounded-lg border flex items-center justify-center gap-1 ${mode === 'new' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200'}`}
            >
              <UserPlus className="w-4 h-4" /> New patient
            </button>
          </div>

          {mode === 'new' ? (
            <>
              <div>
                <label className="medical-label">Patient name</label>
                <input className="medical-input" value={patientName} onChange={(e) => setPatientName(e.target.value)} />
              </div>
              <div>
                <label className="medical-label">OHIP number (optional)</label>
                <input className="medical-input" value={healthNumber} onChange={(e) => setHealthNumber(e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="medical-label">Patient</label>
                <select className="medical-input" value={patientId} onChange={(e) => { setPatientId(e.target.value); setEncounterId(''); }}>
                  <option value="">Select patient…</option>
                  {groups.map((g) => (
                    <option key={g.patient.id} value={g.patient.id}>{g.patient.name}</option>
                  ))}
                </select>
              </div>
              {patientId && (
                <div>
                  <label className="medical-label">Session / visit</label>
                  <select className="medical-input" value={encounterId} onChange={(e) => setEncounterId(e.target.value)}>
                    <option value="">New visit for this patient</option>
                    {visits.map((v) => (
                      <option key={v.id} value={v.id}>
                        {new Date(v.date).toLocaleDateString('en-CA')} — {v.chiefComplaint || v.type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <div>
            <label className="medical-label">Visit date & time</label>
            <input type="datetime-local" className="medical-input" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </div>
          <div>
            <label className="medical-label">Chief complaint (optional)</label>
            <input className="medical-input" value={chiefComplaint} onChange={(e) => setChiefComplaint(e.target.value)} />
          </div>

          <div>
            <p className="medical-label mb-2">Codes to add</p>
            <div className="space-y-2">
              {codes.map((c) => (
                <div key={c.code} className="flex items-center justify-between gap-3 p-2 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="font-mono font-bold text-blue-700">{c.code}</span>
                    <span className="text-gray-600 ml-2">{c.description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Qty</label>
                    <input
                      type="number"
                      min={1}
                      className="w-14 px-2 py-1 border rounded text-center"
                      value={units[c.code] ?? 1}
                      onChange={(e) => setUnits((u) => ({ ...u, [c.code]: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save to encounter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToEncounterModal;
