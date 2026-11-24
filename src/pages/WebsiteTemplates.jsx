import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, FolderUp, FileCode, Eye, Trash2 } from 'lucide-react';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox } from '../components/ui';
import SitePreview from '../components/SitePreview';
import { api, apiUpload, apiUrl } from '../services/api';
import { buildZip } from '../utils/zipClient';
import { useApp } from '../context/AppContext';
import { fmt } from '../constants';

const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function CategoryCard({ item, fields, maxMb, onChanged, setPreview }) {
  const { notify } = useApp(); const { category, template: t } = item; const zipIn = useRef(); const dirIn = useRef(); const htmlIn = useRef(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [map, setMap] = useState(() => ({ ...(t?.mappings || {}) })); const [mapFor, setMapFor] = useState(t?.id + ':' + t?.version);
  if (t && mapFor !== t.id + ':' + t.version) { setMap({ ...(t.mappings || {}) }); setMapFor(t.id + ':' + t.version); }
  const upload = async (list, mode) => {
    const files = [...list]; if (!files.length) return; setErr(''); setBusy(true);
    try {
      let bytes, name;
      if (mode === 'zip') { if (!/\.zip$/i.test(files[0].name)) throw new Error('Choose a .zip file.'); bytes = new Uint8Array(await files[0].arrayBuffer()); name = files[0].name; }
      else { const entries = await Promise.all(files.map(async (f) => ({ path: f.webkitRelativePath || f.name, bytes: new Uint8Array(await f.arrayBuffer()) }))); bytes = buildZip(entries); name = (files[0].webkitRelativePath?.split('/')[0] || files[0].name.replace(/\.[^.]+$/, '')) + '.zip'; }
      if (bytes.length > maxMb * 1048576) throw new Error(`That is larger than the ${maxMb} MB limit.`);
      await apiUpload(`/website-templates/${category.id}/upload`, bytes, name); notify(t ? 'Template replaced' : 'Template uploaded'); onChanged();
    } catch (e) { setErr(e.message); } finally { setBusy(false); [zipIn, dirIn, htmlIn].forEach((r) => r.current && (r.current.value = '')); }
  };
  const save = useMutation({ mutationFn: () => api(`/website-templates/${category.id}/mappings`, { method: 'PUT', body: { mappings: Object.fromEntries(Object.entries(map).filter(([, v]) => v.field).map(([k, v]) => [k, { field: v.field, default: v.default || undefined }])) } }), onSuccess: () => { notify('Mappings saved'); onChanged(); }, onError: (e) => setErr(e.message) });
  const remove = useMutation({ mutationFn: () => api(`/website-templates/${category.id}`, { method: 'DELETE' }), onSuccess: () => { notify('Template removed'); onChanged(); }, onError: (e) => setErr(e.message) });
  const prev = async () => { try { const r = await api(`/website-templates/${category.id}/preview-token`, { method: 'POST' }); setPreview({ src: apiUrl(r.path), title: `${category.name} template (original)` }); } catch (e) { setErr(e.message); } };
  const setM = (name, patch) => setMap({ ...map, [name]: { ...(map[name] || {}), ...patch } });
  const uploader = (label) => <div className="flex flex-wrap gap-2">
    <button className="btn !min-h-[36px]" disabled={busy} onClick={() => zipIn.current.click()}><Upload size={14} />{label} ZIP</button>
    <button className="btn !min-h-[36px]" disabled={busy} onClick={() => dirIn.current.click()}><FolderUp size={14} />Folder</button>
    <button className="btn !min-h-[36px]" disabled={busy} onClick={() => htmlIn.current.click()}><FileCode size={14} />HTML files</button>
    <input ref={zipIn} type="file" accept=".zip" hidden onChange={(e) => upload(e.target.files, 'zip')} aria-label="Template ZIP" />
    <input ref={dirIn} type="file" webkitdirectory="" directory="" multiple hidden onChange={(e) => upload(e.target.files, 'files')} aria-label="Template folder" />
    <input ref={htmlIn} type="file" accept=".html,.htm,.css,.js,.png,.jpg,.jpeg,.gif,.svg,.webp,.ico,.woff,.woff2,.ttf,.otf" multiple hidden onChange={(e) => upload(e.target.files, 'files')} aria-label="HTML and asset files" /></div>;
  return (
    <section className="card p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-medium">{category.name}</h2>{t ? <span className={`rounded-full text-xs font-medium px-2.5 py-0.5 ${t.configured ? 'bg-[#E6F5EF] text-ok' : 'bg-[#FDF3E2] text-[#9A6410]'}`}>{t.configured ? 'Active and ready' : 'Needs mapping'}</span> : <span className="text-xs text-muted">No template yet</span>}</div>
      {busy && <p className="text-sm text-muted" role="status">Uploading and checking the template...</p>}
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      {!t ? <><p className="text-sm text-muted">Upload one website template for this category. Use a ZIP, a folder, or HTML files with their CSS, JavaScript and images. Up to {maxMb} MB.</p>{uploader('Upload')}</> : <>
        <div className="text-sm text-muted">{t.name} &middot; version {t.version} &middot; uploaded {fmt(t.uploadedAt)} &middot; {t.fileCount} files ({t.htmlFiles.length} HTML), {size(t.size)}</div>
        <div className="flex flex-wrap gap-2"><button className="btn !min-h-[36px]" onClick={prev}><Eye size={14} />Preview original</button>{uploader('Replace with')}<button className="btn btn-danger !min-h-[36px]" onClick={() => window.confirm('Remove this template? Websites already generated keep working.') && remove.mutate()}><Trash2 size={14} />Remove</button></div>
        <div>
          <h3 className="text-sm font-medium mb-1">Placeholders found ({t.placeholders.length})</h3>
          {!t.placeholders.length ? <p className="text-sm text-muted">No {'{{placeholders}}'} were found. The template will be delivered as it is.</p> : <>
            <p className="text-xs text-muted mb-2">Choose the lead information for each one, once. It is remembered for every website made from this template. "Leave unchanged" keeps the placeholder as written. Fallback text is used only when the lead has no information for that field.</p>
            <div className="overflow-x-auto border border-line rounded-lg"><table className="w-full"><thead><tr><th className="th">Placeholder</th><th className="th">Used</th><th className="th">Fill with</th><th className="th">Fallback text (optional)</th></tr></thead>
              <tbody>{t.placeholders.map((p) => <tr key={p.name} className="border-t border-line"><td className="td font-mono text-xs">{`{{${p.name}}}`}</td><td className="td text-xs text-muted">{p.count}x in {p.files.length} file{p.files.length === 1 ? '' : 's'}</td>
                <td className="td"><select className="input !min-h-[34px] !py-1" value={map[p.name]?.field || ''} aria-label={`Field for ${p.name}`} onChange={(e) => setM(p.name, { field: e.target.value })}><option value="">Choose...</option><option value="none">Leave unchanged</option>{fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}</select></td>
                <td className="td"><input className="input !min-h-[34px] !py-1" maxLength={200} value={map[p.name]?.default || ''} aria-label={`Fallback for ${p.name}`} onChange={(e) => setM(p.name, { default: e.target.value })} /></td></tr>)}</tbody></table></div>
            <div className="mt-2"><button className="btn btn-primary" disabled={save.isPending} onClick={() => save.mutate()}>Save mappings</button></div></>}
        </div></>}
    </section>);
}

export default function WebsiteTemplates() {
  const { notify } = useApp(); const qc = useQueryClient(); const [preview, setPreview] = useState(null); const [name, setName] = useState('');
  const q = useQuery({ queryKey: ['website-templates'], queryFn: () => api('/website-templates') }); const changed = () => qc.invalidateQueries({ queryKey: ['website-templates'] });
  const add = useMutation({ mutationFn: () => api('/categories', { method: 'POST', body: { department: 'website', name: name.trim() } }), onSuccess: () => { setName(''); notify('Category added'); changed(); qc.invalidateQueries({ queryKey: ['departments'] }); }, onError: (e) => notify(e.issues?.[0]?.message || e.message) });
  return <>
    <PageHeader title="Website templates" desc="One template per Website Outreach category. When you mark a lead's message as sent, a personalised copy is prepared for download." />
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch} /> : <>
      <div className="grid md:grid-cols-2 gap-4 items-start">{q.data.items.map((it) => <CategoryCard key={it.category.id} item={it} fields={q.data.fields} maxMb={q.data.maxMb} onChanged={changed} setPreview={setPreview} />)}</div>
      {!q.data.items.length && <Empty title="No categories yet" desc="Add a Website Outreach category below, then upload its template." />}
      <section className="card p-4 mt-4 max-w-xl"><h2 className="font-medium mb-1">Add a category</h2><p className="text-xs text-muted mb-2">These are the same categories used when discovering leads, for example Restaurants or Hotels.</p><div className="flex gap-2"><input className="input" placeholder="Category name" aria-label="Category name" value={name} onChange={(e) => setName(e.target.value)} /><button className="btn btn-primary" disabled={name.trim().length < 2 || add.isPending} onClick={() => add.mutate()}>Add</button></div></section></>}
    {preview && <SitePreview src={preview.src} title={preview.title} onClose={() => setPreview(null)} />}
  </>;
}
