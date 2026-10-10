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
const { readStored, updateStored, mergeById } = load("lib/baseline/storage.ts");
const validList = (v) =>
  Array.isArray(v) && v.every((x) => x && typeof x.id === "string");
function memoryStore() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
}
test("Writes use the latest persisted list, retaining another tab’s additions", () => {
  const store = memoryStore();
  updateStored(store, "items", [], validList, () => [{ id: "a" }]);
  updateStored(store, "items", [], validList, (current) => [
    ...current,
    { id: "b" },
  ]);
  assert.deepEqual(readStored(store, "items", [], validList), [
    { id: "a" },
    { id: "b" },
  ]);
});
test("Invalid existing data is never overwritten by a new save", () => {
  const store = memoryStore();
  store.setItem("items", "broken JSON");
  assert.throws(() =>
    updateStored(store, "items", [], validList, [{ id: "new" }]),
  );
  assert.equal(store.getItem("items"), "broken JSON");
});
test("Backup merge keeps existing IDs and deduplicates incoming entries", () => {
  assert.deepEqual(
    mergeById(
      [{ id: "a", n: 1 }],
      [
        { id: "a", n: 2 },
        { id: "b", n: 3 },
        { id: "b", n: 4 },
      ],
    ),
    [
      { id: "a", n: 1 },
      { id: "b", n: 3 },
    ],
  );
});
test("Malformed backup text fields, dates, and inherited surface names are rejected", () => {
  assert.ok(!isMatch({ ...m, notes: { value: "bad" } }));
  assert.ok(!isMatch({ ...m, surface: "toString" }));
  assert.ok(!isMatch({ ...m, date: "2026-02-30" }));
  assert.ok(!isMatch({ ...m, firstServe: undefined }));
});
test("Racket imported numbers cannot be strings and grip counts are integral", () => {
  assert.ok(!isSetup({ ...newSetup(), baseWeight: "305" }));
  assert.ok(!isSetup({ ...newSetup(), overgrips: 1.5 }));
  assert.ok(!isSetup({ ...newSetup(), overgrips: 6 }));
  assert.ok(!isSetup({ ...newSetup(), strings: 41 }));
});

const { progressSummary, suggestedDrill, shiftDate } = load("lib/baseline/data.ts");
const { shareSetupHash, readSharedSetup } = load("lib/baseline/racquet.ts");
const progressMatch = {id:'real',opponent:'Partner',score:'6-4',surface:'hard',style:'Unknown',result:'win',date:'2026-10-09',firstServe:null,unforcedErrors:null};
test('Progress windows exclude future, older and sample matches and keep zero stats', () => {
  const matches = [progressMatch, {...progressMatch,id:'zero',firstServe:0,result:'loss'}, {...progressMatch,id:'future',date:'2026-10-10'}, {...progressMatch,id:'old',date:'2026-09-11'}];
  const r = progressSummary(matches, [{id:'p',drillId:'serve',minutes:30,date:'2026-10-09',notes:''}], '2026-10-09', 28);
  assert.equal(r.start,'2026-09-12'); assert.equal(r.total,2); assert.equal(r.winRate,50); assert.equal(r.avgServe,0); assert.equal(r.serveCount,1); assert.equal(r.activeDays,1); assert.equal(r.minutes,30); assert.equal(r.weekly.length,4); assert.equal(r.weekly[3].minutes,30);
});
test('Progress calendar arithmetic handles leap years and daylight saving boundaries', () => {
  assert.equal(shiftDate('2024-03-01',-1),'2024-02-29');
  assert.equal(shiftDate('2026-03-09',-1),'2026-03-08');
  assert.equal(progressSummary([],[],'2026-10-09',84).weekly.length,12);
});
test('Practice focus takes priority over availability of serve statistics', () => {
  assert.equal(suggestedDrill({...progressMatch,focus:'Return placement',firstServe:60}),'return');
  assert.equal(suggestedDrill({...progressMatch,focus:'Serve placement'}),'serve');
  assert.equal(suggestedDrill({...progressMatch,focus:'Footwork recovery'}),'movement');
});
test('Share links preserve Unicode specs without IDs or private notes', () => {
  const s = {...newSetup(),id:'private-id',name:'Javi · competición 🎾',notes:'Private note',lead12:3};
  const hash = shareSetupHash(s); const decoded = decodeURIComponent(hash);
  assert.ok(!decoded.includes('private-id')); assert.ok(!decoded.includes('Private note'));
  const restored = readSharedSetup(hash);
  assert.equal(restored.name,s.name); assert.equal(restored.lead12,3); assert.equal(restored.id,''); assert.equal(restored.notes,'');
});
test('Malformed and oversized shared configurations cannot be loaded', () => {
  assert.equal(readSharedSetup('#overview'),null);
  assert.throws(() => readSharedSetup('#racquet-lab?setup=%bad'));
  assert.throws(() => readSharedSetup('#racquet-lab?setup='+encodeURIComponent(JSON.stringify({...newSetup(),baseWeight:-1}))));
  assert.throws(() => readSharedSetup('#racquet-lab?setup='+'x'.repeat(6001)));
});

const { setArchived } = load('lib/baseline/storage.ts');
const { isPracticeSession } = load('lib/baseline/data.ts');
test('Archive and restore retain full records without mutating the original list', () => {
  const original = [{...progressMatch,notes:'Keep this note'}, {...progressMatch,id:'other'}];
  const archived = setArchived(original,'real',true);
  assert.equal(original[0].archived,undefined); assert.equal(archived.length,2);
  assert.equal(archived[0].notes,'Keep this note'); assert.equal(archived[1],original[1]);
  assert.equal(matchSummary(archived).total,1);
  const restored = setArchived(archived,'real',false);
  assert.equal(matchSummary(restored).total,2); assert.equal(restored[0].notes,'Keep this note');
});
test('Archived practices and matches are excluded from every progress aggregate', () => {
  const session = {id:'practice',drillId:'serve',minutes:30,date:'2026-10-09',notes:'Preserved',archived:true};
  const report = progressSummary([{...progressMatch,archived:true}],[session],'2026-10-09',28);
  assert.equal(report.total,0);assert.equal(report.minutes,0);assert.equal(report.sessions,0);assert.equal(report.activeDays,0);assert.equal(report.surfaces.length,0);assert.equal(report.recent.length,0);assert.ok(report.weekly.every(w => w.minutes === 0));
  assert.ok(isPracticeSession(session));assert.ok(!isPracticeSession({...session,archived:'true'}));assert.ok(!isMatch({...progressMatch,archived:'true'}));assert.ok(!isSetup({...newSetup(),archived:'true'}));
});
test('Archive survives backup serialization; shared setups open active', () => {
  const archived = {...newSetup(),archived:true};
  assert.ok(isSetup(JSON.parse(JSON.stringify(archived))));
  assert.equal(readSharedSetup(shareSetupHash(archived)).archived,false);
});
