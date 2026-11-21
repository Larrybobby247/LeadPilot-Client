import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Chrome, Copy, ExternalLink, FileSpreadsheet, PenLine, Search, TriangleAlert } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DEPT } from '../constants';
import { CSV_TEMPLATE, parseCsv } from '../utils/csv';
const FIELDS = ['name', 'category', 'phone', 'email', 'website', 'city'];
export default function Discover() {
    const { myDepts, setDraft, notify } = useApp();
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const want = sp.get('dept');
    const [dept, setDept] = useState(myDepts.includes(want) ? want : myDepts[0]);
    const [tab, setTab] = useState('search');
    const info = useQuery({ queryKey: ['departments'], queryFn: () => api('/departments') });
    const conns = useQuery({ queryKey: ['ext-conns'], queryFn: () => api('/extension/connections') });
    const cats = info.data?.items?.find((x) => x.id === dept)?.categories || [];
    const [cat, setCat] = useState('');
    const category = cat || cats[0] || '';
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('Nigeria');
    const [kw, setKw] = useState('');
    const queries = useMemo(() => {
        const loc = [city, state].filter(Boolean).join(', ');
        const base = `${category.toLowerCase()} in ${loc || country}`;
        const extra = kw ? ` ${kw}` : '';
        const qs = [{ label: 'Google Search', q: base + extra }, { label: 'Instagram profiles', q: `site:instagram.com ${base}${extra}` }, { label: 'Facebook pages', q: `site:facebook.com ${base}${extra}` }];
        if (dept === 'website')
            qs.push({ label: 'LinkedIn companies', q: `site:linkedin.com/company ${category.toLowerCase()} ${country}${extra}` });
        return qs;
    }, [category, city, state, country, kw, dept]);
    const [rows, setRows] = useState([]);
    const [map, setMap] = useState({});
    const [csvErr, setCsvErr] = useState('');
    const onFile = async (f) => {
        if (!f)
            return;
        setCsvErr('');
        if (!f.name.toLowerCase().endsWith('.csv') || f.size > 2_000_000) {
            setRows([]);
            return setCsvErr('Choose a .csv file under 2 MB.');
        }
        const r = parseCsv(await f.text());
        if (r.length < 2) {
            setRows([]);
            return setCsvErr('The file needs a header row and at least one record.');
        }
        if (r.length > 501)
            return setCsvErr('Import up to 500 rows at a time.');
        setRows(r);
        const m = {};
        FIELDS.forEach((k) => { m[k] = r[0].findIndex((h) => h.toLowerCase().includes(k)); });
        setMap(m);
    };
    const toPreview = (records, source, method, query) => { setDraft({ dept, source, method, query, records }); nav('/discover/preview'); };
    const csvRecords = () => rows.slice(1).map((r) => { const g = (k) => (map[k] >= 0 ? (r[map[k]] || '').trim() : ''); return { name: g('name'), category: g('category') || undefined, phone: g('phone') || undefined, email: g('email') || undefined, website: g('website') || undefined, city: g('city') || undefined, verification: g('phone') ? 'unverified' : 'requires_review', notes: g('phone') ? [] : ['No phone number in the file.'] }; });
    const [m, setM] = useState({ name: '', category: '', phone: '', email: '', website: '', city: '' });
    const [mErr, setMErr] = useState('');
    const [warn, setWarn] = useState(null);
    useEffect(() => {
        setWarn(null);
        if (tab !== 'manual' || !(m.phone.replace(/\D/g, '').length >= 10 || m.website.includes('.') || m.email.includes('@')))
            return; // live duplicate check as the user types
        const t = setTimeout(async () => { try {
            const r = await api('/leads/preview', { method: 'POST', body: { department: dept, records: [{ name: m.name || 'New business', phone: m.phone || undefined, website: m.website || undefined, email: m.email || undefined, city: m.city || undefined }] } });
            const it = r.items[0];
            setWarn(['duplicate', 'potential', 'associate'].includes(it.kind) ? it : null);
        }
        catch { /* ignore */ } }, 500);
        return () => clearTimeout(t);
    }, [m.phone, m.website, m.email, m.name, m.city, dept, tab]);
    const addManual = (e) => { e.preventDefault(); if (!m.name.trim())
        return setMErr('Business name is required.'); toPreview([{ ...Object.fromEntries(Object.entries(m).filter(([, v]) => v)), verification: 'unverified' }], 'manual', 'manual'); };
    const ext = conns.data?.items?.length > 0;
    const tabs = [{ id: 'search', label: 'Search queries', Icon: Search }, { id: 'extension', label: 'Chrome extension', Icon: Chrome }, { id: 'csv', label: 'CSV import', Icon: FileSpreadsheet }, { id: 'manual', label: 'Manual entry', Icon: PenLine }];
    return <>
    <PageHeader title="Discover leads" desc="Find businesses, review what was collected, and build your prospect list."/>
    <div className="grid sm:grid-cols-3 gap-3 mb-5">{myDepts.map((d) => <button key={d} onClick={() => { setDept(d); setCat(''); }} aria-pressed={dept === d} className="card p-4 text-left" style={dept === d ? { borderColor: DEPT[d].color, boxShadow: `0 0 0 2px ${DEPT[d].color}33` } : {}}><div className="font-medium">{DEPT[d].name}</div><div className="text-xs text-muted">{DEPT[d].blurb}</div></button>)}</div>
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line mb-5">{tabs.map(({ id, label, Icon }) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 ${tab === id ? 'border-primary text-primary font-medium' : 'border-transparent text-muted'}`}><Icon size={16}/>{label}</button>)}</div>
    {tab === 'search' && <div className="grid lg:grid-cols-5 gap-4">
      <div className="card p-5 space-y-3 lg:col-span-2"><div><label className="label" htmlFor="cat">Business category</label><select id="cat" className="input" value={category} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-3"><div><label className="label" htmlFor="city">City</label><input id="city" className="input" placeholder="Ibadan" value={city} onChange={(e) => setCity(e.target.value)}/></div><div><label className="label" htmlFor="st">State</label><input id="st" className="input" value={state} onChange={(e) => setState(e.target.value)}/></div></div>
        <div><label className="label" htmlFor="co">Country</label><input id="co" className="input" value={country} onChange={(e) => setCountry(e.target.value)}/></div><div><label className="label" htmlFor="kw">Extra keywords (optional)</label><input id="kw" className="input" value={kw} onChange={(e) => setKw(e.target.value)}/></div></div>
      <div className="card p-5 lg:col-span-3"><h2 className="font-medium mb-1">Generated searches</h2><p className="text-sm text-muted mb-3">Open a search in Google, then use LeadPilot Collector on the results page.</p>
        <ul className="space-y-2">{queries.map((x) => <li key={x.q} className="rounded-lg border border-line p-3"><div className="text-xs text-muted">{x.label}</div><div className="text-sm font-medium break-words">{x.q}</div><div className="flex gap-2 mt-2"><a className="btn btn-primary !min-h-[36px]" target="_blank" rel="noreferrer noopener" href={'https://www.google.com/search?q=' + encodeURIComponent(x.q)}><ExternalLink size={14}/>Open in Google</a><button className="btn !min-h-[36px]" onClick={() => { navigator.clipboard?.writeText(x.q); notify('Query copied'); }}><Copy size={14}/>Copy</button></div></li>)}</ul></div></div>}
    {tab === 'extension' && <div className="card p-5 space-y-3 max-w-2xl"><h2 className="font-medium">Collect with LeadPilot Collector</h2><p className="text-sm">Status: <b className={ext ? 'text-ok' : 'text-muted'}>{ext ? 'Connected' : 'Not connected'}</b></p>
      <ol className="text-sm list-decimal pl-5 space-y-1"><li>Generate a search in the Search queries tab and open it in Google.</li><li>Open the extension and choose Scan this page.</li><li>Select records, then import into {DEPT[dept].name}. Nothing is imported without your confirmation.</li></ol><Link to={ext ? '/extension/history' : '/extension'} className="btn">{ext ? 'View collection history' : 'Connect the extension'}</Link></div>}
    {tab === 'csv' && <div className="card p-5 space-y-4"><div className="flex flex-wrap justify-between gap-2"><h2 className="font-medium">Import from CSV</h2><a className="btn !min-h-[36px]" download="leadpilot-template.csv" href={'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_TEMPLATE)}>Download template</a></div>
      <input type="file" accept=".csv" className="input" onChange={(e) => onFile(e.target.files?.[0])} aria-label="CSV file"/>{csvErr && <div role="alert" className="text-sm text-danger">{csvErr}</div>}
      {rows.length > 1 && <><div className="grid sm:grid-cols-3 gap-3">{FIELDS.map((k) => <div key={k}><label className="label">{k[0].toUpperCase() + k.slice(1)} column</label><select className="input" value={map[k]} onChange={(e) => setMap({ ...map, [k]: +e.target.value })}><option value={-1}>Not mapped</option>{rows[0].map((h, i) => <option key={i} value={i}>{h}</option>)}</select></div>)}</div>
        <div className="overflow-x-auto border border-line rounded-lg"><table className="w-full"><thead><tr>{rows[0].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead><tbody>{rows.slice(1, 6).map((r, i) => <tr key={i} className="border-t border-line">{r.map((c, j) => <td key={j} className="td">{c}</td>)}</tr>)}</tbody></table></div>
        <p className="text-xs text-muted">Showing the first 5 of {rows.length - 1} rows. Duplicates are checked on the next screen.</p><button className="btn btn-primary" disabled={map.name < 0} onClick={() => toPreview(csvRecords(), 'csv_import', 'csv')}>Review {rows.length - 1} records</button></>}</div>}
    {tab === 'manual' && <form onSubmit={addManual} className="card p-5 grid sm:grid-cols-2 gap-3 max-w-2xl">{FIELDS.map((k) => <div key={k} className={k === 'name' ? 'sm:col-span-2' : ''}><label className="label" htmlFor={'m' + k}>{k === 'name' ? 'Business name' : k[0].toUpperCase() + k.slice(1)}</label><input id={'m' + k} className="input" value={m[k]} onChange={(e) => setM({ ...m, [k]: e.target.value })}/></div>)}
      {warn && <div role="alert" className="sm:col-span-2 rounded-lg bg-[#FDF3E2] text-[#9A6410] text-sm p-3 flex gap-2"><TriangleAlert size={16} className="mt-0.5 shrink-0"/><div>Possible duplicate detected. This business already exists in your LeadPilot database{warn.existing?.name ? ` (${warn.existing.name})` : ''}. {warn.existing?.leadId && <Link className="underline font-medium" to={`/leads/${warn.existing.leadId}`}>View the existing record</Link>}</div></div>}
      {mErr && <div role="alert" className="sm:col-span-2 text-sm text-danger">{mErr}</div>}<div className="sm:col-span-2"><button className="btn btn-primary">Review lead</button></div></form>}
  </>;
}
