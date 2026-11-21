import { useQuery } from '@tanstack/react-query';
import { Flame, Target } from 'lucide-react';
import { api } from '../services/api';
import { DEPT, fmt } from '../constants';
export default function GoalWidget() {
    const q = useQuery({ queryKey: ['goals-today'], queryFn: () => api('/goals/today'), refetchInterval: 30000 });
    if (q.isLoading)
        return <div className="card p-4 h-32 animate-pulse"/>;
    if (q.error || !q.data)
        return null;
    const d = q.data;
    if (d.restDay)
        return <section className="card p-4"><div className="flex items-center gap-2 font-medium"><Target size={18} className="text-primary"/>Rest and weekly review day</div><p className="text-sm text-muted mt-1">No outreach target today. Review your week in Analytics, then plan Monday.</p></section>;
    return (<section className="card p-4 space-y-3" aria-label="Today's outreach goal">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2 font-medium"><Target size={18} className="text-primary"/>Today's outreach goal</div>{d.streak > 0 && <span className="flex items-center gap-1 text-xs text-[#9A6410]"><Flame size={14}/>{d.streak}-day streak</span>}</div>
      {d.goals.map((g) => <div key={g.campaign}><div className="flex justify-between text-sm"><span className="font-medium" style={{ color: DEPT[g.campaign]?.color }}>{DEPT[g.campaign]?.name || g.campaign}</span><span>{g.completed} of {g.target}</span></div>
        <div className="h-2 rounded bg-line mt-1" role="progressbar" aria-valuenow={g.percent} aria-valuemin={0} aria-valuemax={100}><div className="h-2 rounded" style={{ width: `${g.percent}%`, background: g.status === 'completed' ? '#159B69' : '#3157D5' }}/></div>
        <div className="flex justify-between text-xs text-muted mt-1"><span>{g.remaining} remaining, {g.percent}%</span><span>{g.status === 'completed' ? 'Completed' : g.status === 'in_progress' ? 'In progress' : 'Not started'}</span></div></div>)}
      {d.completedAll ? <p className="text-sm text-ok bg-[#E6F5EF] rounded-lg p-2">Daily goal completed! Excellent work. You've reached today's outreach target.</p> : <p className="text-xs text-muted">{d.hoursLeft} hours left today. Last recorded outreach: {fmt(d.lastOutreachAt)}. Only messages you confirm as sent, or record as email/call, count.</p>}
    </section>);
}
