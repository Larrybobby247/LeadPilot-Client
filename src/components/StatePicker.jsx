import { STATES, ZONES } from '../data/nigeria';

// Pick states by zone. "Select zone" ticks every state in that zone.
export default function StatePicker({ value, onChange }) {
  const has = (n) => value.includes(n);
  const toggle = (n) => onChange(has(n) ? value.filter((x) => x !== n) : [...value, n]);
  const zone = (z, on) => { const names = STATES.filter((s) => s.zone === z).map((s) => s.name); onChange(on ? [...new Set([...value, ...names])] : value.filter((x) => !names.includes(x))); };
  return (
    <div className="space-y-3">
      {ZONES.map((z) => { const items = STATES.filter((s) => s.zone === z); const all = items.every((s) => has(s.name));
        return <div key={z}>
          <div className="flex justify-between text-xs"><span className="font-medium text-muted">{z}</span><button type="button" className="text-primary" onClick={() => zone(z, !all)}>{all ? 'Clear zone' : 'Select zone'}</button></div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">{items.map((s) => <label key={s.name} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={has(s.name)} onChange={() => toggle(s.name)} />{s.name}</label>)}</div>
        </div>; })}
      <p className="text-xs text-muted">{value.length} selected</p>
    </div>
  );
}
