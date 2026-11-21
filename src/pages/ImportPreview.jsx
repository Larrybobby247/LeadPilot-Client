import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox } from '../components/ui';
import { SourceBadge, VerifyBadge } from '../components/Badges';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DEPT } from '../constants';
const KIND = { new: { label: 'New', cls: 'bg-[#E6F5EF] text-ok' }, associate: { label: 'Exists in another workspace', cls: 'bg-blue-50 text-blue-700' }, duplicate: { label: 'Duplicate', cls: 'bg-[#FBE9EB] text-danger' }, potential: { label: 'Possible duplicate', cls: 'bg-[#FDF3E2] text-[#9A6410]' }, taken: { label: 'Held by a teammate', cls: 'bg-slate-100 text-slate-600' }, rejected: { label: 'Rejected', cls: 'bg-slate-100 text-slate-600' } };
export default function ImportPreview() {
    const { draft, setDraft, setResult, role, notify } = useApp();
    const nav = useNavigate();
    const [sel, setSel] = useState(new Set());
    const [actions, setActions] = useState({});
    const [edit, setEdit] = useState(null);
    const [init, setInit] = useState(false);
    const recs = draft?.records || [];
    const pv = useQuery({ queryKey: ['preview', draft?.dept, JSON.stringify(recs)], enabled: !!draft && recs.length > 0, queryFn: async () => { const r = await api('/leads/preview', { method: 'POST', body: { department: draft.dept, records: recs.map(({ action, ...x }) => x) } }); return r.items; } });
    if (!draft)
        return <Navigate to="/discover" replace/>;
    const items = pv.data || [];
    if (pv.data && !init) {
        setSel(new Set(items.map((it, i) => (it.kind === 'new' || it.kind === 'associate') && recs[i].verification !== 'requires_review' ? i : -1).filter((i) => i >= 0)));
        setInit(true);
    }
    const upd = (i, patch) => { const next = [...recs]; next[i] = { ...next[i], ...patch, verification: 'unverified', notes: [] }; setDraft({ ...draft, records: next }); setInit(false); };
    const remove = (i) => { setDraft({ ...draft, records: recs.filter((_, j) => j !== i) }); setSel(new Set()); setInit(false); setActions({}); };
    const run = useMutation({ mutationFn: () => api('/leads/bulk-import', { method: 'POST', body: { department: draft.dept, source: draft.source, method: draft.method, query: draft.query, records: [...sel].map((i) => ({ ...recs[i], action: actions[i] })) } }),
        onSuccess: (r) => { setResult({ ...r, dept: draft.dept }); setDraft(null); notify('Import finished'); nav('/discover/results'); }, onError: (e) => notify(e.message) });
    const counts = { new: items.filter((x) => x.kind === 'new' || x.kind === 'associate').length, dup: items.filter((x) => x.kind === 'duplicate' || x.kind === 'taken').length, pot: items.filter((x) => x.kind === 'potential').length };
    return <>
    <PageHeader title="Review before importing" desc={`Going into ${DEPT[draft.dept].name}. The server checks every record against all workspaces.`} action={<div className="flex gap-2"><button className="btn" onClick={() => setSel(new Set(items.map((_, i) => i)))}>Select all</button><button className="btn" onClick={() => setSel(new Set())}>Deselect all</button></div>}/>
    {!recs.length ? <Empty title="No records to review" desc="Everything was removed. Go back to discovery to collect more." action={<Link className="btn btn-primary" to="/discover">Back to discovery</Link>}/> : pv.isLoading ? <Skeleton rows={5}/> : pv.error ? <ErrorBox error={pv.error} retry={pv.refetch}/> : <>
      <div className="grid grid-cols-3 gap-3 mb-4"><div className="card p-3"><div className="text-xl font-semibold text-ok">{counts.new}</div><div className="text-xs text-muted">New leads</div></div><div className="card p-3"><div className="text-xl font-semibold text-danger">{counts.dup}</div><div className="text-xs text-muted">Existing duplicates</div></div><div className="card p-3"><div className="text-xl font-semibold text-[#9A6410]">{counts.pot}</div><div className="text-xs text-muted">Need review</div></div></div>
      <div className="space-y-2">{recs.map((r, i) => {
                const it = items[i];
                if (!it)
                    return null;
                const k = KIND[it.kind];
                const canImport = ['new', 'associate'].includes(it.kind) || !!actions[i];
                return <div key={i} className="card p-4"><div className="flex gap-3 items-start"><input type="checkbox" className="mt-1.5 w-4 h-4" disabled={!canImport} checked={sel.has(i) && canImport} onChange={() => { const s = new Set(sel); s.has(i) ? s.delete(i) : s.add(i); setSel(s); }} aria-label={`Select ${r.name}`}/>
          <div className="flex-1 min-w-0">{edit === i ? <div className="grid sm:grid-cols-2 gap-2">{['name', 'phone', 'email', 'website'].map((f) => <div key={f}><label className="label">{f[0].toUpperCase() + f.slice(1)}</label><input className="input" defaultValue={r[f] || ''} onBlur={(e) => upd(i, { [f]: e.target.value.trim() || undefined })}/></div>)}<div className="sm:col-span-2"><button className="btn btn-primary" onClick={() => setEdit(null)}>Done</button></div></div> : <>
            <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{r.name || <span className="text-danger">Missing name</span>}</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${k.cls}`}>{k.label}</span></div>
            <div className="text-sm text-muted break-words">{r.phone || 'No phone'} &middot; {r.website || r.social || 'No website or profile'}{r.email ? ` · ${r.email}` : ''}</div>
            {it.reason && <div className="text-xs text-danger mt-1">{it.reason}</div>}{it.kind === 'taken' && <div className="text-xs text-muted mt-1">A teammate already has this business, so it is filtered out of your import.</div>}{it.matchedOn && <div className="text-xs text-[#9A6410] mt-1">Matches {it.existing?.name || 'an existing record'} on {it.matchedOn}. {it.existing?.leadId && <Link className="underline" to={`/leads/${it.existing.leadId}`} target="_blank">Inspect</Link>}</div>}
            {r.notes?.map((n) => <div key={n} className="text-xs text-[#9A6410] mt-1">{n}</div>)}
            <div className="flex flex-wrap items-center gap-2 mt-2"><SourceBadge source={draft.source}/><VerifyBadge v={r.verification || 'unverified'}/>
              {['duplicate', 'potential'].includes(it.kind) && <select className="input !w-auto !min-h-[32px] !py-1 text-xs" value={actions[i] || ''} aria-label="Duplicate action" onChange={(e) => { setActions({ ...actions, [i]: e.target.value }); const s = new Set(sel); e.target.value ? s.add(i) : s.delete(i); setSel(s); }}><option value="">Skip (default)</option>{it.existing?.leadId && <option value="update">Update existing lead with this info</option>}{it.kind === 'potential' && !it.existing?.leadId && <option value="associate">Add to this workspace (same business)</option>}{role === 'owner' && <option value={it.kind === 'duplicate' ? 'override' : 'import_new'}>Different business: import anyway (owner)</option>}</select>}</div></>}</div>
          <div className="flex flex-col gap-1 text-sm"><button className="text-primary font-medium" onClick={() => setEdit(i)}>Edit</button><button className="text-danger font-medium" onClick={() => remove(i)}>Remove</button></div></div></div>;
            })}</div>
      <div className="sticky bottom-0 bg-canvas/95 py-4 flex items-center justify-between gap-3"><span className="text-sm text-muted">{sel.size} of {recs.length} selected. Edited records are marked unverified.</span><button className="btn btn-primary" disabled={!sel.size || run.isPending} onClick={() => run.mutate()}>{run.isPending ? 'Importing...' : `Import ${sel.size} selected`}</button></div></>}
  </>;
}
