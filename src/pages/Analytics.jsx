import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../components/Layout';
import { Skeleton, ErrorBox, Stat } from '../components/ui';
import { api, qs } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT } from '../constants';
export default function Analytics() {
    const { role, myDepts } = useApp();
    const [days, setDays] = useState(30);
    const [dept, setDept] = useState('');
    const from = new Date(Date.now() - (days - 1) * 864e5);
    from.setHours(0, 0, 0, 0);
    const p = { from: from.toISOString(), department: dept };
    const ov = useQuery({ queryKey: ['analytics', 'overview', days, dept], queryFn: () => api('/analytics/overview' + qs(p)) });
    const team = useQuery({ queryKey: ['analytics', 'team', days, dept], queryFn: () => api('/analytics/team' + qs(p)), enabled: role === 'owner' });
    const m = ov.data?.metrics;
    return <>
    <PageHeader title="Analytics" desc="Understand your lead generation, outreach and conversion performance." action={<div className="flex gap-2"><select className="input !w-auto" value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Date range"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select>
      <select className="input !w-auto" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Workspace"><option value="">All workspaces</option>{myDepts.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select></div>}/>
    {ov.isLoading ? <Skeleton rows={4}/> : ov.error ? <ErrorBox error={ov.error} retry={ov.refetch}/> : <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6"><Stat label="Leads discovered" value={m.discovered}/><Stat label="Contact-ready" value={m.contactReady}/><Stat label="Outreach confirmed" value={m.contacted}/><Stat label="Response rate" value={`${m.responseRate}%`}/><Stat label="Interested" value={m.interested}/><Stat label="Conversion rate" value={`${m.conversionRate}%`}/></div>
      <div className="grid lg:grid-cols-2 gap-4 mb-6"><div className="card p-4"><h2 className="font-medium mb-3">Funnel</h2><div className="h-64"><ResponsiveContainer><BarChart data={ov.data.funnel} layout="vertical"><CartesianGrid stroke="#E8EBF2" horizontal={false}/><XAxis type="number" allowDecimals={false} fontSize={12}/><YAxis type="category" dataKey="stage" width={90} fontSize={12} tickLine={false} axisLine={false}/><Tooltip /><Bar dataKey="n" fill="#3157D5" radius={4}/></BarChart></ResponsiveContainer></div></div>
        <div className="card p-4 text-sm space-y-2"><h2 className="font-medium">How these are counted</h2><ul className="list-disc pl-5 text-muted space-y-1"><li>Outreach confirmed: the first time you confirmed a message as sent or recorded an email or call. Opening WhatsApp is never counted ({m.opensNotCounted} opens in this period).</li><li>Responses, interest, demo requests and conversions count the first time a lead reached that stage.</li><li>Interested is not converted. A demo request is not a sale.</li><li>Duplicate imports never create leads, so they are never counted.</li></ul></div></div></>}
    {role === 'owner' && <section className="card overflow-x-auto"><h2 className="font-medium p-4 pb-0">Team comparison</h2>{team.isLoading ? <div className="p-4"><Skeleton rows={2}/></div> : <table className="w-full"><thead><tr className="border-b border-line">{['Member', 'Discovered', 'Contacted', 'Responses', 'Interested', 'Follow-ups done', 'Converted'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
      <tbody>{team.data?.items?.map((r) => <tr key={r.userId} className="border-b border-line last:border-0"><td className="td font-medium">{r.name}</td><td className="td">{r.discovered}</td><td className="td">{r.contacted}</td><td className="td">{r.responded}</td><td className="td">{r.interested}</td><td className="td">{r.followUpsCompleted}</td><td className="td">{r.converted}</td></tr>)}</tbody></table>}</section>}
  </>;
}
