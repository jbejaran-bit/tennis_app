"use client";
import { useState } from "react";
import { Setup,signed } from "@/lib/baseline/racquet";
import { createBenchSheet,benchSheetText,benchSheetFilename,convertTapeDensity,TapeUnit,TapeDensity } from "@/lib/baseline/bench";
import { downloadText } from "@/lib/baseline/data";
import Modal from "./Modal";
import Icon from "./Icons";

export default function RacketBenchSheet({setup,onClose}:{setup:Setup;onClose:()=>void}) {
  const [density,setDensity]=useState("");
  const [unit,setUnit]=useState<TapeUnit>("g/cm");
  const [includeNotes,setIncludeNotes]=useState(false);
  const [downloadError,setDownloadError]=useState("");
  const [message,setMessage]=useState("");
  const [unitError,setUnitError]=useState("");
  const tape:TapeDensity|null=density==="" ? null : {value:Number(density),unit};
  let error=unitError,sheet:ReturnType<typeof createBenchSheet>;
  try{sheet=createBenchSheet(setup,tape);}catch(e){error=(e as Error).message;sheet=createBenchSheet(setup);}
  const r=sheet.result;
  function changeUnit(next:TapeUnit){
    if(tape && !error){try{setDensity(String(convertTapeDensity(tape,next)));}catch(e){setUnitError((e as Error).message);return;}}
    setUnitError("");
    setUnit(next);setDownloadError("");setMessage("");
  }
  function download(){
    if(error)return;
    try{downloadText(benchSheetFilename(setup.name),benchSheetText(setup,tape,includeNotes));setDownloadError("");setMessage("Bench sheet downloaded. Check the recorded totals against your frame before adding mass.");}
    catch{setDownloadError("The download could not start. Copy the text summary below to keep the sheet.");setMessage("");}
  }
  return <Modal title="Racket bench sheet" onClose={onClose}><button className="text-button" onClick={()=>{setDensity("");setUnit("g/cm");setIncludeNotes(false);setDownloadError("");setUnitError("");setMessage("Bench options reset. Racket specifications are unchanged.");}}>Reset bench options</button><div className="bench-sheet">
    <header className="bench-sheet-heading"><span className="eyebrow">FROM THE LAB / TO THE FRAME</span><h3 id="bench-setup-name" tabIndex={-1} data-autofocus>{setup.name || "Unnamed setup"}</h3><p>{setup.model}</p><span className="badge">{setup.archived ? "ARCHIVED RECORD" : "CONFIGURATION SNAPSHOT"}</span></header>
    <div className="bench-specs" aria-label="Estimated final configuration"><div><span>Final weight</span><b>{r.weight.toFixed(1)} <small>g</small></b></div><div><span>Final balance</span><b>{r.balance.toFixed(2)} <small>cm</small></b></div><div><span>Total SW</span><b>{r.swingweight===null ? "Unknown" : r.swingweight.toFixed(1)}</b></div></div>
    <p className="bench-total-note">These are the <strong>total additions recorded in this configuration</strong>. Check what is already on your frame before adding more. Opening this sheet keeps your working draft and saved records intact.</p>
    <section className="bench-section"><h4>1. Confirm the starting racket</h4><dl className="bench-baseline"><div><dt>Starting condition</dt><dd>{setup.condition==="ready" ? "Already strung / measured" : "Unstrung frame"}</dd></div><div><dt>Starting specs</dt><dd>{setup.baseWeight.toFixed(1)} g · {setup.baseBalance.toFixed(2)} cm</dd></div><div><dt>Starting SW</dt><dd>{setup.baseSW===null ? "Unknown" : setup.baseSW.toFixed(1)+" kg·cm²"}</dd></div><div><dt>Length</dt><dd>{setup.length.toFixed(2)} cm</dd></div></dl><p className="helper">Starting weight, balance and SW must describe the same condition. Positions below are approximate mass centers measured from the butt.</p></section>
    <section className="bench-section"><h4>2. Prepare the recorded tuning</h4><div className="bench-tape-fields"><label className="field">Tape density (optional)<input type="number" min="0" step="any" value={density} placeholder="From your product’s packaging" aria-invalid={!!error} onChange={e=>{setDensity(e.target.value);setUnitError("");setDownloadError("");setMessage("");}} /></label><label className="field">Density unit<select value={unit} onChange={e=>changeUnit(e.target.value as TapeUnit)}><option value="g/cm">Grams per centimeter</option><option value="g/in">Grams per inch</option></select></label></div><p className="helper">Use the density for the exact tape product and width. Changing units converts an entered density. Verify the cut mass on a scale.</p>
      {error && <p className="notice" role="alert">{error}</p>}
      {!sheet.tuning.length ? <p className="bench-empty">No tip, side, throat or butt-cap mass recorded.</p> : <div className="bench-tuning-list">{sheet.tuning.map(row=><article className="bench-tuning-row" data-bench-location={row.key} key={row.key}><div className="bench-tuning-label"><h5>{row.label}</h5><span>{row.position.toFixed(2)} cm from butt · modeled center</span></div><div className="bench-tuning-quantity"><b>{row.mass.toFixed(2)} <small>g total</small></b>{row.paired && <span>{row.perSideMass!.toFixed(2)} g per side</span>}</div><p className="bench-tape-length">{row.key==="butt" ? "Weigh separately; no tape length assumed." : error ? "Correct the density to calculate tape lengths." : row.tape ? row.paired ? <>Two equal portions: <b>{row.tape.perSideCm!.toFixed(2)} cm ({row.tape.perSideIn!.toFixed(2)} in) each</b><small>{row.tape.totalCm.toFixed(2)} cm combined</small></> : <>Tape total: <b>{row.tape.totalCm.toFixed(2)} cm ({row.tape.totalIn.toFixed(2)} in)</b></> : "Tape length will appear after entering a density."}</p></article>)}</div>}
    </section>
    <section className="bench-section"><h4>3. Account for strings and grips</h4><dl className="bench-baseline"><div><dt>Additional string mass</dt><dd>{setup.strings.toFixed(2)} g</dd></div><div><dt>Extra overgrips</dt><dd>{setup.overgrips} · {(setup.overgrips*5.5).toFixed(2)} g estimated</dd></div><div><dt>Grip replacement</dt><dd>{signed(setup.leather,2)} g net change</dd></div><div><dt>Strings</dt><dd>{setup.stringName || "Not recorded"}</dd></div><div><dt>Tension</dt><dd>{setup.tension || "Not recorded"}</dd></div></dl><p className="helper">{setup.condition==="ready" ? "The starting racket already includes its measured strings and grip. Count only changes beyond that starting racket." : "The unstrung starting frame includes its original grip. The string mass and grip changes above are counted separately."} Grip replacement is new grip mass minus removed grip mass; overgrip mass is approximate.</p></section>
    <section className="bench-finish"><h4>4. Recheck before taking it on court</h4><p>Check existing tuning, keep the paired side masses equal, then reweigh and measure the finished racket. Displayed quantities and tape lengths are rounded estimates. A bench sheet does not establish matching stiffness, twistweight or feel.</p></section>
    <div className="bench-export"><label className="bench-notes-option"><input type="checkbox" checked={includeNotes} disabled={!setup.notes} onChange={e=>{setIncludeNotes(e.target.checked);setDownloadError("");setMessage("");}} />Include private setup notes in the download</label><div className="button-row"><button className="button primary" disabled={!!error} onClick={download}><Icon name="download" />Download bench sheet</button><button className="button" onClick={onClose}>Close sheet</button></div><p className="helper">Downloads a text sheet to this device. Use the checkbox to include private setup notes.</p>{message && <p className="notice" role="status">{message}</p>}{downloadError && <><p className="notice" role="alert">{downloadError}</p><label className="field">Text summary<textarea readOnly rows={8} value={benchSheetText(setup,tape,includeNotes)} onFocus={e=>e.target.select()} /></label></>}</div>
  </div></Modal>;
}
