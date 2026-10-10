"use client";
import { useState } from "react";
import { Match, PracticeSession, progressSummary, today, dateLabel } from "@/lib/baseline/data";
export default function ProgressHub({matches, sessions, onLog, onPractice}: {matches: Match[]; sessions: PracticeSession[]; onLog: () => void; onPractice: () => void}) {
  const [days, setDays] = useState(28);
  const report = progressSummary(matches, sessions, today(), days);
  const maxMinutes = Math.max(1, ...report.weekly.map(w => w.minutes));
  return <div className="progress-hub">
    <div className="section-heading"><div><div className="eyebrow">YOUR GAME OVER TIME</div><p>{dateLabel(report.start)} – {dateLabel(report.end)}</p></div><div className="filter-row" aria-label="Progress date range">{[28, 84].map(d => <button key={d} className={`filter-chip ${days === d ? "selected" : ""}`} aria-pressed={days === d} onClick={() => setDays(d)}>Last {d} days</button>)}</div></div>
    <div className="progress-stats">{[
      ["MATCH RECORD", `${report.wins}W · ${report.losses}L`, `${report.total} matches logged`],
      ["WIN RATE", report.winRate === null ? "—" : `${report.winRate}%`, "Only your recorded results"],
      ["PRACTICE", `${report.minutes} min`, `${report.sessions} practice sessions`],
      ["ACTIVE DAYS", String(report.activeDays), "Days with a match or practice"],
    ].map(([label,value,note]) => <div className="stat-tile" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}</div>
    <section className="panel progress-panel"><div className="section-heading"><div><div className="eyebrow">CONSISTENCY STARTS HERE</div><h2>Your practice rhythm</h2></div><button className="button" onClick={onPractice}>Find a drill</button></div><p>Seven-day blocks in the selected period. Match time is not included.</p>
      {report.sessions === 0 && <p className="notice">No practice logged in this period. Log a session in Training to start your chart.</p>}
      <div className="practice-chart" role="img" aria-label={report.weekly.map(w => `${dateLabel(w.from)} to ${dateLabel(w.to)}: ${w.minutes} minutes`).join('; ')}>{report.weekly.map(w => <div className="practice-column" key={w.from}><span>{w.minutes}</span><div className="practice-bar-track"><div style={{height: `${w.minutes / maxMinutes * 100}%`}} /></div><small>{w.from.slice(5).replace('-', '/')}</small></div>)}</div>
      <details className="chart-data"><summary>View exact practice totals</summary><div className="table-wrap"><table><thead><tr><th>Period</th><th>Sessions</th><th>Minutes</th></tr></thead><tbody>{report.weekly.map(w => <tr key={w.from}><th>{dateLabel(w.from)} – {dateLabel(w.to)}</th><td>{w.sessions}</td><td>{w.minutes}</td></tr>)}</tbody></table></div></details>
    </section>
    <div className="progress-grid"><section className="panel progress-panel"><div className="eyebrow">COURT BY COURT</div><h2>Results by surface</h2>{report.surfaces.length ? <div className="table-wrap"><table><thead><tr><th>Surface</th><th>Record</th><th>Win rate</th></tr></thead><tbody>{report.surfaces.map(s => <tr key={s.id}><th>{s.label}</th><td>{s.wins}W · {s.losses}L</td><td>{s.winRate}% <small>({s.total} matches)</small></td></tr>)}</tbody></table></div> : <p>Log your first match to compare court surfaces.</p>}<p className="helper">Small samples and different opponents can change these percentages. They describe your log, not your ability.</p></section>
    <section className="panel progress-panel"><div className="eyebrow">ONLY WHAT YOU TRACK</div><h2>First-serve percentage</h2><div className="progress-big">{report.avgServe === null ? "—" : `${report.avgServe}%`}</div><p>{report.serveCount} of {report.total} matches include this stat.</p><p className="helper">Average of recorded match percentages, not weighted by serve attempts. Missing values are excluded.</p><button className="button" onClick={onLog}>Log a match</button></section></div>
    <section className="panel progress-panel"><div className="eyebrow">CARRY IT FORWARD</div><h2>Recent match reflections</h2>{report.recent.length ? <div className="reflection-list">{report.recent.map(m => <article key={m.id}><span className={`result-badge ${m.result}`}>{m.result === 'win' ? 'W' : 'L'}</span><div><h3>vs {m.opponent} <small>{m.score}</small></h3><p>{m.focus || 'No practice focus recorded.'}</p><small>{dateLabel(m.date)}</small></div></article>)}</div> : <p>Your recent results and next-session focus will appear here. Sample matches are excluded.</p>}</section>
  </div>;
}
