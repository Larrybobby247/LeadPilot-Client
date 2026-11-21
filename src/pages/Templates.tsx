import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox, Modal, Field } from '../components/ui';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT, PURPOSES } from '../constants';

export default function Templates() {
  const { role, myDepts, user, notify } = useApp(); const qc = useQueryClient(); const [dept, setDept] = useState(myDepts[0] as string); const [edit, setEdit] = useState<any>(null); const [prev, setPrev] = useState('');
  const q = useQuery({ queryKey: ['templates', 'all', dept], queryFn: () => api<any>('/templates' + qs({ department: dept })) }); const vars = useQuery({ queryKey: ['tpl-vars'], queryFn: () => api<any>('/templates/variables') });
  const inv = () => qc.invalidateQueries({ queryKey: ['templates'] });
  const save = useMutation({ mutationFn: (t: any) => t._id ? api(`/templates/${t._id}`, { method: 'PATCH', body: { name: t.name, category: t.category, purpose: t.purpose, body: t.body, active: t.active } }) : api('/templates', { method: 'POST', body: t }), onSuccess: () => { setEdit(null); notify('Template saved'); inv(); }, onError: (e: any) => notify(e.issues?.[0]?.message || e.message) });
  const dup = useMutation({ mutationFn: (id: string) => api(`/templates/${id}/duplicate`, { method: 'POST' }), onSuccess: () => { notify('Copied to your personal templates'); inv(); } });
  const del = useMutation({ mutationFn: (id: string) => api(`/templates/${id}`, { method: 'DELETE' }), onSuccess: () => { notify('Template deleted'); inv(); }, onError: (e: any) => notify(e.message) });
  const toggle = useMutation({ mutationFn: (t: any) => api(`/templates/${t._id}`, { method: 'PATCH', body: { active: !t.active } }), onSuccess: inv, onError: (e: any) => notify(e.message) });
  const preview = async (body: string) => { const r = await api<any>('/templates/preview', { method: 'POST', body: { body } }); setPrev(r.text); };
  const canEdit = (t: any) => (t.scope === 'global' ? role === 'owner' : t.owner === user?.id);
  const items: any[] = q.data?.items || [];
  return <>
    <PageHeader title="Message templates" desc={role === 'owner' ? 'Manage global templates and your own.' : 'Use global templates, or create and duplicate your own.'} action={<button className="btn btn-primary" onClick={() => setEdit({ name: '', department: dept, category: 'General', purpose: 'initial_outreach', body: '', active: true })}>New template</button>} />
    <div role="tablist" className="flex gap-1 border-b border-line mb-4">{myDepts.map((d) => <button key={d} role="tab" aria-selected={dept === d} onClick={() => setDept(d)} className={`px-4 py-2.5 text-sm border-b-2 ${dept === d ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'}`}>{DEPT[d].name}</button>)}</div>
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch} /> : !items.length ? <Empty title="No templates" desc="Create one, or ask the owner to add global templates." /> :
      <div className="grid md:grid-cols-2 gap-3">{items.map((t) => <div key={t._id} className="card p-4 space-y-2"><div className="flex justify-between gap-2"><div><div className="font-medium">{t.name}</div><div className="text-xs text-muted">{PURPOSES[t.purpose]} &middot; {t.category} &middot; {t.scope === 'global' ? 'Global' : 'Personal'}{!t.active ? ' · Inactive' : ''}</div></div></div>
        <p className="text-sm text-ink/80 whitespace-pre-wrap line-clamp-4">{t.body}</p>
        <div className="flex flex-wrap gap-2 text-sm"><button className="text-primary" onClick={() => preview(t.body)}>Preview</button>{canEdit(t) && <button className="text-primary" onClick={() => setEdit(t)}>Edit</button>}<button className="text-primary" onClick={() => dup.mutate(t._id)}>Duplicate</button>{canEdit(t) && <button className="text-primary" onClick={() => toggle.mutate(t)}>{t.active ? 'Deactivate' : 'Activate'}</button>}{canEdit(t) && <button className="text-danger" onClick={() => confirm('Delete this template?') && del.mutate(t._id)}>Delete</button>}</div></div>)}</div>}
    {prev && <Modal title="Preview with sample data" onClose={() => setPrev('')}><p className="text-sm whitespace-pre-wrap">{prev}</p></Modal>}
    {edit && <Modal title={edit._id ? 'Edit template' : 'New template'} desc={edit._id ? undefined : role === 'owner' ? 'Saved as a global template.' : 'Saved as your personal template.'} onClose={() => setEdit(null)}><div className="space-y-3">
      <Field label="Name"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field><Field label="Purpose"><select className="input" value={edit.purpose} onChange={(e) => setEdit({ ...edit, purpose: e.target.value })}>{Object.entries(PURPOSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Business category"><input className="input" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field><Field label="Message"><textarea className="input min-h-[140px]" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} /></Field>
      <div className="flex flex-wrap gap-1">{vars.data?.variables?.map((v: string) => <button key={v} type="button" className="rounded-full border border-line px-2 py-0.5 text-xs" onClick={() => setEdit({ ...edit, body: edit.body + `{{${v}}}` })}>{`{{${v}}}`}</button>)}</div>
      <div className="flex justify-between"><button className="btn" onClick={() => preview(edit.body)} disabled={!edit.body}>Preview</button><div className="flex gap-2"><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" disabled={edit.name.trim().length < 2 || edit.body.trim().length < 5 || save.isPending} onClick={() => save.mutate(edit)}>Save</button></div></div></div></Modal>}
  </>;
}
