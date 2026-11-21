import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox, Stat } from '../components/ui';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT, fmtDay } from '../constants';
export default function Followups() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const [tab, setTab] = useState('today');
    const q = useQuery({ queryKey: ['followups', tab], queryFn: () => api('/followups' + qs({ bucket: tab })) });
    const done = () => { qc.invalidateQueries({ queryKey: ['followups'] }); qc.invalidateQueries({ queryKey: ['leads'] }); };
    const complete = useMutation({ mutationFn: (id) => api(`/followups/${id}/complete`, { method: 'POST' }), onSuccess: (r) => { notify(r.next ? `Done. Next follow-up ${fmtDay(r.next)}.` : 'Follow-up completed'); done(); }, onError: (e) => notify(e.message) });
    const patch = useMutation({ mutationFn: (v) => api(`/followups/${v.id}`, { method: 'PATCH', body: v.body }), onSuccess: () => { notify('Follow-up updated'); done(); }, onError: (e) => notify(e.message) });
    const c = q.data?.counts || {};
    const items = q.data?.items || [];
    return <>
    <PageHeader title="Follow-ups" desc="Stay on top of every prospect and never miss an important conversation."/>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"><Stat label="Due today" value={c.today ?? '-'}/><Stat label="Overdue" value={c.overdue ?? '-'}/><Stat label="Upcoming" value={c.upcoming ?? '-'}/><Stat label="Completed" value={c.completed ?? '-'}/></div>
    <div role="tablist" className="flex gap-1 border-b border-line mb-4 overflow-x-auto">{['today', 'overdue', 'upcoming', 'completed', 'all'].map((t) => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm capitalize whitespace-nowrap border-b-2 ${tab === t ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'}`}>{t}</button>)}</div>
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch}/> : !items.length ? <Empty title="Nothing here" desc="Follow-ups appear after you confirm outreach, or when you schedule one from a lead." action={<Link to="/leads" className="btn btn-primary">Go to leads</Link>}/> :
            <div className="card divide-y divide-line">{items.map((f) => <div key={f._id} className="p-4 flex flex-wrap items-center justify-between gap-3"><div><Link to={`/leads/${f.lead?._id}`} className="font-medium text-primary">{f.lead?.business?.name}</Link><div className="text-xs text-muted">{DEPT[f.department]?.name} &middot; due {fmtDay(f.dueAt)} &middot; {f.status}{f.lead?.followUpsPaused ? ' (reminders paused)' : ''}{f.user?.name ? ` · ${f.user.name}` : ''}</div></div>
        {['Pending', 'Rescheduled'].includes(f.status) && <div className="flex flex-wrap gap-2"><Link className="btn !min-h-[34px]" to={`/leads/${f.lead?._id}`}>Open lead</Link><button className="btn btn-primary !min-h-[34px]" onClick={() => complete.mutate(f._id)}>Mark done</button>
          <input type="date" className="input !w-auto !min-h-[34px]" aria-label="Reschedule" onChange={(e) => e.target.value && patch.mutate({ id: f._id, body: { dueAt: new Date(e.target.value + 'T09:00:00').toISOString() } })}/><button className="btn btn-danger !min-h-[34px]" onClick={() => patch.mutate({ id: f._id, body: { status: 'Cancelled' } })}>Cancel</button></div>}</div>)}</div>}
  </>;
}
