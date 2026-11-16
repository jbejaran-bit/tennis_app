"use client";
import { createRecordId } from "@/lib/baseline/record-id";
import { useEffect, useMemo, useState } from "react";
import RacquetVisualizer, { MassLocation } from "./RacquetVisualizer";
import Icon from "./Icons";
import TargetPlanner from "./TargetPlanner";
import SetupComparison from "./SetupComparison";
import CustomizationImpact from "./CustomizationImpact";
import RacketCourtTest from "./RacketCourtTest";
import RacketSetupShelf from "./RacketSetupShelf";
import RacketBenchSheet from "./RacketBenchSheet";
import {
  MODELS,
  Setup,
  newSetup,
  calculateSetup,
  balanceLabel,
  isSetup,
  shareSetupHash,
  readSharedSetup,
  signed,
  finalCondition,
  validMatchDayChoice,
  sameSetupContent,
  RacketTrial,
  validRacketTrials,
  summarizeCourtTests,
  CourtFeedbackFocus,
} from "@/lib/baseline/racquet";
import { downloadJson,today } from "@/lib/baseline/data";
import { useLocalData } from "@/lib/baseline/useLocalData";
import { setArchived } from "@/lib/baseline/storage";
const validSetups = (v: unknown): v is Setup[] =>
  Array.isArray(v) && v.every(isSetup);
import Modal from "./Modal";
import ProRacketComparison, { DEFAULT_PRO_SELECTION, ProComparisonSelection } from "./ProRacketComparison";
export default function RacquetLab({initialSetup,onInitialSetupLoaded}: {initialSetup?:Setup|null;onInitialSetupLoaded?:()=>void} = {}) {
  const [setup, setSetup] = useState<Setup>(newSetup);
  const [proSelection,setProSelection] = useState<ProComparisonSelection>({...DEFAULT_PRO_SELECTION});
  const [requestedSection,setRequestedSection] = useState("");
  const [phoneDiagram, setPhoneDiagram] = useState(false);
  const [resetScope,setResetScope]=useState<"all"|"starting"|"tuning"|"details"|null>(null);
  const saved = useLocalData<Setup[]>("baseline_setups_v2", [], validSetups);
  const matchDay=useLocalData<string>("baseline_match_day_v1","",validMatchDayChoice);
  const courtTests=useLocalData<RacketTrial[]>("baseline_racket_trials_v1",[],validRacketTrials);
  const asOf=today();
  const courtSummaries=useMemo(()=>summarizeCourtTests(courtTests.value,asOf),[courtTests.value,asOf]);
  const [feedbackFocus,setFeedbackFocus]=useState<CourtFeedbackFocus|null>(null);
  const [benchSetup,setBenchSetup]=useState<Setup|null>(null);
  const [mode, setMode] = useState<"build" | "saved" | "compare" | "test" | "pros">("build");
  const modes = [["build","Build"],["saved","Saved setups"],["compare","Compare"],["test","Court test"],["pros","Pro specs"]] as const;
  function selectMode(next:typeof mode, clearFeedback=true) {
    if(next==="test" && clearFeedback) setFeedbackFocus(null);
    setMode(next);
    const params=new URLSearchParams(window.location.hash.split("?")[1] || "");
    if(next==="build") params.delete("view"); else params.set("view",next);
    window.history.replaceState(null,"","#racquet-lab"+(params.size ? "?"+params.toString() : ""));
  }
  useEffect(()=>{
    if(mode!=="build" || !requestedSection)return;
    const section=document.getElementById(requestedSection) as HTMLDetailsElement|null;
    if(section){section.open=true;section.focus({preventScroll:true});section.scrollIntoView({block:"start",behavior:"instant"});}
    setRequestedSection("");
  },[mode,requestedSection]);
  const [compareReferenceId,setCompareReferenceId] = useState("");
  const [previous, setPrevious] = useState<Setup | null>(null);
  const [targetSetup, setTargetSetup] = useState<Setup | null>(null);
  const [message, setMessage] = useState("");
  const [shared, setShared] = useState<Setup | null>(null);
  const [shareLink, setShareLink] = useState("");
  const [ready, setReady] = useState(false);
  const [activePoint,setActivePoint] = useState<MassLocation>("lead12");
  const [draftError,setDraftError] = useState("");
  useEffect(() => {
    try {
      const raw = initialSetup ? null : localStorage.getItem("baseline_setup_draft_v2");
      if (raw) {
        const v = JSON.parse(raw);
        if (isSetup(v)) setSetup(v);
        else setDraftError("The saved draft could not be opened. It has been kept. Export your saved setups before replacing the draft.");
      }
    } catch {setDraftError("The saved draft could not be opened. Check browser storage before continuing.");}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && !draftError && isSetup(setup)) {
      try {
        localStorage.setItem("baseline_setup_draft_v2", JSON.stringify(setup));
      } catch {setDraftError("Draft auto-save is unavailable. Use Export specs to keep this draft before leaving.");}
    }
  }, [setup, ready, draftError]);
  useEffect(()=>{
    if(!initialSetup || !isSetup(initialSetup)) return;
    setSetup({...initialSetup,archived:!!initialSetup.archived});
    setDraftError("");setPrevious(null);setTargetSetup(null);setFeedbackFocus(null);setShareLink("");setShared(null);selectMode("build");
    setMessage(initialSetup.id ? "Saved setup opened. Your saved version stays intact until you update it." : "Recorded specifications loaded as a new draft. Save a copy to keep a new setup.");
    onInitialSetupLoaded?.();
  },[initialSetup,onInitialSetupLoaded]);
  useEffect(()=>{
    const reviewLink=()=>{
      try {
        const view=new URLSearchParams(window.location.hash.split("?")[1] || "").get("view");
        if(!initialSetup)setMode(view && ["build","saved","compare","test","pros"].includes(view) ? view as typeof mode : "build");
        const incoming=readSharedSetup(window.location.hash);
        setShared(incoming);
        if(incoming)setMode("build");
      } catch {setShared(null);setMessage("This shared setup link is invalid. Your saved setups and current draft have not changed.");}
    };
    reviewLink();
    window.addEventListener("hashchange",reviewLink);
    return()=>window.removeEventListener("hashchange",reviewLink);
  },[]);
  useEffect(()=>{
    if(shared){const heading=document.getElementById("shared-setup-heading");heading?.focus({preventScroll:true});heading?.scrollIntoView({block:"start",behavior:"instant"});}
  },[shared]);
  const update = (patch: Partial<Setup>) => {
    if (isSetup(setup)) setPrevious(setup);
    setSetup((s) => ({ ...s, ...patch }));
    setMessage("");
    setShareLink("");
  };
  const result = calculateSetup(setup);
  const archivedDraft = saved.value.some(s => s.id === setup.id && s.archived);
  const activeSetups = saved.value.filter(s => !s.archived);
  const persisted = activeSetups.find(s => s.id === setup.id);
  const matchDaySetup=activeSetups.find(s=>s.id===matchDay.value && finalCondition(s)==="strung");
  const dirty = !persisted || !sameSetupContent(persisted,setup);
  const resetModel=MODELS.find(m=>m.name===setup.model);
  const resetBase:Setup=persisted || {...newSetup(),...(resetModel ? {model:resetModel.name,color:resetModel.color,baseWeight:resetModel.baseWeight,baseBalance:resetModel.baseBalance,name:resetModel.name+" setup"} : {})};
  const resetKeys={starting:["model","condition","baseWeight","baseBalance","baseSW","length","strings"],tuning:["lead12","lead39","throat","butt","overgrips","leather"],details:["name","stringName","tension","notes","color"]} as const;
  function resetDraft(){
    if(!resetScope)return;
    const patch=resetScope==="all" ? resetBase : Object.fromEntries(resetKeys[resetScope].map(key=>[key,resetBase[key]]));
    setPrevious(setup);setSetup(current=>({...current,...patch}));setTargetSetup(null);setShareLink("");setResetScope(null);setMessage("Draft reset. Saved records are unchanged. Use Undo change to recover your edits.");
  }
  const modeHelp={build:["Edit your racket","Start with your racket. Change one thing, save a copy, and see how it feels on court."],saved:["Find your saved rackets","Open a saved card to load, copy, compare or restore a setup."],compare:["Compare your own rackets","Choose a saved reference to see how your current draft differs."],test:["Record how it feels on court","Log a test after playing, or open Compare feedback to review earlier results."],pros:["Compare with a professional","Choose a player and your racket. Switch between specs, string details and sources."]};

  const load = (s: Setup) => { update({...s,archived:!!s.archived}); setTargetSetup(null); selectMode("build"); setMessage("Setup loaded. Your saved version stays intact until you update it."); };
  const copy = (s:Setup) => { update({...s,id:"",archived:false,name:s.name.slice(0,75)+" copy"}); setTargetSetup(null);selectMode("build");setMessage("Copy ready as a new draft. Save it to keep a separate setup."); };
  const create = () => { update({...newSetup(),archived:false});setTargetSetup(null);selectMode("build");setMessage("New setup ready. Your saved configurations have been kept."); };
  const archive = (s:Setup,archived:boolean) => { if(saved.save(current=>setArchived(current,s.id,archived)))setMessage(archived ? `${s.name} archived. Restore it from Archived setups at any time. Match and court-test snapshots are kept.` : `${s.name} restored to your active setups.`); };
  const match = (s: Setup) => { setTargetSetup(s); selectMode("build"); };
  const reviewFeedback=(reference:Setup,candidate?:Setup)=>{setFeedbackFocus({reference:{...reference},candidate:candidate ? {...candidate} : undefined});selectMode("test",false);};
  const recordTest=()=>{setFeedbackFocus(null);selectMode("test");};
  const openBenchSheet=(s:Setup)=>{if(isSetup(s))setBenchSetup({...s});};
  useEffect(() => { if (targetSetup && mode === "build") document.getElementById("target-planner")?.scrollIntoView({behavior:"smooth",block:"center"}); }, [targetSetup, mode]);
  const valid = isSetup(setup);
  const pin=(s:Setup)=>{if(!s.id || finalCondition(s)!=="strung")return;const source=activeSetups.find(a=>a.id===s.id);if(!source)return;if(matchDay.save(s.id))setMessage(`${source.name} is your match-day setup. New match logs will preselect its saved specifications.`);};
  const fieldInvalid = (key:keyof Setup,min:number,max:number) => !Number.isFinite(setup[key]) || Number(setup[key]) < min || Number(setup[key]) > max || (key==="overgrips" && !Number.isInteger(setup[key])) || (key==="baseBalance" && Number(setup[key])>=setup.length);
  const number = (
    key: keyof Setup,
    label: string,
    min: number,
    max: number,
    step = 0.5,
    help?: string,
  ) => (
    <div className="resettable-field"><label className="field">
      {label}
      <input
        id={"baseline-mass-"+key}
        onFocus={() => {if(["lead12","lead39","throat","butt"].includes(key)) setActivePoint(key as MassLocation);}}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(setup[key]) ? Number((setup[key] as number).toFixed(2)) : ""}
        onChange={(e) => update({ [key]: e.target.value === "" ? NaN : Number(e.target.value) })}
        aria-invalid={fieldInvalid(key,min,max)}
        aria-describedby={fieldInvalid(key,min,max) ? "error-"+key : undefined}
      />
      {help && <small>{help}</small>}
      {fieldInvalid(key,min,max) && <small className="field-error" id={"error-"+key}>{key==="overgrips" ? "Use a whole number from 0 to 5." : key==="baseBalance" ? "Enter a balance greater than 0 and shorter than the racket." : `Enter a number from ${min} to ${max}.`}</small>}
    </label><button type="button" className="field-reset" aria-label={`Reset ${label}`} onClick={()=>{setPrevious(setup);setSetup(current=>({...current,[key]:resetBase[key]}));setShareLink("");setMessage("Field restored. Undo change is available.");}}>Reset</button></div>
  );
  const save = () => {
    if (archivedDraft) { setMessage("Restore this setup in Saved setups, or make a copy before saving."); return; }
    if (!valid || !setup.name.trim()) {
      setMessage("Enter a setup name and valid starting specs.");
      return;
    }
    const item = {
      ...setup,
      archived: false,
      id: setup.id || createRecordId(),
      name: setup.name.trim(),
    };
    if (
      saved.save((current) => {
        if (current.find(s => s.id === item.id)?.archived) throw new Error("Restore the setup before updating it.");
        return [
        ...current.filter((s) => s.id !== item.id),
        item,
      ];})
    ) {
      setSetup(item);
      setMessage("Setup saved on this device.");
    }
  };
  async function share() {
    try {
      const link = window.location.origin + window.location.pathname + shareSetupHash(setup);
      setShareLink(link);
      setMessage("Share link ready below. Copy it to share your configuration; court notes are excluded.");
      try { await navigator.clipboard.writeText(link); setMessage("Setup link copied. Only specs, setup name, strings and tension are included. Court notes stay private."); }
      catch { setMessage("Copy the link below to share this configuration. Court notes are excluded."); }
    } catch { setMessage("Check the setup inputs before sharing."); }
  }
  return (
    <div className="racket-workspace">
      <div className="lab-toolbar">
        <nav className="lab-mode-switch" role="tablist" aria-label="Racket Lab workspace">
          {modes.map(([id,label],index) => <button key={id} id={"lab-tab-"+id} role="tab" aria-selected={mode===id} aria-controls="lab-panel" tabIndex={mode===id ? 0 : -1} className={mode===id ? "selected" : ""} onClick={()=>selectMode(id)} onKeyDown={e=>{
            let next:number|undefined;
            if(e.key==="ArrowRight")next=(index+1)%modes.length;
            if(e.key==="ArrowLeft")next=(index+modes.length-1)%modes.length;
            if(e.key==="Home")next=0;
            if(e.key==="End")next=modes.length-1;
            if(next!==undefined){e.preventDefault();selectMode(modes[next][0]);document.getElementById("lab-tab-"+modes[next][0])?.focus();}
          }}>{label}{id==="compare" && <small>{activeSetups.length}</small>}</button>)}
        </nav>
        <div className="draft-state"><span className={dirty ? "draft-dot" : "status-dot"} /><span>{!valid ? "Draft · check inputs" : dirty ? draftError ? "Draft · auto-save unavailable" : "Draft · auto-saved on this device" : "Saved setup"}{setup.id && dirty ? " · setup changes pending" : ""}</span>
          {previous && <button className="text-button" onClick={() => {setSetup(previous);setPrevious(null);setMessage("Last draft change undone.");setShareLink("");}}>Undo change</button>}
        </div>
        {mode==="build" ? <button className="button primary lab-save-action" aria-label="Save current racket setup" disabled={!valid || !setup.name.trim() || !saved.ready || !!saved.error || archivedDraft} onClick={save}><Icon name="check" />{persisted ? "Update setup" : "Save setup"}</button> : <button className="button lab-save-action" onClick={()=>selectMode("build")}><Icon name="racket" />Edit current draft</button>}
      </div>
      <div className="lab-context"><p>{modeHelp[mode][1]}</p><button className="text-button" onClick={()=>setResetScope("all")}>Reset racket draft</button></div>
      <div id="lab-panel" role="tabpanel" aria-labelledby={"lab-tab-"+mode}>
      {message && <p className="lab-feedback" role="status"><Icon name="check" />{message}</p>}
      {!ready && <p className="helper" role="status">Opening your saved draft…</p>}
      {draftError && <p role="status" className="notice">{draftError}</p>}
      {matchDay.error && <p role="status" className="notice">{matchDay.error}</p>}
      {matchDaySetup && <div className="matchday-strip"><Icon name="racket" /><div><span>MATCH-DAY SETUP</span><b>{matchDaySetup.name}</b></div><button className="text-button" onClick={()=>{if(matchDay.save(""))setMessage("Match-day choice cleared. Your saved setups have been kept.");}}>Clear choice</button></div>}
      {!valid && <p role="alert" className="notice input-notice">Some draft values need attention. Check the highlighted fields in Build. Your last valid draft and saved setups are kept.{mode!=="build" && <button className="text-button" onClick={()=>selectMode("build")}>Check draft inputs</button>}</p>}
      {shared && <section className="panel shared-setup-preview" aria-labelledby="shared-setup-heading"><div className="eyebrow">A SETUP SHARED WITH YOU</div><h2 id="shared-setup-heading" tabIndex={-1}>{shared.name}</h2><p>{shared.model} · {finalCondition(shared)==="strung" ? "Strung" : "Unstrung"} configuration</p><div className="shared-preview-specs"><div><b>{calculateSetup(shared).weight.toFixed(1)} <small>g</small></b><span>ESTIMATED WEIGHT</span></div><div><b>{calculateSetup(shared).balance.toFixed(2)} <small>cm</small></b><span>ESTIMATED BALANCE</span></div><div><b>{calculateSetup(shared).swingweight?.toFixed(1) ?? "Unknown"}</b><span>SW · kg·cm²</span></div></div><p className="shared-preview-strings">Strings: {shared.stringName || "Not recorded"} · Tension: {shared.tension || "Not recorded"}</p><p className="helper">Review it first. Loading replaces your working draft; saved setups stay intact. Save a copy afterward to keep this configuration.</p><div className="button-row"><button className="button primary" onClick={()=>{update(shared);setDraftError("");setTargetSetup(null);setShared(null);setMessage("Shared setup loaded as a new draft. Save it to keep a copy.");window.history.replaceState(null,"","#racquet-lab");}}>Load shared setup <Icon name="arrow" /></button><button className="button" onClick={()=>{setShared(null);window.history.replaceState(null,"","#racquet-lab");}}>Dismiss</button></div></section>}
      {mode==="pros" && <ProRacketComparison draft={setup} saved={activeSetups} selection={proSelection} onSelectionChange={setProSelection} onBuild={()=>{selectMode("build");setRequestedSection("starting-racket");}} />}
      {mode==="saved" && <RacketSetupShelf setups={saved.value} preferredId={matchDaySetup?.id} canWrite={saved.ready && !saved.error} canChoose={saved.ready && !saved.error && matchDay.ready && !matchDay.error} error={saved.error} onLoad={load} onCopy={copy} onCompare={s=>{setCompareReferenceId(s.id);selectMode("compare");}} onChoose={pin} onArchive={archive} onCreate={create} courtSummaries={courtSummaries} courtLoading={!courtTests.ready} courtError={courtTests.error} onReviewFeedback={s=>reviewFeedback(s)} onBenchSheet={openBenchSheet} />}
      {mode==="compare" && valid && <SetupComparison draft={setup} saved={activeSetups} onLoad={load} onMatch={match} onTest={recordTest} preferredId={matchDaySetup?.id} onPin={pin} initialReferenceId={compareReferenceId} onReferenceChange={setCompareReferenceId} courtSummaries={courtSummaries} courtLoading={!courtTests.ready} courtError={courtTests.error} onReviewFeedback={reviewFeedback} onBenchSheet={openBenchSheet} />}
      {mode==="test" && <RacketCourtTest setup={setup} onLoad={load} feedbackFocus={feedbackFocus} />}
      {mode==="build" && <nav className="phone-build-tools" aria-label="Jump to racket editor section">
        <div>{[["starting-racket","Specs"],["customize-racket","Customize"],["save-setup","Save & share"]].map(([id,label])=><button className="button" key={id} onClick={()=>{const section=document.getElementById(id);if(section?.tagName==="DETAILS")(section as HTMLDetailsElement).open=true;section?.focus({preventScroll:true});section?.scrollIntoView({block:"start",behavior:"instant"});}}>{label}</button>)}</div>
        <button className="text-button" aria-expanded={phoneDiagram} aria-controls="racket-diagram" onClick={()=>setPhoneDiagram(v=>!v)}>{phoneDiagram ? "Hide racket diagram" : "Show racket diagram"}</button>
      </nav>}
      {mode==="build" && <section className="lab-live-summary" aria-label="Live racket specifications">
        <div className="lab-stats" aria-live="polite">
          <div>
            <span>Estimated weight</span>
            <strong>
              {valid ? result.weight.toFixed(1) : "—"}
              <small> g</small>
            </strong>
            <em>{valid ? signed(result.added) : "—"} g from additions</em>
          </div>
          <div>
            <span>Estimated balance</span>
            <strong>
              {valid ? result.balance.toFixed(2) : "—"}
              <small> cm</small>
            </strong>
            <em>From the butt cap</em>
          </div>
          <div>
            <span>
              {result.swingweight === null
                ? "Swingweight change"
                : "Estimated swingweight"}
            </span>
            <strong className="lime">
              {valid
                ? result.swingweight === null
                  ? "+" + result.swChange.toFixed(1)
                  : result.swingweight.toFixed(1)
                : "—"}
            </strong>
            <em>
              {result.swingweight === null
                ? "kg·cm² · baseline unknown"
                : "kg·cm² · 10 cm axis"}
            </em>
          </div>
        </div>
        <p className="summary-context">{setup.condition==="ready" ? "Measured starting racket" : "Unstrung starter"} · {Number.isFinite(setup.strings) ? setup.strings : "—"} g added strings · {Number.isFinite(setup.overgrips) ? setup.overgrips : "—"} extra {setup.overgrips===1 ? "overgrip" : "overgrips"}. All additions below count toward these totals.</p>
      </section>}
      {mode==="build" && <div className="lab-layout">
      <div id="racket-diagram" className={`lab-visual panel${phoneDiagram ? " phone-diagram-open" : ""}`}>
        <div className="frame-heading-meta"><span className="badge">LIVE FRAME</span><span>01 / BUILD</span></div>
        <div className="eyebrow">SELECT A LOCATION TO CUSTOMIZE</div>
        <h2>{setup.model === "Custom frame" ? setup.name : setup.model}</h2>
        <RacquetVisualizer
          frameColor={setup.color}
          leatherGrip={setup.leather > 0}
          lead12={setup.lead12}
          lead39={setup.lead39}
          leadThroat={setup.throat}
          butt={setup.butt}
          activePoint={activePoint}
          onSelect={point=>{setActivePoint(point); const field=document.getElementById("baseline-mass-"+point);const section=field?.closest("details");if(section)section.open=true;field?.focus({preventScroll:true});field?.scrollIntoView({behavior:window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",block:"center"});}}
        />
        <div className="balance-readout">
          <span>HEAD LIGHT</span>
          <b>{valid ? balanceLabel(result.hl) : "Check inputs"}</b>
          <span>HEAD HEAVY</span>
        </div>
        <div className="balance-track">
          <i
            style={{
              left: `${valid ? Math.max(0, Math.min(100, 50 + (result.balance - setup.length / 2) * 7)) : 50}%`,
            }}
          />
          <span />
        </div>
        <div className="lab-note">
          Your real racket can differ from catalog specs. Use a scale and
          balance measurement to improve these estimates.
        </div>
        <details className="method-note">
          <summary>How the estimates work</summary>
          <p>
            Weight and balance use added mass and its distance from the butt.
            Swingweight change uses ΔSW = mass (kg) × (distance − 10 cm)². Each
            addition is a point-mass approximation; strings and grips are
            distributed in reality. Twistweight and stiffness are not estimated.
          </p>
          <p>
            Starter catalog values are unstrung estimates carried over from the
            original app; model years and individual frames vary. Check your
            exact model before comparing. Only enter a starting swingweight
            measured in the same condition as the starting weight and balance.
          </p>
          <a
            href="https://twu.tennis-warehouse.com/learning_center/customizationReverse.php"
            target="_blank"
            rel="noreferrer"
          >
            Tennis Warehouse University methodology ↗
          </a>
        </details>
      </div>
      <div className="lab-controls">
        <details className="panel starting-panel editor-section" id="starting-racket" tabIndex={-1} open>
          <summary className="section-heading">
            <h3>
              <span className="step-number">01</span> Starting racket
            </h3>
            <span className="badge">EDITABLE SPECS</span>
          </summary>
          <button className="text-button section-reset" onClick={()=>setResetScope("starting")}>Reset this section</button>
          <label className="field">
            Frame model
            <select
              value={setup.model}
              onChange={(e) => {
                const m = MODELS.find((m) => m.name === e.target.value);
                update(
                  m
                    ? {
                        ...newSetup(),
                        archived: false,
                        model: m.name,
                        color: m.color,
                        baseWeight: m.baseWeight,
                        baseBalance: m.baseBalance,
                        baseSW: null,
                        condition: "unstrung",
                        strings: 16,
                        length: 68.58,
                        id: "",
                        name: m.name.split(" (")[0] + " setup",
                      }
                    : { model: "Custom frame", id: "", name: "Custom setup" },
                );
              }}
            >
              {MODELS.map((m) => (
                <option key={m.name}>{m.name}</option>
              ))}
              <option>Custom frame</option>
            </select>
          </label>
          <div className="form-grid mt-4">
            <label className="field">
              Starting condition
              <select
                value={setup.condition}
                onChange={(e) => {
                  const condition = e.target.value as Setup["condition"];
                  update({
                    condition,
                    strings: condition === "ready" ? 0 : 16,
                    baseSW: null,
                  });
                }}
              >
                <option value="unstrung">Unstrung frame</option>
                <option value="ready">Already strung / measured setup</option>
              </select>
            </label>
            {number("length", "Length (cm)", 50, 80, 0.01)}
          </div>
          <p className="helper">
            {setup.condition === "ready"
              ? "Enter the weight and balance of your complete starting racket below. Add only accessories not already included."
              : "Starting specs include the factory grip, but no strings. The additions below are counted separately."}
          </p>
          <div className="form-grid three">
            {number("baseWeight", "Starting weight (g)", 100, 600, 0.1)}
            {number(
              "baseBalance",
              "Starting balance (cm)",
              0.01,
              setup.length,
              0.01,
            )}
            <div className="resettable-field"><label className="field">
              Starting SW (optional)
              <input
                type="number"
                min="0"
                max="800"
                step=".1"
                placeholder="Unknown"
                value={setup.baseSW ?? ""}
                aria-describedby="starting-sw-help"
                aria-invalid={setup.baseSW!==null && (!Number.isFinite(setup.baseSW) || setup.baseSW<0 || setup.baseSW>800)}
                onChange={(e) =>
                  update({
                    baseSW:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <small id="starting-sw-help">{setup.baseSW!==null && (!Number.isFinite(setup.baseSW) || setup.baseSW<0 || setup.baseSW>800) ? "Enter 0 to 800, or leave blank if unknown." : "Leave blank if you haven’t measured it."}</small>
            </label><button className="field-reset" onClick={()=>update({baseSW:resetBase.baseSW})}>Reset starting SW</button></div>
          </div>
        </details>
        <details className="panel tuning-panel editor-section" id="customize-racket" tabIndex={-1}>
          <summary className="section-heading">
            <h3>
              <span className="step-number">02</span> Customize the feel
            </h3>
          </summary>
          <button className="text-button section-reset" onClick={()=>setResetScope("tuning")}>Reset this section</button>
            <button
              className="text-button"
              onClick={() =>
                update({
                  lead12: 0,
                  lead39: 0,
                  throat: 0,
                  butt: 0,
                  leather: 0,
                })
              }
            >
              Clear tuning weights
            </button>
          <div className="addition-grid">
            {number(
              "lead12",
              "12 o’clock · tip (g)",
              0,
              100,
              0.5,
              "More weight far from the hand has a larger SW effect.",
            )}
            {number(
              "lead39",
              "3 + 9 o’clock · total (g)",
              0,
              100,
              0.5,
              "Combined mass: split equally between both sides.",
            )}
            {number("throat", "Throat (g)", 0, 100, 0.5)}
            {number("butt", "Inside butt cap (g)", 0, 100, 0.5)}
            {number(
              "overgrips",
              "Extra overgrips",
              0,
              5,
              1,
              "5.5 g each, approximate.",
            )}
            {number(
              "leather",
              "Grip replacement · net change (g)",
              -100,
              100,
              0.5,
              "New grip minus removed grip. A lighter replacement uses a negative value.",
            )}
            {number(
              "strings",
              "Additional string mass (g)",
              0,
              40,
              0.5,
              "Use 0 if strings are included in the starting specs.",
            )}
          </div>
        </details>
        {valid && <details className="editor-advanced" open={targetSetup ? true : undefined}><summary>Advanced: tuning impact & target planner</summary><CustomizationImpact setup={setup} /><TargetPlanner setup={setup} onApply={update} target={targetSetup} onClearTarget={() => setTargetSetup(null)} /></details>}
        <details className="panel editor-section" id="save-setup" tabIndex={-1}>
          <summary className="section-heading">
            <h3>
              <span className="step-number">03</span> Keep your setup
            </h3>
            <span className="badge">{activeSetups.length} SAVED</span>
          </summary>
          <button className="text-button section-reset" onClick={()=>setResetScope("details")}>Reset this section</button>
          <div className="form-grid">
            <label className="field">
              Setup name
              <input
                maxLength={80}
                value={setup.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Match day / 2 g at 12"
                aria-invalid={!setup.name.trim()}
              />
              {!setup.name.trim() && <small className="field-error">Give your setup a name to save it.</small>}
            </label>
            <label className="field">
              Strings & gauge
              <input
                maxLength={100}
                value={setup.stringName}
                onChange={(e) => update({ stringName: e.target.value })}
                placeholder="e.g. Tour Bite 1.25"
              />
            </label>
          </div>
          <div className="form-grid mt-4">
            <label className="field">
              Tension (include unit)
              <input
                value={setup.tension}
                maxLength={60}
                onChange={(e) => update({ tension: e.target.value })}
                placeholder="e.g. 23 / 22 kg"
              />
            </label>
            <label className="field">
              On-court notes
              <input
                value={setup.notes}
                maxLength={500}
                onChange={(e) => update({ notes: e.target.value })}
                placeholder="What changed in the feel?"
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="button primary"
              disabled={!valid || !setup.name.trim() || !saved.ready || !!saved.error || archivedDraft}
              onClick={save}
            >
              <Icon name="check" />
              {setup.id ? "Update setup" : "Save setup"}
            </button>
            <button
              className="button"
              disabled={!valid}
              onClick={() => {
                update({ id: "", archived: false, name: setup.name.slice(0,75) + " copy" });
                setMessage("Copy ready. Give it a name and save.");
              }}
            >
              Make a copy
            </button>
            <button
              className="button"
              disabled={!valid}
              onClick={() =>
                downloadJson("baseline-racket-setup.json", {
                  setup,
                  estimates: result,
                  method: "Point-mass estimate; 10 cm swingweight axis",
                })
              }
            >
              <Icon name="download" />
              Export specs
            </button>
            <button className="button" disabled={!valid} onClick={()=>openBenchSheet(setup)}>Bench sheet</button>
          </div>
          <button className="button matchday-action" disabled={!persisted || dirty || finalCondition(setup)!=="strung" || !matchDay.ready || !!matchDay.error || matchDaySetup?.id===setup.id} onClick={()=>pin(setup)}><Icon name="racket" />{matchDaySetup?.id===setup.id && setup.id ? "Match-day setup selected" : "Use for match day"}</button>
          {(!persisted || dirty || finalCondition(setup)!=="strung") && <p className="helper">Save a strung setup first to use its specifications as your default when logging matches.</p>}
          <button className="button" disabled={!valid} onClick={share}>Copy setup link</button>
          <p className="helper setup-access-note">Anyone with the link can read the setup details.</p>
          {shareLink && <label className="field mt-4">Shareable setup link<input readOnly value={shareLink} onFocus={e => e.target.select()} /><small>Includes specs, name, strings and tension. Excludes your court notes.</small></label>}
          {archivedDraft && <p className="notice">This setup is archived. Restore it in Saved setups, or use Make a copy to start a new active setup.</p>}
          {(saved.error || !valid) && (
            <p role="status" className="notice">
              {saved.error ||
                (!valid
                  ? "Check the starting specs and additions: values must be within the shown limits."
                  : message)}
            </p>
          )}
          {activeSetups.length > 0 && (
            <>
              <div className="form-grid mt-4">
                <label className="field">
                  Load saved setup
                  <select
                    value={setup.id}
                    onChange={(e) => {
                      const s = saved.value.find(
                        (s) => s.id === e.target.value,
                      );
                      if (s) {
                        load(s);
                      }
                    }}
                  >
                    <option value="">Choose a saved setup</option>
                    {activeSetups.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="lab-next-step"><div><h3>Ready to compare this setup?</h3><p>Compare this draft with a saved reference, then test the change on court.</p></div><button className="button primary" disabled={!valid} onClick={()=>selectMode("compare")}>Compare setups <Icon name="arrow" /></button></div>
            </>
          )}
        </details>
      </div>
      </div>}
      </div>
      {resetScope && <Modal title="Reset racket edits?" onClose={()=>setResetScope(null)}><p>{resetScope==="all" ? "Restore the whole working draft" : "Restore only this editor section"} to {persisted ? "its last saved version" : "the catalog defaults (or the default Blade for a custom frame)"}. Starting specs include the string-mass assumption. Saved rackets, matches and court tests will not be deleted.</p><div className="button-row mt-4"><button className="button" onClick={()=>setResetScope(null)}>Keep my edits</button><button className="button primary" onClick={resetDraft}>Confirm reset</button></div></Modal>}
      {benchSetup && <RacketBenchSheet setup={benchSetup} onClose={()=>setBenchSetup(null)} />}
    </div>
  );
}
