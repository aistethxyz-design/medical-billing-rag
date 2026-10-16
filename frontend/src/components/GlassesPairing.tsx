import React, { useCallback, useState } from 'react';
import { Glasses, KeyRound, Copy, Check } from 'lucide-react';
import { getApiBase } from '@/services/runtimeConfig';
import { useAuthStore } from '@/stores/authStore';

/**
 * Connect Even G2 glasses — mints a long-lived, copilot-only glasses key that the
 * user pastes once into the EM Copilot plugin on their phone. The key is shown
 * only here and never stored by the site.
 */
const GlassesPairing: React.FC = () => {
  const { token } = useAuthStore();
  const [glassesKey, setGlassesKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const createKey = useCallback(async () => {
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const resp = await fetch(`${getApiBase()}/api/glasses/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.token) throw new Error(data.error || `Could not create key (${resp.status})`);
      setGlassesKey(data.token);
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  }, [token]);

  const copyKey = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(glassesKey);
      setCopied(true);
    } catch {
      setError('Copy failed — select the key and copy it manually.');
    }
  }, [glassesKey]);

  return (
    <div className="panel p-4">
      <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">
        <Glasses className="w-3.5 h-3.5" />
        Connect your Even G2 glasses
      </p>
      <ol className="text-sm text-gray-600 list-decimal ml-5 space-y-0.5">
        <li>Open this page on your phone and tap <strong>Create glasses key</strong>.</li>
        <li>Tap <strong>Copy</strong>, then open EM Copilot in the Even Realities app.</li>
        <li>Paste the key and tap <strong>Connect</strong>. You only do this once (key lasts 1 year).</li>
      </ol>

      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={createKey} disabled={busy} className="btn btn-primary">
          <KeyRound className="w-4 h-4" />
          {busy ? 'Creating…' : glassesKey ? 'Create a new key' : 'Create glasses key'}
        </button>
        {glassesKey && (
          <button onClick={copyKey} className="btn btn-secondary">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>

      {glassesKey && (
        <textarea
          readOnly
          value={glassesKey}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full mt-3 min-h-[72px] rounded-lg border border-gray-300 p-2 font-mono text-xs break-all"
        />
      )}
      {glassesKey && (
        <p className="text-xs text-gray-500 mt-1">
          Treat this like a password — anyone with it can use your copilot access. It stops working if you are
          removed from the allowlist.
        </p>
      )}
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default GlassesPairing;
