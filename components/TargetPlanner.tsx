"use client";
import { useEffect, useState } from "react";
import { Setup, calculateSetup, planTarget, planSpecificationTarget, signed } from "@/lib/baseline/racquet";

type Props = {setup:Setup;onApply:(patch:Partial<Setup>)=>void;target?:Setup|null;onClearTarget?:()=>void};
export default function TargetPlanner({setup,onApply,target,onClearTarget}:Props) {
  const [weight,setWeight] = useState("");
  const [balance,setBalance] = useState("");
  const [swingweight,setSwingweight] = useState("");
  const [matchSW,setMatchSW] = useState(false);
  const [notice,setNotice] = useState("");
  const [hoop,setHoop] = useState<"tip"|"sides">("tip");
  useEffect(()=>{if(target){const r=calculateSetup(target);setWeight(String(r.weight));setBalance(String(r.balance));setSwingweight(r.swingweight===null ? "" : String(r.swingweight));setNotice("");}},[target]);
  const current=calculateSetup(setup);
  const reference=target ? calculateSetup(target) : null;
  const complete=weight!=="" && balance!=="";
  const plan=complete ? matchSW
    ? planSpecificationTarget(setup,Number(weight),Number(balance),swingweight==="" ? null : Number(swingweight))
    : planTarget(setup,Number(weight),Number(balance),hoop) : null;
  const tip=plan?.ok ? "sides" in plan ? plan.tip : hoop==="tip" ? plan.tip : 0 : 0;
  const sides=plan?.ok ? "sides" in plan ? plan.sides : hoop==="sides" ? plan.tip : 0 : 0;
  const hasAdditions=plan?.ok && tip+sides+plan.butt>0.001;
  const range=plan && "range" in plan ? plan.range : null;
  return <section className="panel target-planner" id="target-planner">
    <div className="section-heading"><h3>Build toward a target</h3><span className="badge">RACKET MATCHING</span></div>
    <p className="helper">Start from your current draft. Match weight and balance, or include a measured swingweight to solve all three specifications together.</p>
    {target && reference && <div className="target-reference"><span>Reference: <b>{target.name}</b></span><button className="text-button" onClick={onClearTarget}>Unlink reference</button><small>Reference SW: {reference.swingweight===null ? "unknown" : reference.swingweight.toFixed(1)+" kg·cm²"}. Targets below are editable; matching specifications does not establish identical feel.</small></div>}
    <button className="text-button" onClick={()=>{setWeight("");setBalance("");setSwingweight("");setMatchSW(false);setHoop("tip");setNotice("Target inputs reset. Your racket is unchanged.");onClearTarget?.();}}>Reset target inputs</button>
    <div className="target-goal-switch" role="group" aria-label="Target specifications"><button className={`filter-chip ${!matchSW ? "selected" : ""}`} aria-pressed={!matchSW} onClick={()=>{setMatchSW(false);setNotice("");}}>Weight + balance</button><button className={`filter-chip ${matchSW ? "selected" : ""}`} aria-pressed={matchSW} onClick={()=>{setMatchSW(true);setNotice("");}}>Weight, balance + SW</button></div>
    {matchSW ? <p className="target-placement-note">Uses mass at 12 o’clock, 3 + 9 o’clock, and inside the butt cap. Side mass is the combined total for both sides.</p> : <div className="filter-row" aria-label="Hoop placement">{([["tip","12 o’clock"],["sides","3 + 9 o’clock"]] as const).map(([id,label])=><button key={id} className={`filter-chip ${hoop===id ? "selected" : ""}`} aria-pressed={hoop===id} onClick={()=>{setHoop(id);setNotice("");}}>{label}</button>)}</div>}
    {matchSW && current.swingweight===null && <p className="notice" role="status">Enter Starting SW in Build to match all three specifications. Unknown swingweight cannot be inferred from weight or balance.</p>}
    <div className={`form-grid ${matchSW ? "three" : ""}`}>
      <label className="field">Target weight (g)<input type="number" min="100" max="1000" step="0.1" placeholder={current.weight.toFixed(1)} value={weight} onChange={e=>{setWeight(e.target.value);setNotice("");}} /></label>
      <label className="field">Target balance (cm)<input type="number" min="0.01" max={setup.length} step="0.01" placeholder={current.balance.toFixed(2)} value={balance} onChange={e=>{setBalance(e.target.value);setNotice("");}} /><small>Measured from the butt cap.</small></label>
      {matchSW && <label className="field">Target swingweight (kg·cm²)<input type="number" min="0" step="0.1" placeholder={current.swingweight===null ? "Needs starting SW" : current.swingweight.toFixed(1)} value={swingweight} onChange={e=>{setSwingweight(e.target.value);setNotice("");}} /><small>Use the same measurement condition and 10 cm axis.</small></label>}
    </div>
    <div aria-live="polite" className="target-plan-output">
      {range && <div className="target-feasible-range"><span>ACHIEVABLE TOTAL SW</span><strong>{range.min.toFixed(2)}–{range.max.toFixed(2)} <small>kg·cm²</small></strong><p>At this target weight and balance, using these three locations and your existing additions. Displayed limits are rounded estimates.</p></div>}
      {plan && plan.ok===false && !(matchSW && current.swingweight===null) && <p className={matchSW && swingweight==="" && range ? "helper" : "notice"}>{plan.reason}</p>}
      {plan?.ok && <>
        <div className="target-results">
          {(matchSW || hoop==="tip") && <div><span>Add at 12 o’clock</span><strong>{tip.toFixed(2)} <small>g</small></strong></div>}
          {(matchSW || hoop==="sides") && <div><span>Add at 3 + 9 (combined)</span><strong>{sides.toFixed(2)} <small>g</small></strong><small>{(sides/2).toFixed(2)} g per side</small></div>}
          <div><span>Add inside butt cap</span><strong>{plan.butt.toFixed(2)} <small>g</small></strong></div>
          {!matchSW && <div><span>Extra swingweight</span><strong>+{(plan.result.swChange-current.swChange).toFixed(1)} <small>kg·cm²</small></strong></div>}
        </div>
        <div className="target-projection"><span>PROJECTED SPECIFICATIONS</span><p>{plan.result.weight.toFixed(1)} g · {plan.result.balance.toFixed(2)} cm balance · {plan.result.swingweight===null ? "Total SW unknown" : plan.result.swingweight.toFixed(1)+" kg·cm² SW"}</p><small>Additional SW: +{(plan.result.swChange-current.swChange).toFixed(1)} kg·cm². {matchSW ? "All three entered targets are met by the point-mass estimate." : "This plan matches weight and balance only."}</small></div>
        {reference && plan.result.swingweight!==null && reference.swingweight!==null && <p className="helper">Projected SW differs from reference by {signed(plan.result.swingweight-reference.swingweight)} kg·cm².{!matchSW && " A weight/balance match can still have different swingweight."}</p>}
        <button className="button primary" disabled={!hasAdditions} onClick={()=>{onApply({lead12:plan.setup.lead12,lead39:plan.setup.lead39,butt:plan.setup.butt});setNotice("Plan applied to your draft. Review the estimates, then save or make a copy to keep it.");}}>{hasAdditions ? "Apply to draft" : "Target reached"}</button>
      </>}
      {notice && <p role="status" className="notice">{notice}</p>}
    </div>
    <details className="method-note"><summary>Matching method and limits</summary><p>Calculated from the current draft, including every existing addition. New mass is modeled at {matchSW ? `${(setup.length-0.6).toFixed(2)} cm (tip), ${(setup.length-14.5).toFixed(2)} cm (paired sides)` : `${(setup.length-(hoop==="tip" ? 0.6 : 14.5)).toFixed(2)} cm (hoop)`}, and 2 cm (butt), all from the butt cap. Matching all three solves mass, balance and swing inertia around the 10 cm axis. The feasible range respects the Lab’s 100 g total cap per location. Only additional mass is solved; existing tuning is retained.</p><p>Values shown are rounded; the draft keeps calculation precision. Actual placement and weighing accuracy change the result. Measure again after customizing. Matching these estimates does not guarantee matching twistweight, stiffness or feel.</p></details>
  </section>;
}
