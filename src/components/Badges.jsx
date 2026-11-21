import { Chrome, Globe, FileSpreadsheet, MapPin, PenLine, ShieldCheck, CircleHelp, TriangleAlert } from 'lucide-react';
const SRC = {
    google_search: { label: 'Google Search', Icon: Globe, cls: 'bg-blue-50 text-blue-700' },
    chrome_extension: { label: 'Chrome Extension', Icon: Chrome, cls: 'bg-indigo-50 text-indigo-700' },
    csv_import: { label: 'CSV Import', Icon: FileSpreadsheet, cls: 'bg-slate-100 text-slate-700' },
    google_maps: { label: 'Google Maps', Icon: MapPin, cls: 'bg-emerald-50 text-emerald-700' },
    manual: { label: 'Manual Entry', Icon: PenLine, cls: 'bg-amber-50 text-amber-800' },
};
export const SourceBadge = ({ source }) => {
    const { label, Icon, cls } = SRC[source];
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}><Icon size={12} aria-hidden/>{label}</span>;
};
const VER = {
    verified: { label: 'Verified', Icon: ShieldCheck, cls: 'bg-[#E6F5EF] text-ok' },
    unverified: { label: 'Unverified', Icon: CircleHelp, cls: 'bg-[#FDF3E2] text-[#9A6410]' },
    requires_review: { label: 'Needs review', Icon: TriangleAlert, cls: 'bg-[#FBE9EB] text-danger' },
};
export const VerifyBadge = ({ v }) => {
    const { label, Icon, cls } = VER[v];
    return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}><Icon size={12} aria-hidden/>{label}</span>;
};
const WS = { WORKING_WEBSITE: 'Working website', NO_WEBSITE: 'No website', BROKEN_WEBSITE: 'Broken website', PARKED_DOMAIN: 'Parked domain', UNCERTAIN: 'Uncertain' };
export const WebsiteBadge = ({ s }) => s ? <span className="text-xs text-muted whitespace-nowrap">{WS[s]}</span> : <span className="text-xs text-muted">-</span>;
export const StatusBadge = ({ s }) => {
    const m = { New: 'bg-slate-100 text-slate-700', Contacted: 'bg-blue-50 text-blue-700', Responded: 'bg-cyan-50 text-cyan-700', Interested: 'bg-[#E6F5EF] text-ok', Converted: 'bg-[#E6F5EF] text-ok' };
    return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${m[s] || 'bg-slate-100 text-slate-700'}`}>{s}</span>;
};
