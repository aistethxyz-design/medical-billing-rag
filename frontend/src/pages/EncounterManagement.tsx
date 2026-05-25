import React, { useEffect, useState } from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Download,
  Hash,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import {
  fetchEncountersByPatient,
  fetchBillingSummary,
  exportSummaryCsv,
  type PatientGroup,
  type BillingSummary,
} from '@/services/encountersApi';
import AddEncounterModal from '@/components/AddEncounterModal';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });

const statusStyle: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  coded: 'bg-blue-100 text-blue-800',
  submitted: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
};

const EncounterManagement: React.FC = () => {
  const { token, user } = useAuthStore();
  const [groups, setGroups] = useState<PatientGroup[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [addForPatientId, setAddForPatientId] = useState<string | undefined>();

  const openAddEncounter = (patientId?: string) => {
    setAddForPatientId(patientId);
    setShowAdd(true);
  };

  const load = () => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchEncountersByPatient(token), fetchBillingSummary(token)])
      .then(([g, s]) => {
        setGroups(g);
        setSummary(s);
        setExpanded(new Set(g.map((x) => x.patient.id)));
      })
      .catch(() => toast.error('Could not load encounters'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [token]);

  const togglePatient = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    if (!summary) return;
    const csv = exportSummaryCsv(summary, groups);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ohip-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Billing summary exported');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            Encounters & Billing
          </h1>
          <p className="text-gray-600 mt-1">
            Your visits and OHIP billing{user?.email ? ` · ${user.email}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openAddEncounter()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add encounter
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export billing list
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total visits</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalVisits}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-500">Patients</p>
                <p className="text-2xl font-bold text-gray-900">{summary.uniquePatients}</p>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total billed</p>
                <p className="text-2xl font-bold text-gray-900">{fmt(summary.totalBilled)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Visits by patient */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Visits by patient</h2>
          {groups.length === 0 ? (
            <div className="panel p-8 text-center text-gray-500">
              <p>No encounters yet for this account.</p>
              <p className="text-sm mt-2">Visits and billing codes you add will appear here only for {user?.email ?? 'your login'}.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.patient.id} className="panel overflow-hidden">
                <div className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => togglePatient(group.patient.id)}
                    className="flex-1 flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {expanded.has(group.patient.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900">{group.patient.name}</p>
                        {group.patient.healthNumber && (
                          <p className="text-xs text-gray-500">OHIP {group.patient.healthNumber}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm text-gray-500">{group.visits.length} visit{group.visits.length !== 1 ? 's' : ''}</p>
                      <p className="font-semibold text-green-700">{fmt(group.patientTotal)}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddEncounter(group.patient.id)}
                    className="px-4 border-l border-gray-100 text-blue-600 hover:bg-blue-50 text-sm font-medium whitespace-nowrap flex items-center gap-1"
                    title={`Add visit for ${group.patient.name}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add visit
                  </button>
                </div>

                {expanded.has(group.patient.id) && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {group.visits.map((visit) => (
                      <div key={visit.id} className="p-4 pl-12 bg-gray-50/50">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {fmtDate(visit.date)} · {fmtTime(visit.date)}
                            </p>
                            <p className="text-sm text-gray-600">{visit.type} · {visit.location}</p>
                            {visit.chiefComplaint && (
                              <p className="text-sm text-gray-500 mt-1">{visit.chiefComplaint}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusStyle[visit.status]}`}>
                              {visit.status}
                            </span>
                            <p className="font-semibold text-gray-900 mt-1">{fmt(visit.visitTotal)}</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                                <th className="pb-2 pr-4">Code</th>
                                <th className="pb-2 pr-4">Description</th>
                                <th className="pb-2 pr-4">Time slot</th>
                                <th className="pb-2 pr-4">Qty</th>
                                <th className="pb-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {visit.billingCodes.map((line) => (
                                <tr key={`${visit.id}-${line.code}-${line.description}`}>
                                  <td className="py-2 pr-4 font-mono font-semibold text-blue-700">{line.code}</td>
                                  <td className="py-2 pr-4 text-gray-700">{line.description}</td>
                                  <td className="py-2 pr-4 text-gray-500">{line.timeOfDay ?? '—'}</td>
                                  <td className="py-2 pr-4 text-center">{line.units ?? 1}</td>
                                  <td className="py-2 text-right font-medium">{fmt(line.amount * (line.units ?? 1))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Code summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Codes used
          </h2>
          <div className="panel p-4">
            <p className="text-xs text-gray-500 mb-4">
              Roll-up of every OHIP code billed across all visits — ready for your batch claim.
            </p>
            {!summary?.codes.length ? (
              <p className="text-sm text-gray-500">No codes billed yet.</p>
            ) : (
              <div className="space-y-2">
                {summary.codes.map((row) => (
                  <div
                    key={row.code}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">{row.code}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border">
                          <Hash className="w-3 h-3" />×{row.count}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{row.description}</p>
                    </div>
                    <p className="font-semibold text-gray-900 whitespace-nowrap">{fmt(row.totalAmount)}</p>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 font-semibold">
                  <span className="text-gray-700">Grand total</span>
                  <span className="text-green-700 text-lg">{fmt(summary.totalBilled)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {token && (
        <AddEncounterModal
          open={showAdd}
          onClose={() => {
            setShowAdd(false);
            setAddForPatientId(undefined);
          }}
          token={token}
          onSaved={load}
          preselectedPatientId={addForPatientId}
        />
      )}
    </div>
  );
};

export default EncounterManagement;
