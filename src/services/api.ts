// All server calls go through here. The access token lives in memory only; the refresh token is an httpOnly cookie.
const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';
let token: string | null = null;
let onAuthLost: () => void = () => {};
export const setToken = (t: string | null) => { token = t; };
export const setAuthLostHandler = (f: () => void) => { onAuthLost = f; };
export class ApiError extends Error { constructor(public status: number, message: string, public body?: any) { super(message); } }

async function raw(path: string, init: RequestInit = {}) {
  return fetch(BASE + '/api' + path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
}
let refreshing: Promise<boolean> | null = null;
export async function refresh(): Promise<boolean> {
  refreshing ||= (async () => { try { const r = await raw('/auth/refresh', { method: 'POST' }); if (!r.ok) return false; const d = await r.json(); token = d.accessToken; return d; } catch { return false; } finally { setTimeout(() => (refreshing = null), 0); } })() as Promise<boolean>;
  return refreshing;
}
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const init: RequestInit = { method: opts.method || 'GET', body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined };
  let res: Response; try { res = await raw(path, init); } catch { throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.'); }
  if (res.status === 401 && !path.startsWith('/auth/')) { const ok = await refresh(); if (ok) res = await raw(path, init); else { token = null; onAuthLost(); } }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.message || 'Request failed', data);
  return data as T;
}
export const qs = (o: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => v !== undefined && v !== '' && v !== null && p.set(k, String(v))); const s = p.toString(); return s ? '?' + s : ''; };
