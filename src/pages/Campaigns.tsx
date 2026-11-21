import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox, Modal, Field } from '../components/ui';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT } from '../constants';

export default function Campaigns() {
  const { myDepts, notify } = useApp(); const qc = useQueryClient(); const q = useQuery({ queryKey: ['campaigns'], queryFn: () => api<any>('/campaigns') }); const [open, setOpen] = useState(false); const [f, setF] = useState<any>({ name: '', department: myDepts[0], category: '', location: '', description: '' });
  const create = useMutation({ mutationFn: () => api('/campaigns', { method: 'POST', body: { ...f, status: 'Active' } }), onSuccess: () => { setOpen(false); notify('Campaign created'); qc.invalidateQueries({ queryKey: ['campaigns'] }); }, onError: (e: any) => notify(e.issues?.[0]?.message || e.message) });
  const setStatus = useMutation({ mutationFn: (v: any) => api(`/campaigns/${v.id}`, { method: 'PATCH', body: { status: v.status } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }), onError: (e: any) => notify(e.message) });
  return <>
    <PageHeader title="Campaigns" desc="Organise your prospecting and outreach activities." action={<button className="btn btn-primary" onClick={() => setOpen(true)}>Create campaign</button>} />
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch} /> : !q.data.items.length ? <Empty title="No campaigns yet" desc="Group leads into a campaign to track their results together." action={<button className="btn btn-primary" onClick={() => setOpen(true)}>Create campaign</button>} /> :
      <div className="grid md:grid-cols-2 gap-3">{q.data.items.map((c: any) => <div key={c._id} className="card p-4 space-y-2"><div className="flex justify-between gap-2"><div><div className="font-medium">{c.name}</div><div className="text-xs text-muted">{(DEPT as any)[c.department].name}{c.category ? ` · ${c.category}` : ''}{c.location ? ` · ${c.location}` : ''}</div></div>
        <select className="input !w-auto !min-h-[32px] !py-1 text-xs" value={c.status} aria-label="Status" onChange={(e) => setStatus.mutate({ id: c._id, status: e.target.value })}>{['Draft', 'Active', 'Paused', 'Completed', 'Archived'].map((s) => <option key={s}>{s}</option>)}</select></div>
        <div className="grid grid-cols-4 text-center text-sm"><div><b>{c.stats.total}</b><div className="text-xs text-muted">Leads</div></div><div><b>{c.stats.contacted}</b><div className="text-xs text-muted">Contacted</div></div><div><b>{c.stats.responded}</b><div className="text-xs text-muted">Replies</div></div><div><b>{c.stats.converted}</b><div className="text-xs text-muted">Converted</div></div></div></div>)}</div>}
    {open && <Modal title="Create campaign" onClose={() => setOpen(false)}><div className="space-y-3"><Field label="Name"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Workspace"><select className="input" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })}>{myDepts.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select></Field>
      <Field label="Target category"><input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field><Field label="Target location"><input className="input" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field><Field label="Description"><textarea className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      <div className="flex justify-end gap-2"><button className="btn" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={f.name.trim().length < 2 || create.isPending} onClick={() => create.mutate()}>Create</button></div></div></Modal>}
  </>;
}
