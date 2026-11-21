// All server calls go through here. The access token lives in memory only; the refresh token is an httpOnly cookie.
const BASE = import.meta.env.VITE_API_URL || 'https://leadpilot-server.onrender.com';
let token = null;
let onAuthLost = () => { };
export const setToken = (t) => { token = t; };
export const setAuthLostHandler = (f) => { onAuthLost = f; };
export class ApiError extends Error {
    status;
    body;
    constructor(status, message, body) {
        super(message);
        this.status = status;
        this.body = body;
    }
}
async function raw(path, init = {}) {
    return fetch(BASE + '/api' + path, { ...init, credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers || {}) } });
}
let refreshing = null;
export async function refresh() {
    refreshing ||= (async () => { try {
        const r = await raw('/auth/refresh', { method: 'POST' });
        if (!r.ok)
            return false;
        const d = await r.json();
        token = d.accessToken;
        return d;
    }
    catch {
        return false;
    }
    finally {
        setTimeout(() => (refreshing = null), 0);
    } })();
    return refreshing;
}
export async function api(path, opts = {}) {
    const init = { method: opts.method || 'GET', body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined };
    let res;
    try {
        res = await raw(path, init);
    }
    catch {
        throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
    }
    if (res.status === 401 && !path.startsWith('/auth/')) {
        const ok = await refresh();
        if (ok)
            res = await raw(path, init);
        else {
            token = null;
            onAuthLost();
        }
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok)
        throw new ApiError(res.status, data.message || 'Request failed', data);
    return data;
}
export const qs = (o) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => v !== undefined && v !== '' && v !== null && p.set(k, String(v))); const s = p.toString(); return s ? '?' + s : ''; };
