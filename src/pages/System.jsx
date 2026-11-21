import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox, Field } from '../components/ui';
import { ScheduleEditor } from './Team';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT, fmt } from '../constants';
export function Notifications() {
    const qc = useQueryClient();
    const nav = useNavigate();
    const q = useQuery({ queryKey: ['notifications'], queryFn: () => api('/notifications') });
    const read = useMutation({ mutationFn: (ids) => api('/notifications/read', { method: 'POST', body: { ids } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
    return <><PageHeader title="Notifications" action={<button className="btn" disabled={!q.data?.unread} onClick={() => read.mutate(undefined)}>Mark all as read</button>}/>
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch}/> : !q.data.items.length ? <Empty title="You are all caught up" desc="Follow-up reminders, assignments and import results show up here."/> :
            <div className="card divide-y divide-line">{q.data.items.map((n) => <button key={n._id} className="w-full text-left p-4 flex gap-3 hover:bg-canvas" onClick={() => { read.mutate([n._id]); if (n.link)
                nav(n.link); }}><span className={`mt-1.5 w-2 h-2 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`}/><div><div className="text-sm font-medium">{n.title}</div>{n.body && <div className="text-sm text-muted">{n.body}</div>}<div className="text-xs text-muted">{fmt(n.createdAt)}</div></div></button>)}</div>}</>;
}
export function Activity() {
    const { role } = useApp();
    const [action, setAction] = useState('');
    const q = useQuery({ queryKey: ['activity', action], queryFn: () => api('/activity' + qs({ action })) });
    return <><PageHeader title="Activity" desc={role === 'owner' ? 'Read-only log of everything your team does.' : 'Your own activity history.'} action={<input className="input !w-auto" placeholder="Filter by action, e.g. lead.imported" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action"/>}/>
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch}/> : !q.data.items.length ? <Empty title="No activity" desc="Actions appear here as they happen."/> : <div className="card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line">{['When', 'User', 'Action', 'Workspace', 'Details'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
      <tbody>{q.data.items.map((a) => <tr key={a._id} className="border-b border-line last:border-0"><td className="td whitespace-nowrap">{fmt(a.at)}</td><td className="td">{a.user?.name}</td><td className="td">{a.action}</td><td className="td">{DEPT[a.department]?.name || '-'}</td><td className="td text-xs text-muted max-w-[280px] truncate">{a.metadata ? JSON.stringify(a.metadata) : ''}</td></tr>)}</tbody></table></div>}</>;
}
export function Integrations() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['integrations'], queryFn: () => api('/integrations') });
    const [key, setKey] = useState('');
    const [limit, setLimit] = useState('');
    const save = useMutation({ mutationFn: () => api('/integrations/google_places', { method: 'PUT', body: { ...(key && { secret: key }), ...(limit && { monthlyLimit: +limit }) } }), onSuccess: () => { setKey(''); notify('Saved. Test the connection before enabling.'); qc.invalidateQueries({ queryKey: ['integrations'] }); }, onError: (e) => notify(e.issues?.[0]?.message || e.message) });
    const test = useMutation({ mutationFn: () => api('/integrations/google_places/test', { method: 'POST' }), onSuccess: (r) => { notify(r.message); qc.invalidateQueries({ queryKey: ['integrations'] }); }, onError: (e) => notify(e.message) });
    const toggle = useMutation({ mutationFn: (enabled) => api('/integrations/google_places', { method: 'PUT', body: { enabled } }), onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }), onError: (e) => notify(e.message) });
    return <><PageHeader title="Integrations" desc="Nothing shows as connected until it has been verified."/>
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch}/> : <div className="grid md:grid-cols-2 gap-3">{q.data.items.map((i) => <div key={i.key} className="card p-4 space-y-2"><div className="flex justify-between"><div className="font-medium">{i.name}</div><span className="text-xs rounded-full bg-canvas px-2 py-0.5">{i.state}</span></div><p className="text-xs text-muted">{i.costNote}</p>
      {i.lastError && <p className="text-xs text-danger">Last error: {i.lastError}</p>}<p className="text-xs text-muted">Usage this month: {i.usage.units} requests{i.monthlyLimit ? `, limit ${i.monthlyLimit}, ${i.usage.remaining} left` : ''}</p>
      {i.key === 'google_places' && <div className="space-y-2"><input className="input" type="password" autoComplete="off" placeholder={i.hasSecret ? 'API key saved (hidden). Paste a new one to replace.' : 'Google Maps Platform API key'} value={key} onChange={(e) => setKey(e.target.value)}/><input className="input" type="number" placeholder="Monthly request limit" value={limit} onChange={(e) => setLimit(e.target.value)}/>
        <div className="flex flex-wrap gap-2"><button className="btn" onClick={() => save.mutate()} disabled={!key && !limit}>Save</button><button className="btn" onClick={() => test.mutate()} disabled={!i.hasSecret || test.isPending}>Test connection</button><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={i.enabled} onChange={(e) => toggle.mutate(e.target.checked)}/>Enabled</label></div></div>}</div>)}</div>}</>;
}
function Security() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const [f, setF] = useState({ current: '', password: '' });
    const s = useQuery({ queryKey: ['sessions'], queryFn: () => api('/auth/sessions') });
    const pw = useMutation({ mutationFn: () => api('/auth/change-password', { method: 'POST', body: f }), onSuccess: () => notify('Password changed. Please sign in again.'), onError: (e) => notify(e.issues?.[0]?.message || e.message) });
    const end = useMutation({ mutationFn: (id) => api(`/auth/sessions/${id}`, { method: 'DELETE' }), onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }) });
    return <section className="card p-5 space-y-3"><h2 className="font-medium">Password and sessions</h2><div className="grid sm:grid-cols-2 gap-3"><Field label="Current password"><input className="input" type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })}/></Field><Field label="New password"><input className="input" type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })}/></Field></div>
    <button className="btn" disabled={!f.current || !f.password} onClick={() => pw.mutate()}>Change password</button>
    {s.data?.items?.length > 0 && <ul className="text-sm divide-y divide-line">{s.data.items.map((x) => <li key={x.id} className="py-2 flex justify-between gap-2"><span className="truncate">{x.userAgent || 'Unknown device'} - {fmt(x.createdAt)}</span><button className="text-danger" onClick={() => end.mutate(x.id)}>Sign out</button></li>)}</ul>}</section>;
}
function MyGoals() {
    const { user, notify } = useApp();
    const qc = useQueryClient();
    const g = useQuery({ queryKey: ['my-goals'], queryFn: () => api('/goals/me') });
    const [s, setS] = useState(null);
    const save = useMutation({ mutationFn: () => api('/goals/me', { method: 'PUT', body: { schedule: s } }), onSuccess: () => { notify('Targets saved'); setS(null); qc.invalidateQueries({ queryKey: ['my-goals'] }); qc.invalidateQueries({ queryKey: ['goals-today'] }); }, onError: (e) => notify(e.message) });
    if (!g.data)
        return null;
    const editable = g.data.selfEditable;
    const sched = s ?? g.data.schedule;
    return <section className="card p-5 space-y-3"><h2 className="font-medium">My daily goals</h2>{!sched.length ? <p className="text-sm text-muted">No goals assigned yet. {user?.role === 'member' && 'Your administrator sets these.'}</p> : <>
    {editable ? <><p className="text-xs text-muted">Your administrator lets you change your daily targets.</p><ScheduleEditor depts={g.data.allowedCampaigns} schedule={sched} onChange={setS}/>{s && <button className="btn btn-primary" onClick={() => save.mutate()}>Save targets</button>}</> :
                <ul className="text-sm space-y-1">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => { const e = sched.find((x) => x.day === i); return <li key={d} className="flex justify-between"><span>{d}</span><span className="text-muted">{e ? `${DEPT[e.campaign]?.name}: ${e.target}` : i === 0 ? 'Rest & weekly review' : 'Rest'}</span></li>; })}</ul>}</>}</section>;
}
function Reminders() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['goal-settings'], queryFn: () => api('/goals/settings') });
    const log = useQuery({ queryKey: ['reminder-log'], queryFn: () => api('/goals/reminders') });
    const [f, setF] = useState(null);
    useEffect(() => { if (q.data)
        setF(q.data); }, [q.data]);
    const save = useMutation({ mutationFn: () => api('/goals/settings', { method: 'PUT', body: f }), onSuccess: () => { notify('Reminder settings saved'); qc.invalidateQueries({ queryKey: ['goal-settings'] }); }, onError: (e) => notify(e.issues?.[0]?.message || e.message) });
    const run = useMutation({ mutationFn: () => api('/goals/reminders/run', { method: 'POST' }), onSuccess: (r) => { notify(`Checked now: ${r.daily} daily and ${r.weekly} weekly reminders sent`); qc.invalidateQueries({ queryKey: ['reminder-log'] }); }, onError: (e) => notify(e.message) });
    if (!f)
        return null;
    return <section className="card p-5 space-y-3"><h2 className="font-medium">Team goals and reminders</h2><p className="text-xs text-muted">Each person's campaigns, days and targets are edited under Team Members. These are the shared reminder times. The server checks every minute, even when nobody is logged in, and sends at most one reminder of each kind per person per day.</p>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })}/>Send reminders</label>
    <div className="grid sm:grid-cols-4 gap-3"><Field label="First reminder"><input className="input" type="time" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })}/></Field><Field label="Second reminder"><input className="input" type="time" value={f.second} onChange={(e) => setF({ ...f, second: e.target.value })}/></Field><Field label="Weekly report (Sunday)"><input className="input" type="time" value={f.weeklyTime} onChange={(e) => setF({ ...f, weeklyTime: e.target.value })}/></Field><Field label="Timezone"><input className="input" value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}/></Field></div>
    <div className="flex gap-2"><button className="btn btn-primary" onClick={() => save.mutate()}>Save</button><button className="btn" onClick={() => run.mutate()} disabled={run.isPending}>Run reminder check now</button></div>
    <Link to="/team" className="text-sm text-primary block">Edit people's targets and schedules</Link>
    {log.data?.items?.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-primary">Reminder history</summary><table className="w-full mt-2"><tbody>{log.data.items.slice(0, 20).map((r) => <tr key={r.id} className="border-b border-line"><td className="py-1">{r.user}</td><td>{r.kind}</td><td>{r.dateKey}</td><td>{r.status}{r.error ? ` (${r.error})` : ''}</td></tr>)}</tbody></table></details>}</section>;
}
function Products() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['settings'], queryFn: () => api('/settings') });
    const [p, setP] = useState(null);
    useEffect(() => { if (q.data)
        setP(q.data.products || {}); }, [q.data]);
    const save = useMutation({ mutationFn: () => api('/settings', { method: 'PUT', body: { products: p } }), onSuccess: () => { notify('Product information saved'); qc.invalidateQueries({ queryKey: ['settings'] }); }, onError: (e) => notify(e.issues?.[0]?.message || e.message) });
    if (!p)
        return null;
    const set = (d, k, v) => setP({ ...p, [d]: { ...(p[d] || {}), [k]: v } });
    return <section className="card p-5 space-y-4"><div><h2 className="font-medium">Approved product information</h2><p className="text-xs text-muted">The AI may only state what you write here. If pricing is empty it will never quote a price.</p></div>
    {['ordarly', 'keykonnec', 'website'].map((d) => <div key={d} className="space-y-2 border-t border-line pt-3"><div className="font-medium text-sm" style={{ color: DEPT[d].color }}>{DEPT[d].name}</div><div className="grid sm:grid-cols-2 gap-2"><input className="input" placeholder="Product or company name" value={p[d]?.productName || ''} onChange={(e) => set(d, 'productName', e.target.value)}/><input className="input" placeholder="Demo link" value={p[d]?.demoLink || ''} onChange={(e) => set(d, 'demoLink', e.target.value)}/><input className="input" placeholder="Signup link" value={p[d]?.signupLink || ''} onChange={(e) => set(d, 'signupLink', e.target.value)}/></div>
      <textarea className="input" placeholder="What it is and what it does (facts only)" value={p[d]?.description || ''} onChange={(e) => set(d, 'description', e.target.value)}/><textarea className="input" placeholder="Pricing (exactly as you want it quoted)" value={p[d]?.pricing || ''} onChange={(e) => set(d, 'pricing', e.target.value)}/><textarea className="input" placeholder="Approved notes on competitors, e.g. how you differ from Chowdeck" value={p[d]?.competitorNotes || ''} onChange={(e) => set(d, 'competitorNotes', e.target.value)}/></div>)}
    <button className="btn btn-primary" onClick={() => save.mutate()}>Save product information</button></section>;
}
function DuplicateProtection() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const q = useQuery({ queryKey: ['settings'], queryFn: () => api('/settings') });
    const [audit, setAudit] = useState(null);
    const set = useMutation({ mutationFn: (v) => api('/settings', { method: 'PUT', body: { collisionPolicy: v } }), onSuccess: () => { notify('Saved'); qc.invalidateQueries({ queryKey: ['settings'] }); }, onError: (e) => notify(e.message) });
    const run = useMutation({ mutationFn: () => api('/leads/collisions/audit'), onSuccess: setAudit, onError: (e) => notify(e.message) });
    const resolve = useMutation({ mutationFn: (v) => api('/leads/collisions/resolve', { method: 'POST', body: v }), onSuccess: () => { notify('Extra leads archived'); run.mutate(); }, onError: (e) => notify(e.message) });
    return <section className="card p-5 space-y-3"><h2 className="font-medium">Duplicate protection</h2>
    <Field label="When two people find the same business"><select className="input" value={q.data?.collisionPolicy || 'filter'} onChange={(e) => set.mutate(e.target.value)}><option value="filter">Filter it out for the second person (recommended)</option><option value="allow">Allow it in other workspaces they work in</option></select></Field>
    <p className="text-xs text-muted">Every import (web, CSV, manual and the extension) is checked against all users and workspaces on the server, using phone numbers, websites, social profiles and email. Name plus city only raises a "possible duplicate" for review. Colliding records are filtered out, and the second person is never told who holds it. The owner is exempt.</p>
    <button className="btn" onClick={() => run.mutate()} disabled={run.isPending}>Run collision audit on existing leads</button>
    {audit && <div className="space-y-3 text-sm">{!audit.heldByMultiple.length && !audit.sharedPhones.length && <p className="text-ok">No collisions found.</p>}
      {audit.heldByMultiple.map((h, i) => <div key={i} className="border border-line rounded-lg p-3"><div className="font-medium">{h.business}</div><ul className="mt-1 space-y-1">{h.leads.map((l) => <li key={l.id} className="flex justify-between gap-2"><span>{l.user}, {DEPT[l.department].name}, {l.status}</span><span className="flex gap-3"><Link className="text-primary" to={`/leads/${l.id}`}>Open</Link><button className="text-danger" onClick={() => resolve.mutate({ keepLeadId: l.id, archiveLeadIds: h.leads.filter((x) => x.id !== l.id).map((x) => x.id) })}>Keep this, archive others</button></span></li>)}</ul></div>)}
      {audit.sharedPhones.length > 0 && <div><div className="font-medium">Businesses sharing a phone number (review by hand)</div><ul className="list-disc pl-5 text-muted">{audit.sharedPhones.map((p) => <li key={p.phone}>+{p.phone}: {p.businesses.join(' / ')}</li>)}</ul></div>}</div>}</section>;
}
export function SettingsPage() {
    const { role, user } = useApp();
    return <><PageHeader title="Settings" desc={`Signed in as ${user?.email}`}/><div className="space-y-4 max-w-3xl"><MyGoals /><Security />{role === 'owner' && <><Reminders /><DuplicateProtection /><Products /></>}</div></>;
}
