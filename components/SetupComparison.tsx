"use client";
import { useState } from "react";
import { Setup, calculateSetup, compareSetups, balanceLabel, finalCondition, signed,CourtTestSummary,courtEvidenceForSetup } from "@/lib/baseline/racquet";
import SetupCourtEvidence from "./SetupCourtEvidence";

type Props = { draft: Setup; saved: Setup[]; onLoad: (s: Setup) => void; onMatch: (s: Setup) => void; onTest: () => void;preferredId?:string;onPin?:(s:Setup)=>void;initialReferenceId?:string;onReferenceChange?:(id:string)=>void;courtSummaries?:CourtTestSummary[];courtLoading?:boolean;courtError?:string;onReviewFeedback?:(reference:Setup,candidate?:Setup)=>void;onBenchSheet?:(s:Setup)=>void };
export default function SetupComparison({draft, saved, onLoad, onMatch, onTest,preferredId,onPin,initialReferenceId,onReferenceChange,courtSummaries=[],courtLoading,courtError,onReviewFeedback,onBenchSheet}: Props) {
  const [referenceId, setReferenceId] = useState(saved.find(s=>s.id===initialReferenceId)?.id || saved.find(s => s.id !== draft.id)?.id || saved[0]?.id || "");
  const [thirdId, setThirdId] = useState("");
  const reference = saved.find(s => s.id === referenceId);
  const third = saved.find(s => s.id === thirdId && s.id !== referenceId);
  const entries = [{setup:draft, label:"CURRENT DRAFT"}, ...(reference ? [{setup:reference, label:"REFERENCE"}] : []), ...(third ? [{setup:third, label:"ALTERNATIVE"}] : [])];
  const results = entries.map(e => calculateSetup(e.setup));
  const delta = reference ? compareSetups(draft, reference) : null;
  const rows: { label: string; unit: string; digits: number; values: (number | null)[]; help?: string }[] = [
    {label:"Weight",unit:"g",digits:1,values:results.map(r => r.weight)},
    {label:"Balance from butt",unit:"cm",digits:2,values:results.map(r => r.balance)},
    {label:"Head-light points",unit:"",digits:1,values:results.map(r => r.hl),help:"Positive = head light; negative = head heavy"},
    {label:"Total swingweight",unit:"kg·cm²",digits:1,values:results.map(r => r.swingweight),help:"Unknown stays unknown; enter each starting SW to compare totals"},
    {label:"Length",unit:"cm",digits:2,values:entries.map(e => e.setup.length)},
    {label:"Added mass",unit:"g",digits:1,values:results.map(r => r.added)},
    {label:"SW from additions",unit:"kg·cm²",digits:1,values:results.map(r => r.swChange),help:"Changes to each baseline, not a measure of which frame swings heavier"},
  ];
  return <div className="comparison-workspace">
    <section className="panel comparison-toolbar">
      <div><div className="eyebrow">Setup comparison</div><h2>What changed between these rackets?</h2><p>Compare your draft with saved setups. The differences below are measured against your chosen reference.</p></div>
      <button className="text-button" onClick={()=>{setReferenceId("");setThirdId("");onReferenceChange?.("");}}>Reset comparison choices</button>
      <div className="form-grid mt-4">
        <label className="field">Reference setup<select value={reference?.id || ""} onChange={e => {setReferenceId(e.target.value);onReferenceChange?.(e.target.value); if(thirdId === e.target.value) setThirdId("");}}><option value="">Choose a saved reference</option>{saved.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="field">Third setup (optional)<select value={third?.id || ""} onChange={e => setThirdId(e.target.value)}><option value="">Add another saved setup</option>{saved.filter(s => s.id !== referenceId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      </div>
      {!saved.length && <p className="notice">Save your starting setup in Build, make a copy, then change one variable. Your saved starting setup becomes the reference.</p>}
      {courtError && <p className="notice" role="alert">Court feedback: {courtError}</p>}
    </section>
    <div className={`comparison-cards columns-${entries.length}`}>{entries.map(({setup:s,label},i) => <article className={`panel comparison-card ${i===0 ? 'draft-card' : ''}`} key={label}>
      <div className="eyebrow"><i style={{background:s.color}} />{label}</div><h3>{s.name || 'Unnamed draft'}</h3><p>{s.model}</p>
      <div className="comparison-card-metrics"><strong>{results[i].weight.toFixed(1)}<small> g</small></strong><span>{balanceLabel(results[i].hl)}</span></div>
      <div className="comparison-secondary-metrics"><div><span>Balance</span><b>{results[i].balance.toFixed(2)}<small> cm</small></b></div><div><span>Total SW</span><b>{results[i].swingweight===null ? "Unknown" : results[i].swingweight.toFixed(1)}</b></div></div>
      <div className="badge">{finalCondition(s).toUpperCase()} · {s.condition === 'ready' ? 'ENTERED BASELINE' : 'CATALOG / EDITABLE'}</div>
      {s.id && s.id===preferredId && <span className="matchday-badge">MATCH-DAY CHOICE</span>}
      <dl><div><dt>Strings</dt><dd>{s.stringName || 'Not recorded'}</dd></div><div><dt>Tension</dt><dd>{s.tension || 'Not recorded'}</dd></div></dl>
      <SetupCourtEvidence setup={s} summary={courtEvidenceForSetup(s,courtSummaries)} loading={courtLoading} error={courtError} onReview={onReviewFeedback ? s=>onReviewFeedback(s) : undefined} />
      {onBenchSheet && <button className="button comparison-bench-action" aria-label={`Open bench sheet for ${s.name}`} onClick={()=>onBenchSheet(s)}>Bench sheet</button>}
      {i > 0 && <div className="button-row"><button className="button" onClick={() => onLoad(s)}>Load as draft</button><button className="button" disabled={finalCondition(s)!==finalCondition(draft)} onClick={() => onMatch(s)}>Match this setup</button>{onPin && finalCondition(s)==="strung" && <button className="button" disabled={s.id===preferredId} onClick={()=>onPin(s)}>{s.id===preferredId ? "Match-day choice" : "Use for match day"}</button>}</div>}
    </article>)}</div>
    <section className="panel comparison-specs">
      <div className="section-heading"><h3>Specification matrix</h3><span className="badge">ESTIMATES</span></div>
      <p className="comparison-scroll-hint">Swipe the table to compare every setup <span aria-hidden="true">↔</span></p>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Racket specification comparison; scroll horizontally on small screens"><table>
        <caption>{reference ? `Differences are draft or alternative minus ${reference.name}. Differences appear only for the same strung/unstrung condition. Values are estimates.` : 'Choose a reference to see specification differences.'}</caption>
        <thead><tr><th scope="col">Specification</th>{entries.map(e => <th scope="col" className={e.label==="REFERENCE" ? "reference-column" : ""} key={e.label}>{e.label === 'CURRENT DRAFT' ? 'Draft' : e.label === 'REFERENCE' ? 'Reference' : 'Alternative'}</th>)}</tr></thead>
        <tbody>{rows.map(row => <tr key={row.label}><th scope="row">{row.label}<small>{row.unit}{row.help && <span>{row.help}</span>}</small></th>{row.values.map((v,i) => <td key={i} className={i===1 ? "reference-column" : ""}><b>{v === null ? 'Unknown' : v.toFixed(row.digits)}</b>{reference && i !== 1 && finalCondition(entries[i].setup)===finalCondition(reference) && v !== null && row.values[1] !== null && <small className="spec-delta">{signed(v-row.values[1]!,row.digits)} {row.unit}</small>}</td>)}</tr>)}</tbody>
      </table></div>
    </section>
    {delta && <section className="panel decision-panel"><div className="eyebrow">Understanding the numbers</div><h3>{delta.compatible ? 'What to take onto court' : 'Check measurement conditions'}</h3><ul>{delta.insights.map(t => <li key={t}>{t}</li>)}</ul>{delta.compatible && <div className="button-row"><button className="button primary" onClick={onTest}>Court test the draft</button><button className="button" onClick={() => onMatch(reference!)}>Build toward reference</button>{onReviewFeedback && !courtLoading && !courtError && (courtEvidenceForSetup(draft,courtSummaries).totalCount>0 || courtEvidenceForSetup(reference!,courtSummaries).totalCount>0) && <button className="button" onClick={()=>onReviewFeedback(reference!,draft)}>Compare recorded feedback</button>}</div>}<p className="helper">Court feedback below each card belongs to its exact recorded inputs. A changed specification, string or tension needs its own test. These are your subjective entries, not a predicted winner.</p></section>}
  </div>;
}
