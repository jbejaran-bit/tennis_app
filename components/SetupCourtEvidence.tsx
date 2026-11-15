"use client";
import { Setup,CourtTestSummary } from "@/lib/baseline/racquet";
import { dateLabel } from "@/lib/baseline/data";

type Props={setup:Setup;summary:CourtTestSummary;loading?:boolean;error?:string;onReview?:(s:Setup)=>void};
export default function SetupCourtEvidence({setup,summary,loading,error,onReview}:Props) {
  const tested=summary.totalCount>0;
  return <section className="setup-court-evidence" aria-label={`Court feedback for ${setup.name}`} data-evidence-state={loading || error ? "unavailable" : tested ? "tested" : "untested"}>
    <div className="evidence-heading"><span>COURT FEEDBACK</span><b>{loading ? "Opening history…" : error ? "History unavailable" : tested ? `${summary.totalCount} ${summary.totalCount===1 ? "test" : "tests"} · ${summary.minutes} min` : "No tests for these specs"}</b></div>
    {!loading && !error && <>{tested ? <p>Latest decision: <strong>{summary.latestDecision==="keep" ? "Keep" : summary.latestDecision==="revert" ? "Revert" : "Test again"}</strong>{summary.lastDate && <> · {dateLabel(summary.lastDate)}</>}</p> : <p>A specification or string change needs its own court feedback.</p>}{tested && onReview && <button className="text-button" aria-label={`Review court feedback for ${setup.name}`} onClick={()=>onReview(setup)}>Review court feedback <span aria-hidden="true">→</span></button>}</>}
    {!loading && error && <p>Check court-test storage before making a feedback-based decision.</p>}
  </section>;
}
