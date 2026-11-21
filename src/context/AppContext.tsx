import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, refresh, setToken, setAuthLostHandler } from '../services/api';
import type { Department } from '../types';

export interface User { id: string; name: string; email: string; role: 'owner' | 'member'; departments: Department[] }
interface Ctx {
  user: User | null; ready: boolean; role: 'owner' | 'member'; myDepts: Department[];
  signIn: (email: string, password: string) => Promise<void>; applySession: (d: { accessToken: string; user: User }) => void; signOut: () => Promise<void>;
  draft: { dept: Department; source: string; method?: string; query?: string; records: any[] } | null; setDraft: (d: Ctx['draft']) => void;
  result: any | null; setResult: (r: any | null) => void; toast: string; notify: (m: string) => void;
}
const C = createContext<Ctx>(null as unknown as Ctx);
export const useApp = () => useContext(C);

export function AppProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null); const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<Ctx['draft']>(null); const [result, setResult] = useState<any>(null); const [toast, setToast] = useState('');
  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(''), 3500); };
  const applySession = (d: { accessToken: string; user: User }) => { setToken(d.accessToken); setUser(d.user); };
  useEffect(() => { setAuthLostHandler(() => { setUser(null); qc.clear(); }); (async () => { const d: any = await refresh(); if (d?.user) applySession(d); setReady(true); })(); }, []); // restore session from the refresh cookie
  const signIn = async (email: string, password: string) => { const d = await api('/auth/login', { method: 'POST', body: { email, password } }); applySession(d); };
  const signOut = async () => { try { await api('/auth/logout', { method: 'POST' }); } catch {} setToken(null); setUser(null); setDraft(null); setResult(null); qc.clear(); };
  const role = user?.role || 'member'; const myDepts = user?.departments || [];
  return <C.Provider value={{ user, ready, role, myDepts, signIn, applySession, signOut, draft, setDraft, result, setResult, toast, notify }}>
    {children}{toast && <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-sm px-4 py-2.5 rounded-lg shadow-lg max-w-[90vw]">{toast}</div>}</C.Provider>;
}
