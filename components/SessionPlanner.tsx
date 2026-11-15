"use client";
import { useState } from "react";
import { drills, downloadText } from "@/lib/baseline/data";
import { SessionPlan, SESSION_PLAN_KEY, isSessionPlan, sessionPresets, sessionPlanText } from "@/lib/baseline/session-plan";
import { useLocalData } from "@/lib/baseline/useLocalData";
import Modal from "./Modal";
import Icon from "./Icons";

export default function SessionPlanner({onLog}:{onLog:(id:string,minutes:number)=>void}) {
  const plan=useLocalData<SessionPlan>(SESSION_PLAN_KEY,[],isSessionPlan);
  const [resetConfirm,setResetConfirm]=useState(false);
  const [resetBackup,setResetBackup]=useState<SessionPlan|null>(null);
  const [addId,setAddId]=useState("serve");
  const [notice,setNotice]=useState("");
  const [court,setCourt]=useState<SessionPlan|null>(null);
  const [step,setStep]=useState(0);
  const [exportText,setExportText]=useState("");
  const total=plan.value.reduce((sum,b)=>sum+b.minutes,0);
  const disabled=!plan.ready || !!plan.error;
  function change(update:(current:SessionPlan)=>SessionPlan) {
    if(disabled) return;
    if(!isSessionPlan(update(plan.value))){setNotice("Keep the plan within 180 minutes. Shorten a block before adding more.");return;}
    if(plan.save(update)) {setNotice("Court plan saved on this device.");setExportText("");}
  }
  function add() {
    const drill=drills.find(d=>d.id===addId);if(!drill)return;
    if(total+drill.minutes>180){setNotice("Keep the plan within 180 minutes. Shorten a block before adding another.");return;}
    change(current=>current.some(b=>b.drillId===addId) ? current : [...current,{drillId:addId,minutes:drill.minutes}]);
  }
  function move(id:string,offset:number) {
    change(current=>{const next=[...current],index=next.findIndex(b=>b.drillId===id),target=index+offset;if(index<0 || target<0 || target>=next.length)return current;[next[index],next[target]]=[next[target],next[index]];return next;});
  }
  function download() {
    const text=sessionPlanText(plan.value);
    try{downloadText("baseline-court-plan.txt",text);setNotice("Court plan downloaded.");}
    catch{setExportText(text);setNotice("The download could not start. Copy your court plan below.");}
  }
  const block=court?.[step],drill=drills.find(d=>d.id===block?.drillId);
  return <section className="panel session-planner" aria-label="Session builder">
    <div className="section-heading"><div><div className="eyebrow">Session planner</div><h2>What are you working on today?</h2></div><span className="badge">{total} MIN · {plan.value.length} {plan.value.length===1 ? "BLOCK" : "BLOCKS"}</span></div>
    <p className="helper">Add starter blocks, adjust the order and time, then take your targets onto court. Your plan stays here between visits.</p>
    <div className="button-row"><button className="text-button" disabled={disabled || !plan.value.length} onClick={()=>setResetConfirm(true)}>Restart session plan</button>{resetBackup && <button className="text-button" disabled={disabled || plan.value.length>0} onClick={()=>{if(plan.save(current=>{if(current.length)throw new Error("Plan changed");return resetBackup;})){setResetBackup(null);setNotice("Previous session plan restored.");}}}>Undo plan restart</button>}</div>
    {resetConfirm && <Modal title="Restart session plan?" onClose={()=>setResetConfirm(false)}><p>This clears planned blocks only. Completed practice records stay saved. You can undo while the plan remains empty.</p><div className="button-row"><button className="button" onClick={()=>setResetConfirm(false)}>Keep current plan</button><button className="button primary" onClick={()=>{let backup:SessionPlan=[];if(plan.save(current=>{backup=current;return [];})){setResetBackup(backup);setResetConfirm(false);setExportText("");setNotice("Session plan restarted. Completed practices are unchanged.");}}}>Confirm plan restart</button></div></Modal>}
    <div className="session-presets">{sessionPresets.map(p=><button key={p.name} className="session-preset" disabled={disabled} onClick={()=>{change(current=>{const ids=new Set(current.map(b=>b.drillId));return [...current,...p.plan.filter(b=>!ids.has(b.drillId))];});}}><b>{p.name} <Icon name="plus" /></b><small>{p.description}</small></button>)}</div>
    {plan.value.length>0 ? <ol className="session-blocks">{plan.value.map((b,i)=>{const d=drills.find(d=>d.id===b.drillId)!;const durations=Array.from(new Set([b.minutes,5,10,15,20,25,30,45,60,90])).sort((a,b)=>a-b);return <li key={b.drillId} data-plan-drill={b.drillId}>
      <span className="session-block-number">{String(i+1).padStart(2,"0")}</span><div className="session-block-copy"><b>{d.title}</b><small>{d.mode} · {d.target}</small><button className="text-button" onClick={()=>onLog(b.drillId,b.minutes)}>Log completed block <Icon name="arrow" /></button></div>
      <label className="field session-duration">Minutes for {d.title}<select aria-label={`Minutes for ${d.title}`} value={b.minutes} disabled={disabled} onChange={e=>{const minutes=Number(e.target.value);if(total-b.minutes+minutes>180){setNotice("Keep the plan within 180 minutes. Shorten another block first.");return;}change(current=>current.map(item=>item.drillId===b.drillId ? {...item,minutes} : item));}}>{durations.map(n=><option key={n} value={n}>{n} min</option>)}</select></label>
      <div className="session-block-actions"><button className="icon-button" disabled={disabled || i===0} aria-label={`Move ${d.title} earlier`} onClick={()=>move(b.drillId,-1)}>↑</button><button className="icon-button" disabled={disabled || i===plan.value.length-1} aria-label={`Move ${d.title} later`} onClick={()=>move(b.drillId,1)}>↓</button><button className="icon-button" disabled={disabled} aria-label={`Remove ${d.title} from plan`} onClick={()=>change(current=>current.filter(item=>item.drillId!==b.drillId))}><Icon name="close" /></button></div>
    </li>;})}</ol> : <div className="session-plan-empty"><span>01</span><p>Your session is empty for now.<small>Add a starter above or choose your first drill below.</small></p></div>}
    <div className="session-plan-footer"><div className="session-add"><label className="field">Add a drill<select value={addId} disabled={disabled} onChange={e=>setAddId(e.target.value)}>{drills.map(d=><option key={d.id} value={d.id} disabled={plan.value.some(b=>b.drillId===d.id)}>{d.title}{plan.value.some(b=>b.drillId===d.id) ? " · In plan" : ""}</option>)}</select></label><button className="button" disabled={disabled || plan.value.some(b=>b.drillId===addId)} onClick={add}>Add block <Icon name="plus" /></button></div><div className="button-row"><button className="button primary" disabled={disabled || !plan.value.length} onClick={()=>{setStep(0);setCourt(plan.value.map(b=>({...b})));}}>Open court mode <Icon name="arrow" /></button><button className="button" disabled={disabled || !plan.value.length} onClick={download}><Icon name="download" /> Download plan</button></div></div>
    <p className="helper">Up to 180 planned minutes. Allow extra time for warm-up and breaks. Changing a block’s time does not change its suggested rounds. Add results only after practicing.</p>
    {(plan.error || notice) && <p role={plan.error ? "alert" : "status"} className="notice">{plan.error || notice}</p>}
    {exportText && <label className="field">Court plan text<textarea rows={10} readOnly value={exportText} onFocus={e=>e.currentTarget.select()} /></label>}
    {court && <Modal title="Your court session" onClose={()=>setCourt(null)}><div className="court-session">
      {block && drill ? <><div className="eyebrow">BLOCK {step+1} / {court.length} · {drill.mode.toUpperCase()}</div><h3 data-autofocus tabIndex={-1} key={block.drillId}>{drill.title}</h3><div className="court-session-time">{block.minutes}<small>planned minutes</small></div><div className="focus-note"><span>YOUR TARGET</span><p>{drill.target}</p></div><p>{drill.detail}</p><h4>Suggested rounds</h4><ol>{drill.rounds.map(r=><li key={r}>{r}</li>)}</ol><div className="focus-note"><span>KEEP THIS CUE</span><p>{drill.cue}</p></div><p className="helper">Bring: {drill.equipment}</p><div className="button-row"><button className="button primary" onClick={()=>setStep(step+1)}>{step===court.length-1 ? "Finish session view" : "Next block"} <Icon name="arrow" /></button><button className="button" onClick={()=>{setCourt(null);onLog(block.drillId,block.minutes);}}>Log this block</button>{step>0 && <button className="text-button" onClick={()=>setStep(step-1)}>Previous block</button>}</div></> : <><div className="eyebrow">After practice</div><h3>How did it go?</h3><p>Log the blocks you actually practiced. Adjust the minutes, record any attempts you tracked, and keep one useful note.</p><div className="court-session-log">{court.map(b=><button className="button" key={b.drillId} onClick={()=>{setCourt(null);onLog(b.drillId,b.minutes);}}>Log {drills.find(d=>d.id===b.drillId)!.title} <Icon name="arrow" /></button>)}</div><button className="text-button" onClick={()=>setStep(0)}>Review the plan again</button></>}
      <p className="helper">Court mode does not automatically save practice results.</p></div></Modal>}
  </section>;
}
