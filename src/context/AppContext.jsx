import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, refresh, setToken, setAuthLostHandler } from '../services/api';
const C = createContext(null);
export const useApp = () => useContext(C);
export function AppProvider({ children }) {
    const qc = useQueryClient();
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);
    const [draft, setDraft] = useState(null);
    const [result, setResult] = useState(null);
    const [toast, setToast] = useState('');
    const notify = (m) => { setToast(m); setTimeout(() => setToast(''), 3500); };
    const applySession = (d) => { setToken(d.accessToken); setUser(d.user); };
    useEffect(() => { setAuthLostHandler(() => { setUser(null); qc.clear(); }); (async () => { const d = await refresh(); if (d?.user)
        applySession(d); setReady(true); })(); }, []); // restore session from the refresh cookie
    const signIn = async (email, password) => { const d = await api('/auth/login', { method: 'POST', body: { email, password } }); applySession(d); };
    const signOut = async () => { try {
        await api('/auth/logout', { method: 'POST' });
    }
    catch { } setToken(null); setUser(null); setDraft(null); setResult(null); qc.clear(); };
    const role = user?.role || 'member';
    const myDepts = user?.departments || [];
    return <C.Provider value={{ user, ready, role, myDepts, signIn, applySession, signOut, draft, setDraft, result, setResult, toast, notify }}>
    {children}{toast && <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-[90vw]">{toast}</div>}</C.Provider>;
}
