import { Link, Navigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { useApp } from '../context/AppContext';
const List = ({ title, items, empty = 'None.' }) => <div className="card p-4"><h2 className="font-medium mb-2">{title}</h2>{items.length ? <ul className="text-sm space-y-1.5">{items.map((i, n) => <li key={n}>{i}</li>)}</ul> : <p className="text-sm text-muted">{empty}</p>}</div>;
export default function ImportResults() {
    const { result: r } = useApp();
    if (!r)
        return <Navigate to="/discover" replace/>;
    const cards = [{ k: 'Imported', v: r.imported.length, c: 'text-ok' }, { k: 'Already existing / filtered', v: r.duplicates.length + (r.taken?.length || 0), c: '' }, { k: 'Need review', v: r.potential.length + r.review.length, c: 'text-[#9A6410]' }, { k: 'Rejected', v: r.rejected.length, c: 'text-danger' }];
    return <>
    <PageHeader title="Import results" desc="Only imported records were added to your leads." action={<div className="flex gap-2"><Link className="btn" to="/discover">Discover more</Link><Link className="btn btn-primary" to="/leads">View leads</Link></div>}/>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{cards.map((c) => <div key={c.k} className="card p-4"><div className={`text-2xl font-semibold ${c.c}`}>{c.v}</div><div className="text-sm text-muted">{c.k}</div></div>)}</div>
    <div className="grid lg:grid-cols-2 gap-4">
      <List title="Imported" items={r.imported.map((x) => x.name + (x.associated ? ' (existing business added to this workspace)' : ''))}/>
      <List title="Already existing (skipped)" items={r.duplicates.map((x) => `${x.name}: matches ${x.existing} on ${x.matchedOn}`)}/>
      <List title="Filtered out: already held by a teammate" items={(r.taken || []).map((x) => x.name)}/>
      <List title="Possible duplicates (not imported)" items={r.potential.map((x) => `${x.name}: similar to ${x.existing} (${x.matchedOn})`)}/>
      <List title="Imported, needs review" items={r.review.map((x) => `${x.name}${x.reason ? ': ' + x.reason : ''}`)}/>
      <List title="Updated existing leads" items={(r.updated || []).map((x) => x.name + (x.conflicts?.length ? ` (${x.conflicts.length} field(s) differ and were left unchanged)` : ''))}/>
      <List title="Rejected" items={r.rejected.map((x) => `${x.name}: ${x.reason}`)}/>
    </div></>;
}
