import { Setup,isSetup,calculateSetup,additionBreakdown,finalCondition,signed } from "./racquet";

export type TapeUnit = "g/cm" | "g/in";
export type TapeDensity = {value:number;unit:TapeUnit};
function densityPerCm(density:TapeDensity) {
  if(!["g/cm","g/in"].includes(density.unit) || !Number.isFinite(density.value) || density.value<=0) throw new Error("Enter a positive tape density from your product’s packaging, or leave it blank.");
  const value=density.unit==="g/in" ? density.value/2.54 : density.value;
  if(!Number.isFinite(value) || value<=0) throw new Error("Check the tape density and its unit.");
  return value;
}
export function convertTapeDensity(density:TapeDensity,unit:TapeUnit):number {
  if(!["g/cm","g/in"].includes(unit))throw new Error("Choose grams per centimeter or grams per inch.");
  const perCm=densityPerCm(density),value=unit==="g/in" ? perCm*2.54 : perCm;
  if(!Number.isFinite(value))throw new Error("Check the tape density and its unit.");
  return value;
}

/** Cumulative recorded tuning. Tape density is supplied by the player, never assumed. */
export function createBenchSheet(setup:Setup,density:TapeDensity|null=null) {
  if(!isSetup(setup))throw new Error("Correct the racket specifications before creating a bench sheet.");
  const perCm=density===null ? null : densityPerCm(density);
  const points=additionBreakdown(setup);
  const keys=["lead12","lead39","throat","butt"] as const;
  const tuning=keys.map((key,index)=>{
    const point=points[index],paired=key==="lead39";
    const lengthCm=key!=="butt" && point.mass>0 && perCm!==null ? point.mass/perCm : null;
    if(lengthCm!==null && !Number.isFinite(lengthCm))throw new Error("That tape density produces an unrepresentable length. Check the value and unit.");
    return {key,label:point.label,mass:point.mass,position:point.position,paired,perSideMass:paired ? point.mass/2 : null,
      tape:lengthCm===null ? null : {totalCm:lengthCm,totalIn:lengthCm/2.54,perSideCm:paired ? lengthCm/2 : null,perSideIn:paired ? lengthCm/2/2.54 : null}};
  }).filter(row=>row.mass>0);
  return {result:calculateSetup(setup),condition:finalCondition(setup),density,gramsPerCm:perCm,tuning};
}

export function benchSheetText(setup:Setup,density:TapeDensity|null=null,includeNotes=false) {
  const sheet=createBenchSheet(setup,density),r=sheet.result;
  const lines=["BASELINE / RACKET BENCH SHEET",setup.name || "Unnamed setup",setup.model,"",
    "STARTING SPECIFICATIONS",`Condition: ${setup.condition==="ready" ? "Already strung / measured starting racket" : "Unstrung frame"}`,
    `Weight: ${setup.baseWeight.toFixed(2)} g | Balance: ${setup.baseBalance.toFixed(2)} cm from butt | Length: ${setup.length.toFixed(2)} cm`,
    `Starting swingweight: ${setup.baseSW===null ? "Unknown" : setup.baseSW.toFixed(2)+" kg·cm²"}`,"",
    "RECORDED TUNING TOTALS","These are cumulative quantities recorded for this setup. Check existing tuning before adding more."];
  for(const row of sheet.tuning){
    lines.push(`${row.label}: ${row.mass.toFixed(2)} g total${row.paired ? `; ${row.perSideMass!.toFixed(2)} g per side` : ""} | modeled mass center ${row.position.toFixed(2)} cm from butt`);
    if(row.key==="butt")lines.push("  Weigh this mass separately; no tape cut length is assumed.");
    else if(row.tape)lines.push(row.paired ? `  Tape: two equal portions of ${row.tape.perSideCm!.toFixed(2)} cm (${row.tape.perSideIn!.toFixed(2)} in) each; ${row.tape.totalCm.toFixed(2)} cm combined.` : `  Tape: ${row.tape.totalCm.toFixed(2)} cm (${row.tape.totalIn.toFixed(2)} in) total.`);
    else lines.push("  Tape length not calculated; enter your product’s mass per length if needed.");
  }
  if(!sheet.tuning.length)lines.push("No tip, side, throat or butt-cap mass recorded.");
  lines.push("", "STRINGS AND GRIPS",`Additional string mass: ${setup.strings.toFixed(2)} g${setup.condition==="ready" ? " (only mass beyond the measured starting racket)" : ""}`,
    `Extra overgrips: ${setup.overgrips} (${(setup.overgrips*5.5).toFixed(2)} g estimated total; weigh your actual grips)`,
    `Replacement grip net change: ${signed(setup.leather,2)} g (new grip minus removed grip)`,
    `Strings: ${setup.stringName || "Not recorded"}`,`Tension: ${setup.tension || "Not recorded"}`,"",
    "ESTIMATED FINAL CONFIGURATION",`${r.weight.toFixed(2)} g | ${r.balance.toFixed(2)} cm balance from butt | ${sheet.condition.toUpperCase()}`,
    `Total swingweight: ${r.swingweight===null ? "Unknown; starting SW was not provided" : r.swingweight.toFixed(2)+" kg·cm²"}`,
    `Swingweight from additions: ${signed(r.swChange,2)} kg·cm² (10 cm axis)`);
  if(density)lines.push("",`Tape density supplied: ${density.value} ${density.unit}. Use the density for the exact product and width; verify cut mass on a scale.`);
  if(includeNotes && setup.notes)lines.push("","PRIVATE SETUP NOTES",setup.notes);
  lines.push("","BENCH CHECK","Check starting weight, balance and SW in the same condition. Check existing tuning and keep the paired side masses equal. Reweigh and remeasure the finished racket before testing it.",
    "Mass centers are point-mass approximations. Displayed values are rounded; tape lengths do not guarantee exact final specifications. Stiffness, twistweight and feel are not matched by this sheet.");
  return lines.join("\n");
}

export function benchSheetFilename(name:string) {
  const slug=name.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,70).replace(/-+$/g,"");
  return `racket-bench-${slug || "setup"}.txt`;
}
