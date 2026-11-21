import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox } from '../components/ui';
import { SourceBadge, StatusBadge, VerifyBadge, WebsiteBadge } from '../components/Badges';
import { useApp } from '../context/AppContext';
import { api, qs } from '../services/api';
import { DEPT } from '../constants';

export default function Workspace() {
  const { dept } = useParams(); const { myDepts } = useApp(); const [cat, setCat] = useState(''); const [ws, setWs] = useState(dept === 'website' ? 'opportunities' : '');
  const info = useQuery({ queryKey: ['departments'], queryFn: () => api<any>('/departments') });
  const leads = useQuery({ queryKey: ['leads', 'ws', dept, cat, ws], queryFn: () => api<any>('/leads' + qs({ department: dept, category: cat, websiteStatus: ws, limit: 50 })), enabled: !!dept && myDepts.includes(dept as any) });
  if (!dept || !(dept in DEPT) || !myDepts.includes(dept as any)) return <Navigate to="/" replace />;
  const d = (DEPT as any)[dept]; const cats: string[] = info.data?.items?.find((x: any) => x.id === dept)?.categories || [];
  return <>
    <PageHeader title={`${d.name} workspace`} desc={d.blurb} action={<Link to={`/discover?dept=${dept}`} className="btn btn-primary">Discover leads</Link>} />
    <div className="flex flex-wrap gap-2 mb-4"><select className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option>{cats.map((c) => <option key={c}>{c}</option>)}</select>
      {dept === 'website' && <select className="input !w-auto" value={ws} onChange={(e) => setWs(e.target.value)} aria-label="Website status"><option value="opportunities">Opportunities (no working site)</option><option value="">All</option><option value="NO_WEBSITE">No website</option><option value="BROKEN_WEBSITE">Broken website</option><option value="PARKED_DOMAIN">Parked domain</option><option value="UNCERTAIN">Uncertain (manual review)</option><option value="WORKING_WEBSITE">Working website</option></select>}</div>
    {leads.isLoading ? <Skeleton /> : leads.error ? <ErrorBox error={leads.error} retry={leads.refetch} /> : !leads.data.items.length ? <Empty title="No leads here yet" desc="Discover businesses and import them into this workspace." action={<Link to={`/discover?dept=${dept}`} className="btn btn-primary">Discover leads</Link>} /> :
      <div className="card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line"><th className="th">Business</th><th className="th">City</th>{dept === 'website' && <th className="th">Website</th>}<th className="th">Source</th><th className="th">Verification</th><th className="th">Status</th></tr></thead>
        <tbody>{leads.data.items.map((l: any) => <tr key={l.id} className="border-b border-line last:border-0"><td className="td"><Link to={`/leads/${l.id}`} className="font-medium text-primary">{l.business.name}</Link><div className="text-xs text-muted">{l.business.category}</div></td><td className="td">{l.business.city || '-'}</td>{dept === 'website' && <td className="td"><WebsiteBadge s={l.business.websiteStatus} /></td>}<td className="td"><SourceBadge source={l.source} /></td><td className="td"><VerifyBadge v={l.verification} /></td><td className="td"><StatusBadge s={l.status} /></td></tr>)}</tbody></table></div>}
  </>;
}
