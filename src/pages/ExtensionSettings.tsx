import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Copy, Unplug } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Skeleton } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { fmt } from '../constants';

export default function ExtensionSettings() {
  const { notify } = useApp(); const qc = useQueryClient(); const conns = useQuery({ queryKey: ['ext-conns'], queryFn: () => api<any>('/extension/connections') });
  const [code, setCode] = useState<string | null>(null); const [left, setLeft] = useState(0); const [confirm, setConfirm] = useState<string | null>(null);
  useEffect(() => { if (!left) return; const t = setTimeout(() => { setLeft(left - 1); if (left === 1) setCode(null); }, 1000); return () => clearTimeout(t); }, [left]);
  const pair = useMutation({ mutationFn: () => api<any>('/extension/pair', { method: 'POST' }), onSuccess: (r) => { setCode(r.code); setLeft(r.expiresInSeconds); }, onError: (e: any) => notify(e.message) });
  const revoke = useMutation({ mutationFn: (id: string) => api(`/extension/connections/${id}/revoke`, { method: 'POST' }), onSuccess: () => { setConfirm(null); notify('Extension disconnected'); qc.invalidateQueries({ queryKey: ['ext-conns'] }); }, onError: (e: any) => notify(e.message) });
  const items: any[] = conns.data?.items || [];
  return <>
    <PageHeader title="Chrome extension" desc="Connect LeadPilot Collector to your account and collect businesses from pages you choose." />
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="card p-5 space-y-4"><div className="flex items-center gap-2">{items.length ? <CheckCircle2 className="text-ok" size={20} /> : <Unplug className="text-muted" size={20} />}<h2 className="font-medium">{items.length ? 'Connected' : 'Not connected'}</h2></div>
        {conns.isLoading ? <Skeleton rows={2} /> : items.length ? <ul className="space-y-3">{items.map((c) => <li key={c.id} className="rounded-lg border border-line p-3 text-sm"><div className="flex justify-between gap-2"><div><div className="font-medium">{c.label}{c.user ? ` (${c.user})` : ''}</div><div className="text-xs text-muted">Connected {fmt(c.connectedAt)}. Last used {fmt(c.lastUsedAt)}.</div></div>
          {confirm === c.id ? <div className="flex gap-2"><button className="btn !min-h-[34px]" onClick={() => setConfirm(null)}>Cancel</button><button className="btn btn-danger !min-h-[34px]" onClick={() => revoke.mutate(c.id)}>Disconnect</button></div> : <button className="btn btn-danger !min-h-[34px]" onClick={() => setConfirm(c.id)}>Disconnect</button>}</div></li>)}</ul> : <p className="text-sm text-muted">Generate a pairing code and enter it in the extension popup.</p>}</section>
      <section className="card p-5 space-y-4"><h2 className="font-medium">Pair a new extension</h2>
        <ol className="text-sm space-y-2 list-decimal pl-5"><li>Install LeadPilot Collector (load unpacked in Chrome developer mode).</li><li>Select Generate pairing code.</li><li>Open the extension popup and enter the code before it expires. It works once.</li></ol>
        {code ? <div className="rounded-lg bg-canvas p-4 flex items-center justify-between"><div><div className="text-2xl font-semibold tracking-widest">{code.slice(0, 4)}-{code.slice(4)}</div><div className="text-xs text-muted">Expires in {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</div></div><button className="btn" onClick={() => { navigator.clipboard?.writeText(code); notify('Code copied'); }}><Copy size={16} />Copy</button></div> : <button className="btn btn-primary" onClick={() => pair.mutate()} disabled={pair.isPending}>Generate pairing code</button>}</section></div></>;
}
