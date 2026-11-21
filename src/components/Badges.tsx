import { Chrome, Globe, FileSpreadsheet, MapPin, PenLine, ShieldCheck, CircleHelp, TriangleAlert } from 'lucide-react';
import type { Source, Verification, WebsiteStatus } from '../types';

const SRC = {
  google_search: { label: 'Google Search', Icon: Globe, cls: 'bg-blue-50 text-blue-700' },
  chrome_extension: { label: 'Chrome Extension', Icon: Chrome, cls: 'bg-indigo-50 text-indigo-700' },
  csv_import: { label: 'CSV Import', Icon: FileSpreadsheet, cls: 'bg-slate-100 text-slate-700' },
  google_maps: { label: 'Google Maps', Icon: MapPin, cls: 'bg-emerald-50 text-emerald-700' },
  manual: { label: 'Manual Entry', Icon: PenLine, cls: 'bg-amber-50 text-amber-800' },
} as const;
export const SourceBadge = ({ source }: { source: Source }) => {
  const { label, Icon, cls } = SRC[source];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}><Icon size={12} aria-hidden />{label}</span>;
};

const VER = {
  verified: { label: 'Verified', Icon: ShieldCheck, cls: 'bg-[#E6F5EF] text-ok' },
  unverified: { label: 'Unverified', Icon: CircleHelp, cls: 'bg-[#FDF3E2] text-[#9A6410]' },
  requires_review: { label: 'Needs review', Icon: TriangleAlert, cls: 'bg-[#FBE9EB] text-danger' },
} as const;
export const VerifyBadge = ({ v }: { v: Verification }) => {
  const { label, Icon, cls } = VER[v];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}><Icon size={12} aria-hidden />{label}</span>;
};

const WS: Record<WebsiteStatus, string> = { WORKING_WEBSITE: 'Working website', NO_WEBSITE: 'No website', BROKEN_WEBSITE: 'Broken website', PARKED_DOMAIN: 'Parked domain', UNCERTAIN: 'Uncertain' };
export const WebsiteBadge = ({ s }: { s?: WebsiteStatus }) => s ? <span className="text-xs text-muted whitespace-nowrap">{WS[s]}</span> : <span className="text-xs text-muted">-</span>;

export const StatusBadge = ({ s }: { s: string }) => {
  const m: Record<string, string> = { New: 'bg-slate-100 text-slate-700', Contacted: 'bg-blue-50 text-blue-700', Responded: 'bg-cyan-50 text-cyan-700', Interested: 'bg-[#E6F5EF] text-ok', Converted: 'bg-[#E6F5EF] text-ok' };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m[s] || 'bg-slate-100 text-slate-700'}`}>{s}</span>;
};
