import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader, Empty } from '../components/Layout';
import { Skeleton, ErrorBox } from '../components/ui';
import { SourceBadge } from '../components/Badges';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { DEPT, fmt } from '../constants';

export default function ExtensionHistory() {
  const { myDepts, role } = useApp(); const [dept, setDept] = useState(''); const q = useQuery({ queryKey: ['ext-imports'], queryFn: () => api<any>('/extension/imports') });
  const rows = (q.data?.items || []).filter((h: any) => myDepts.includes(h.department) && (!dept || h.department === dept));
  return <>
    <PageHeader title="Collection history" desc="Every import made with the Chrome extension, with its results." action={<select className="input !w-auto" value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Workspace"><option value="">All workspaces</option>{myDepts.map((d) => <option key={d} value={d}>{DEPT[d].name}</option>)}</select>} />
    {q.isLoading ? <Skeleton /> : q.error ? <ErrorBox error={q.error} retry={q.refetch} /> : !rows.length ? <Empty title="No collections yet" desc="Scan a Google Search results page with LeadPilot Collector and your imports will be listed here." action={<Link className="btn btn-primary" to="/extension">Set up the extension</Link>} /> :
      <div className="card overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-line">{['Date', 'Search', 'Source', 'Workspace', ...(role === 'owner' ? ['User'] : []), 'Collected', 'Imported', 'Duplicates', 'Rejected', 'Review', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody>{rows.map((h: any) => <tr key={h.id} className="border-b border-line last:border-0"><td className="td whitespace-nowrap">{fmt(h.date)}</td><td className="td">{h.query || '-'}</td><td className="td"><SourceBadge source="chrome_extension" /></td><td className="td">{(DEPT as any)[h.department].name}</td>{role === 'owner' && <td className="td">{h.user}</td>}<td className="td">{h.collected}</td><td className="td text-ok font-medium">{h.imported}</td><td className="td">{h.duplicates}</td><td className="td text-danger">{h.rejected}</td><td className="td">{h.review}</td><td className="td">{h.status}</td></tr>)}</tbody></table></div>}
  </>;
}
