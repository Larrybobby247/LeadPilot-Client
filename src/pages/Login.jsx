import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
export default function Login() {
    const { signIn } = useApp();
    const nav = useNavigate();
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (!/\S+@\S+\.\S+/.test(email))
            return setErr('Enter a valid email address.');
        if (!pw)
            return setErr('Enter your password.');
        setBusy(true);
        try {
            await signIn(email, pw);
            nav('/');
        }
        catch (x) {
            setErr(x.message);
        }
        finally {
            setBusy(false);
        }
    };
    return (<div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2 font-semibold"><span className="grid place-items-center w-9 h-9 rounded-lg bg-primary text-white"><Plane size={18}/></span>LeadPilot</div>
          <div><h1 className="text-2xl font-semibold">Welcome back</h1><p className="text-sm text-muted mt-1">Sign in to continue managing your leads and outreach.</p></div>
          {err && <div role="alert" className="text-sm text-danger bg-[#FBE9EB] rounded-lg px-3 py-2">{err}</div>}
          <div><label className="label" htmlFor="em">Email address</label><input id="em" type="email" autoComplete="username" className="input" value={email} onChange={(e) => setEmail(e.target.value)}/></div>
          <div><label className="label" htmlFor="pw">Password</label><div className="relative"><input id="pw" type={show ? 'text' : 'password'} autoComplete="current-password" className="input pr-10" value={pw} onChange={(e) => setPw(e.target.value)}/>
            <button type="button" className="absolute right-3 top-2.5 text-muted" onClick={() => setShow(!show)} aria-label="Show or hide password">{show ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></div>
          <div className="text-right"><Link to="/forgot-password" className="text-sm text-primary">Forgot password?</Link></div>
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
          <p className="text-xs text-muted">Accounts are invitation-only. Ask the owner for an invitation link.</p>
        </form>
      </div>
      <div className="hidden lg:flex flex-col justify-center p-16 text-white bg-gradient-to-br from-primary to-primary-dark">
        <h2 className="text-3xl font-semibold max-w-md">Turn prospects into opportunities.</h2>
        <p className="mt-3 max-w-md text-white/80">Discover businesses, manage WhatsApp outreach and track every follow-up, with your whole team in one place.</p></div>
    </div>);
}
