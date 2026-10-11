import { PracticeSession, outcomeLabels } from "@/lib/baseline/data";
export default function PracticeOutcome({ drillId, initial }: { drillId: string; initial?: PracticeSession["outcome"] }) {
  if (!outcomeLabels[drillId] && !initial) return null;
  return <fieldset className="practice-outcome"><legend>Optional drill result</legend><p className="helper">{outcomeLabels[drillId] || "Successful repetitions"}. Leave both fields blank if you did not count.</p><div className="form-grid"><label className="field">Successful attempts<input type="number" name="successes" min="0" max="10000" step="1" defaultValue={initial?.successes ?? ""} placeholder="e.g. 18" /></label><label className="field">Total attempts<input type="number" name="attempts" min="1" max="10000" step="1" defaultValue={initial?.attempts ?? ""} placeholder="e.g. 30" /></label></div></fieldset>;
}
