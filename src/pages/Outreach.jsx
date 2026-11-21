import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox } from '../components/ui';
import Composer from '../components/Composer';
import { StatusBadge } from '../components/Badges';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT } from '../constants';
export default function Outreach() {
    const { myDepts } = useApp();
    const [dept, setDept] = useState('');
    const [status, setStatus] = useState('New');
    const [sel, setSel] = useState(null);
    const list = useQuery({ queryKey: ['leads', 'outreach', dept, status], queryFn: () => api('/leads' + qs({ department: dept, status, limit: 50 })) });
    const items = (list.data?.items || []).filter((l) => l.contactReady);
    const current = useQuery({ queryKey: ['lead', sel], queryFn: () => api(`/leads/${sel}`), enabled: !!sel });
    return <>
    <PageHeader title="Outreach" desc="Work through contact-ready leads one at a time."/>
    <div className="flex gap-2 mb-4"><select className="input !w-auto" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Workspace"><option value="">All workspaces</option>{myDepts.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select>
      <select className="input !w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">{['New', 'Outreach Opened', 'Contacted', 'Responded', 'No Response'].map((s) => <option key={s}>{s}</option>)}</select></div>
    {list.isLoading ? <Skeleton /> : list.error ? <ErrorBox error={list.error} retry={list.refetch}/> : !items.length ? <Empty title="No contact-ready leads" desc="Leads need a valid phone number to appear here." action={<Link to="/discover" className="btn btn-primary">Discover leads</Link>}/> :
            <div className="grid lg:grid-cols-5 gap-4"><div className="lg:col-span-2 card max-h-[70vh] overflow-y-auto">{items.map((l) => <button key={l.id} onClick={() => setSel(l.id)} className={`w-full text-left px-4 py-3 border-b border-line last:border-0 ${sel === l.id ? 'bg-primary/5' : 'hover:bg-canvas'}`}><div className="flex justify-between gap-2"><span className="font-medium">{l.business.name}</span><StatusBadge s={l.status}/></div><div className="text-xs text-muted">{l.business.category} &middot; {l.business.city}</div></button>)}</div>
        <div className="lg:col-span-3">{!sel ? <div className="card p-6 text-sm text-muted">Select a lead to prepare a message.</div> : current.isLoading ? <Skeleton rows={3}/> : current.data && <div className="space-y-3"><div className="card p-4"><Link to={`/leads/${sel}`} className="font-medium text-primary">{current.data.business.name}</Link><div className="text-sm text-muted">+{current.data.business.phones?.[0]}</div></div>
          <Composer lead={current.data} pendingEventId={current.data.status === 'Outreach Opened' ? current.data.outreach.find((e) => e.type === 'opened')?._id : undefined}/></div>}</div></div>}
  </>;
}
