import { PracticeSession, drillPeriodSummary, dateLabel } from "@/lib/baseline/data";
export default function DrillProgress({ sessions, end, days, onPractice }: { sessions: PracticeSession[]; end: string; days: number; onPractice: (id?: string) => void }) {
  const report = drillPeriodSummary(sessions, end, days);
  return <section className="panel progress-panel"><div className="section-heading"><div><div className="eyebrow">PRACTICE WITH A MEASURE</div><h2>Drill benchmarks</h2></div><span className="badge">LAST {days} DAYS</span></div>
    <p>Compare target success with the preceding {days} days ({dateLabel(report.previousStart)} – {dateLabel(report.previousEnd)}).</p>
    <div className="benchmark-grid">{report.drills.map(d => <article className="benchmark-card" key={d.id}><h3>{d.title}</h3><p className="helper">{d.metric}</p><strong className="benchmark-rate">{d.current.rate === null ? "—" : `${d.current.rate}%`}</strong><p>{d.current.attempts ? `${d.current.successes}/${d.current.attempts} successful attempts · ${d.current.recorded.length} sessions` : "No counted results in this period."}</p>
      <div className="benchmark-bars">{[["Previous",d.previous],["Current",d.current]].map(([label, value]) => {const stats = value as typeof d.current; return <div key={String(label)}><span>{String(label)}</span><div className="benchmark-track" aria-hidden="true"><i style={{width:`${stats.rate ?? 0}%`}} /></div><b>{stats.rate === null ? "—" : `${stats.rate}%`}</b></div>;})}</div>
      <p className="benchmark-change">{d.change === null ? "Record results in both periods to compare." : `${d.change > 0 ? "+" : ""}${d.change.toFixed(1)} percentage points`}</p>
      <p className="helper">Previous: {d.previous.successes}/{d.previous.attempts} across {d.previous.recorded.length} sessions.</p>
      <button className="button" onClick={() => onPractice(d.id)}>Practice this drill</button>
    </article>)}</div><p className="helper">Rates use total successful attempts divided by total recorded attempts. Missing counts, archived sessions and future dates are excluded. Compare similar targets and conditions; a change in this log alone does not prove a change in skill.</p>
  </section>;
}
