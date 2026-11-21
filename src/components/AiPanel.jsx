import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Copy, RefreshCw } from 'lucide-react';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { fmt } from '../constants';
const KINDS = { initial: 'Initial introduction', followup: 'Follow-up message', interested: 'Reply to an interested prospect', more_info: 'Reply to a request for more information', later: 'Reply to "I will get back later"', not_interested: 'Reply to "not interested"', custom: 'Custom message' };
const TONES = { friendly: 'Friendly', professional: 'Professional', persuasive: 'Persuasive', conversational: 'Conversational', direct: 'Short and direct' };
export default function AiPanel({ leadId }) {
    const { notify } = useApp();
    const qc = useQueryClient();
    const [kind, setKind] = useState('initial');
    const [tone, setTone] = useState('friendly');
    const [instr, setInstr] = useState('');
    const [text, setText] = useState('');
    const [msgId, setMsgId] = useState(null);
    const [warn, setWarn] = useState('');
    const [err, setErr] = useState('');
    const hist = useQuery({ queryKey: ['ai-messages', leadId], queryFn: () => api('/ai/messages' + qs({ leadId })) });
    const gen = useMutation({ mutationFn: (regenerate) => api('/ai/generate', { method: 'POST', body: { leadId, kind, tone, instructions: instr || undefined, regenerate } }),
        onSuccess: (r) => { setText(r.text); setMsgId(r.id); setErr(''); setWarn(r.productInfoMissing ? 'No approved product description is saved for this workspace, so the message stays general. Add it in Settings.' : ''); qc.invalidateQueries({ queryKey: ['ai-messages', leadId] }); }, onError: (e) => setErr(e.message) });
    const save = useMutation({ mutationFn: () => api(`/ai/messages/${msgId}/save-template`, { method: 'POST', body: { name: prompt('Name this template') || '' } }), onSuccess: () => notify('Saved as a personal template'), onError: (e) => notify(e.issues?.[0]?.message || e.message) });
    return (<section className="card p-4 space-y-3"><h2 className="font-medium flex items-center gap-2"><Sparkles size={16} className="text-primary"/>AI message generator</h2>
      <div className="grid sm:grid-cols-2 gap-2"><select className="input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Message type">{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select><select className="input" value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tone">{Object.entries(TONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
      {kind === 'custom' && <input className="input" placeholder="What should the message say?" aria-label="Custom instructions" value={instr} onChange={(e) => setInstr(e.target.value)} maxLength={500}/>}
      <div className="flex flex-wrap gap-2"><button className="btn btn-primary" onClick={() => gen.mutate(false)} disabled={gen.isPending}>{gen.isPending ? 'Writing...' : 'Generate message'}</button>{text && <button className="btn" onClick={() => gen.mutate(true)} disabled={gen.isPending}><RefreshCw size={14}/>Regenerate</button>}</div>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}{warn && <p className="text-xs text-[#9A6410]">{warn}</p>}
      {text && <><textarea className="input min-h-[120px]" value={text} onChange={(e) => setText(e.target.value)} aria-label="Generated message"/><div className="flex flex-wrap gap-2"><button className="btn" onClick={() => { navigator.clipboard?.writeText(text); notify('Message copied'); }}><Copy size={14}/>Copy</button><button className="btn" onClick={() => save.mutate()}>Save as template</button></div>
        <p className="text-xs text-muted">AI drafts are never sent automatically. Check the facts, then send it yourself in WhatsApp. To send via LeadPilot's WhatsApp flow, paste the text into the Message box above.</p></>}
      {hist.data?.items?.length > 0 && <details className="text-sm"><summary className="cursor-pointer text-primary">Previous messages ({hist.data.items.length})</summary><ul className="mt-2 space-y-2">{hist.data.items.map((m) => <li key={m._id} className="border border-line rounded-lg p-2"><div className="text-xs text-muted">{KINDS[m.kind]} - {fmt(m.createdAt)}</div><div className="whitespace-pre-wrap">{m.text}</div><button className="text-primary text-xs" onClick={() => { setText(m.text); setMsgId(m._id); }}>Reuse</button></li>)}</ul></details>}
    </section>);
}
