const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");
const fs = require("node:fs");
function load(path) {
  const source = fs.readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const module = { exports: {} };
  new Function("module", "exports", "require", compiled)(
    module,
    module.exports,
    require,
  );
  return module.exports;
}
const { newSetup, calculateSetup, isSetup } = load("lib/baseline/racquet.ts");
const { matchSummary, isMatch, isLegacyDemo } = load("lib/baseline/data.ts");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test("No additions reproduce the same measured baseline", () => {
  const s = { ...newSetup(), overgrips: 0, strings: 0, baseSW: 290 };
  const r = calculateSetup(s);
  close(r.weight, 305);
  close(r.balance, 32);
  close(r.swingweight, 290);
});
test("Tip weighting uses mass in kg, the 10 cm axis and weighted balance", () => {
  const s = {
    ...newSetup(),
    length: 68.6,
    overgrips: 0,
    strings: 0,
    lead12: 3,
    baseSW: 290,
  };
  const r = calculateSetup(s);
  close(r.weight, 308);
  close(r.balance, (305 * 32 + 3 * 68) / 308);
  close(r.swChange, 10.092);
  close(r.swingweight, 300.092);
});
test("Unknown starting swingweight stays unknown while delta is available", () => {
  const r = calculateSetup({
    ...newSetup(),
    strings: 0,
    overgrips: 0,
    lead39: 4,
  });
  assert.equal(r.swingweight, null);
  assert.ok(r.swChange > 0);
});
test("Side mass is total, not doubled; butt mass shifts balance toward hand", () => {
  const s = { ...newSetup(), strings: 0, overgrips: 0, lead39: 4, butt: 5 };
  const r = calculateSetup(s);
  close(r.weight, 314);
  assert.ok(r.balance < 32);
});
test("Custom lengths change head-light points and tip mass distance", () => {
  const a = calculateSetup({ ...newSetup(), length: 68.58, lead12: 3 });
  const b = calculateSetup({ ...newSetup(), length: 71.12, lead12: 3 });
  assert.ok(b.hl > a.hl);
  assert.ok(b.swChange > a.swChange);
});
test("Invalid saved inputs are rejected", () => {
  assert.ok(isSetup(newSetup()));
  assert.ok(!isSetup({ ...newSetup(), strings: -1 }));
  assert.ok(!isSetup({ ...newSetup(), baseWeight: NaN }));
  assert.ok(!isSetup({ ...newSetup(), baseBalance: 80 }));
  assert.ok(!isSetup({ ...newSetup(), baseSW: Infinity }));
});
const m = {
  id: "real",
  opponent: "Test",
  score: "6-4, 6-4",
  date: "2026-10-08",
  surface: "hard",
  style: "Unknown",
  firstServe: null,
  unforcedErrors: null,
  result: "win",
};
test("Unknown serve percentages are not silently treated as zero", () => {
  assert.ok(isMatch(m));
  const r = matchSummary([
    m,
    { ...m, id: "2real", result: "loss", firstServe: 60 },
  ]);
  assert.equal(r.avgServe, 60);
  assert.equal(r.serveCount, 1);
  assert.equal(r.winRate, 50);
});
test("Legacy examples are preserved but excluded from performance totals", () => {
  const demo = { ...m, id: "1", opponent: "Jannik Sinner", date: "2026-05-18" };
  assert.ok(isLegacyDemo(demo));
  assert.equal(matchSummary([demo, m]).total, 1);
  assert.equal(matchSummary([demo]).winRate, null);
});
test("Numeric validation accepts real zero and rejects impossible stats", () => {
  assert.ok(isMatch({ ...m, firstServe: 0, unforcedErrors: 0 }));
  assert.ok(!isMatch({ ...m, firstServe: 101 }));
  assert.ok(!isMatch({ ...m, unforcedErrors: -1 }));
});
