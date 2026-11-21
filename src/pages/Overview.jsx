import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Compass } from 'lucide-react';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox, Stat } from '../components/ui';
import GoalWidget from '../components/GoalWidget';
import { useApp } from '../context/AppContext';
import { api, qs } from '../services/api';
import { DEPT } from '../constants';
export default function Overview() {
    const { role, user, myDepts } = useApp();
    const [days, setDays] = useState(7);
    const from = new Date(Date.now() - (days - 1) * 864e5);
    from.setHours(0, 0, 0, 0);
    const q = useQuery({ queryKey: ['overview', days], queryFn: () => api('/analytics/overview' + qs({ from: from.toISOString() })) });
    const fu = useQuery({ queryKey: ['followups', 'counts'], queryFn: () => api('/followups?bucket=today&limit=1') });
    const depts = useQuery({ queryKey: ['dept-metrics', days], queryFn: () => api('/analytics/departments' + qs({ from: from.toISOString() })), enabled: role === 'owner' });
    const ai = useQuery({ queryKey: ['ai-usage'], queryFn: () => api('/ai/usage'), enabled: role === 'owner' });
    const m = q.data?.metrics;
    const x = q.data?.extras;
    return <>
    <PageHeader title={`${new Date().getHours() < 12 ? 'Good morning' : 'Welcome back'}, ${user?.name.split(' ')[0]}`} desc={role === 'owner' ? "Here's an overview of your lead generation and outreach activities." : "Here's what is happening with your leads."} action={<div className="flex gap-2"><select className="input !w-auto" value={days} onChange={(e) => setDays(+e.target.value)} aria-label="Date range"><option value={1}>Today</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select><Link to="/discover" className="btn btn-primary"><Compass size={16}/>Discover leads</Link></div>}/>
    <div className="mb-6"><GoalWidget /></div>
    {q.isLoading ? <Skeleton rows={3}/> : q.error ? <ErrorBox error={q.error} retry={q.refetch}/> : m.discovered === 0 && m.contacted === 0 ? <Empty title="No activity in this period" desc="Discover businesses with Google Search, the Chrome extension or a CSV file to get started." action={<Link to="/discover" className="btn btn-primary">Discover leads</Link>}/> : <>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-2">
        <Stat label={role === 'owner' ? 'Leads discovered' : 'My leads discovered'} value={m.discovered}/><Stat label="Contact-ready" value={m.contactReady}/><Stat label="Outreach confirmed" value={m.contacted} hint={`${m.opensNotCounted} WhatsApp opens not counted`}/>
        <Stat label="Responses" value={m.responded} hint={`${m.responseRate}% of contacted`}/><Stat label="Interested" value={m.interested}/><Stat label="Conversions" value={m.converted} hint={`${m.conversionRate}% of contacted`}/></div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-2 mt-3"><Stat label="New leads today" value={x.newToday}/><Stat label="Qualified leads" value={x.qualified} hint="Contact-ready with a medium or high complete record"/><Stat label="Duplicates prevented" value={x.duplicatesPrevented}/><Stat label="Awaiting response" value={x.awaitingResponse}/><Stat label="Demo requests" value={m.demoRequested}/><Stat label="Follow-ups overdue" value={m.overdueFollowUps}/></div>
      <p className="text-xs text-muted mb-6">Outreach confirmed counts only messages you confirmed as sent. Opening WhatsApp, interest and demo requests are not sales.</p>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-2"><h2 className="font-medium mb-3">Activity</h2><div className="h-64"><ResponsiveContainer><AreaChart data={q.data.series}><CartesianGrid stroke="#E8EBF2" vertical={false}/><XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tickLine={false} axisLine={false} fontSize={12}/><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28}/><Tooltip />
          <Area dataKey="discovered" name="Discovered" stroke="#3157D5" fill="#3157D5" fillOpacity={0.12}/><Area dataKey="contacted" name="Outreach confirmed" stroke="#159B69" fill="#159B69" fillOpacity={0.12}/><Area dataKey="responses" name="Responses" stroke="#E9A23B" fill="#E9A23B" fillOpacity={0.12}/></AreaChart></ResponsiveContainer></div></div>
        <div className="card p-4"><h2 className="font-medium mb-3">Pipeline</h2><ul className="space-y-2 text-sm">{q.data.funnel.map((f) => <li key={f.stage} className="flex justify-between"><span>{f.stage}</span><b>{f.n}</b></li>)}</ul>
          <Link to="/followups" className="block mt-4 text-sm text-primary">{fu.data?.counts?.today ?? 0} follow-ups due today, {fu.data?.counts?.overdue ?? 0} overdue</Link></div></div></>}
    {role === 'owner' && ai.data && <section className="card p-4 mb-6"><h2 className="font-medium mb-2">AI usage this month</h2>{!ai.data.configured ? <p className="text-sm text-muted">Gemini is not configured. Add GEMINI_API_KEY on the server to enable AI features.</p> : <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm"><div><b>{ai.data.generated}</b><div className="text-xs text-muted">Messages generated</div></div><div><b>{ai.data.requests}</b><div className="text-xs text-muted">AI requests</div></div><div><b>{ai.data.tokens || 'n/a'}</b><div className="text-xs text-muted">Tokens reported</div></div><div><b>{ai.data.rateLimited}</b><div className="text-xs text-muted">Rate-limit events</div></div><div><b>{ai.data.errors.length}</b><div className="text-xs text-muted">Recent errors</div></div></div>}</section>}
    <div className="grid sm:grid-cols-3 gap-3">{myDepts.map((d) => {
            const dm = depts.data?.items?.find((x) => x.department === d);
            return (<Link key={d} to={`/workspace/${d}`} className="card p-4 block hover:bg-canvas" style={{ borderLeft: `4px solid ${DEPT[d].color}` }}><div className="font-medium">{DEPT[d].name}</div><div className="text-sm text-muted">{dm ? `${dm.discovered} discovered, ${dm.contacted} contacted, ${dm.converted} converted` : DEPT[d].blurb}</div></Link>);
        })}</div>
  </>;
}
