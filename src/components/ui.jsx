import { useEffect } from 'react';
import { X } from 'lucide-react';
export const Skeleton = ({ rows = 4 }) => <div className="space-y-2" aria-busy="true">{Array.from({ length: rows }, (_, i) => <div key={i} className="h-12 rounded-lg bg-line/60 animate-pulse"/>)}</div>;
export const ErrorBox = ({ error, retry }) => <div role="alert" className="card p-6 text-center"><p className="text-sm text-danger">{error?.message || 'Something went wrong.'}</p>{retry && <button className="btn mt-3" onClick={retry}>Try again</button>}</div>;
export function Modal({ title, desc, onClose, children }) {
    useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
    return <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={title} className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-card max-h-[90vh] overflow-y-auto p-5">
      <div className="flex justify-between items-start mb-3"><div><h2 className="font-semibold text-lg">{title}</h2>{desc && <p className="text-sm text-muted">{desc}</p>}</div><button onClick={onClose} aria-label="Close" className="text-muted"><X size={18}/></button></div>{children}</div></div>;
}
export const Field = ({ label, children }) => <div><label className="label">{label}</label>{children}</div>;
export const Stat = ({ label, value, hint }) => <div className="card p-4"><div className="text-2xl font-semibold">{value}</div><div className="text-xs text-muted">{label}</div>{hint && <div className="text-[11px] text-muted mt-1">{hint}</div>}</div>;
