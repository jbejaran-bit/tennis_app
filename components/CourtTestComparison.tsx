"use client";
import { useEffect,useState } from "react";
import { RacketTrial,Setup,TRIAL_METRICS,TRIAL_LABELS,summarizeCourtTests,setupFingerprint,calculateSetup,signed,CourtFeedbackFocus,CourtTestFilters,CourtTestSummary,courtEvidenceForSetup,isSetup } from "@/lib/baseline/racquet";
import { today,surfaces,dateLabel } from "@/lib/baseline/data";
import Icon from "./Icons";

type Props={trials:RacketTrial[];draft:Setup;onLoad:(s:Setup)=>void;onRecord:()=>void;focus?:CourtFeedbackFocus|null};
export default function CourtTestComparison({trials,draft,onLoad,onRecord,focus}:Props) {
  const [referenceKey,setReferenceKey]=useState(focus ? setupFingerprint(focus.reference) : "");
  const [candidateKey,setCandidateKey]=useState<string|null>(focus ? focus.candidate ? setupFingerprint(focus.candidate) : null : "");
  const [surface,setSurface]=useState("");
  const [period,setPeriod]=useState<"all"|"28"|"84">("all");
  const [stringAge,setStringAge]=useState<NonNullable<CourtTestFilters["stringAge"]>>("all");
  const filtered=period!=="all" || stringAge!=="all";
  const conditionLabel=filtered ? "matching these conditions" : surface ? `on ${surfaces[surface].toLowerCase()}` : "across recorded surfaces";
  const selectionLabel=filtered ? "selected conditions" : "selected surface";
  function resetFilters(){setSurface("");setPeriod("all");setStringAge("all");}
  useEffect(()=>{setReferenceKey(focus ? setupFingerprint(focus.reference) : "");setCandidateKey(focus ? focus.candidate ? setupFingerprint(focus.candidate) : null : "");resetFilters();},[focus]);
  const summaries=summarizeCourtTests(trials,today(),surface,{days:period==="all" ? undefined : period==="28" ? 28 : 84,stringAge});
  const identicalFocus=!!focus?.candidate && setupFingerprint(focus.reference)===setupFingerprint(focus.candidate);
  const configurations=[...summaries];
  const requested=focus ? [focus.reference,...(focus.candidate && !identicalFocus ? [focus.candidate] : [])] : [];
  for(const setup of requested){const evidence=courtEvidenceForSetup(setup,summaries);const index=configurations.findIndex(s=>s.key===evidence.key);if(index<0)configurations.push(evidence);else configurations[index]=evidence;}
  const reference=configurations.find(s=>s.key===referenceKey) || (isSetup(draft) ? configurations.find(s=>s.key===setupFingerprint(draft)) : undefined) || configurations[0];
  const candidate=candidateKey===null ? undefined : configurations.find(s=>s.key===candidateKey && s.key!==reference?.key) || (candidateKey==="" ? configurations.find(s=>s.key!==reference?.key) : undefined);
  const entries=[reference,candidate].filter((s):s is CourtTestSummary=>!!s);
  const validPair=!!reference && !!candidate;
  const comparablePair=validPair && reference.trials.length>0 && candidate.trials.length>0;
  const differentModels=validPair && reference.setup.model!==candidate.setup.model;
  const colors=["#d2f58a","#8bc9b3"];
  return <div className="court-comparison" aria-label="Court-test feedback comparison">
    <section className="panel court-comparison-intro"><div className="eyebrow">FEEDBACK / CONFIGURATION BY CONFIGURATION</div><h2 id="court-feedback-heading" tabIndex={-1}>Compare the feel. Keep the context.</h2><p>Review one configuration or compare two. Feedback is matched to exact setup inputs, including mass placement, strings and tension.</p>
      <div className="form-grid mt-4"><label className="field">Reference configuration<select value={reference?.key || ""} onChange={e=>{setReferenceKey(e.target.value);if(candidateKey===e.target.value)setCandidateKey(null);}}><option value="">Choose a configuration</option>{configurations.map(s=><option key={s.key} value={s.key}>{s.setup.name} · {s.totalCount} total tests · {calculateSetup(s.setup).weight.toFixed(1)} g · {calculateSetup(s.setup).balance.toFixed(2)} cm</option>)}</select></label>
      <label className="field">Candidate configuration<select value={candidate?.key || ""} onChange={e=>setCandidateKey(e.target.value || null)}><option value="">None — review reference only</option>{configurations.filter(s=>s.key!==reference?.key).map(s=><option key={s.key} value={s.key}>{s.setup.name} · {s.totalCount} total tests · {calculateSetup(s.setup).weight.toFixed(1)} g · {calculateSetup(s.setup).balance.toFixed(2)} cm</option>)}</select></label></div>
      <p className="helper">Archived and future-dated tests stay in history and are excluded from these summaries. Reviewing feedback keeps your current draft intact; load selected specs before recording a different setup.</p>
      {identicalFocus && !validPair && reference?.key===setupFingerprint(focus!.reference) && candidateKey===reference.key && <p className="notice">The selected setups have identical recorded inputs. Their tests form one configuration, even when the names or record IDs differ.</p>}
      <div className="court-condition-filters"><label className="field">Compare tests on<select value={surface} onChange={e=>setSurface(e.target.value)}><option value="">All surfaces</option>{Object.entries(surfaces).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
      <label className="field">Test period<select value={period} onChange={e=>setPeriod(e.target.value as typeof period)}><option value="all">All recorded dates</option><option value="28">Last 28 days</option><option value="84">Last 84 days</option></select></label>
      <label className="field">String age at test<select value={stringAge} onChange={e=>setStringAge(e.target.value as typeof stringAge)}><option value="all">All string ages</option><option value="fresh">0–5 hours</option><option value="played">Over 5–15 hours</option><option value="older">Over 15 hours</option><option value="unknown">Not recorded</option></select></label></div>
      <div className="court-filter-status"><p className="helper">String-age ranges describe recorded hours, not string lifespan. Unknown hours are included only in All string ages or Not recorded.</p>{(surface || filtered) && <button className="text-button" onClick={resetFilters}>Reset conditions</button>}</div>
      <p className="court-sample-status" role="status">{entries.reduce((sum,s)=>sum+s.trials.length,0)} of {entries.reduce((sum,s)=>sum+s.totalCount,0)} active tests included for {validPair ? "the selected pair" : "the reference"}.</p>
    </section>
    {!reference ? <section className="panel"><div className="empty-state"><Icon name="racket" /><h3>Feedback starts with a court test.</h3><p>Record your starting setup, then test a change under similar conditions. Archived and future-dated tests are excluded.</p><button className="button primary" onClick={onRecord}>Record current draft</button></div></section> : <>
      <div className={`court-comparison-cards columns-${entries.length}`}>{entries.map((s,i)=>{const r=calculateSetup(s.setup),hours=s.stringHours;return <article className="panel court-summary-card" style={{borderTopColor:colors[i]}} data-configuration-key={s.key} key={s.key}>
        <div className="eyebrow"><span style={{background:colors[i]}} />{i===0 ? "REFERENCE" : "CANDIDATE"}</div><h3>{s.setup.name}</h3><p>{s.setup.model}</p>
        <div className="court-summary-count"><strong>{s.trials.length}</strong><span>tests {conditionLabel}<small>{s.minutes} min · {s.lastDate ? "Latest "+dateLabel(s.lastDate) : "No tests for these conditions"}</small></span></div>
        {s.totalCount===0 && <p className="notice">No active court tests for these exact inputs. Feedback from a different version has not been substituted.</p>}
        <p className="court-config-specs">{r.weight.toFixed(1)} g · {r.balance.toFixed(2)} cm · {r.swingweight===null ? "Total SW unknown" : r.swingweight.toFixed(1)+" kg·cm² SW"}</p>
        <dl><div><dt>Strings</dt><dd>{s.setup.stringName || "Not recorded"}</dd></div><div><dt>Tension</dt><dd>{s.setup.tension || "Not recorded"}</dd></div><div><dt>Hours on strings</dt><dd>{hours.min===null ? "Not recorded" : hours.min===hours.max ? `${hours.min} h` : `${hours.min}–${hours.max} h`}<small>{s.trials.length ? `${hours.count}/${s.trials.length} tests recorded` : "No tests for these conditions"}</small></dd></div><div><dt>Surfaces</dt><dd>{s.surfaces.map(v=>surfaces[v]).join(", ") || "—"}</dd></div><div><dt>Latest decision</dt><dd>{s.latestDecision===null ? "Not recorded" : s.latestDecision==="keep" ? "Keep" : s.latestDecision==="revert" ? "Revert" : "Test again"}</dd></div></dl>
        {s.latestNote && <details className="method-note"><summary>Latest test note</summary><p className="preserve-lines">{s.latestNote}</p></details>}
        <button className="button" onClick={()=>onLoad({...s.setup,id:"",archived:false,name:s.setup.name.slice(0,70)+" retest"})}>Load {i===0 ? "reference" : "candidate"} specs <Icon name="arrow" /></button>
      </article>;})}</div>
      <section className="panel feedback-matrix"><div className="section-heading"><h3>{validPair ? "Your feedback, side by side" : "Your recorded feedback"}</h3><span className="badge">1–5 SCALE</span></div><p className="helper">Mean of the ratings you recorded, with a count for each metric. Unassessed metrics stay unknown. Tests are equally weighted; minutes do not change a rating’s weight.</p>
        {validPair && !comparablePair && <p className="notice">Both configurations need at least one test on the {selectionLabel}. Your choices are kept; adjust the filters or record another test.</p>}
        {!validPair && reference.trials.length===0 && reference.totalCount>0 && <p className="notice">This configuration has no tests on the {selectionLabel}. Adjust the filters; your selection is kept.</p>}
        {TRIAL_METRICS.map(metric=>{const a=reference.ratings[metric],b=candidate?.ratings[metric];const delta=a.mean!==null && b?.mean!==undefined && b?.mean!==null ? b.mean-a.mean : null;return <section className="feedback-metric" key={metric} aria-label={TRIAL_LABELS[metric]}><div className="feedback-metric-heading"><h4>{TRIAL_LABELS[metric]}</h4><span>{!validPair ? "Reference ratings" : delta===null ? "Both need ratings" : `Candidate ${signed(delta)} points vs reference`}</span></div>{[a,...(b ? [b] : [])].map((rating,i)=><div className="feedback-rating" key={i}><span className="feedback-rating-name">{i===0 ? "Reference" : "Candidate"}</span><div className="feedback-track" role="img" aria-label={rating.mean===null ? "Not assessed" : `${rating.mean.toFixed(1)} out of 5 from ${rating.count} rated tests`}><i style={{width:rating.mean===null ? "0%" : `${rating.mean/5*100}%`,background:colors[i]}} /></div><b>{rating.mean===null ? "—" : rating.mean.toFixed(1)}<small>{rating.count===0 ? "Not assessed" : `${rating.count} rated ${rating.count===1 ? "test" : "tests"}`}</small></b></div>)}</section>;})}
      </section>
      {!validPair && <section className="panel feedback-next-test"><h3>Test another configuration to compare.</h3><p>A renamed copy with the same inputs is the same configuration. Change a specification or string setup, test it, then record the feedback. You can also choose an already tested candidate above.</p></section>}
      <section className="panel feedback-context"><div className="eyebrow">MAKE THE NEXT TEST MORE USEFUL</div><h3>Look for repeatable differences.</h3><ul><li>{differentModels ? "Different frame models are being compared. A rating difference cannot isolate the effect of added weight." : "Use the same balls, targets and session structure so each configuration gets a similar test."}</li><li>{entries.some(s=>s.surfaces.length>1) ? "These results combine surfaces. Use the surface selector for a closer comparison." : "Compare similar string age and session duration; those conditions can change the feel."}</li><li>These are your subjective ratings, not controlled measurements or a causal result. A small sample is a reason to test again.</li></ul><button className="button primary" onClick={onRecord}>Record current draft</button></section>
    </>}
  </div>;
}
