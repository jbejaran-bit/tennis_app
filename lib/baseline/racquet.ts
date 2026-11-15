export const MODELS = [
  {
    name: "Wilson Blade 98 (16x19 v9)",
    color: "#16a34a",
    baseWeight: 305,
    baseBalance: 32.0,
  },
  {
    name: "Wilson Blade 98 (18x20 v9)",
    color: "#15803d",
    baseWeight: 305,
    baseBalance: 32.0,
  },
  {
    name: "Babolat Pure Aero 98",
    color: "#eab308",
    baseWeight: 305,
    baseBalance: 31.5,
  },
  {
    name: "Babolat Pure Aero",
    color: "#facc15",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Yonex EZONE 98",
    color: "#2563eb",
    baseWeight: 305,
    baseBalance: 31.5,
  },
  {
    name: "Yonex EZONE 100",
    color: "#3b82f6",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Head Speed MP",
    color: "#ffffff",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Head Speed Pro",
    color: "#000000",
    baseWeight: 310,
    baseBalance: 31.5,
  },
  {
    name: "Babolat Pure Drive",
    color: "#1d4ed8",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Yonex VCORE 98",
    color: "#dc2626",
    baseWeight: 305,
    baseBalance: 32.0,
  },
  {
    name: "Yonex VCORE 100",
    color: "#ef4444",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Babolat Pure Strike 98 (16x19)",
    color: "#ea580c",
    baseWeight: 305,
    baseBalance: 32.0,
  },
  {
    name: "Wilson Pro Staff 97 v14",
    color: "#991b1b",
    baseWeight: 315,
    baseBalance: 31.0,
  },
  {
    name: "Head Radical MP",
    color: "#f97316",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Head Extreme MP",
    color: "#a3e635",
    baseWeight: 300,
    baseBalance: 32.0,
  },
  {
    name: "Head Gravity MP",
    color: "#06b6d4",
    baseWeight: 295,
    baseBalance: 32.5,
  },
  {
    name: "Head Gravity Pro",
    color: "#0891b2",
    baseWeight: 315,
    baseBalance: 31.5,
  },
  {
    name: "Tecnifibre TFight ISO 305",
    color: "#38bdf8",
    baseWeight: 305,
    baseBalance: 32.5,
  },
  {
    name: "Yonex Percept 97",
    color: "#0f766e",
    baseWeight: 310,
    baseBalance: 31.0,
  },
  {
    name: "Wilson Shift 99 (300g)",
    color: "#94a3b8",
    baseWeight: 300,
    baseBalance: 31.5,
  },
];
export type Setup = {
  archived?: boolean;
  id: string;
  name: string;
  model: string;
  color: string;
  condition: "unstrung" | "ready";
  baseWeight: number;
  baseBalance: number;
  baseSW: number | null;
  length: number;
  overgrips: number;
  leather: number;
  lead12: number;
  lead39: number;
  throat: number;
  butt: number;
  strings: number;
  stringName: string;
  tension: string;
  notes: string;
};
export function newSetup(): Setup {
  return {
    id: "",
    name: "My Blade setup",
    model: MODELS[0].name,
    color: MODELS[0].color,
    condition: "unstrung",
    baseWeight: 305,
    baseBalance: 32,
    baseSW: null,
    length: 68.58,
    overgrips: 1,
    leather: 0,
    lead12: 0,
    lead39: 0,
    throat: 0,
    butt: 0,
    strings: 16,
    stringName: "",
    tension: "",
    notes: "",
  };
}
export function isSetup(value: unknown): value is Setup {
  if (!value || typeof value !== "object") return false;
  const s = value as Setup;
  return (
    (s.archived === undefined || typeof s.archived === "boolean") &&
    (["id", "name", "model", "color", "stringName", "tension", "notes"] as const).every(
      (k) => typeof s[k] === "string",
    ) &&
    ["unstrung", "ready"].includes(s.condition) &&
    Number.isFinite(s.baseWeight) &&
    Number.isFinite(s.length) &&
    Number.isFinite(s.baseBalance) &&
    Number.isInteger(s.overgrips) &&
    s.overgrips <= 5 &&
    s.strings <= 40 &&
    /^#[0-9a-f]{6}$/i.test(s.color) &&
    s.baseWeight >= 100 &&
    s.baseWeight <= 600 &&
    s.length >= 50 &&
    s.length <= 80 &&
    s.baseBalance > 0 &&
    s.baseBalance < s.length &&
    (s.baseSW === null ||
      (Number.isFinite(s.baseSW) && s.baseSW >= 0 && s.baseSW <= 800)) &&
    Number.isFinite(s.leather) && s.leather >= -100 && s.leather <= 100 &&
    s.baseWeight + s.leather > 0 &&
    ([
      "overgrips",
      "lead12",
      "lead39",
      "throat",
      "butt",
      "strings",
    ] as const).every((k) => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 100)
  );
}

export const TRIAL_METRICS = ["control", "timing", "stability", "serve", "comfort"] as const;
export type TrialMetric = typeof TRIAL_METRICS[number];
export const TRIAL_LABELS: Record<TrialMetric,string> = {control:"Depth & control",timing:"Timing & maneuverability",stability:"Stability on contact",serve:"Serve confidence",comfort:"Comfort"};
export type RacketTrial = {
  id: string;
  archived?: boolean;
  date: string;
  minutes: number;
  surface: string;
  stringHours: number | null;
  decision: "keep" | "retest" | "revert";
  ratings: Record<TrialMetric, number | null>;
  notes: string;
  setup: Setup;
};
export function isRacketTrial(value: unknown): value is RacketTrial {
  if (!value || typeof value !== "object") return false;
  const t = value as RacketTrial;
  const date = typeof t.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? new Date(t.date + "T12:00:00Z") : null;
  return typeof t.id === "string" && t.id.length > 0 &&
    (t.archived === undefined || typeof t.archived === "boolean") &&
    !!date && Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === t.date &&
    Number.isInteger(t.minutes) && t.minutes >= 1 && t.minutes <= 300 &&
    ["hard", "clay", "grass", "indoor_hard", "carpet"].includes(t.surface) &&
    (t.stringHours === null || Number.isFinite(t.stringHours) && t.stringHours >= 0 && t.stringHours <= 1000) &&
    ["keep", "retest", "revert"].includes(t.decision) &&
    typeof t.notes === "string" && t.notes.length <= 2000 && isSetup(t.setup) && finalCondition(t.setup) === "strung" &&
    !!t.ratings && typeof t.ratings === "object" && TRIAL_METRICS.every(k => t.ratings[k] === null || Number.isInteger(t.ratings[k]) && t.ratings[k]! >= 1 && t.ratings[k]! <= 5);
}
export const validRacketTrials = (v: unknown): v is RacketTrial[] => Array.isArray(v) && v.every(isRacketTrial);
export const validMatchDayChoice = (v: unknown): v is string => typeof v === "string" && v.length <= 200;
export function setupDescription(s: Setup) {
  return [s.name,s.stringName,s.tension].filter(Boolean).join(" · ");
}
export function sameSetupContent(a: Setup,b: Setup) {
  return !!a.archived===!!b.archived && (Object.keys(newSetup()) as (keyof Setup)[]).every(k=>a[k]===b[k]);
}
export type SetupSort = "saved" | "name" | "weight" | "balance" | "swingweight";
export function filterSortSetups(setups: Setup[], options: {query?:string;archived?:boolean;condition?:""|"strung"|"unstrung";sort?:SetupSort;direction?:"asc"|"desc"} = {}) {
  const query=(options.query || "").trim().toLocaleLowerCase();
  const order=options.direction==="asc" ? 1 : -1;
  const sort=options.sort || "saved";
  const entries=setups.map((setup,index)=>({setup,index})).filter(({setup:s})=>
    !!s.archived===!!options.archived && (!options.condition || finalCondition(s)===options.condition) &&
    (!query || [s.name,s.model,s.stringName,s.tension,s.notes].join(" ").toLocaleLowerCase().includes(query))
  );
  return entries.sort((a,b)=>{
    if(sort==="saved") return (a.index-b.index)*order;
    if(sort==="name") return a.setup.name.localeCompare(b.setup.name)*order || a.index-b.index;
    const left=calculateSetup(a.setup),right=calculateSetup(b.setup);
    const av=left[sort],bv=right[sort];
    if(av===null) return bv===null ? a.index-b.index : 1;
    if(bv===null) return -1;
    return (av-bv)*order || a.setup.name.localeCompare(b.setup.name) || a.index-b.index;
  }).map(e=>e.setup);
}

/** Exact input identity; names, notes, IDs, archive state and paint color are cosmetic. */
export function setupFingerprint(s: Setup): string {
  const fields = ["model","condition","baseWeight","baseBalance","baseSW","length","overgrips","leather","lead12","lead39","throat","butt","strings","stringName","tension"] as const;
  return JSON.stringify(fields.map(k=>s[k]));
}

export type CourtTestFilters = {
  days?: 28 | 84;
  stringAge?: "all" | "fresh" | "played" | "older" | "unknown";
};

/** Filters change the sample, never the available configurations or stored history. */
export function summarizeCourtTests(trials: RacketTrial[], asOf: string, surface = "", filters: CourtTestFilters = {}) {
  const date=new Date(asOf+"T12:00:00Z");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(asOf) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10)!==asOf) return [];
  const from=new Date(date);
  if(filters.days) from.setUTCDate(from.getUTCDate()-(filters.days-1));
  const start=filters.days ? from.toISOString().slice(0,10) : "";
  const eligible=trials.filter(t=>isRacketTrial(t) && !t.archived && t.date<=asOf).sort((a,b)=>b.date.localeCompare(a.date));
  const byConfiguration=new Map<string,RacketTrial[]>();
  const ids=new Set<string>();
  for(const trial of eligible) {
    if(ids.has(trial.id)) continue;
    ids.add(trial.id);
    const key=setupFingerprint(trial.setup);
    const current=byConfiguration.get(key) || [];
    current.push(trial);byConfiguration.set(key,current);
  }
  return Array.from(byConfiguration,([key,all])=>{
    const recorded=all.filter(t=>{
      if(surface && t.surface!==surface || start && t.date<start) return false;
      switch(filters.stringAge) {
        case "fresh": return t.stringHours!==null && t.stringHours<=5;
        case "played": return t.stringHours!==null && t.stringHours>5 && t.stringHours<=15;
        case "older": return t.stringHours!==null && t.stringHours>15;
        case "unknown": return t.stringHours===null;
        default: return true;
      }
    });
    const ratings=Object.fromEntries(TRIAL_METRICS.map(metric=>{
      const values=recorded.map(t=>t.ratings[metric]).filter((v):v is number=>v!==null);
      return [metric,{mean:values.length ? values.reduce((a,b)=>a+b,0)/values.length : null,count:values.length}];
    })) as Record<TrialMetric,{mean:number|null;count:number}>;
    const hours=recorded.map(t=>t.stringHours).filter((v):v is number=>v!==null);
    return {key,setup:all[0].setup,totalCount:all.length,trials:recorded,ratings,
      minutes:recorded.reduce((sum,t)=>sum+t.minutes,0),
      firstDate:recorded.at(-1)?.date || null,lastDate:recorded[0]?.date || null,
      surfaces:Array.from(new Set(recorded.map(t=>t.surface))),
      stringHours:{min:hours.length ? Math.min(...hours) : null,max:hours.length ? Math.max(...hours) : null,count:hours.length},
      latestNote:recorded[0]?.notes || "",latestDecision:recorded.length ? recorded[0].decision : null,
    };
  });
}
export type CourtTestSummary = ReturnType<typeof summarizeCourtTests>[number];
export type CourtFeedbackFocus = {reference:Setup;candidate?:Setup};

/** Feedback belongs to exact recorded inputs, never just a saved record ID or label. */
export function courtEvidenceForSetup(setup:Setup,summaries:CourtTestSummary[]):CourtTestSummary {
  const key=setupFingerprint(setup),recorded=summaries.find(s=>s.key===key);
  if(recorded) return {...recorded,setup};
  return {key,setup,totalCount:0,trials:[],ratings:Object.fromEntries(TRIAL_METRICS.map(k=>[k,{mean:null,count:0}])) as CourtTestSummary["ratings"],minutes:0,firstDate:null,lastDate:null,surfaces:[],stringHours:{min:null,max:null,count:0},latestNote:"",latestDecision:null};
}
export function calculateSetup(s: Setup) {
  // All positions are cm from the butt. Swingweight uses the standard 10 cm axis.
  // Each addition is approximated as a point mass. Strung and unstrung baselines must not be mixed.
  const points = additionBreakdown(s);
  const added = points.reduce((sum, p) => sum + p.mass, 0);
  const weight = s.baseWeight + added;
  const balance =
    (s.baseWeight * s.baseBalance +
      points.reduce((sum, p) => sum + p.mass * p.position, 0)) /
    weight;
  const swChange = points.reduce((sum, p) => sum + p.sw, 0);
  const swingweight = s.baseSW === null ? null : s.baseSW + swChange;
  const hl = (s.length / 2 - balance) / 0.3175;
  return { weight, balance, swChange, swingweight, hl, added };
}

export function additionBreakdown(s: Setup) {
  return [
    { label: "12 o’clock", mass: s.lead12, position: s.length - 0.6 },
    { label: "3 + 9 o’clock (total)", mass: s.lead39, position: s.length - 14.5 },
    { label: "Throat", mass: s.throat, position: s.length * 0.48 },
    { label: "Butt cap", mass: s.butt, position: 2 },
    { label: "Overgrips", mass: s.overgrips * 5.5, position: 10 },
    { label: "Grip replacement (net)", mass: s.leather, position: 10 },
    { label: "Strings", mass: s.strings, position: s.length - 16 },
  ].map(p => ({...p, sw: p.position === 10 ? 0 : p.mass / 1000 * (p.position - 10) ** 2}));
}

export function finalCondition(s: Setup): "strung" | "unstrung" {
  return s.condition === "ready" || s.strings > 0 ? "strung" : "unstrung";
}

export function signed(value: number, digits = 1) {
  const rounded = Number(value.toFixed(digits));
  return (rounded > 0 ? "+" : "") + (Object.is(rounded, -0) ? 0 : rounded).toFixed(digits);
}

export function compareSetups(candidate: Setup, reference: Setup) {
  const a = calculateSetup(candidate), b = calculateSetup(reference);
  const compatible = finalCondition(candidate) === finalCondition(reference);
  const weight = a.weight - b.weight, balance = a.balance - b.balance;
  const swingweight = a.swingweight === null || b.swingweight === null ? null : a.swingweight - b.swingweight;
  const insights: string[] = [];
  if (!compatible) insights.push("One setup is unstrung and the other includes strings. Match their condition before making an equipment decision.");
  else {
    if (Math.abs(weight) >= 0.05) insights.push(`${Math.abs(weight).toFixed(1)} g ${weight > 0 ? "heavier" : "lighter"} overall. Static weight alone does not tell you how hard the racket is to swing.`);
    if (Math.abs(balance) >= 0.005) insights.push(`Balance moves ${Math.abs(balance * 10).toFixed(1)} mm toward the ${balance > 0 ? "head" : "hand"}. Head-light points also depend on racket length.`);
    if (swingweight === null) insights.push("Total swingweight cannot be compared until both starting swingweights are supplied. Addition deltas are not a substitute for total swingweight.");
    else if (Math.abs(swingweight) >= 0.05) insights.push(`${Math.abs(swingweight).toFixed(1)} kg·cm² ${swingweight > 0 ? "more" : "less"} swing inertia around the 10 cm axis. Check timing and fatigue on court.`);
    else insights.push("The estimated total swingweights are nearly identical. This does not establish identical stiffness, twistweight or feel.");
    if (candidate.length !== reference.length) insights.push("These rackets have different lengths; equal weight and balance do not make them matched frames.");
  }
  return {compatible, weight, balance, swingweight, insights};
}
export function balanceLabel(hl: number) {
  return Math.abs(hl) < 0.05
    ? "Even balance"
    : `${Math.abs(hl).toFixed(1)} pts ${hl > 0 ? "HL" : "HH"}`;
}

/** Sharing is opt-in; private court notes and local record IDs never leave the device. */
export function shareSetupHash(setup: Setup) {
  if (!isSetup(setup)) throw new Error("Check the setup inputs before sharing.");
  const specs = Object.fromEntries((Object.keys(newSetup()) as (keyof Setup)[]).filter(k => k !== "notes" && k !== "id").map(k => [k, setup[k]]));
  const encoded = encodeURIComponent(JSON.stringify({...specs, name: setup.name.slice(0, 100), model: setup.model.slice(0, 100), stringName: setup.stringName.slice(0, 150), tension: setup.tension.slice(0, 100)}));
  return "#racquet-lab?setup=" + encoded;
}
export function readSharedSetup(hash: string): Setup | null {
  if (!hash.startsWith("#racquet-lab?setup=")) return null;
  if (hash.length > 6000) throw new Error("Shared setup link is too long.");
  const value = JSON.parse(decodeURIComponent(hash.slice("#racquet-lab?setup=".length)));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid shared setup.");
  const setup = {...value, id: "", notes: "", archived: false};
  if (!isSetup(setup)) throw new Error("Invalid shared setup.");
  return setup;
}

/** Solve conservation of mass and first moment for two fixed addition points. */
export function planTarget(s: Setup, targetWeight: number, targetBalance: number, hoop: "tip" | "sides" = "tip"):
  { ok: false; reason: string } | { ok: true; tip: number; butt: number; hoop: "tip" | "sides"; setup: Setup; result: ReturnType<typeof calculateSetup> } {
  if (!isSetup(s) || !Number.isFinite(targetWeight) || !Number.isFinite(targetBalance) || targetWeight < 100 || targetWeight > 1000 || targetBalance <= 0 || targetBalance >= s.length)
    return { ok: false, reason: "Enter a valid target weight and a balance between the butt and tip." };
  const current = calculateSetup(s);
  const extra = targetWeight - current.weight;
  if (extra < -1e-8) return { ok: false, reason: "This target requires removing weight. Reduce your existing additions first, then try again." };
  const tipPosition = hoop === "tip" ? s.length - 0.6 : s.length - 14.5;
  const tip = (targetWeight * targetBalance - current.weight * current.balance - extra * 2) / (tipPosition - 2);
  const butt = extra - tip;
  if (tip < -1e-8 || butt < -1e-8) return { ok: false, reason: "This balance cannot be reached at that weight using the selected hoop and butt additions. Try more total weight or a balance closer to your current setup." };
  const key = hoop === "tip" ? "lead12" : "lead39";
  const next = { ...s, [key]: s[key] + Math.max(0, tip), butt: s.butt + Math.max(0, butt) };
  if (!isSetup(next)) return { ok: false, reason: "The required additions exceed the Lab’s 100 g limit per location. Choose a closer target." };
  return { ok: true, tip: Math.max(0, tip), butt: Math.max(0, butt), hoop, setup: next, result: calculateSetup(next) };
}

type SwingweightRange = { min: number; max: number };
type SpecificationPlan =
  | { ok: false; reason: string; range?: SwingweightRange }
  | { ok: true; tip: number; sides: number; butt: number; range: SwingweightRange; setup: Setup; result: ReturnType<typeof calculateSetup> };

/** Solve mass, first moment and inertia at tip, paired sides and butt. Adds mass only. */
export function planSpecificationTarget(s: Setup, targetWeight: number, targetBalance: number, targetSW: number | null): SpecificationPlan {
  if (!isSetup(s) || !Number.isFinite(targetWeight) || !Number.isFinite(targetBalance) || targetWeight < 100 || targetWeight > 1000 || targetBalance <= 0 || targetBalance >= s.length)
    return { ok: false, reason: "Enter a valid target weight and a balance between the butt and tip." };
  const current = calculateSetup(s);
  if (current.swingweight === null)
    return { ok: false, reason: "A three-specification match needs a known starting swingweight. Enter Starting SW in Build, measured in the same condition as your starting weight and balance." };
  const extra = targetWeight - current.weight;
  if (extra < -1e-8)
    return { ok: false, reason: "This target requires removing weight. Reduce your existing additions first, then try again." };
  if (targetSW !== null && (!Number.isFinite(targetSW) || targetSW < 0))
    return { ok: false, reason: "Enter a non-negative target swingweight in kg·cm²." };

  const tipPosition = s.length - 0.6, sidePosition = s.length - 14.5, buttPosition = 2;
  const moment = targetWeight * targetBalance - current.weight * current.balance;
  // At a fixed weight/balance, side and butt masses are affine functions of tip mass.
  const sideBase = (moment - buttPosition * extra) / (sidePosition - buttPosition);
  const sideSlope = -(tipPosition - buttPosition) / (sidePosition - buttPosition);
  const buttBase = extra - sideBase, buttSlope = -1 - sideSlope;
  const tipLimit = 100 - s.lead12, sideLimit = 100 - s.lead39, buttLimit = 100 - s.butt;
  let lower = 0, upper = tipLimit;
  for (const [base,slope,limit] of [[sideBase,sideSlope,sideLimit],[buttBase,buttSlope,buttLimit]]) {
    const a = -base / slope, b = (limit - base) / slope;
    lower = Math.max(lower,Math.min(a,b)); upper = Math.min(upper,Math.max(a,b));
  }
  if (upper < lower - 1e-8)
    return { ok: false, reason: "That weight and balance cannot be reached with additional tip, side and butt-cap mass within the Lab’s 100 g total limit at each location. Change the targets or reduce existing additions." };
  upper = Math.max(lower,upper);
  const tipInertia = (tipPosition - 10) ** 2, sideInertia = (sidePosition - 10) ** 2, buttInertia = (buttPosition - 10) ** 2;
  const fixedInertia = sideBase * sideInertia + buttBase * buttInertia;
  const inertiaSlope = tipInertia + sideSlope * sideInertia + buttSlope * buttInertia;
  const range = {
    min: current.swingweight + (fixedInertia + inertiaSlope * lower) / 1000,
    max: current.swingweight + (fixedInertia + inertiaSlope * upper) / 1000,
  };
  if (targetSW === null)
    return { ok: false, reason: "Enter a target swingweight to calculate the three-specification match.", range };
  if (targetSW < range.min - 1e-8 || targetSW > range.max + 1e-8)
    return { ok: false, reason: "The target swingweight is outside the achievable range for this weight and balance at the three modeled locations. Adjust swingweight, weight or balance; no mass has been applied.", range };
  const tip = Math.min(tipLimit,Math.max(0,((targetSW - current.swingweight) * 1000 - fixedInertia) / inertiaSlope));
  const sides = Math.min(sideLimit,Math.max(0,sideBase + sideSlope * tip));
  const butt = Math.min(buttLimit,Math.max(0,buttBase + buttSlope * tip));
  const next = {...s,lead12:s.lead12+tip,lead39:s.lead39+sides,butt:s.butt+butt};
  if (!isSetup(next)) return { ok: false, reason: "The required additions exceed the Lab’s limits. Choose a closer target.", range };
  return { ok: true, tip, sides, butt, range, setup:next, result:calculateSetup(next) };
}
