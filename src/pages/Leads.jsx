import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox } from '../components/ui';
import { SourceBadge, StatusBadge, VerifyBadge, WebsiteBadge } from '../components/Badges';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT, MANUAL_STATUSES, fmtDay } from '../constants';

export default function Leads() {
  const { user, role, myDepts, notify } = useApp(); const qc = useQueryClient(); const [sp] = useSearchParams(); const owner = role === 'owner';
  // The owner starts on their own leads and can switch to the whole team (or one person). Members only ever see their own.
  const [f, setF] = useState({ search: sp.get('q') || '', department: '', status: '', source: '', verification: '', assignedTo: owner ? user.id : '' });
  const [page, setPage] = useState(1); const [sel, setSel] = useState(new Set()); const [bulk, setBulk] = useState('');
  const set = (k, v) => { setF({ ...f, [k]: v }); setPage(1); setSel(new Set()); };
  const leads = useQuery({ queryKey: ['leads', f, page], queryFn: () => api('/leads' + qs({ ...f, page, limit: 25 })) });
  const team = useQuery({ queryKey: ['team'], queryFn: () => api('/team'), enabled: owner });
  const run = useMutation({
    mutationFn: async () => { const [kind, v] = bulk.split(':'); await Promise.all([...sel].map((id) => (kind === 'status' ? api(`/leads/${id}`, { method: 'PATCH', body: { status: v } }) : api(`/leads/${id}/assign`, { method: 'POST', body: { userId: v } })))); },
    onSuccess: () => { notify(`${sel.size} leads updated`); setSel(new Set()); setBulk(''); qc.invalidateQueries({ queryKey: ['leads'] }); }, onError: (e) => notify(e.message),
  });
  const items = leads.data?.items || []; const toggle = (id) => { const s = new Set(sel); s.has(id) ? s.delete(id) : s.add(id); setSel(s); };
  const showingMine = !owner || f.assignedTo === user.id; const showingAll = owner && f.assignedTo === '';
  const who = owner ? (showingMine ? 'Your leads' : showingAll ? 'All team leads' : `${team.data?.items?.find((u) => u.id === f.assignedTo)?.name || 'Team member'}'s leads`) : 'Your leads';
  const exportCsv = () => {
    const rows = [['Business', 'Category', 'City', 'Phone', 'Website', 'Source', 'Verification', 'Status']].concat(items.map((l) => [l.business.name, l.business.category || '', l.business.city || '', l.business.phones?.[0] || '', l.business.website || '', l.source, l.verification, l.status]));
    const esc = (c) => `"${String(c).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.map((r) => r.map(esc).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'leads.csv'; a.click();
  };
  return <>
    <PageHeader title={owner ? who : 'My leads'} desc={owner ? (showingMine ? 'Showing the leads assigned to you. Switch to see your whole team.' : showingAll ? 'Showing every lead across your team.' : 'Showing one team member.') : 'Manage your prospects and track every outreach interaction.'} action={<div className="flex gap-2"><button className="btn" onClick={exportCsv} disabled={!items.length}>Export page</button><Link to="/discover" className="btn btn-primary">Discover leads</Link></div>} />
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-4">
      {owner && <select className="input col-span-2 lg:col-span-1 font-medium" value={f.assignedTo} onChange={(e) => set('assignedTo', e.target.value)} aria-label="Whose leads to show"><option value={user.id}>My leads</option><option value="">All team leads</option>{team.data?.items?.filter((u) => u.id !== user.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
      <input className="input col-span-2" placeholder="Search business" value={f.search} onChange={(e) => set('search', e.target.value)} aria-label="Search business" />
      <select className="input" value={f.department} onChange={(e) => set('department', e.target.value)} aria-label="Workspace"><option value="">All workspaces</option>{myDepts.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select>
      <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)} aria-label="Status"><option value="">All statuses</option>{['New', 'Outreach Opened', 'Contacted', ...MANUAL_STATUSES.slice(1)].map((s) => <option key={s}>{s}</option>)}</select>
      <select className="input" value={f.source} onChange={(e) => set('source', e.target.value)} aria-label="Source"><option value="">All sources</option><option value="google_search">Google Search</option><option value="chrome_extension">Chrome Extension</option><option value="csv_import">CSV Import</option><option value="google_maps">Google Maps</option><option value="manual">Manual Entry</option></select>
      <select className="input" value={f.verification} onChange={(e) => set('verification', e.target.value)} aria-label="Verification"><option value="">All verification</option><option value="verified">Verified</option><option value="unverified">Unverified</option><option value="requires_review">Needs review</option></select>
    </div>
    {sel.size > 0 && <div className="card p-3 mb-3 flex flex-wrap items-center gap-2"><b className="text-sm">{sel.size} selected</b>
      <select className="input !w-auto" value={bulk} onChange={(e) => setBulk(e.target.value)} aria-label="Bulk action"><option value="">Choose action</option><optgroup label="Set status">{MANUAL_STATUSES.map((s) => <option key={s} value={'status:' + s}>{s}</option>)}</optgroup>{owner && <optgroup label="Assign to">{team.data?.items?.filter((u) => u.active).map((u) => <option key={u.id} value={'assign:' + u.id}>{u.name}</option>)}</optgroup>}</select>
      <button className="btn btn-primary" disabled={!bulk || run.isPending} onClick={() => run.mutate()}>Apply</button><button className="btn" onClick={() => setSel(new Set())}>Clear</button></div>}
    {leads.isLoading ? <Skeleton /> : leads.error ? <ErrorBox error={leads.error} retry={leads.refetch} /> : !items.length ? <Empty title="No leads match" desc={owner && showingMine ? 'You have no leads under these filters. Switch to "All team leads" to see your team, or discover new businesses.' : 'Change the filters, or discover new businesses.'} action={<Link to="/discover" className="btn btn-primary">Discover leads</Link>} /> : <>
      <div className="hidden md:block card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line"><th className="th w-8"><input type="checkbox" aria-label="Select all" checked={sel.size === items.length} onChange={(e) => setSel(e.target.checked ? new Set(items.map((l) => l.id)) : new Set())} /></th>
        {['Business', 'Workspace', 'City', 'Phone', 'Website', 'Source', 'Verification', 'Status', ...(owner && !showingMine ? ['Assigned'] : []), 'Next follow-up'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{items.map((l) => <tr key={l.id} className="border-b border-line last:border-0"><td className="td"><input type="checkbox" aria-label={`Select ${l.business.name}`} checked={sel.has(l.id)} onChange={() => toggle(l.id)} /></td>
          <td className="td"><Link className="font-medium text-primary" to={`/leads/${l.id}`}>{l.business.name}</Link><div className="text-xs text-muted">{l.business.category}</div></td><td className="td">{DEPT[l.department].name}</td><td className="td">{l.business.city || '-'}</td><td className="td">{l.business.phones?.[0] ? '+' + l.business.phones[0] : <span className="text-muted">None</span>}</td>
          <td className="td"><WebsiteBadge s={l.business.websiteStatus} /></td><td className="td"><SourceBadge source={l.source} /></td><td className="td"><VerifyBadge v={l.verification} /></td><td className="td"><StatusBadge s={l.status} /></td>{owner && !showingMine && <td className="td">{l.assignedTo?.name}</td>}<td className="td whitespace-nowrap">{fmtDay(l.nextFollowUpAt)}</td></tr>)}</tbody></table></div>
      <div className="md:hidden space-y-3">{items.map((l) => <Link key={l.id} to={`/leads/${l.id}`} className="card p-4 space-y-2 block"><div className="flex justify-between gap-2"><div><div className="font-medium">{l.business.name}</div><div className="text-xs text-muted">{l.business.category} &middot; {l.business.city}{owner && !showingMine && l.assignedTo?.name ? ` · ${l.assignedTo.name}` : ''}</div></div><StatusBadge s={l.status} /></div><div className="flex flex-wrap gap-2"><SourceBadge source={l.source} /><VerifyBadge v={l.verification} /></div></Link>)}</div>
      <div className="flex items-center justify-between mt-4 text-sm"><span className="text-muted">{leads.data.total} leads</span><div className="flex gap-2"><button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span className="self-center">Page {page} of {leads.data.pages || 1}</span><button className="btn" disabled={page >= leads.data.pages} onClick={() => setPage(page + 1)}>Next</button></div></div></>}
  </>;
}
