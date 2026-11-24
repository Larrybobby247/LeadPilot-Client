import { useEffect } from 'react';
import { X } from 'lucide-react';

// The site runs inside a sandboxed frame with no access to this app (no cookies, storage or login). Its own scripts still run so the page looks right.
export default function SitePreview({ src, title, onClose }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return <div className="fixed inset-0 z-50 bg-ink/60 flex flex-col p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
    <div className="bg-white rounded-t-card px-4 py-2.5 flex items-center justify-between"><div><div className="font-medium text-sm">{title}</div><div className="text-xs text-muted">Preview in a protected frame. Some features that need browser storage may not work here; the downloaded site is unaffected.</div></div><button onClick={onClose} aria-label="Close preview" className="text-muted"><X size={20} /></button></div>
    <iframe title={title} src={src} sandbox="allow-scripts allow-forms allow-popups" referrerPolicy="no-referrer" className="flex-1 bg-white rounded-b-card w-full border-0" />
  </div>;
}
