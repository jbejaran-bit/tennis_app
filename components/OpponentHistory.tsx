"use client";
import { Match, opponentHistory, dateLabel, surfaces } from "@/lib/baseline/data";

export default function OpponentHistory({ matches, active, onSelect }: { matches: Match[]; active: Match; onSelect: (id: string) => void }) {
  const history = opponentHistory(matches, active.opponent);
  const otherMeetings = history.meetings.filter(m => m.id !== active.id);
  return <section className="opponent-history" aria-label="Opponent history">
    <div className="eyebrow">KNOW THE MATCHUP</div>
    <div className="section-heading"><h3>Head to head</h3><span className="badge">ALL TIME</span></div>
    <div className="opponent-record"><strong>{history.wins}<small>W</small> <span>–</span> {history.losses}<small>L</small></strong><p>{history.total} recorded {history.total === 1 ? "meeting" : "meetings"} with {active.opponent}</p></div>
    {history.surfaces.length > 0 && <ul className="opponent-surfaces">{history.surfaces.map(s => <li key={s.id}><span>{s.label}</span><b>{s.wins}W · {s.losses}L</b></li>)}</ul>}
    {otherMeetings.length > 0 ? <details key={active.id} className="method-note"><summary>Review other meetings ({otherMeetings.length})</summary><div className="opponent-meetings">{otherMeetings.map(m => <article key={m.id}>
      <div className="section-heading"><span className={`result-mark ${m.result}`}>{m.result === "win" ? "W" : "L"}</span><b>{m.score}</b><button className="text-button" onClick={() => onSelect(m.id)} aria-label={`Open match against ${m.opponent} on ${dateLabel(m.date)}, ${m.score}`}>Open match</button></div>
      <small>{dateLabel(m.date)} · {surfaces[m.surface]}</small>
      <p className="preserve-lines">{m.notes || "No match notes recorded."}</p>
      {m.focus && <p className="helper"><b>Practice focus:</b> {m.focus}</p>}
    </article>)}</div></details> : <p className="helper">Log another meeting with this opponent to build your rematch notes.</p>}
    <p className="helper">Matched by opponent name, ignoring capitalization and extra spaces. Use distinct names for different players. Includes active matches through today, across all result filters; sample matches are excluded.</p>
  </section>;
}
