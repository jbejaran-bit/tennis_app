"use client";
import { FormEvent, useState } from "react";
import { Match, PracticeSession, drills, dateLabel, today, isPracticeSession, isLegacyDemo } from "@/lib/baseline/data";
import { Setup } from "@/lib/baseline/racquet";
import { SaveLocal } from "@/lib/baseline/useLocalData";
import { setArchived } from "@/lib/baseline/storage";
import Modal from "./Modal";
type Props = {matches: Match[]; sessions: PracticeSession[]; setups: Setup[]; saveMatches: SaveLocal<Match[]>; saveSessions: SaveLocal<PracticeSession[]>; saveSetups: SaveLocal<Setup[]>; onEditMatch: (m: Match) => void; error: string};
export default function SavedDataHub({matches,sessions,setups,saveMatches,saveSessions,saveSetups,onEditMatch,error}: Props) {
  const [kind,setKind] = useState("matches");
  const [archived,setArchiveView] = useState(false);
  const [query,setQuery] = useState("");
  const [editing,setEditing] = useState<PracticeSession | null>(null);
  const [message,setMessage] = useState("");
  const [formError,setFormError] = useState("");
  const rows = kind === "matches" ? matches.map(m => ({id:m.id, archived:!!m.archived,title:`vs ${m.opponent}`,detail:`${dateLabel(m.date)} · ${m.score}${isLegacyDemo(m) ? ' · Sample' : ''}`,search:m.opponent})) : kind === "practice" ? sessions.map(s => ({id:s.id,archived:!!s.archived,title:drills.find(d => d.id === s.drillId)?.title || 'Practice',detail:`${dateLabel(s.date)} · ${s.minutes} min · ${s.notes}`,search:s.notes+' '+(drills.find(d => d.id === s.drillId)?.title || '')})) : setups.map(s => ({id:s.id,archived:!!s.archived,title:s.name,detail:`${s.model} · ${s.stringName || 'Strings not recorded'}`,search:s.name+' '+s.model}));
  const visible = rows.filter(r => r.archived === archived && (r.title+' '+r.search).toLowerCase().includes(query.toLowerCase()));
  function toggle(id:string) {
    const next = !archived;
    const ok = kind === 'matches' ? saveMatches(current => setArchived(current,id,next)) : kind === 'practice' ? saveSessions(current => setArchived(current,id,next)) : saveSetups(current => setArchived(current,id,next));
    setMessage(ok ? next ? "Record archived. Open Archived to restore it at any time." : "Record restored to your active workspace." : "Could not save the change. Your record has been kept.");
  }
  function editPractice(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!editing) return;
    const f = new FormData(e.currentTarget);
    const updated = {...editing,date:String(f.get('date')),minutes:Number(f.get('minutes')),notes:String(f.get('notes'))};
    if(!isPracticeSession(updated) || updated.date > today()) {setFormError('Check the date and minutes before saving.');return;}
    if(saveSessions(current => current.map(s => s.id === updated.id ? {...updated,archived:s.archived} : s))) {setEditing(null);setMessage('Practice entry updated. Progress totals now reflect your correction.');}
    else setFormError('Could not save this edit. Your original entry has been kept.');
  }
  return <div className="saved-data-hub"><section className="panel progress-panel"><div className="eyebrow">YOUR RECORDS, UNDER YOUR CONTROL</div><h2>Keep a useful history</h2><p>Archive entries to hide them from your workspace and progress totals. They stay in your backup and can be restored here. Video clips remain in the Video journal.</p><div className="filter-row" aria-label="Record type">{[['matches','Matches'],['practice','Practice'],['setups','Racket setups']].map(([id,label]) => <button className={`filter-chip ${kind === id ? 'selected' : ''}`} aria-pressed={kind === id} key={id} onClick={() => {setKind(id);setQuery('');setMessage('');}}>{label}</button>)}</div></section>
  <section className="panel progress-panel"><div className="section-heading"><div className="filter-row" aria-label="Record status">{[false,true].map(value => <button key={String(value)} className={`filter-chip ${archived === value ? 'selected' : ''}`} aria-pressed={archived === value} onClick={() => setArchiveView(value)}>{value ? 'Archived' : 'Active'} ({rows.filter(r => r.archived === value).length})</button>)}</div><label className="field">Search saved records<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search names or practice notes" /></label></div>
  {(message || error) && <p className="notice" role="status">{error || message}</p>}
  {visible.length === 0 ? <div className="empty-state"><h3>{query ? 'No matching records' : archived ? 'Nothing archived' : 'No active records yet'}</h3><p>{query ? 'Try a shorter search or another record type.' : archived ? 'Archived records will appear here with a Restore button.' : 'Save a setup, match or practice session to manage it here.'}</p></div> : <ul className="saved-records">{visible.map(r => <li key={r.id}><div><h3>{r.title}</h3><p>{r.detail}</p></div><div className="button-row">{!archived && kind !== 'setups' && <button className="button" aria-label={`Edit ${r.title}`} onClick={() => {if(kind === 'matches') onEditMatch(matches.find(m => m.id === r.id)!); else {setFormError('');setEditing(sessions.find(s => s.id === r.id)!);}}}>Edit</button>}<button className="button" aria-label={`${archived ? 'Restore' : 'Archive'} ${r.title}`} onClick={() => toggle(r.id)}>{archived ? 'Restore' : 'Archive'}</button></div></li>)}</ul>}
  </section>
  {editing && <Modal title="Edit practice entry" onClose={() => setEditing(null)}><form className="form-stack" onSubmit={editPractice}><p>{drills.find(d => d.id === editing.drillId)?.title}</p><div className="form-grid"><label className="field">Practice date<input type="date" name="date" max={today()} required defaultValue={editing.date} /></label><label className="field">Minutes practiced<input type="number" name="minutes" min="1" max="300" required defaultValue={editing.minutes} /></label></div><label className="field">Practice notes<textarea name="notes" rows={4} maxLength={2000} defaultValue={editing.notes} /></label>{(formError || error) && <p className="notice" role="alert">{formError || error}</p>}<div className="button-row"><button className="button primary" type="submit">Save changes</button><button className="button" type="button" onClick={() => setEditing(null)}>Cancel</button></div></form></Modal>}
  </div>;
}
