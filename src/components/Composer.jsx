import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Briefcase, Copy, Undo2 } from 'lucide-react';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { PURPOSES, fmtDay } from '../constants';

// Pick the right link for the button. WhatsApp Business: Android opens that app directly, desktop uses WhatsApp Web, iPhone has no
// per-app link so it uses the normal link (it opens whichever app is set for WhatsApp links).
const pickUrl = (links, business) => {
  if (!business) return links.standard;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return links.androidBusiness;
  if (/iPhone|iPad|iPod/i.test(ua)) return links.standard;
  return links.web;
};

// "Did you send it?" is always available. Opening WhatsApp first is optional.
export default function Composer({ lead, pendingEventId }) {
  const qc = useQueryClient(); const { notify } = useApp();
  const tpls = useQuery({ queryKey: ['templates', lead.department], queryFn: () => api('/templates' + qs({ department: lead.department })) });
  const [tid, setTid] = useState(''); const [text, setText] = useState(''); const [missing, setMissing] = useState([]); const [err, setErr] = useState('');
  const [event, setEvent] = useState(pendingEventId || null); const [channel, setChannel] = useState('whatsapp'); const [result, setResult] = useState(null);
  useEffect(() => { if (pendingEventId) setEvent(pendingEventId); }, [pendingEventId]);
  const usable = (tpls.data?.items || []).filter((t) => t.active);

  const pick = async (id) => {
    setTid(id); setErr(''); setResult(null); if (!id) return;
    try { const r = await api('/outreach/preview', { method: 'POST', body: { leadId: lead.id, templateId: id } }); setText(r.text); setMissing(r.missing); } catch (e) { setErr(e.message); }
  };
  const refresh = () => { qc.invalidateQueries({ queryKey: ['lead', lead.id] }); qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['followups'] }); qc.invalidateQueries({ queryKey: ['goals-today'] }); };

  const open = useMutation({
    mutationFn: async ({ business, force }) => {
      const w = window.open('', '_blank'); // opened synchronously so mobile popup blockers allow it
      try {
        const r = await api('/outreach/opened', { method: 'POST', body: { leadId: lead.id, templateId: tid || undefined, message: text, channel: business ? 'whatsapp_business' : 'whatsapp', force } });
        const url = pickUrl(r.links, business);
        if (w) { w.opener = null; w.location.href = url; } else window.location.href = url;
        return r;
      } catch (e) { w?.close(); throw e; }
    },
    onSuccess: (r, v) => { setEvent(r.eventId); setChannel(v.business ? 'whatsapp_business' : 'whatsapp'); setResult(null); setErr(''); refresh(); },
    onError: (e, v) => { if (e.body?.code === 'ALREADY_CONTACTED' && window.confirm(e.message + ' Open WhatsApp anyway?')) open.mutate({ ...v, force: true }); else setErr(e.message); },
  });
  const answer = useMutation({
    mutationFn: (sent) => api('/outreach/confirm-sent', { method: 'POST', body: { leadId: lead.id, eventId: event || undefined, sent, message: text || undefined, templateId: tid || undefined, channel } }),
    onSuccess: (r, sent) => { setEvent(null); setErr(''); setResult({ sent, eventId: r.eventId, next: r.nextFollowUpAt }); refresh(); notify(sent ? 'Recorded as sent' : 'Marked as not sent. Nothing was counted.'); },
    onError: (e) => setErr(e.message),
  });
  const undo = useMutation({
    mutationFn: () => api('/outreach/undo', { method: 'POST', body: { eventId: result.eventId } }),
    onSuccess: () => { setResult(null); refresh(); notify('Undone. It no longer counts.'); }, onError: (e) => setErr(e.message),
  });

  if (!lead.contactReady) return <div className="card p-4 text-sm text-muted">This lead has no valid phone number, so WhatsApp outreach is not available. Add a number in the lead details.</div>;
  const canOpen = text.trim() && !open.isPending;
  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-medium">Message</h3>
      <select className="input" value={tid} onChange={(e) => pick(e.target.value)} aria-label="Template"><option value="">Choose a template</option>{usable.map((t) => <option key={t._id} value={t._id}>{t.name} ({PURPOSES[t.purpose]}){t.scope === 'personal' ? ' - mine' : ''}</option>)}</select>
      <textarea className="input min-h-[140px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="Choose a template or write your own message" aria-label="Message" />
      <div className="flex justify-between text-xs text-muted"><span>{text.length} characters</span>{missing.length > 0 && <span className="text-[#9A6410]">Fill in before sending: {missing.join(', ')}</span>}</div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={!canOpen} onClick={() => open.mutate({ business: false })}><MessageCircle size={16} />Open WhatsApp</button>
        <button className="btn" disabled={!canOpen} onClick={() => open.mutate({ business: true })}><Briefcase size={16} />Open WhatsApp Business</button>
        <button className="btn" disabled={!text} onClick={() => { navigator.clipboard?.writeText(text); notify('Message copied'); }}><Copy size={16} />Copy</button>
      </div>
      <p className="text-xs text-muted">LeadPilot never sends messages. You review and send inside WhatsApp. On iPhone, WhatsApp Business opens only if it is the app set for WhatsApp links; otherwise your regular WhatsApp opens. You can also copy the message and send it from any app.</p>

      <div role="group" aria-label="Did you send this message?" className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
        {!result && <>
          <p className="text-sm font-medium">Did you send this message?</p>
          <p className="text-xs text-muted">{event ? 'You opened WhatsApp for this message. ' : ''}Answer here whenever you are done, however you sent it. Only "Yes" counts toward the lead and today's goal.</p>
          <div className="flex gap-2"><button className="btn btn-primary" disabled={answer.isPending} onClick={() => answer.mutate(true)}>Yes, message sent</button><button className="btn" disabled={answer.isPending} onClick={() => answer.mutate(false)}>No, not sent</button></div>
        </>}
        {result?.sent && <>
          <p className="text-sm text-ok font-medium">Recorded as sent. It counts toward this lead and today's goal.{result.next ? ` Next follow-up: ${fmtDay(result.next)}.` : ''}</p>
          <div className="flex gap-2"><button className="btn !min-h-[34px]" disabled={undo.isPending} onClick={() => undo.mutate()}><Undo2 size={14} />Undo</button><button className="btn !min-h-[34px]" onClick={() => setResult(null)}>Record another message</button></div>
        </>}
        {result && !result.sent && <>
          <p className="text-sm text-muted">Marked as not sent. Nothing was counted for this lead or today's goal.</p>
          <button className="btn !min-h-[34px]" onClick={() => setResult(null)}>Change answer</button>
        </>}
      </div>
    </div>);
}
