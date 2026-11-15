import { Setup, calculateSetup, balanceLabel } from "@/lib/baseline/racquet";
import Icon from "./Icons";

export default function RecordedSetup({setup,recorded=false,onReview}: {setup:Setup;recorded?:boolean;onReview?:(s:Setup)=>void}) {
  const result=calculateSetup(setup);
  return <section className="recorded-equipment" aria-label={recorded ? "Racket setup recorded for this match" : "Racket setup to record with this match"}>
    <div className="section-heading"><div className="eyebrow"><Icon name="racket" />{recorded ? "RECORDED MATCH SETUP" : "SETUP TO RECORD"}</div><span className="badge">{recorded ? "SNAPSHOT" : "STRUNG"}</span></div>
    <h3>{setup.name}</h3><p>{setup.model}</p>
    <dl className="recorded-specs"><div><dt>Weight</dt><dd>{result.weight.toFixed(1)}<small> g</small></dd></div><div><dt>Balance</dt><dd>{result.balance.toFixed(2)}<small> cm</small></dd></div><div><dt>Total SW</dt><dd>{result.swingweight===null ? "Unknown" : result.swingweight.toFixed(1)}</dd></div></dl>
    <p className="recorded-strings">{balanceLabel(result.hl)} · {setup.stringName || "Strings not recorded"} · {setup.tension || "Tension not recorded"}</p>
    <p className="helper">{recorded ? "Captured specifications and estimates. Later saved-setup edits do not change this match record." : "These specifications will be captured when you save the match."}</p>
    {onReview && <button className="button" onClick={()=>onReview(setup)}>Review in Racket Lab <Icon name="arrow" /></button>}
  </section>;
}
