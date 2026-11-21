import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox, Modal, Field, Stat } from '../components/ui';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT, fmt, fmtDay } from '../constants';
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL = ['ordarly', 'keykonnec', 'website'];
const DEFAULT_WEEK = { 1: 'ordarly', 2: 'keykonnec', 3: 'ordarly', 4: 'keykonnec', 5: 'website', 6: 'keykonnec' };
// Mirrors the server rule: all three -> the default week; fewer -> only their campaigns Mon-Sat; Sunday is a rest day.
const buildSchedule = (depts, target) => { const ds = ALL.filter((d) => depts.includes(d)); if (!ds.length)
    return []; return [1, 2, 3, 4, 5, 6].map((day, i) => ({ day, campaign: ds.length === 3 ? DEFAULT_WEEK[day] : ds[i % ds.length], target })); };
function ScheduleEditor({ depts, schedule, onChange }) {
    const row = (day) => schedule.find((e) => e.day === day);
    const set = (day, campaign, target) => { const rest = schedule.filter((e) => e.day !== day); onChange(campaign === 'rest' ? rest : [...rest, { day, campaign, target: target ?? row(day)?.target ?? 10 }].sort((a, b) => a.day - b.day)); };
    return <div className="space-y-2">{[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const r = row(day);
            return <div key={day} className="grid grid-cols-[90px_1fr_80px] gap-2 items-center"><span className="text-sm">{DAYS[day]}</span>
    <select className="input" value={r?.campaign || 'rest'} aria-label={`${DAYS[day]} campaign`} onChange={(e) => set(day, e.target.value)}><option value="rest">{day === 0 ? 'Rest & weekly review' : 'Rest day'}</option>{depts.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select>
    <input className="input" type="number" min={0} max={1000} disabled={!r} value={r?.target ?? ''} aria-label={`${DAYS[day]} target`} onChange={(e) => set(day, r.campaign, Math.max(0, Math.min(1000, +e.target.value || 0)))}/></div>;
        })}</div>;
}
export default function Team() {
    const { notify } = useApp();
    const qc = useQueryClient();
    const [tab, setTab] = useState('goals');
    const [invite, setInvite] = useState(false);
    const [editing, setEditing] = useState(null);
    const [link, setLink] = useState(null);
    const [filter, setFilter] = useState({ status: '', campaign: '', date: '' });
    const team = useQuery({ queryKey: ['team'], queryFn: () => api('/team') });
    const invs = useQuery({ queryKey: ['invitations'], queryFn: () => api('/invitations') });
    const goals = useQuery({ queryKey: ['goals-team', filter], queryFn: () => api('/goals/team' + qs(filter)), refetchInterval: 30000 });
    const inv = () => { qc.invalidateQueries({ queryKey: ['team'] }); qc.invalidateQueries({ queryKey: ['invitations'] }); qc.invalidateQueries({ queryKey: ['goals-team'] }); };
    const act = useMutation({ mutationFn: (v) => api(v.path, { method: v.method || 'POST', body: v.body }), onSuccess: (r, v) => { if (r?.link)
            setLink(r);
        else
            notify('Updated'); inv(); }, onError: (e) => notify(e.message) });
    const members = team.data?.items || [];
    return <>
    <PageHeader title="Team members" desc="Manage your prospecting team, their goals and their performance." action={<button className="btn btn-primary" onClick={() => setInvite(true)}>Invite team member</button>}/>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"><Stat label="Total members" value={members.length}/><Stat label="Active" value={members.filter((m) => m.active).length}/><Stat label="Pending invitations" value={invs.data?.items?.filter((i) => i.status === 'pending' && new Date(i.expiresAt) > new Date()).length ?? '-'}/><Stat label="Deactivated" value={members.filter((m) => !m.active).length}/></div>
    <div role="tablist" className="flex gap-1 border-b border-line mb-4">{[['goals', "Today's goals"], ['members', 'Members'], ['invitations', 'Invitations']].map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2.5 text-sm border-b-2 ${tab === k ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'}`}>{l}</button>)}</div>
    {tab === 'goals' && <><div className="flex flex-wrap gap-2 mb-3"><select className="input !w-auto" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} aria-label="Goal status"><option value="">All users</option><option value="completed">Completed goals</option><option value="incomplete">Incomplete goals</option><option value="none">No outreach activity</option></select>
      <select className="input !w-auto" value={filter.campaign} onChange={(e) => setFilter({ ...filter, campaign: e.target.value })} aria-label="Campaign"><option value="">All campaigns</option>{ALL.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select><input type="date" className="input !w-auto" value={filter.date} onChange={(e) => setFilter({ ...filter, date: e.target.value })} aria-label="Date"/></div>
      {goals.isLoading ? <Skeleton /> : goals.error ? <ErrorBox error={goals.error} retry={goals.refetch}/> : !goals.data.items.length ? <Empty title="No one matches" desc="Change the filters."/> : <div className="card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line">{['Name', 'Assigned campaigns', "Today's campaign", 'Target', 'Done', 'Left', '%', 'Status', 'Last outreach', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{goals.data.items.map((r) => <tr key={r.id} className="border-b border-line last:border-0"><td className="td font-medium">{r.name}</td><td className="td">{r.campaigns.map((c) => DEPT[c].name).join(', ')}</td><td className="td">{r.restDay ? 'Rest' : r.scheduled.map((c) => DEPT[c].name).join(', ')}</td><td className="td">{r.restDay ? '-' : r.target}</td><td className="td">{r.completed}</td><td className="td">{r.restDay ? '-' : r.remaining}</td><td className="td">{r.restDay ? '-' : r.percent + '%'}</td><td className="td capitalize">{r.status.replace('_', ' ')}</td><td className="td whitespace-nowrap">{fmt(r.lastOutreachAt)}</td><td className="td"><button className="text-primary text-sm" onClick={async () => setEditing({ id: r.id, name: r.name, ...(await api(`/goals/user/${r.id}`)) })}>Edit goals</button></td></tr>)}</tbody></table></div>}</>}
    {tab === 'members' && (team.isLoading ? <Skeleton /> : <div className="card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line">{['Member', 'Email', 'Workspaces', 'Leads', 'Contacted', 'Last active', 'Status', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
      <tbody>{members.map((m) => <tr key={m.id} className="border-b border-line last:border-0"><td className="td font-medium">{m.name}{m.role === 'owner' ? ' (owner)' : ''}</td><td className="td">{m.email}</td><td className="td">{(m.role === 'owner' ? ALL : m.departments).map((d) => DEPT[d].name).join(', ')}</td><td className="td">{m.leads}</td><td className="td">{m.contacted}</td><td className="td whitespace-nowrap">{fmt(m.lastActiveAt)}</td><td className="td">{m.active ? 'Active' : 'Deactivated'}</td>
        <td className="td whitespace-nowrap">{m.role !== 'owner' && <><button className="text-primary text-sm mr-3" onClick={async () => setEditing({ id: m.id, name: m.name, ...(await api(`/goals/user/${m.id}`)) })}>Goals</button><button className="text-sm text-danger" onClick={() => act.mutate({ path: `/team/${m.id}`, method: 'PATCH', body: { active: !m.active } })}>{m.active ? 'Deactivate' : 'Reactivate'}</button></>}</td></tr>)}</tbody></table></div>)}
    {tab === 'invitations' && (invs.isLoading ? <Skeleton /> : !invs.data.items.length ? <Empty title="No invitations" desc="Invite a team member to get started." action={<button className="btn btn-primary" onClick={() => setInvite(true)}>Invite team member</button>}/> : <div className="card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line">{['Email', 'Workspaces', 'Status', 'Expires', ''].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
      <tbody>{invs.data.items.map((i) => {
                const expired = i.status === 'pending' && new Date(i.expiresAt) < new Date();
                return <tr key={i._id} className="border-b border-line last:border-0"><td className="td">{i.email}</td><td className="td">{i.departments.map((d) => DEPT[d].name).join(', ')}</td><td className="td capitalize">{expired ? 'expired' : i.status}</td><td className="td">{fmtDay(i.expiresAt)}</td>
        <td className="td whitespace-nowrap">{i.status === 'pending' && <><button className="text-primary text-sm mr-3" onClick={() => act.mutate({ path: `/invitations/${i._id}/resend` })}>Resend</button><button className="text-danger text-sm" onClick={() => act.mutate({ path: `/invitations/${i._id}/revoke` })}>Revoke</button></>}</td></tr>;
            })}</tbody></table></div>)}
    {invite && <InviteModal onClose={() => setInvite(false)} onDone={(r) => { setInvite(false); setLink(r); inv(); }}/>}
    {editing && editing.schedule && <GoalsModal u={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); notify('Goals saved'); inv(); }}/>}
    {link && <Modal title="Invitation link" desc="Single use. Expires in 72 hours." onClose={() => setLink(null)}><div className="space-y-3"><input className="input" readOnly value={link.link} aria-label="Invitation link" onFocus={(e) => e.target.select()}/><p className="text-xs text-muted">{link.emailed ? 'An email was sent.' : 'Email is not configured, so copy this link and send it yourself.'} Expires {fmt(link.expiresAt)}.</p><button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(link.link); notify('Link copied'); }}>Copy link</button></div></Modal>}
  </>;
}
function InviteModal({ onClose, onDone }) {
    const [f, setF] = useState({ email: '', name: '', departments: [], target: '' });
    const [all, setAll] = useState(false);
    const [schedule, setSchedule] = useState(null);
    const [reminders, setReminders] = useState(true);
    const [weekly, setWeekly] = useState(false);
    const [err, setErr] = useState('');
    const depts = all ? [...ALL] : f.departments;
    const target = parseInt(f.target, 10);
    const sched = schedule ?? (target > 0 ? buildSchedule(depts, target) : []);
    const toggleDept = (d) => { setAll(false); setSchedule(null); setF({ ...f, departments: f.departments.includes(d) ? f.departments.filter((x) => x !== d) : [...f.departments, d] }); };
    const send = useMutation({ mutationFn: () => api('/invitations', { method: 'POST', body: { email: f.email, name: f.name || undefined, role: 'member', departments: depts, goals: { dailyTarget: target, schedule: sched, remindersEnabled: reminders, weeklyReportEnabled: weekly } } }), onSuccess: onDone, onError: (e) => setErr(e.issues?.[0]?.message || e.message) });
    return <Modal title="Invite team member" desc="Their daily target is set by you; nothing is inherited from your own goal." onClose={onClose}><div className="space-y-3">
    <Field label="Email address"><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })}/></Field><Field label="Full name (optional)"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })}/></Field>
    <div><label className="label">Campaigns</label><div className="flex flex-wrap gap-3 text-sm">{ALL.map((d) => <label key={d} className="flex items-center gap-2"><input type="checkbox" checked={depts.includes(d)} onChange={() => toggleDept(d)}/>{DEPT[d].name}</label>)}</div>
      <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={all} onChange={(e) => { setAll(e.target.checked); setSchedule(null); }}/>Assign all three campaign categories (applies the default weekly schedule)</label></div>
    <Field label="Daily outreach target (prospects per day)"><input className="input" type="number" min={1} max={1000} value={f.target} onChange={(e) => { setF({ ...f, target: e.target.value }); setSchedule(null); }} placeholder="You choose this"/></Field>
    {depts.length > 0 && target > 0 && <div><label className="label">Weekly schedule</label><ScheduleEditor depts={depts} schedule={sched} onChange={setSchedule}/></div>}
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)}/>Daily goal reminders</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)}/>Weekly performance report</label>
    {err && <p role="alert" className="text-sm text-danger">{err}</p>}<div className="flex justify-end gap-2"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!/\S+@\S+/.test(f.email) || !depts.length || !(target > 0) || send.isPending} onClick={() => send.mutate()}>Generate invitation link</button></div></div></Modal>;
}
function GoalsModal({ u, onClose, onSaved }) {
    const [s, setS] = useState(u.schedule);
    const [rem, setRem] = useState(u.remindersEnabled);
    const [wk, setWk] = useState(u.weeklyReportEnabled);
    const [self, setSelf] = useState(u.selfEditable);
    const [email, setEmail] = useState(u.reminderEmail || '');
    const [err, setErr] = useState('');
    const save = useMutation({ mutationFn: () => api(`/goals/user/${u.id}`, { method: 'PUT', body: { schedule: s, remindersEnabled: rem, weeklyReportEnabled: wk, selfEditable: self, reminderEmail: email } }), onSuccess: onSaved, onError: (e) => setErr(e.message) });
    return <Modal title={`Goals for ${u.name}`} desc="Changes apply from today. Past days keep what was recorded." onClose={onClose}><div className="space-y-3"><ScheduleEditor depts={u.allowedCampaigns} schedule={s} onChange={setS}/>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rem} onChange={(e) => setRem(e.target.checked)}/>Daily reminders</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={wk} onChange={(e) => setWk(e.target.checked)}/>Weekly report email</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={self} onChange={(e) => setSelf(e.target.checked)}/>Let this person change their own daily targets</label>
    <Field label="Reminder email (optional, defaults to login email)"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></Field>{err && <p role="alert" className="text-sm text-danger">{err}</p>}<div className="flex justify-end gap-2"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>Save goals</button></div></div></Modal>;
}
export { ScheduleEditor };
