// Mirrors the server: turns a pasted Google Search / Maps link into the search words, so the user can see what will be searched.
const clean = (q) => String(q).replace(/\b(site|inurl|intitle|intext|filetype|related|cache):\S+/gi, ' ').replace(/["+]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
export function extractQuery(input = '') {
  const t = String(input).trim(); if (!t) return null;
  if (!/^(https?:\/\/|www\.)/i.test(t) && !/^google\./i.test(t)) return clean(t) || null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); if (!/(^|\.)google\.[a-z.]+$/.test(u.hostname)) return null;
    const q = u.searchParams.get('q') || u.searchParams.get('query'); if (q) return clean(q) || null;
    const m = u.pathname.match(/\/maps\/(?:search|place)\/([^/@]+)/); if (m) return clean(decodeURIComponent(m[1].replace(/\+/g, ' '))) || null;
  } catch { /* not a usable link */ }
  return null;
}
