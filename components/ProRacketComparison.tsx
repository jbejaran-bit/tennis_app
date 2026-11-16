"use client";
import {Setup,finalCondition,signed} from '@/lib/baseline/racquet';
import {PRO_SPECS,compareProSpec} from '@/lib/baseline/pro-specs';

export type ProComparisonSelection = {proId:string; ownId:string; section:string; year:string};
export const DEFAULT_PRO_SELECTION:ProComparisonSelection = {proId:PRO_SPECS[0].id,ownId:'',section:'specs',year:''};

export default function ProRacketComparison({draft,saved,onBuild,selection,onSelectionChange}:{draft:Setup;saved:Setup[];onBuild:()=>void;selection:ProComparisonSelection;onSelectionChange:(next:ProComparisonSelection)=>void}) {
 const {proId,ownId,section,year}=selection;
 const change=(patch:Partial<ProComparisonSelection>)=>onSelectionChange({...selection,...patch});
 const years=[...new Set(PRO_SPECS.map(p=>p.reportYear))].sort((a,b)=>b-a);
 const reports=PRO_SPECS.filter(p=>!year || p.reportYear===Number(year));
 const pro=reports.find(p=>p.id===proId) || reports[0];
 const own=saved.find(s=>s.id===ownId)||draft;
 const comparison=compareProSpec(own,pro);
 return <section className="pro-workspace" aria-label="Pro racket comparison">
  <div className="panel pro-intro">
   <div className="pro-intro-heading"><div><div className="eyebrow">The tour, in numbers</div><h2>How does your racket compare?</h2></div><button className="text-button" onClick={()=>onSelectionChange({...DEFAULT_PRO_SELECTION})}>Reset pro comparison</button></div>
   <p>Pick a reported setup, then compare it with yours. Pro rackets change over time, and the racket under the paint may differ from the one in a shop.</p>
   <div className="pro-browse-fields"><label className="field">Report year<select value={year} onChange={e=>{const year=e.target.value;const visible=PRO_SPECS.filter(p=>!year || p.reportYear===Number(year));change({year,proId:visible.find(p=>p.id===pro.id)?.id || visible[0].id,section:'specs'});}}><option value="">All report years</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label><label className="field">Your comparison racket<select value={saved.some(s=>s.id===ownId)?ownId:''} onChange={e=>change({ownId:e.target.value})}><option value="">Current draft</option>{saved.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label></div>
   <label className="field pro-player-select">Player & report<select value={pro.id} onChange={e=>change({proId:e.target.value})}>{reports.map(p=><option key={p.id} value={p.id}>{p.player} · {p.reportYear} · {p.condition}</option>)}</select></label>
   <div className="pro-player-grid" aria-label="Choose a player">{reports.map(p=><button key={p.id} aria-pressed={p.id===pro.id} onClick={()=>change({proId:p.id})}><span className="pro-player-initial" aria-hidden="true">{p.player.split(' ').map(n=>n[0]).join('')}</span><span><b>{p.player}</b><small>{p.reportYear} report · {p.condition}</small></span></button>)}</div>
   <p className="pro-year-note">No affiliation with any brand. Specifications are reference values and may differ from your racket.</p>
   <details className="method-note">
    <summary>All player reports and sources</summary>
    <ul className="pro-source-list">
     {PRO_SPECS.map(report => <li key={report.id}>
      <strong>{report.player}</strong> · {report.model} · {report.reportYear} report · {report.condition}
      <br /><a href={report.url} target="_blank" rel="noreferrer">Tennisnerd source</a> · Not independently verified
     </li>)}
    </ul>
   </details>
   <p className="pro-year-note">Report year is the source date, not a confirmed playing season. Each profile explains what is known.</p>
  </div>
  <article className="panel pro-profile" key={pro.id}>
   <div className="pro-profile-heading"><div><div className="eyebrow">{pro.reportYear} REPORT · {pro.evidence} · NOT INDEPENDENTLY VERIFIED</div><h2>{pro.player}</h2><p>{pro.model}</p></div><span className="badge">{pro.condition.toUpperCase()} REFERENCE</span></div>
   <p className="helper pro-era">{pro.era}</p>
   <nav className="pro-section-nav" aria-label="Pro reference sections">{[['specs','Compare specs'],['strings','Strings & context'],['sources','Source & year']].map(([id,label])=><button className="button" key={id} aria-pressed={section===id} onClick={()=>change({section:id})}>{label}</button>)}</nav>
   {section==='specs' && <div>
    <p className="helper">{own.name || 'Your draft'} · {comparison.valid ? finalCondition(own) : 'Check inputs'} versus {pro.player} · {pro.condition}. Your values are calculated estimates.</p>
    {!comparison.valid ? <p className="notice" role="alert">Correct the draft inputs in Build to calculate your comparison. <button className="text-button" onClick={onBuild}>Open Build</button></p> : !comparison.compatible && <div className="notice"><p>Different measurement conditions: your racket is {finalCondition(own)}, this reference is {pro.condition}. Differences are hidden until conditions match.</p><p>{pro.condition==='unstrung' ? 'Use an unstrung starting racket with 0 g of added strings.' : 'Use a strung starting racket, or include string mass in your unstrung setup.'} You can also choose a matching saved setup above.</p><button className="text-button" onClick={onBuild}>Review starting specs in Build →</button></div>}
    <div className="pro-metrics">{comparison.rows.map(row=><section className="pro-metric" key={row.label} aria-label={row.label}><h3>{row.label} <small>{row.unit}</small></h3><div><span>Yours<strong>{row.own===null?'Unknown':row.own.toFixed(row.digits)}</strong></span><span>{pro.player.split(' ').at(-1)}<strong>{row.pro===null?'Not reported':row.pro.toFixed(row.digits)}</strong></span></div><p>{row.delta===null ? 'Difference unavailable' : `${signed(row.delta,row.digits)} ${row.unit} · yours minus pro`}</p></section>)}</div>
    <p className="helper">Use these as reference points. Matching a pro’s numbers will not reproduce their racket, strings or feel.</p>
   </div>}
   {section==='strings' && <div className="pro-context"><h3>Reported string setup</h3><p>{pro.strings}</p><h3>Tension</h3><p>{pro.tension}</p><h3>Measurement context</h3><p>{pro.notes}</p></div>}
   {section==='sources' && <div className="pro-context"><h3>Source and dates</h3><p>Report published or updated: <time dateTime={pro.date}>{pro.date}</time>. Source snapshot reviewed: 2026-10-13.</p><p>{pro.era}. A report year is not a model release year or proof the player used these specifications throughout that season.</p><p>{pro.evidence}. {pro.notes}</p><a className="text-button" href={pro.url} target="_blank" rel="noreferrer">Read Tennisnerd source ↗</a></div>}
  </article>
 </section>;
}
