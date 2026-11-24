import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe, Download, Eye, RefreshCw, TriangleAlert } from 'lucide-react';
import { api, apiDownload, apiUrl } from '../services/api';
import { useApp } from '../context/AppContext';
import { fmt } from '../constants';
import SitePreview from './SitePreview';

// Appears on Website Outreach leads only after the message is marked as sent. The website is prepared automatically in the background.
export default function WebsiteCard({ lead }) {
  const { role, notify } = useApp(); const qc = useQueryClient(); const [preview, setPreview] = useState(null); const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['lead-website', lead.id], queryFn: () => api(`/lead-websites/${lead.id}`), refetchInterval: (query) => (query.state.data?.state === 'generating' ? 2000 : false) });
  const gen = useMutation({ mutationFn: () => api(`/lead-websites/${lead.id}/generate`, { method: 'POST', body: {} }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['lead-website', lead.id] }); }, onError: (e) => notify(e.message) });
  const s = q.data; if (!s || ['not_applicable', 'not_sent'].includes(s.state)) return null;
  const openPreview = async () => { try { const r = await api(`/lead-websites/${lead.id}/preview-token`, { method: 'POST' }); setPreview(apiUrl(r.path)); } catch (e) { notify(e.message); } };
  const download = async () => { setBusy(true); try { await apiDownload(`/lead-websites/${lead.id}/download`, 'website.zip'); } catch (e) { notify(e.message); } finally { setBusy(false); } };
  return (
    <section className="card p-4 space-y-2" aria-label="Website">
      <h2 className="font-medium flex items-center gap-2"><Globe size={16} className="text-primary" />Website</h2>
      {s.state === 'no_template' && <p className="text-sm text-[#9A6410] bg-[#FDF3E2] rounded-lg p-3 flex gap-2"><TriangleAlert size={16} className="mt-0.5 shrink-0" /><span>{s.message} {role === 'owner' ? <Link to="/website-templates" className="underline font-medium">Add a template</Link> : 'Ask the owner to add one.'}</span></p>}
      {s.state === 'needs_config' && <p className="text-sm text-[#9A6410] bg-[#FDF3E2] rounded-lg p-3">{s.message} {role === 'owner' ? <Link to="/website-templates" className="underline font-medium">Map placeholders</Link> : 'Ask the owner to finish setting it up.'}</p>}
      {s.state === 'pending' && <><p className="text-sm text-muted">A "{s.category}" template is ready, but this lead's website has not been prepared yet.</p><button className="btn" onClick={() => gen.mutate()} disabled={gen.isPending}>Prepare website</button></>}
      {s.state === 'generating' && <p className="text-sm text-muted" role="status">Preparing the website for this lead...</p>}
      {s.state === 'failed' && <><p role="alert" className="text-sm text-danger">{s.error}</p><button className="btn" onClick={() => gen.mutate()} disabled={gen.isPending}>Try again</button></>}
      {s.state === 'ready' && <>
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#E6F5EF] text-ok text-xs font-medium px-2.5 py-0.5">Website Preview Ready</span><span className="text-xs text-muted">Template: {s.category}{s.templateVersion ? ` (v${s.templateVersion})` : ''} &middot; {fmt(s.generatedAt)}</span></div>
        <div className="flex flex-wrap gap-2"><button className="btn" onClick={openPreview}><Eye size={16} />Preview</button><button className="btn btn-primary" onClick={download} disabled={busy}><Download size={16} />{busy ? 'Preparing...' : 'Download Website'}</button></div>
        {s.stale && <p className="text-xs text-[#9A6410]">This lead's details or the template changed since it was prepared. <button className="underline font-medium inline-flex items-center gap-1" onClick={() => gen.mutate()} disabled={gen.isPending}><RefreshCw size={12} />Regenerate</button></p>}
        {s.unfilled?.length > 0 && <p className="text-xs text-muted">Not filled (no information on file): {s.unfilled.join(', ')}.</p>}
        {s.warnings?.length > 0 && <p className="text-xs text-muted">{s.warnings.join(' ')}</p>}
      </>}
      {preview && <SitePreview src={preview} title={`Website for ${lead.business?.name || 'this lead'}`} onClose={() => setPreview(null)} />}
    </section>);
}
