import { useState, ReactNode } from 'react';
import { NavLink, Link, useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Users, CalendarClock, Megaphone, Utensils, BedDouble, Globe, Compass, Chrome, History, UsersRound, BarChart3, MessageSquareText, ScrollText, Plug, Settings, Bell, Menu, PanelLeftClose, PanelLeftOpen, Search, Plane, LogOut, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

type Item = { to: string; label: string; Icon: any; owner?: boolean };
const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'General', items: [{ to: '/', label: 'Overview', Icon: LayoutDashboard }, { to: '/leads', label: 'My Leads', Icon: Users }, { to: '/outreach', label: 'Outreach', Icon: Send }, { to: '/followups', label: 'Follow-ups', Icon: CalendarClock }, { to: '/campaigns', label: 'Campaigns', Icon: Megaphone }] },
  { title: 'Workspaces', items: [{ to: '/workspace/ordarly', label: 'Ordarly', Icon: Utensils }, { to: '/workspace/keykonnec', label: 'KeyKonnec', Icon: BedDouble }, { to: '/workspace/website', label: 'Website Outreach', Icon: Globe }] },
  { title: 'Discovery', items: [{ to: '/discover', label: 'Discover Leads', Icon: Compass }, { to: '/extension', label: 'Chrome Extension', Icon: Chrome }, { to: '/extension/history', label: 'Collection History', Icon: History }] },
  { title: 'Insights', items: [{ to: '/analytics', label: 'Analytics', Icon: BarChart3 }, { to: '/templates', label: 'Message Templates', Icon: MessageSquareText }, { to: '/activity', label: 'Activity', Icon: ScrollText }] },
  { title: 'Management', items: [{ to: '/team', label: 'Team Members', Icon: UsersRound, owner: true }, { to: '/integrations', label: 'Integrations', Icon: Plug, owner: true }] },
  { title: 'System', items: [{ to: '/settings', label: 'Settings', Icon: Settings }] },
];

export default function Layout() {
  const { user, role, myDepts, signOut } = useApp();
  const [open, setOpen] = useState(false); const [collapsed, setCollapsed] = useState(false); const [q, setQ] = useState(''); const nav = useNavigate();
  const notes = useQuery({ queryKey: ['notifications'], queryFn: () => api<any>('/notifications'), refetchInterval: 60000 });
  const visible = (i: Item) => (!i.owner || role === 'owner') && (!i.to.startsWith('/workspace/') || myDepts.includes(i.to.split('/')[2] as any));
  const sidebar = (
    <aside className={`h-full bg-white border-r border-line flex flex-col ${collapsed ? 'w-[68px]' : 'w-[250px]'}`}>
      <div className="h-14 px-4 flex items-center justify-between border-b border-line">
        <Link to="/" className="flex items-center gap-2 font-semibold"><span className="grid place-items-center w-8 h-8 rounded-lg bg-primary text-white"><Plane size={16} /></span>{!collapsed && 'LeadPilot'}</Link>
        <button className="hidden lg:block text-muted" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button></div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        {GROUPS.map((g) => { const items = g.items.filter(visible); if (!items.length) return null; return (
          <div key={g.title}>{!collapsed && <div className="px-2 pb-1 text-xs text-muted font-medium">{g.title}</div>}
            {items.map(({ to, label, Icon }) => <NavLink key={to} to={to} end={to === '/' || to === '/extension'} title={collapsed ? label : undefined} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm min-h-[40px] ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-ink/80 hover:bg-canvas'}`}><Icon size={18} aria-hidden />{!collapsed && label}</NavLink>)}</div>); })}
      </nav>
      <div className="border-t border-line p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">{(user?.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</div>
        {!collapsed && <div className="min-w-0 flex-1"><div className="text-sm font-medium truncate">{user?.name}</div><div className="text-xs text-muted">{role === 'owner' ? 'Owner' : `Team member, ${myDepts.length} workspace${myDepts.length === 1 ? '' : 's'}`}</div></div>}
        {!collapsed && <button onClick={async () => { await signOut(); nav('/login'); }} aria-label="Sign out" className="text-muted"><LogOut size={16} /></button>}</div>
    </aside>);
  return (
    <div className="h-screen flex">
      <div className="hidden lg:block">{sidebar}</div>
      {open && <div className="lg:hidden fixed inset-0 z-40 flex"><div>{sidebar}</div><button className="flex-1 bg-ink/40" aria-label="Close menu" onClick={() => setOpen(false)} /></div>}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-white border-b border-line px-4 flex items-center gap-3">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <form className="relative flex-1 max-w-md" onSubmit={(e) => { e.preventDefault(); nav('/leads?q=' + encodeURIComponent(q)); }}><Search size={16} className="absolute left-3 top-3 text-muted" /><input className="input pl-9" placeholder="Search leads" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" /></form>
          <Link to="/notifications" className="relative p-2 ml-auto" aria-label="Notifications"><Bell size={18} />{!!notes.data?.unread && <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] rounded-full min-w-[16px] h-4 grid place-items-center px-1">{notes.data.unread}</span>}</Link></header>
        <main className="flex-1 overflow-y-auto"><div className="max-w-[1200px] mx-auto p-4 sm:p-6"><Outlet /></div></main>
      </div></div>);
}
export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-3 mb-6"><div><h1 className="text-2xl font-semibold">{title}</h1>{desc && <p className="text-sm text-muted mt-1">{desc}</p>}</div>{action}</div>;
}
export function Empty({ title, desc, action }: { title: string; desc: string; action?: ReactNode }) {
  return <div className="card p-10 text-center"><h3 className="font-semibold">{title}</h3><p className="text-sm text-muted mt-1 mb-4 max-w-sm mx-auto">{desc}</p>{action}</div>;
}
