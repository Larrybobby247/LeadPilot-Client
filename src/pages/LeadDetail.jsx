import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/Layout';
import { Skeleton, ErrorBox, Modal, Field } from '../components/ui';
import { SourceBadge, StatusBadge, VerifyBadge, WebsiteBadge } from '../components/Badges';
import Composer from '../components/Composer';
import AiPanel from '../components/AiPanel';
import ConversationPanel from '../components/ConversationPanel';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT, MANUAL_STATUSES, fmt, fmtDay } from '../constants';
export default function LeadDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const qc = useQueryClient();
    const { role, notify } = useApp();
    const q = useQuery({ queryKey: ['lead', id], queryFn: () => api(`/leads/${id}`) });
    const team = useQuery({ queryKey: ['team'], queryFn: () => api('/team'), enabled: role === 'owner' });
    const [note, setNote] = useState('');
    const [edit, setEdit] = useState(false);
    const [fuDate, setFuDate] = useState('');
    const [form, setForm] = useState({});
    const refresh = () => { qc.invalidateQueries({ queryKey: ['lead', id] }); qc.invalidateQueries({ queryKey: ['leads'] }); };
    const patchM = useMutation({ mutationFn: (v) => api(`/leads/${id}`, { method: 'PATCH', body: v.body }), onSuccess: (_r, v) => { notify(v.msg || 'Saved'); refresh(); }, onError: (e) => notify(e.message) });
    const [tab, setTab] = useState('outreach');
    const [chan, setChan] = useState('email');
    const rec = useMutation({ mutationFn: () => api('/outreach/record', { method: 'POST', body: { leadId: id, channel: chan } }), onSuccess: (r) => { notify(r.nextFollowUpAt ? `Recorded. Next follow-up ${fmtDay(r.nextFollowUpAt)}.` : 'Outreach recorded'); refresh(); qc.invalidateQueries({ queryKey: ['goals-today'] }); }, onError: (e) => notify(e.message) });
    const status = useMutation({ mutationFn: (s) => api(`/leads/${id}`, { method: 'PATCH', body: { status: s } }), onSuccess: () => { notify('Status updated'); refresh(); }, onError: (e) => notify(e.message) });
    const assign = useMutation({ mutationFn: (u) => api(`/leads/${id}/assign`, { method: 'POST', body: { userId: u } }), onSuccess: () => { notify('Lead reassigned'); refresh(); }, onError: (e) => notify(e.message) });
    const addNote = useMutation({ mutationFn: () => api(`/leads/${id}/notes`, { method: 'POST', body: { text: note } }), onSuccess: () => { setNote(''); notify('Note added'); refresh(); } });
    const check = useMutation({ mutationFn: () => api(`/leads/${id}/website-check`, { method: 'POST' }), onSuccess: () => { notify('Website checked'); refresh(); }, onError: (e) => notify(e.message) });
    const wsSet = useMutation({ mutationFn: (s) => api(`/leads/${id}/website-status`, { method: 'POST', body: { status: s } }), onSuccess: () => { notify('Website status saved'); refresh(); } });
    const schedule = useMutation({ mutationFn: () => api('/followups', { method: 'POST', body: { leadId: id, dueAt: new Date(fuDate).toISOString() } }), onSuccess: () => { setFuDate(''); notify('Follow-up scheduled'); refresh(); qc.invalidateQueries({ queryKey: ['followups'] }); }, onError: (e) => notify(e.message) });
    const doneFu = useMutation({ mutationFn: (fid) => api(`/followups/${fid}/complete`, { method: 'POST' }), onSuccess: () => { notify('Follow-up completed'); refresh(); } });
    const archive = useMutation({ mutationFn: () => api(`/leads/${id}`, { method: 'DELETE' }), onSuccess: () => { notify('Lead archived'); nav('/leads'); } });
    const save = useMutation({ mutationFn: () => api(`/leads/${id}`, { method: 'PATCH', body: { contactPerson: form.contactPerson, whatsappNumber: form.whatsappNumber, business: { name: form.name, category: form.category, city: form.city, state: form.state, website: form.website, email: form.email, phone: form.phone } } }), onSuccess: () => { setEdit(false); notify('Lead updated'); refresh(); }, onError: (e) => notify(e.issues?.[0]?.message || e.message) });
    if (q.isLoading)
        return <Skeleton rows={6}/>;
    if (q.error)
        return <ErrorBox error={q.error} retry={q.refetch}/>;
    const l = q.data, b = l.business;
    const pending = l.status === 'Outreach Opened' ? l.outreach.find((e) => e.type === 'opened')?._id : undefined;
    const openEdit = () => { setForm({ name: b.name, category: b.category || '', city: b.city || '', state: b.state || '', website: b.website || '', email: b.emails?.[0] || '', phone: '', contactPerson: l.contactPerson || '', whatsappNumber: l.whatsappNumber || '' }); setEdit(true); };
    const timeline = [...l.activity.map((a) => ({ at: a.at, text: a.action.replace(/[._]/g, ' '), by: a.by })), ...l.outreach.map((e) => ({ at: e.at, text: e.type === 'confirmed_sent' ? 'WhatsApp message confirmed sent' : e.type === 'opened' ? 'WhatsApp opened (not confirmed)' : 'WhatsApp opened, message not sent' }))].sort((a, b2) => +new Date(b2.at) - +new Date(a.at));
    return <>
    <PageHeader title={b.name} desc={`${b.category || 'Business'} in ${[b.city, b.state].filter(Boolean).join(', ') || 'unknown location'} - ${DEPT[l.department].name}`} action={<div className="flex flex-wrap gap-2 items-center"><StatusBadge s={l.status}/><button className="btn" onClick={openEdit}>Edit lead</button><button className="btn btn-danger" onClick={() => confirm('Archive this lead? It will be hidden and its follow-ups cancelled.') && archive.mutate()}>Archive</button></div>}/>
    <div className="grid lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 space-y-4">
        <section className="card p-4"><h2 className="font-medium mb-3">Business information</h2>
          <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-muted">Phone</dt><dd>{b.phones?.length ? b.phones.map((p) => <div key={p}>+{p}</div>) : 'None'}</dd></div><div><dt className="text-muted">Email</dt><dd>{b.emails?.join(', ') || 'None'}</dd></div>
            <div><dt className="text-muted">Website</dt><dd className="break-all">{b.website || 'None'}</dd></div><div><dt className="text-muted">Social</dt><dd className="break-all">{[b.instagram, b.facebook, b.linkedin].filter(Boolean).join(', ') || 'None'}</dd></div>
            <div><dt className="text-muted">Contact person</dt><dd>{l.contactPerson || '-'}</dd></div><div><dt className="text-muted">Completeness</dt><dd>{l.completeness ?? 0}% ({l.completenessBand})</dd></div>
            <div><dt className="text-muted">Source</dt><dd className="space-y-1"><SourceBadge source={l.source}/>{l.sourceUrl && l.sourceUrl.startsWith('http') && <a className="block text-primary break-all text-xs" href={l.sourceUrl} target="_blank" rel="noreferrer noopener">Original source</a>}</dd></div>
            <div><dt className="text-muted">Verification</dt><dd className="space-y-1"><VerifyBadge v={l.verification}/><select className="input !min-h-[32px] !py-1 text-xs" value={l.verification} onChange={(e) => patchM.mutate({ body: { verification: e.target.value }, msg: 'Verification updated' })} aria-label="Set verification"><option value="verified">Verified</option><option value="unverified">Unverified</option><option value="requires_review">Needs review</option></select></dd></div></dl></section>
        {l.department === 'website' && <section className="card p-4 space-y-2"><h2 className="font-medium">Website verification</h2><div className="flex items-center gap-2"><WebsiteBadge s={b.websiteStatus}/><span className="text-xs text-muted">Last checked {fmt(b.websiteCheckedAt)}</span></div><p className="text-sm text-muted">{b.websiteReason || 'Not checked yet.'}</p>
          <div className="flex flex-wrap gap-2"><button className="btn" disabled={!b.website || check.isPending} onClick={() => check.mutate()}>Check now</button><select className="input !w-auto" value="" onChange={(e) => e.target.value && wsSet.mutate(e.target.value)} aria-label="Set website status manually"><option value="">Set status manually</option><option value="WORKING_WEBSITE">Working website</option><option value="NO_WEBSITE">No website</option><option value="BROKEN_WEBSITE">Broken website</option><option value="PARKED_DOMAIN">Parked domain</option><option value="UNCERTAIN">Uncertain</option></select></div></section>}
        <div role="tablist" className="flex gap-1 border-b border-line">{[['outreach', 'Outreach'], ['ai', 'AI messages'], ['conversation', 'Conversation']].map(([k, t]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`px-4 py-2.5 text-sm border-b-2 ${tab === k ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'}`}>{t}</button>)}</div>
        {tab === 'outreach' && <><Composer lead={l} pendingEventId={pending}/><section className="card p-4 space-y-2"><h3 className="font-medium">Record other outreach</h3><p className="text-xs text-muted">Contacted them another way? Record it once it is actually done. It counts toward your daily goal; drafts and opened links never do.</p><div className="flex gap-2"><select className="input !w-auto" value={chan} onChange={(e) => setChan(e.target.value)} aria-label="Channel"><option value="email">Email sent</option><option value="call">Phone call made</option><option value="other">Other contact</option></select><button className="btn" onClick={() => rec.mutate()} disabled={rec.isPending}>Record as completed</button></div></section></>}
        {tab === 'ai' && <AiPanel leadId={l.id}/>}
        {tab === 'conversation' && <ConversationPanel lead={l}/>}
        <section className="card p-4"><h2 className="font-medium mb-3">Notes</h2><div className="flex gap-2 mb-3"><input className="input" placeholder="Add a note" aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)}/><button className="btn btn-primary" disabled={!note.trim()} onClick={() => addNote.mutate()}>Add</button></div>
          {l.notes.length ? <ul className="space-y-2 text-sm">{[...l.notes].reverse().map((n, i) => <li key={i} className="border-b border-line pb-2">{n.text}<div className="text-xs text-muted">{fmt(n.at)}</div></li>)}</ul> : <p className="text-sm text-muted">No notes yet.</p>}</section></div>
      <div className="lg:col-span-2 space-y-4">
        <section className="card p-4 space-y-3"><h2 className="font-medium">Status</h2>
          <select className="input" value={MANUAL_STATUSES.includes(l.status) ? l.status : ''} onChange={(e) => status.mutate(e.target.value)} aria-label="Change status">{!MANUAL_STATUSES.includes(l.status) && <option value="">{l.status} (set by outreach)</option>}{MANUAL_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <p className="text-xs text-muted">"Contacted" is set only when you confirm a message was sent.</p>
          {role === 'owner' && <Field label="Assigned to"><select className="input" value={l.assignedTo?.id} onChange={(e) => assign.mutate(e.target.value)}>{team.data?.items?.filter((u) => u.active && (u.role === 'owner' || u.departments.includes(l.department))).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={l.followUpsPaused} onChange={(e) => patchM.mutate({ body: { followUpsPaused: e.target.checked }, msg: e.target.checked ? 'Follow-up reminders paused' : 'Follow-up reminders resumed' })}/>Pause follow-up reminders</label></section>
        <section className="card p-4 space-y-3"><h2 className="font-medium">Follow-ups</h2>
          {l.followUps.length ? <ul className="space-y-2 text-sm">{l.followUps.map((f) => <li key={f._id} className="flex justify-between items-center"><span>{fmtDay(f.dueAt)} <span className="text-muted">({f.status})</span></span>{['Pending', 'Rescheduled'].includes(f.status) && <button className="text-primary" onClick={() => doneFu.mutate(f._id)}>Mark done</button>}</li>)}</ul> : <p className="text-sm text-muted">None scheduled. They are created when you confirm outreach.</p>}
          <div className="flex gap-2"><input type="date" className="input" value={fuDate} onChange={(e) => setFuDate(e.target.value)} aria-label="Follow-up date"/><button className="btn" disabled={!fuDate || schedule.isPending} onClick={() => schedule.mutate()}>Schedule</button></div></section>
        <section className="card p-4"><h2 className="font-medium mb-3">Timeline</h2>{timeline.length ? <ul className="space-y-2 text-sm">{timeline.slice(0, 30).map((t, i) => <li key={i}><span className="capitalize">{t.text}</span><div className="text-xs text-muted">{fmt(t.at)}{t.by ? ` by ${t.by}` : ''}</div></li>)}</ul> : <p className="text-sm text-muted">No activity yet.</p>}</section></div></div>
    <Link to="/leads" className="inline-block mt-4 text-sm text-primary">Back to leads</Link>
    {edit && <Modal title="Edit lead" onClose={() => setEdit(false)}><div className="space-y-3">{[['name', 'Business name'], ['category', 'Category'], ['city', 'City'], ['state', 'State'], ['website', 'Website'], ['email', 'Add email'], ['phone', 'Add phone number'], ['contactPerson', 'Contact person'], ['whatsappNumber', 'WhatsApp number']].map(([k, label]) => <Field key={k} label={label}><input className="input" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}/></Field>)}
      <div className="flex justify-end gap-2"><button className="btn" onClick={() => setEdit(false)}>Cancel</button><button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>Save changes</button></div></div></Modal>}
  </>;
}
