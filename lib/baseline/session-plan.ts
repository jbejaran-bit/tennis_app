import { drills, Match, today, suggestedDrill, isLegacyDemo } from "./data";
export type SessionBlock = { drillId: string; minutes: number };
export type SessionPlan = SessionBlock[];
export const SESSION_PLAN_KEY = "baseline_session_plan_v1";
export function isSessionPlan(value: unknown): value is SessionPlan {
  return Array.isArray(value) && value.length <= drills.length && value.every(b=>
    b && typeof b==="object" && drills.some(d=>d.id===b.drillId) &&
    Number.isInteger(b.minutes) && b.minutes>=1 && b.minutes<=90
  ) && new Set(value.map(b=>b.drillId)).size===value.length && value.reduce((sum,b)=>sum+b.minutes,0)<=180;
}
export const sessionPresets: {name:string;description:string;plan:SessionPlan}[] = [
  {name:"Solo precision",description:"Serve placement and controlled movement",plan:[{drillId:"movement",minutes:10},{drillId:"serve",minutes:15}]},
  {name:"Partner patterns",description:"Return, build the rally, then move forward",plan:[{drillId:"return",minutes:20},{drillId:"depth",minutes:20},{drillId:"transition",minutes:15}]},
  {name:"Wall rhythm",description:"Footwork and repeatable contact",plan:[{drillId:"movement",minutes:10},{drillId:"wall",minutes:15}]},
];
export function sessionPlanText(plan:SessionPlan) {
  if(!isSessionPlan(plan)) throw new Error("Invalid session plan");
  return ["BASELINE / YOUR COURT PLAN",`${plan.reduce((sum,b)=>sum+b.minutes,0)} minutes · ${plan.length} ${plan.length===1 ? "block" : "blocks"}`,
    "Block durations are your allocation; adapt the drill rounds to fit. Warm up before the plan and allow time for breaks.",
    ...plan.map((block,i)=>{const drill=drills.find(d=>d.id===block.drillId)!;return `\n${i+1}. ${drill.title} / ${block.minutes} MIN / ${drill.mode}\nTarget: ${drill.target}\n${drill.detail}\nSuggested rounds:\n${drill.rounds.map(r=>"- "+r).join("\n")}\nCue: ${drill.cue}\nBring: ${drill.equipment}`;}),
    "\nAFTER COURT\nLog completed blocks in Training. Planned minutes are not automatically recorded as practice."] .join("\n");
}
export function nextPractice(matches:Match[], asOf=today()) {
  const latest=matches.filter(m=>!m.archived && !isLegacyDemo(m) && m.date<=asOf).sort((a,b)=>b.date.localeCompare(a.date))[0];
  const drill=drills.find(d=>d.id===(latest ? suggestedDrill(latest) : "serve"))!;
  return {drill,latest,reason:latest?.focus?.trim() ? `From your latest match focus: ${latest.focus.trim()}` : latest ? "A starting drill based on your latest match log. Choose a different focus in Training whenever you need." : "Start with a simple serve benchmark, or build a session in Training."};
}
