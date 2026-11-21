import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Copy } from 'lucide-react';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { PURPOSES, fmtDay } from '../constants';
// WhatsApp flow: Open -> record "opened" (NOT contact) -> ask "Did you send it?" -> only Yes marks Contacted and schedules follow-up.
export default function Composer({ lead, pendingEventId }) {
    const qc = useQueryClient();
    const { notify } = useApp();
    const tpls = useQuery({ queryKey: ['templates', lead.department], queryFn: () => api('/templates' + qs({ department: lead.department })) });
    const [tid, setTid] = useState('');
    const [text, setText] = useState('');
    const [missing, setMissing] = useState([]);
    const [event, setEvent] = useState(pendingEventId || null);
    const [err, setErr] = useState('');
    useEffect(() => { if (pendingEventId)
        setEvent(pendingEventId); }, [pendingEventId]);
    const usable = (tpls.data?.items || []).filter((t) => t.active);
    const pick = async (id) => { setTid(id); setErr(''); if (!id)
        return; try {
        const r = await api('/outreach/preview', { method: 'POST', body: { leadId: lead.id, templateId: id } });
        setText(r.text);
        setMissing(r.missing);
    }
    catch (e) {
        setErr(e.message);
    } };
    const refresh = () => { qc.invalidateQueries({ queryKey: ['lead', lead.id] }); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['followups'] }); };
    const open = useMutation({ mutationFn: async (force) => {
            const w = window.open('', '_blank'); // open synchronously so mobile popup blockers allow it
            try {
                const r = await api('/outreach/opened', { method: 'POST', body: { leadId: lead.id, templateId: tid || undefined, message: text, force } });
                if (w) {
                    w.opener = null;
                    w.location.href = r.url;
                }
                else
                    window.location.href = r.url;
                return r;
            }
            catch (e) {
                w?.close();
                throw e;
            }
        },
        onSuccess: (r) => { setEvent(r.eventId); setErr(''); refresh(); },
        onError: (e) => { if (e.body?.code === 'ALREADY_CONTACTED' && confirm(e.message + ' Open WhatsApp anyway?'))
            open.mutate(true);
        else
            setErr(e.message); } });
    const confirm_ = useMutation({ mutationFn: (sent) => api('/outreach/confirm-sent', { method: 'POST', body: { eventId: event, sent } }),
        onSuccess: (r, sent) => { setEvent(null); refresh(); notify(sent ? (r.nextFollowUpAt ? `Outreach confirmed. Next follow-up ${fmtDay(r.nextFollowUpAt)}.` : 'Outreach confirmed.') : 'Noted. Nothing was counted.'); }, onError: (e) => setErr(e.message) });
    if (!lead.contactReady)
        return <div className="card p-4 text-sm text-muted">This lead has no valid phone number, so WhatsApp outreach is not available. Add a number in the lead details.</div>;
    return (<div className="card p-4 space-y-3">
      <h3 className="font-medium">Message</h3>
      <select className="input" value={tid} onChange={(e) => pick(e.target.value)} aria-label="Template"><option value="">Choose a template</option>{usable.map((t) => <option key={t._id} value={t._id}>{t.name} ({PURPOSES[t.purpose]}){t.scope === 'personal' ? ' - mine' : ''}</option>)}</select>
      <textarea className="input min-h-[140px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Choose a template or write your own message" aria-label="Message"/>
      <div className="flex justify-between text-xs text-muted"><span>{text.length} characters</span>{missing.length > 0 && <span className="text-[#9A6410]">Fill in before sending: {missing.join(', ')}</span>}</div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <div className="flex flex-wrap gap-2"><button className="btn btn-primary" disabled={!text.trim() || open.isPending} onClick={() => open.mutate(undefined)}><MessageCircle size={16}/>Open WhatsApp</button>
        <button className="btn" disabled={!text} onClick={() => { navigator.clipboard?.writeText(text); notify('Message copied'); }}><Copy size={16}/>Copy</button></div>
      <p className="text-xs text-muted">LeadPilot never sends messages. You review and send inside WhatsApp, then confirm here.</p>
      {event && <div role="alertdialog" aria-label="Confirm message sent" className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2"><p className="text-sm font-medium">Did you send this message?</p>
        <div className="flex gap-2"><button className="btn btn-primary" disabled={confirm_.isPending} onClick={() => confirm_.mutate(true)}>Yes, message sent</button><button className="btn" disabled={confirm_.isPending} onClick={() => confirm_.mutate(false)}>No, not sent</button></div></div>}
    </div>);
}
