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
    ["id", "name", "model", "color", "stringName", "tension", "notes"].every(
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
    [
      "overgrips",
      "leather",
      "lead12",
      "lead39",
      "throat",
      "butt",
      "strings",
    ].every((k) => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 100)
  );
}
export function calculateSetup(s: Setup) {
  // All positions are cm from the butt. Swingweight uses the standard 10 cm axis.
  // Each addition is approximated as a point mass. Strung and unstrung baselines must not be mixed.
  const points = [
    { mass: s.overgrips * 5.5, position: 10 },
    { mass: s.leather, position: 10 },
    { mass: s.lead12, position: s.length - 0.6 },
    { mass: s.lead39, position: s.length - 14.5 },
    { mass: s.throat, position: s.length * 0.48 },
    { mass: s.butt, position: 2 },
    { mass: s.strings, position: s.length - 16 },
  ];
  const added = points.reduce((sum, p) => sum + p.mass, 0);
  const weight = s.baseWeight + added;
  const balance =
    (s.baseWeight * s.baseBalance +
      points.reduce((sum, p) => sum + p.mass * p.position, 0)) /
    weight;
  const swChange = points.reduce(
    (sum, p) => sum + (p.mass / 1000) * (p.position - 10) ** 2,
    0,
  );
  const swingweight = s.baseSW === null ? null : s.baseSW + swChange;
  const hl = (s.length / 2 - balance) / 0.3175;
  return { weight, balance, swChange, swingweight, hl, added };
}
export function balanceLabel(hl: number) {
  return Math.abs(hl) < 0.05
    ? "Even balance"
    : `${Math.abs(hl).toFixed(1)} pts ${hl > 0 ? "HL" : "HH"}`;
}
