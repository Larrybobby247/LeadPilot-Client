import { ReactNode, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plane } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { DEPT } from '../constants';

const Shell = ({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) => <div className="min-h-screen flex items-center justify-center p-6"><div className="w-full max-w-sm space-y-4">
  <div className="flex items-center gap-2 font-semibold"><span className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-white"><Plane size={18} /></span>LeadPilot</div><div><h1 className="text-2xl font-semibold">{title}</h1>{desc && <p className="text-sm text-muted mt-1">{desc}</p>}</div>{children}</div></div>;
const strength = (p: string) => [/.{10,}/, /[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(p)).length;
const Meter = ({ pw }: { pw: string }) => { const s = strength(pw); return <div><div className="h-1.5 rounded bg-line"><div className="h-1.5 rounded" style={{ width: `${s * 20}%`, background: s < 3 ? '#D94B58' : s < 5 ? '#E9A23B' : '#159B69' }} /></div><p className="text-xs text-muted mt-1">At least 10 characters with upper and lower case letters and a number.</p></div>; };

export function ForgotPassword() {
  const [email, setEmail] = useState(''); const [done, setDone] = useState(false); const [err, setErr] = useState('');
  const go = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); try { await api('/auth/forgot-password', { method: 'POST', body: { email } }); setDone(true); } catch (x: any) { setErr(x.message); } };
  return <Shell title="Reset your password" desc="Enter your email and we will send a reset link.">{done ? <p className="text-sm bg-[#E6F5EF] text-ok rounded-lg p-3">If that email belongs to an account, a reset link has been sent. It expires in 1 hour.</p> :
    <form onSubmit={go} className="space-y-3">{err && <p role="alert" className="text-sm text-danger">{err}</p>}<input className="input" type="email" placeholder="Email address" aria-label="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /><button className="btn btn-primary w-full">Send reset link</button></form>}
    <Link to="/login" className="text-sm text-primary">Back to sign in</Link></Shell>;
}
export function ResetPassword() {
  const [sp] = useSearchParams(); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [done, setDone] = useState(false);
  const go = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); if (pw !== pw2) return setErr('Passwords do not match.'); try { await api('/auth/reset-password', { method: 'POST', body: { token: sp.get('token') || '', password: pw } }); setDone(true); } catch (x: any) { setErr(x.issues?.[0]?.message || x.message); } };
  return <Shell title="Choose a new password">{done ? <><p className="text-sm bg-[#E6F5EF] text-ok rounded-lg p-3">Password updated. You can sign in now.</p><Link to="/login" className="btn btn-primary w-full">Sign in</Link></> :
    <form onSubmit={go} className="space-y-3">{err && <p role="alert" className="text-sm text-danger">{err}</p>}<input className="input" type="password" autoComplete="new-password" placeholder="New password" aria-label="New password" value={pw} onChange={(e) => setPw(e.target.value)} /><Meter pw={pw} />
      <input className="input" type="password" autoComplete="new-password" placeholder="Confirm password" aria-label="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} /><button className="btn btn-primary w-full">Update password</button></form>}</Shell>;
}
export function AcceptInvitation() {
  const [sp] = useSearchParams(); const token = sp.get('token') || ''; const { applySession } = useApp(); const nav = useNavigate();
  const q = useQuery({ queryKey: ['invite', token], queryFn: () => api<any>('/invitations/check?token=' + encodeURIComponent(token)) });
  const [name, setName] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState('');
  const go = async (e: React.FormEvent) => { e.preventDefault(); setErr(''); if (pw !== pw2) return setErr('Passwords do not match.'); try { applySession(await api('/invitations/accept', { method: 'POST', body: { token, name, password: pw } })); nav('/'); } catch (x: any) { setErr(x.issues?.[0]?.message || x.message); } };
  if (q.isLoading) return <Shell title="Checking invitation..."><span /></Shell>;
  const s = q.data?.state; if (s !== 'valid') return <Shell title={s === 'used' ? 'Invitation already used' : s === 'expired' ? 'Invitation expired' : 'Invitation not valid'} desc={s === 'used' ? 'This invitation has been accepted. Sign in instead.' : 'Ask the owner to send you a new invitation.'}><Link to="/login" className="btn w-full">Go to sign in</Link></Shell>;
  return <Shell title="Welcome to LeadPilot" desc={`${q.data.invitedBy || 'The owner'} invited you to join.`}>
    <div className="card p-3 text-sm space-y-1"><div><span className="text-muted">Email: </span>{q.data.email}</div><div><span className="text-muted">Workspaces: </span>{q.data.departments.map((d: any) => (DEPT as any)[d].name).join(', ')}</div></div>
    <form onSubmit={go} className="space-y-3">{err && <p role="alert" className="text-sm text-danger">{err}</p>}<input className="input" placeholder="Full name" aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="input" type="password" autoComplete="new-password" placeholder="Password" aria-label="Password" value={pw} onChange={(e) => setPw(e.target.value)} /><Meter pw={pw} />
      <input className="input" type="password" autoComplete="new-password" placeholder="Confirm password" aria-label="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} /><button className="btn btn-primary w-full">Accept invitation</button></form></Shell>;
}
