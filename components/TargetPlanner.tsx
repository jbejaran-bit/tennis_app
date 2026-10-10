"use client";
import { useState } from "react";
import { Setup, calculateSetup, planTarget } from "@/lib/baseline/racquet";

export default function TargetPlanner({ setup, onApply }: { setup: Setup; onApply: (patch: Partial<Setup>) => void }) {
  const [weight, setWeight] = useState("");
  const [balance, setBalance] = useState("");
  const [notice, setNotice] = useState("");
  const current = calculateSetup(setup);
  const plan = weight !== "" && balance !== "" ? planTarget(setup, Number(weight), Number(balance)) : null;
  const hasAdditions = plan?.ok && plan.tip + plan.butt > 0.001;
  return <section className="panel target-planner">
    <div className="section-heading"><h3>Build toward a target</h3><span className="badge">RACKET MATCHING</span></div>
    <p className="helper">Match a target weight and balance by adding mass at 12 o’clock and inside the butt cap. Start with your current racket’s measured specs for a better estimate.</p>
    <div className="form-grid">
      <label className="field">Target weight (g)<input type="number" min="100" max="1000" step="0.1" placeholder={current.weight.toFixed(1)} value={weight} onChange={e => { setWeight(e.target.value); setNotice(""); }} /></label>
      <label className="field">Target balance (cm)<input type="number" min="0.01" max={setup.length} step="0.01" placeholder={current.balance.toFixed(2)} value={balance} onChange={e => { setBalance(e.target.value); setNotice(""); }} /><small>Measured from the butt cap.</small></label>
    </div>
    <div aria-live="polite">
      {plan && plan.ok === false && <p className="notice">{plan.reason}</p>}
      {plan?.ok && <>
        <div className="target-results">
          <div><span>Add at 12 o’clock</span><strong>{plan.tip.toFixed(2)} <small>g</small></strong></div>
          <div><span>Add inside butt cap</span><strong>{plan.butt.toFixed(2)} <small>g</small></strong></div>
          <div><span>Extra swingweight</span><strong>+{(plan.result.swChange - current.swChange).toFixed(1)} <small>kg·cm²</small></strong></div>
        </div>
        <p className="helper">Projected: {plan.result.weight.toFixed(1)} g · {plan.result.balance.toFixed(2)} cm balance. {plan.result.swingweight === null ? "Total swingweight remains unknown without a starting measurement." : `Estimated total swingweight: ${plan.result.swingweight.toFixed(1)} kg·cm².`}</p>
        <button className="button primary" disabled={!hasAdditions} onClick={() => {
          onApply({ lead12: plan.setup.lead12, butt: plan.setup.butt });
          setNotice("Plan applied to your draft. Review the estimates, then save or make a copy to keep it.");
        }}>{hasAdditions ? "Apply to draft" : "Target reached"}</button>
      </>}
      {notice && <p role="status" className="notice">{notice}</p>}
    </div>
    <details className="method-note"><summary>What this plan can—and cannot—match</summary><p>Calculated from the current draft, including every existing addition. New mass is modeled at { (setup.length - 0.6).toFixed(2) } cm and 2 cm from the butt. Values shown are rounded; the draft keeps calculation precision. Actual placement and weighing accuracy change the result. Matching weight and balance does not guarantee matching swingweight, twistweight, stiffness or feel. Measure again after customizing.</p></details>
  </section>;
}
