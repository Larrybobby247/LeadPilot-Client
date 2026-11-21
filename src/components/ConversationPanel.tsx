import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagesSquare, Copy, RefreshCw } from 'lucide-react';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { fmt } from '../constants';

const INTENT: Record<string, string> = { interested: 'Interested', demo_request: 'Requesting a demo', pricing_request: 'Requesting pricing', more_info: 'Requesting more information', will_get_back: 'Will get back later', declined: 'Declined', objection: 'Raised an objection', negotiating: 'Negotiating', converted: 'Already subscribed', unclear: 'Unclear' };
export default function ConversationPanel({ lead }: { lead: any }) {
  const { notify } = useApp(); const qc = useQueryClient(); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const list = useQuery({ queryKey: ['conv', lead.id], queryFn: () => api<any>('/conversations' + qs({ leadId: lead.id })) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['conv', lead.id] }); qc.invalidateQueries({ queryKey: ['lead', lead.id] }); qc.invalidateQueries({ queryKey: ['leads'] }); };
  const analyse = useMutation({ mutationFn: () => api('/conversations/analyse', { method: 'POST', body: { leadId: lead.id, message: msg } }), onSuccess: () => { setMsg(''); setErr(''); refresh(); }, onError: (e: any) => { setErr(e.message); if (e.body?.entryId) { setMsg(''); refresh(); } } });
  const items: any[] = list.data?.items || [];
  return (
    <section className="card p-4 space-y-3"><h2 className="font-medium flex items-center gap-2"><MessagesSquare size={16} className="text-primary" />AI Conversation Assistant</h2>
      <textarea className="input min-h-[110px]" placeholder="Paste what the prospect replied, exactly as they wrote it (for example: 'Thanks for reaching out. Can you send me a demo?')" aria-label="Prospect message" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={2000} />
      <button className="btn btn-primary" disabled={msg.trim().length < 2 || analyse.isPending} onClick={() => analyse.mutate()}>{analyse.isPending ? 'Analysing...' : 'Analyse & Generate Reply'}</button>
      {err && <p role="alert" className="text-sm text-danger">{err} Your message was saved below; you can retry from there.</p>}
      <p className="text-xs text-muted">The AI only drafts. It never sends anything and never changes the lead's status without your confirmation.</p>
      {items.length > 0 && <ol className="space-y-4 pt-2">{items.map((e) => <Entry key={e._id} e={e} onChange={refresh} notify={notify} />)}</ol>}</section>);
}
function Entry({ e, onChange, notify }: { e: any; onChange: () => void; notify: (m: string) => void }) {
  const [reply, setReply] = useState(e.reply || ''); const [date, setDate] = useState(e.followUp?.suggestedFor ? e.followUp.suggestedFor.slice(0, 10) : '');
  const mut = (fn: () => Promise<any>, msg?: string) => useMutation({ mutationFn: fn, onSuccess: () => { if (msg) notify(msg); onChange(); }, onError: (x: any) => notify(x.message) });
  const regen = mut(() => api(`/conversations/${e._id}/regenerate`, { method: 'POST' }), 'Reply regenerated'); const saveReply = mut(() => api(`/conversations/${e._id}`, { method: 'PATCH', body: { reply } }), 'Reply saved');
  const decide = (accept: boolean) => mut(() => api(`/conversations/${e._id}/status`, { method: 'POST', body: { accept } }), accept ? 'Status updated' : 'Status kept'); const fu = (approve: boolean) => mut(() => api(`/conversations/${e._id}/followup`, { method: 'POST', body: { approve, date: approve && date ? new Date(date + 'T09:00:00').toISOString() : undefined } }), approve ? 'Follow-up scheduled' : 'Dismissed');
  const a = e.analysis; const d1 = decide(true), d2 = decide(false), f1 = fu(true), f2 = fu(false);
  return <li className="border border-line rounded-lg p-3 space-y-2">
    <div className="text-xs text-muted">{fmt(e.receivedAt)}</div><div className="text-sm bg-canvas rounded-lg p-2 whitespace-pre-wrap">{e.received}</div>
    {e.aiFailed && <div className="flex items-center gap-2 text-sm text-danger">The AI could not analyse this one. <button className="btn !min-h-[32px]" onClick={() => regen.mutate()} disabled={regen.isPending}>Try again</button></div>}
    {a && <>
      <div className="text-sm"><b>{INTENT[a.intent] || a.intent}</b> <span className="text-muted">({Math.round(a.confidence * 100)}% confident)</span><div className="text-muted">{a.explanation}</div><div>Next: {a.nextAction}</div></div>
      {e.reviewNeeded && <p className="text-sm text-[#9A6410] bg-[#FDF3E2] rounded-lg p-2">The AI is not confident enough to recommend a status. The lead stays "{e.currentStatus}". Please review manually.</p>}
      {e.decision === 'pending' && e.recommendation && <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2"><p className="text-sm">AI recommends updating this lead from <b>{e.recommendation.from}</b> to <b>{e.recommendation.to}</b>.</p><div className="flex gap-2"><button className="btn btn-primary" onClick={() => d1.mutate()}>Confirm Status Update</button><button className="btn" onClick={() => d2.mutate()}>Keep Current Status</button></div></div>}
      {e.decision === 'accepted' && <p className="text-xs text-ok">Status changed from {e.previousStatus} to {e.appliedStatus}.</p>}{e.decision === 'rejected' && <p className="text-xs text-muted">Recommendation declined. Status unchanged.</p>}
      {e.followUp?.state === 'pending' && <div className="rounded-lg border border-line p-3 space-y-2"><p className="text-sm">Suggested follow-up date. Approve or change it:</p><div className="flex flex-wrap gap-2"><input type="date" className="input !w-auto" value={date} onChange={(x) => setDate(x.target.value)} aria-label="Follow-up date" /><button className="btn btn-primary" onClick={() => f1.mutate()}>Schedule</button><button className="btn" onClick={() => f2.mutate()}>No thanks</button></div></div>}
      {e.followUp?.state === 'approved' && <p className="text-xs text-ok">Follow-up scheduled.</p>}
      <textarea className="input min-h-[100px]" value={reply} onChange={(x) => setReply(x.target.value)} aria-label="Suggested reply" />
      <div className="flex flex-wrap gap-2"><button className="btn" onClick={() => { navigator.clipboard?.writeText(reply); notify('Reply copied'); }}><Copy size={14} />Copy</button><button className="btn" onClick={() => saveReply.mutate()} disabled={reply === e.reply}>Save edit</button>{e.decision !== 'accepted' && <button className="btn" onClick={() => regen.mutate()} disabled={regen.isPending}><RefreshCw size={14} />Regenerate</button>}</div></>}
  </li>;
}
