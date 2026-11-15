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
    (id) => id.startsWith(".") ? load(require("node:path").resolve(require("node:path").dirname(path),id)+".ts") : require(id),
  );
  return module.exports;
}
const { newSetup, calculateSetup, isSetup } = load("lib/baseline/racquet.ts");
const {PRO_SPECS,compareProSpec}=load('lib/baseline/pro-specs.ts');
test('Pro comparisons preserve unknown swingweight and suppress mixed-condition deltas',()=>{
 const draft=newSetup(),fed=PRO_SPECS.find(p=>p.id==='federer-2018'),sinner=PRO_SPECS.find(p=>p.id==='sinner-2026');
 const comparison=compareProSpec(draft,fed);assert.ok(comparison.compatible);close(comparison.rows[0].delta,calculateSetup(draft).weight-366);assert.equal(comparison.rows[2].own,null);assert.equal(comparison.rows[2].delta,null);
 assert.ok(compareProSpec(draft,sinner).rows.every(r=>r.delta===null));
 const unstrung={...draft,strings:0,baseSW:296};const matched=compareProSpec(unstrung,sinner);assert.ok(matched.compatible);assert.equal(matched.rows[2].delta,calculateSetup(unstrung).swingweight-296);
 const invalid=compareProSpec({...draft,baseWeight:NaN},fed);assert.equal(invalid.valid,false);assert.ok(invalid.rows.every(r=>r.own===null&&r.delta===null));
});
test('Pro library records retain dates, provenance and player rather than retail Federer specs',()=>{
 assert.equal(new Set(PRO_SPECS.map(p=>p.id)).size,PRO_SPECS.length);
 for(const p of PRO_SPECS){assert.equal(p.reportYear,Number(p.date.slice(0,4)));assert.match(p.url,/^https:\/\//);assert.ok(p.evidence&&p.era&&p.notes);}
 const fed=PRO_SPECS.find(p=>p.id==='federer-2018');assert.equal(fed.weight,366);assert.equal(fed.swingweight,340);
});
const {isVideoFile,videoFilename}=load('lib/baseline/videos.ts');
test('Phone video imports accept missing MIME only for known video extensions',()=>{
 for(const name of ['serve.MOV','rally.mp4','footwork.webm'])assert.equal(isVideoFile({name,type:''}),true);
 assert.equal(isVideoFile({name:'serve.mov',type:'application/octet-stream'}),true);
 assert.equal(isVideoFile({name:'clip',type:'video/quicktime'}),true);
 for(const file of [{name:'notes.txt',type:''},{name:'fake.mp4',type:'text/plain'},{name:'clip',type:''}])assert.equal(isVideoFile(file),false);
});
test('Video downloads retain original containers and international clip titles',()=>{
 assert.equal(videoFilename({title:'Saque de José',blob:{name:'IMG_42.MOV',type:'video/quicktime'}}),'Saque de José.MOV');
 assert.equal(videoFilename({title:'Serve',blob:{type:'video/mp4;codecs=avc1'}}),'Serve.mp4');
 assert.equal(videoFilename({title:'Rally',blob:{type:'video/quicktime'}}),'Rally.mov');
 assert.equal(videoFilename({title:'Serve.webm',blob:{type:'video/webm'}}),'Serve.webm');
 assert.equal(videoFilename({title:'<>:/',blob:{type:'video/ogg'}}),'practice-clip.ogv');
 assert.equal(videoFilename({title:'Unknown container',blob:{type:'video/unknown'}}),'Unknown container');
});
const { matchSummary, isMatch, isLegacyDemo } = load("lib/baseline/data.ts");
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
const {createBenchSheet,convertTapeDensity,benchSheetText,benchSheetFilename}=load('lib/baseline/bench.ts');
test('Bench tape conversion splits side mass once and preserves total length in both unit systems',()=>{
 const setup={...newSetup(),lead12:2,lead39:4,throat:1,butt:6},before=JSON.stringify(setup);
 const sheet=createBenchSheet(setup,{value:0.25,unit:'g/in'}),sides=sheet.tuning.find(r=>r.key==='lead39'),tip=sheet.tuning.find(r=>r.key==='lead12');
 assert.equal(sides.mass,4);assert.equal(sides.perSideMass,2);close(sides.tape.totalIn,16);close(sides.tape.totalCm,40.64);close(sides.tape.perSideIn,8);close(sides.tape.perSideCm,20.32);close(sides.tape.perSideCm*2,sides.tape.totalCm);close(sides.tape.totalCm*sheet.gramsPerCm,4);close(tip.tape.totalIn,8);
 const same=createBenchSheet(setup,{value:0.25/2.54,unit:'g/cm'});close(same.tuning.find(r=>r.key==='lead39').tape.totalCm,sides.tape.totalCm);assert.equal(JSON.stringify(setup),before);
});
test('Changing tape density units preserves the physical mass per length',()=>{
 const inValue=convertTapeDensity({value:0.1,unit:'g/cm'},'g/in');close(inValue,0.254);close(convertTapeDensity({value:inValue,unit:'g/in'},'g/cm'),0.1);close(convertTapeDensity({value:0.25,unit:'g/in'},'g/in'),0.25);
});
test('A bench sheet never assumes a tape density or a tape length for butt-cap mass',()=>{
 const setup={...newSetup(),lead12:2,lead39:4,butt:6},unknown=createBenchSheet(setup);assert.equal(unknown.gramsPerCm,null);assert.ok(unknown.tuning.every(r=>r.tape===null));assert.equal(unknown.tuning.find(r=>r.key==='lead39').perSideMass,2);
 const known=createBenchSheet(setup,{value:0.1,unit:'g/cm'});assert.equal(known.tuning.find(r=>r.key==='butt').tape,null);assert.equal(known.tuning.find(r=>r.key==='butt').mass,6);
 assert.equal(known.tuning.find(r=>r.key==='lead12').position,setup.length-0.6);assert.equal(known.tuning.find(r=>r.key==='lead39').position,setup.length-14.5);
});
test('Bench sheets preserve measured baselines, negative net grip changes and unknown versus real zero SW',()=>{
 const measured={...newSetup(),condition:'ready',strings:0,overgrips:2,baseWeight:330,baseSW:0,leather:-6},sheet=createBenchSheet(measured);close(sheet.result.weight,335);close(sheet.result.swingweight,0);assert.match(benchSheetText(measured),/Starting swingweight: 0.00 kg/);assert.match(benchSheetText(measured),/Replacement grip net change: -6.00 g/);
 const unknown=benchSheetText({...measured,baseSW:null});assert.match(unknown,/Total swingweight: Unknown/);assert.doesNotMatch(unknown,/Total swingweight: 0.00/);
 const unstrung=createBenchSheet({...newSetup(),overgrips:0});assert.equal(unstrung.condition,'strung');close(unstrung.result.weight,321);
});
test('Bench helpers reject invalid specs, missing units, nonpositive density and unrepresentable lengths',()=>{
 const setup={...newSetup(),lead12:100};for(const value of [0,-1,NaN,Infinity])assert.throws(()=>createBenchSheet(setup,{value,unit:'g/cm'}));assert.throws(()=>createBenchSheet(setup,{value:0.1,unit:'g/yard'}));assert.throws(()=>createBenchSheet(setup,{value:1e-308,unit:'g/cm'}));assert.throws(()=>createBenchSheet({...setup,baseWeight:NaN}));assert.throws(()=>convertTapeDensity({value:1e308,unit:'g/cm'},'g/in'));
});
test('Bench text excludes record IDs and private notes by default, with explicit note opt-in and safe filenames',()=>{
 const setup={...newSetup(),id:'device-record-sentinel',name:'Ángulo / frame',archived:true,notes:'Private tactic sentinel',lead39:4};
 const text=benchSheetText(setup,{value:0.25,unit:'g/in'});assert.doesNotMatch(text,/device-record-sentinel|Private tactic sentinel|archived/);assert.match(text,/cumulative quantities/);assert.match(text,/2.00 g per side/);assert.match(text,/20.32 cm/);assert.match(benchSheetText(setup,null,true),/Private tactic sentinel/);assert.equal(benchSheetFilename('../../ Ángulo / frame'),'racket-bench-angulo-frame.txt');assert.equal(benchSheetFilename('🎾'),'racket-bench-setup.txt');assert.ok(benchSheetFilename('a'.repeat(300)).length<100);
});
test('An empty tuning list does not omit separate string and overgrip mass from the final estimate',()=>{
 const setup=newSetup(),sheet=createBenchSheet(setup);assert.equal(sheet.tuning.length,0);close(sheet.result.weight,326.5);const text=benchSheetText(setup);assert.match(text,/No tip, side, throat or butt-cap mass recorded/);assert.match(text,/Additional string mass: 16.00 g/);assert.match(text,/Extra overgrips: 1/);assert.match(text,/326.50 g/);
});
const {sameSetupContent,filterSortSetups}=load('lib/baseline/racquet.ts');
test('Saved content comparison ignores property order and normalizes an absent archive flag',()=>{
 const s={...newSetup(),id:'saved'};
 const reordered={...Object.fromEntries(Object.entries(s).reverse()),archived:false};
 assert.ok(sameSetupContent(s,reordered));assert.ok(!sameSetupContent(s,{...reordered,archived:true}));
 for(const change of [{lead12:2},{name:'Renamed'},{notes:'Private note'},{baseSW:0},{stringName:'Different string'}])assert.ok(!sameSetupContent(s,{...reordered,...change}));
 assert.equal(Object.hasOwn(s,'archived'),false);
});
test('Setup search includes strings, tension and private notes and respects condition and archive filters',()=>{
 const a={...newSetup(),id:'a',name:'Match racket',stringName:'Poly 1.25',tension:'23 kg',notes:'Sharper volley'};
 const b={...newSetup(),id:'b',name:'Bare frame',strings:0};const c={...a,id:'c',archived:true};
 const input=[a,b,c],before=JSON.stringify(input);
 for(const query of [' POLY ','23 KG','volley'])assert.deepEqual(filterSortSetups(input,{query}).map(s=>s.id),['a']);
 assert.deepEqual(filterSortSetups(input,{condition:'unstrung'}).map(s=>s.id),['b']);
 assert.deepEqual(filterSortSetups(input,{condition:'strung'}).map(s=>s.id),['a']);
 assert.deepEqual(filterSortSetups(input,{archived:true,query:'poly'}).map(s=>s.id),['c']);
 assert.deepEqual(filterSortSetups(input,{query:'Missing'}),[]);assert.equal(JSON.stringify(input),before);
});
test('Specification sorting uses final estimates, treats zero as known and keeps unknown swingweight last both ways',()=>{
 const base={...newSetup(),condition:'ready',strings:0,overgrips:0,baseSW:290};
 const a={...base,id:'a',name:'Alpha',baseWeight:330,baseBalance:32};
 const b={...base,id:'b',name:'Beta',baseWeight:300,baseBalance:31,lead12:40};
 const unknown={...base,id:'u',name:'Unknown',baseSW:null};const zero={...base,id:'z',name:'Zero',baseSW:0};
 const input=[a,b,unknown,zero],before=JSON.stringify(input);
 assert.deepEqual(filterSortSetups([a,b],{sort:'weight',direction:'asc'}).map(s=>s.id),['a','b']);
 assert.deepEqual(filterSortSetups([a,b],{sort:'balance',direction:'asc'}).map(s=>s.id),['a','b']);
 assert.deepEqual(filterSortSetups(input,{sort:'swingweight',direction:'asc'}).map(s=>s.id),['z','a','b','u']);
 assert.deepEqual(filterSortSetups(input,{sort:'swingweight',direction:'desc'}).map(s=>s.id),['b','a','z','u']);
 assert.equal(JSON.stringify(input),before);
});
test('Saved-order sorting retains array order and name ties remain stable',()=>{
 const input=['z','a','b'].map(id=>({...newSetup(),id,name:id==='z'?'Zebra':'Alpha'}));
 assert.deepEqual(filterSortSetups(input).map(s=>s.id),['b','a','z']);
 assert.deepEqual(filterSortSetups(input,{sort:'saved',direction:'asc'}).map(s=>s.id),['z','a','b']);
 assert.deepEqual(filterSortSetups(input,{sort:'name',direction:'asc'}).map(s=>s.id),['a','b','z']);
 assert.deepEqual(filterSortSetups(input,{sort:'name',direction:'desc'}).map(s=>s.id),['z','a','b']);
});
test("No additions reproduce the same measured baseline", () => {
  const s = { ...newSetup(), overgrips: 0, strings: 0, baseSW: 290 };
  const r = calculateSetup(s);
  close(r.weight, 305);
  close(r.balance, 32);
  close(r.swingweight, 290);
});

const {additionBreakdown,compareSetups,finalCondition,signed,validRacketTrials,isRacketTrial,planTarget:targetPlan} = load("lib/baseline/racquet.ts");
const {setupFingerprint,summarizeCourtTests,courtEvidenceForSetup}=load("lib/baseline/racquet.ts");
const courtTrial=(id,patch={})=>({id,date:'2026-10-10',minutes:30,surface:'hard',stringHours:null,decision:'retest',ratings:{control:null,timing:null,stability:null,serve:null,comfort:null},notes:'',setup:newSetup(),...patch});
test('Exact-setup evidence follows cosmetic copies but not a revised record with the same ID',()=>{
 const original={...newSetup(),id:'saved',name:'Tested original',stringName:'Poly 1.25',tension:'23 kg'};
 const trials=[courtTrial('one',{setup:original,notes:'Original feedback',decision:'keep',ratings:{control:5,timing:null,stability:null,serve:null,comfort:null}})];
 const summaries=summarizeCourtTests(trials,'2026-10-11'),before=JSON.stringify(summaries);
 const renamed={...original,id:'copy',name:'Current label',notes:'Different private note',color:'#000000',archived:true};
 const evidence=courtEvidenceForSetup(renamed,summaries);assert.equal(evidence.totalCount,1);assert.equal(evidence.setup.name,'Current label');assert.equal(evidence.latestDecision,'keep');assert.equal(evidence.ratings.control.mean,5);
 for(const change of [{lead12:1},{stringName:'Different poly'},{tension:'22 kg'},{baseSW:0}]){
  const missing=courtEvidenceForSetup({...original,...change},summaries);assert.equal(missing.totalCount,0);assert.equal(missing.ratings.control.mean,null);assert.equal(missing.latestDecision,null);assert.equal(missing.latestNote,'');assert.equal(missing.setup.id,'saved');
 }
 assert.equal(JSON.stringify(summaries),before);assert.equal(trials[0].setup.name,'Tested original');
});
test('Evidence can show a selected configuration with zero eligible tests without borrowing other feedback',()=>{
 const selected={...newSetup(),lead12:2};const trials=[courtTrial('archived',{archived:true,setup:selected}),courtTrial('future',{date:'2026-10-12',setup:selected}),courtTrial('other',{ratings:{control:5,timing:null,stability:null,serve:null,comfort:null}})];
 const evidence=courtEvidenceForSetup(selected,summarizeCourtTests(trials,'2026-10-11'));
 assert.equal(evidence.totalCount,0);assert.deepEqual(evidence.trials,[]);assert.equal(evidence.minutes,0);assert.equal(evidence.lastDate,null);assert.equal(evidence.ratings.control.count,0);assert.equal(evidence.ratings.control.mean,null);
});
test('Exact-setup evidence retains total count under a surface filter while qualifying metrics become unknown',()=>{
 const setup=newSetup(),summaries=summarizeCourtTests([courtTrial('one',{setup})],'2026-10-11','clay'),evidence=courtEvidenceForSetup(setup,summaries);
 assert.equal(evidence.totalCount,1);assert.equal(evidence.trials.length,0);assert.equal(evidence.minutes,0);assert.equal(evidence.latestDecision,null);assert.equal(evidence.ratings.control.mean,null);
});
test('Court feedback groups the same inputs across rename/copy and separates weight placement, strings and tension',()=>{
 const original=newSetup();const renamed={...original,id:'new',name:'Renamed copy',color:'#000000',notes:'Private note',archived:true};
 assert.equal(setupFingerprint(original),setupFingerprint(renamed));
 const groups=summarizeCourtTests([courtTrial('one'),courtTrial('two',{date:'2026-10-11',setup:renamed}),courtTrial('tip',{setup:{...original,lead12:2}}),courtTrial('sides',{setup:{...original,lead39:2}}),courtTrial('strings',{setup:{...original,stringName:'Different poly'}}),courtTrial('tension',{setup:{...original,tension:'22 kg'}})],'2026-10-11');
 assert.equal(groups.length,5);const same=groups.find(s=>s.key===setupFingerprint(original));assert.equal(same.trials.length,2);assert.equal(same.setup.name,'Renamed copy');
});
test('Court feedback ignores missing ratings, keeps real zero string hours and weights tests equally',()=>{
 const a=courtTrial('one',{minutes:10,stringHours:0,ratings:{control:1,timing:null,stability:null,serve:null,comfort:null}});
 const b=courtTrial('two',{minutes:60,stringHours:8,ratings:{control:5,timing:3,stability:null,serve:null,comfort:null}});
 const c=courtTrial('unrated',{minutes:30});const input=[a,b,c],before=JSON.stringify(input);const r=summarizeCourtTests(input,'2026-10-11')[0];
 assert.equal(r.ratings.control.mean,3);assert.equal(r.ratings.control.count,2);assert.equal(r.ratings.timing.mean,3);assert.equal(r.ratings.timing.count,1);assert.equal(r.ratings.comfort.mean,null);assert.equal(r.ratings.comfort.count,0);assert.deepEqual(r.stringHours,{min:0,max:8,count:2});assert.equal(r.minutes,100);assert.equal(JSON.stringify(input),before);
});
test('Court summaries exclude archived, future, malformed and duplicated records',()=>{
 const r=summarizeCourtTests([courtTrial('same'),courtTrial('same',{date:'2026-10-11',ratings:{control:4,timing:null,stability:null,serve:null,comfort:null}}),courtTrial('archived',{archived:true}),courtTrial('future',{date:'2026-10-12'}),courtTrial('bad',{ratings:{control:99}})],'2026-10-11');
 assert.equal(r.length,1);assert.equal(r[0].totalCount,1);assert.equal(r[0].ratings.control.mean,4);assert.equal(r[0].lastDate,'2026-10-11');assert.deepEqual(summarizeCourtTests([], '2026-02-30'),[]);
});
test('Surface filters keep configurations selectable when one has no matching tests',()=>{
 const a=courtTrial('hard'),b=courtTrial('clay',{surface:'clay',setup:{...newSetup(),lead12:2}});
 const groups=summarizeCourtTests([a,b],'2026-10-11','clay');assert.equal(groups.length,2);const absent=groups.find(s=>s.key===setupFingerprint(a.setup));assert.equal(absent.totalCount,1);assert.equal(absent.trials.length,0);assert.equal(absent.lastDate,null);assert.equal(absent.ratings.control.mean,null);assert.deepEqual(absent.stringHours,{min:null,max:null,count:0});
});
test('Contribution breakdown conserves total mass and swingweight, including a lighter replacement grip',()=>{
 const s={...newSetup(),leather:-8,lead12:2,lead39:4,butt:3};
 assert.ok(isSetup(s)); const p=additionBreakdown(s),r=calculateSetup(s);
 close(p.reduce((a,b)=>a+b.mass,0),r.added);close(p.reduce((a,b)=>a+b.sw,0),r.swChange);
 assert.equal(p.find(p=>p.label.startsWith('Grip')).sw,0);
 assert.ok(!isSetup({...s,baseWeight:100,leather:-100}));
});
test('Comparisons never substitute addition deltas for unknown total swingweight',()=>{
 const a={...newSetup(),lead12:2},b={...newSetup(),lead12:4};
 const r=compareSetups(a,b); assert.equal(r.swingweight,null);assert.equal(r.compatible,true);assert.match(r.insights.join(' '),/cannot be compared/);
 const known=compareSetups({...a,baseSW:290},{...b,baseSW:280});
 close(known.swingweight,calculateSetup({...a,baseSW:290}).swingweight-calculateSetup({...b,baseSW:280}).swingweight);
});
test('Comparisons flag unstrung versus strung results and distinguish changed lengths',()=>{
 const a={...newSetup(),strings:0,condition:'unstrung'},b={...newSetup(),strings:0,condition:'ready'};
 assert.equal(finalCondition(a),'unstrung');assert.equal(finalCondition(b),'strung');assert.equal(compareSetups(a,b).compatible,false);
 assert.match(compareSetups({...b,length:71.12},b).insights.join(' '),/different lengths/);
 assert.equal(signed(-0.001,2),'0.00');
});
test('Side-placement target plan reproduces target specs, totals both sides once, and preserves source',()=>{
 const s={...newSetup(),baseSW:290,lead12:1,lead39:2}; const desired=calculateSetup({...s,lead39:8,butt:5});
 const p=targetPlan(s,desired.weight,desired.balance,'sides');assert.equal(p.ok,true);close(p.tip,6);close(p.butt,5);close(p.result.balance,desired.balance);close(p.result.swingweight,desired.swingweight);assert.equal(s.lead39,2);
});
const {planSpecificationTarget:specPlan}=load('lib/baseline/racquet.ts');
test('Three-spec matching solves known tip, combined side and butt masses from independent target values',()=>{
 const s={...newSetup(),condition:'ready',baseWeight:300,baseBalance:32,length:68.6,overgrips:0,strings:0,baseSW:290};
 const before=JSON.stringify(s),p=specPlan(s,312,9964.4/312,304.89124);
 assert.equal(p.ok,true);close(p.tip,2);close(p.sides,4);close(p.butt,6);close(p.result.weight,312);close(p.result.balance,9964.4/312);close(p.result.swingweight,304.89124);assert.equal(JSON.stringify(s),before);
});
test('Three-spec matching preserves every existing addition and works across lengths and zero-mass endpoints',()=>{
 for(const length of [50,68.58,71.12,80])for(const [tip,sides,butt] of [[0,0,0],[2,4,6],[0,8,0],[3,0,2],[1.1,2.2,3.3]]){
  const s={...newSetup(),length,baseSW:290,lead12:1,lead39:2,butt:3,leather:-4,throat:1,stringName:'Existing poly',tension:'23 kg'};
  const desired=calculateSetup({...s,lead12:s.lead12+tip,lead39:s.lead39+sides,butt:s.butt+butt}),p=specPlan(s,desired.weight,desired.balance,desired.swingweight);
  assert.equal(p.ok,true,JSON.stringify({length,tip,sides,butt,p}));close(p.tip,tip);close(p.sides,sides);close(p.butt,butt);close(p.result.swingweight,desired.swingweight);
  for(const key of ['overgrips','throat','leather','strings','stringName','tension','baseSW','length'])assert.equal(p.setup[key],s[key]);
 }
});
test('The feasible SW interval respects existing location caps and both endpoints reproduce target weight and balance',()=>{
 const s={...newSetup(),baseSW:290,lead12:99,lead39:99,butt:99};const desired=calculateSetup({...s,lead12:99.5,lead39:99.5,butt:99.5});
 const rangePlan=specPlan(s,desired.weight,desired.balance,null);assert.equal(rangePlan.ok,false);assert.ok(rangePlan.range);assert.ok(rangePlan.range.min<rangePlan.range.max);
 for(const sw of [rangePlan.range.min,rangePlan.range.max]){
  const p=specPlan(s,desired.weight,desired.balance,sw);assert.equal(p.ok,true);close(p.result.weight,desired.weight);close(p.result.balance,desired.balance);close(p.result.swingweight,sw);
  for(const key of ['lead12','lead39','butt'])assert.ok(p.setup[key]>=s[key] && p.setup[key]<=100);
 }
 const outside=specPlan(s,desired.weight,desired.balance,rangePlan.range.max+0.01);assert.equal(outside.ok,false);assert.match(outside.reason,/outside/);
 assert.equal(specPlan(s,desired.weight+10,desired.balance,desired.swingweight).ok,false);
});
test('Splitting across all three locations can match a target beyond either two-location plan cap',()=>{
 const s={...newSetup(),baseSW:290,lead12:90,lead39:90,butt:90};const desired=calculateSetup({...s,lead12:98,lead39:98,butt:98});
 assert.equal(targetPlan(s,desired.weight,desired.balance,'tip').ok,false);assert.equal(targetPlan(s,desired.weight,desired.balance,'sides').ok,false);
 const p=specPlan(s,desired.weight,desired.balance,desired.swingweight);assert.equal(p.ok,true);close(p.tip,8);close(p.sides,8);close(p.butt,8);
});
test('Three-spec matching keeps unknown starting SW unknown and accepts a real zero starting SW',()=>{
 const unknown=newSetup(),r=calculateSetup(unknown);const rejected=specPlan(unknown,r.weight+2,r.balance,320);assert.equal(rejected.ok,false);assert.match(rejected.reason,/known starting/);assert.equal(rejected.range,undefined);
 const zero={...newSetup(),condition:'ready',baseSW:0,overgrips:0,strings:0};const z=calculateSetup(zero),already=specPlan(zero,z.weight,z.balance,0);assert.equal(already.ok,true);close(already.result.swingweight,0);close(already.tip+already.sides+already.butt,0);
 const desired=calculateSetup({...zero,lead12:2,lead39:4,butt:5}),p=specPlan(zero,desired.weight,desired.balance,desired.swingweight);assert.equal(p.ok,true);close(p.tip,2);close(p.sides,4);close(p.butt,5);
});
test('Impossible or incomplete three-spec targets return guidance without applying removals or invalid values',()=>{
 const s={...newSetup(),baseSW:290},r=calculateSetup(s),before=JSON.stringify(s);
 for(const [weight,balance,sw] of [[r.weight-1,r.balance,r.swingweight],[r.weight,33,r.swingweight],[r.weight+8,32,-1],[r.weight+8,32,NaN],[r.weight+8,32,Infinity],[NaN,32,320],[r.weight+8,80,320]])assert.equal(specPlan(s,weight,balance,sw).ok,false);
 const partial=specPlan(s,r.weight+8,r.balance,null);assert.equal(partial.ok,false);assert.match(partial.reason,/Enter a target swingweight/);assert.ok(partial.range);
 assert.equal(specPlan(s,r.weight+8,r.balance,partial.range.min-0.01).ok,false);assert.equal(JSON.stringify(s),before);
});
test('Court-test snapshots round-trip and reject invalid feedback, dates or specs',()=>{
 const t={id:'test',date:'2026-10-11',minutes:30,surface:'hard',stringHours:0,decision:'retest',ratings:{control:5,timing:null,stability:4,serve:3,comfort:1},notes:'Test again',setup:newSetup()};
 assert.ok(isRacketTrial(t));assert.ok(validRacketTrials(JSON.parse(JSON.stringify([t]))));
 for(const v of [{...t,date:'2026-02-30'},{...t,minutes:0},{...t,ratings:{...t.ratings,control:6}},{...t,stringHours:-1},{...t,setup:{...t.setup,lead12:-1}},{...t,decision:'win'}]) assert.ok(!isRacketTrial(v));
 const original=JSON.parse(JSON.stringify(t));const draft={...t.setup,lead12:4};assert.equal(original.setup.lead12,0);assert.equal(draft.lead12,4);
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
test('Match validation accepts legacy labels and strung snapshots, rejecting malformed and unstrung snapshots',()=>{
 assert.ok(isMatch({...m,setup:'Legacy label'}));assert.ok(isMatch({...m,setupSnapshot:newSetup()}));
 assert.ok(!isMatch({...m,setupSnapshot:{...newSetup(),baseBalance:99}}));assert.ok(!isMatch({...m,setupSnapshot:{...newSetup(),strings:0}}));assert.ok(!isMatch({...m,setupSnapshot:null}));
 const record=JSON.parse(JSON.stringify({...m,setupSnapshot:newSetup()}));const current={...record.setupSnapshot,lead12:8};assert.equal(record.setupSnapshot.lead12,0);assert.equal(current.lead12,8);
});
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

test("Target planner reconstructs known tip and butt additions without changing the source", () => {
  const { planTarget } = load("lib/baseline/racquet.ts");
  const s = { ...newSetup(), lead12: 2, butt: 3, baseSW: 290 };
  const target = calculateSetup({ ...s, lead12: 5, butt: 10 });
  const p = planTarget(s, target.weight, target.balance);
  assert.equal(p.ok, true);
  close(p.tip, 3); close(p.butt, 7);
  close(p.result.weight, target.weight); close(p.result.balance, target.balance);
  close(p.result.swingweight, target.swingweight);
  assert.equal(s.lead12, 2);
});
test("Target planner rejects removal, impossible balance, nonfinite inputs and oversized additions", () => {
  const { planTarget } = load("lib/baseline/racquet.ts");
  const s = newSetup();
  const c = calculateSetup(s);
  for (const [w,b] of [[c.weight-1,c.balance],[c.weight,40],[NaN,32],[340,Infinity],[1000,32]]) {
    assert.equal(planTarget(s,w,b).ok,false);
  }
});
test("Target planner handles an already reached target and preserves unknown swingweight", () => {
  const { planTarget } = load("lib/baseline/racquet.ts");
  const s = newSetup(); const c = calculateSetup(s);
  const p = planTarget(s,c.weight,c.balance);
  assert.equal(p.ok,true); close(p.tip,0); close(p.butt,0);
  assert.equal(p.result.swingweight,null);
});

test("Opponent history matches case and whitespace but keeps different players separate", () => {
  const { opponentHistory } = load("lib/baseline/data.ts");
  const base = { id: "a", opponent: "Alex Smith", score: "6-4 6-4", result: "win", surface: "hard", date: "2026-10-01", style: "Unknown", firstServe: null, unforcedErrors: null };
  const result = opponentHistory([base, {...base,id:"b",opponent:"  ALEX   SMITH ", result:"loss",surface:"clay"}, {...base,id:"c",opponent:"Alex Jones"}], "alex smith", "2026-10-11");
  assert.equal(result.total,2); assert.equal(result.wins,1); assert.equal(result.losses,1);
  assert.equal(result.surfaces.length,2); assert.equal(result.avgServe,null);
});
test("Opponent history excludes archived, future and legacy demo matches without mutating input", () => {
  const { opponentHistory } = load("lib/baseline/data.ts");
  const base = { id:"real", opponent:"Jannik Sinner", score:"6-4",result:"win",surface:"hard",date:"2026-10-01",style:"Unknown",firstServe:0,unforcedErrors:0 };
  const input = [{...base,id:"future",date:"2026-12-01"},{...base,id:"archived",archived:true},{...base,id:"1",date:"2026-05-18"},base];
  const before = JSON.stringify(input); const result = opponentHistory(input,base.opponent,"2026-10-11");
  assert.deepEqual(result.meetings.map(m=>m.id),["real"]); assert.equal(result.avgServe,0); assert.equal(JSON.stringify(input),before);
});
test("Opponent history orders recent meetings first and handles empty names", () => {
  const { opponentHistory } = load("lib/baseline/data.ts");
  const base = { id:"old",opponent:"Alex",score:"6-4",result:"win",surface:"hard",date:"2026-09-01",style:"Unknown",firstServe:null,unforcedErrors:null };
  assert.deepEqual(opponentHistory([base,{...base,id:"new",date:"2026-10-01"}],"Alex","2026-10-11").meetings.map(m=>m.id),["new","old"]);
  assert.equal(opponentHistory([base]," ","2026-10-11").total,0);
});

test("Practice outcome accepts real zero, rejects partial and impossible counts", () => {
  const {readPracticeOutcome,isPracticeSession} = load("lib/baseline/data.ts");
  assert.equal(readPracticeOutcome("",""),undefined);
  assert.deepEqual(readPracticeOutcome("0","30"),{successes:0,attempts:30});
  for (const [a,b] of [["","30"],["2",""],["31","30"],["1","0"],["1.5","30"],["0","10001"]]) assert.throws(()=>readPracticeOutcome(a,b));
  const s={id:"p",drillId:"serve",date:"2026-10-11",minutes:15,notes:""};
  assert.equal(isPracticeSession(s),true);
  assert.equal(isPracticeSession({...s,outcome:{successes:0,attempts:30}}),true);
  assert.equal(isPracticeSession({...s,outcome:{successes:"0",attempts:30}}),false);
});
test("Drill rates are weighted by attempts and exclude missing, archived, future and other drills", () => {
  const {drillResults} = load("lib/baseline/data.ts");
  const s={id:"a",drillId:"serve",date:"2026-10-01",minutes:15,notes:"",outcome:{successes:1,attempts:2}};
  const rows=[s,{...s,id:"b",date:"2026-10-02",outcome:{successes:9,attempts:10}},{...s,id:"c",archived:true},{...s,id:"d",date:"2027-01-01"},{...s,id:"e",drillId:"return"},{...s,id:"f",outcome:undefined}];
  const r=drillResults(rows,"serve","2026-10-11");
  assert.equal(r.rate,83);assert.equal(r.attempts,12);assert.equal(r.successes,10);
  assert.deepEqual(r.recorded.map(x=>x.id),["b","a"]);
  assert.equal(drillResults([],"serve","2026-10-11").rate,null);
});

test("Drill period comparison uses adjacent non-overlapping windows and unrounded rates", () => {
  const {drillPeriodSummary} = load("lib/baseline/data.ts");
  const base={id:"x",drillId:"serve",minutes:15,notes:"",outcome:{successes:2,attempts:3}};
  const r=drillPeriodSummary([{...base,date:"2026-10-11"},{...base,id:"prior",date:"2026-09-13",outcome:{successes:1,attempts:3}},{...base,id:"old",date:"2026-08-16"},{...base,id:"future",date:"2026-10-12"}],"2026-10-11",28);
  assert.equal(r.start,"2026-09-14");assert.equal(r.previousEnd,"2026-09-13");assert.equal(r.previousStart,"2026-08-17");
  assert.equal(r.drills[0].current.attempts,3);assert.equal(r.drills[0].previous.attempts,3);assert.equal(r.drills[0].change,33.3);
  assert.equal(r.drills[1].change,null);
});
test("Drill benchmarks retain zero success and respect archives and the expanded window", () => {
  const {drillPeriodSummary} = load("lib/baseline/data.ts");
  const base={id:"x",drillId:"serve",minutes:15,notes:"",date:"2026-08-20",outcome:{successes:0,attempts:10}};
  assert.equal(drillPeriodSummary([base],"2026-10-11",28).drills[0].current.rate,null);
  assert.equal(drillPeriodSummary([base],"2026-10-11",84).drills[0].current.rate,0);
  assert.equal(drillPeriodSummary([{...base,archived:true}],"2026-10-11",84).drills[0].current.rate,null);
});

test('Court string-age ranges are disjoint, include zero, and never treat unknown hours as fresh',()=>{
 const trials=[0,5,5.5,15,15.5,null].map((hours,i)=>courtTrial('age'+i,{stringHours:hours}));
 const before=JSON.stringify(trials),select=stringAge=>summarizeCourtTests(trials,'2026-10-11','',{stringAge})[0];
 assert.deepEqual(select('fresh').trials.map(t=>t.stringHours),[0,5]);
 assert.deepEqual(select('played').trials.map(t=>t.stringHours),[5.5,15]);
 assert.deepEqual(select('older').trials.map(t=>t.stringHours),[15.5]);
 assert.deepEqual(select('unknown').trials.map(t=>t.stringHours),[null]);
 assert.equal(select('all').trials.length,6);assert.equal(select('fresh').totalCount,6);assert.equal(JSON.stringify(trials),before);
});
test('Court date windows include both bounds through leap day and combine with surface and string age',()=>{
 const dates=['2024-03-01','2024-02-03','2024-02-02','2023-12-09','2023-12-08'];
 const trials=dates.map((date,i)=>courtTrial('date'+i,{date,stringHours:5}));
 trials.push(courtTrial('clay',{date:'2024-03-01',stringHours:5,surface:'clay'}),courtTrial('old-strings',{date:'2024-03-01',stringHours:16}),courtTrial('future',{date:'2024-03-02'}),courtTrial('archived',{date:'2024-03-01',archived:true}));
 const recent=summarizeCourtTests(trials,'2024-03-01','hard',{days:28,stringAge:'fresh'})[0];
 assert.deepEqual(recent.trials.map(t=>t.date),['2024-03-01','2024-02-03']);assert.equal(recent.totalCount,7);
 const longer=summarizeCourtTests(trials,'2024-03-01','hard',{days:84,stringAge:'fresh'})[0];assert.deepEqual(longer.trials.map(t=>t.date),dates.slice(0,4));
});
test('Filtered-out court configurations retain identity and total counts with unknown feedback',()=>{
 const a=courtTrial('a',{stringHours:1}),b=courtTrial('b',{stringHours:16,setup:{...newSetup(),lead12:2}});
 const results=summarizeCourtTests([a,b],'2026-10-11','',{stringAge:'fresh'}),empty=results.find(s=>s.key===setupFingerprint(b.setup));
 assert.equal(results.length,2);assert.equal(empty.totalCount,1);assert.equal(empty.trials.length,0);assert.equal(empty.ratings.control.mean,null);assert.equal(empty.latestDecision,null);assert.equal(empty.latestNote,'');assert.equal(empty.minutes,0);
});

const {isSessionPlan,sessionPresets,sessionPlanText,nextPractice}=load('lib/baseline/session-plan.ts');
test('Court plans validate unique known drills, integral durations and the total session limit',()=>{
 assert.ok(isSessionPlan([]));assert.ok(sessionPresets.every(p=>isSessionPlan(p.plan)));assert.ok(isSessionPlan([{drillId:'serve',minutes:90},{drillId:'depth',minutes:90}]));
 for(const invalid of [null,{},[{drillId:'unknown',minutes:10}],[{drillId:'serve',minutes:'15'}],[{drillId:'serve',minutes:0}],[{drillId:'serve',minutes:91}],[{drillId:'serve',minutes:1.5}],[{drillId:'serve',minutes:10},{drillId:'serve',minutes:20}],[{drillId:'serve',minutes:90},{drillId:'depth',minutes:90},{drillId:'return',minutes:1}]])assert.equal(isSessionPlan(invalid),false);
});
test('Court plan text preserves custom order and time with targets, cues and a distinction from completed practice',()=>{
 const plan=[{drillId:'return',minutes:10},{drillId:'serve',minutes:25}],before=JSON.stringify(plan),text=sessionPlanText(plan);
 assert.match(text,/35 minutes · 2 blocks/);assert.ok(text.indexOf('1. Return + one')<text.indexOf('2. Serve with a destination'));assert.match(text,/25 MIN/);assert.match(text,/Bring: Partner/);assert.match(text,/Cue:/);assert.match(text,/not automatically recorded/);assert.equal(JSON.stringify(plan),before);assert.throws(()=>sessionPlanText([{drillId:'unknown',minutes:10}]));
});
test('Next practice follows the latest real match focus while excluding future, archived and demo records',()=>{
 const {today}=load('lib/baseline/data.ts');
 const match={id:'a',opponent:'Partner',score:'6-4',surface:'hard',style:'',firstServe:null,unforcedErrors:null,result:'win',date:'2026-10-10',focus:'Improve return depth'};
 const result=nextPractice([match,{...match,id:'future',date:'2026-10-12',focus:'Serve'}, {...match,id:'archived',date:'2026-10-11',archived:true,focus:'Footwork'}],'2026-10-11');
 assert.equal(result.drill.id,'return');assert.equal(result.latest.id,'a');assert.match(result.reason,/Improve return depth/);assert.equal(nextPractice([]).drill.id,'serve');assert.equal(nextPractice([{...match,id:'1',opponent:'Jannik Sinner',date:'2026-05-18'}],today()).latest,undefined);
});

const {parseBackup,prepareBackup,applyBackup}=load('lib/baseline/backup.ts');
function backupStorage(seed={}) {const data=new Map(Object.entries(seed));return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('Backup review is read-only, deduplicates incoming records and merges against fresh data on confirmation',()=>{
 const a={...newSetup(),id:'a'},b={...newSetup(),id:'b'},c={...newSetup(),id:'c'};
 const storage=backupStorage({'baseline_setups_v2':JSON.stringify([a])});
 const backup=parseBackup(JSON.stringify({version:2,matches:[],practice:[],setups:[{...a,name:'Do not overwrite'},b,b]}));
 const before=JSON.stringify([...storage.data]);const review=prepareBackup(storage,backup);assert.equal(review.rows.find(r=>r.label==='Racket setups').added,1);assert.equal(review.rows.find(r=>r.label==='Racket setups').kept,2);assert.equal(JSON.stringify([...storage.data]),before);
 storage.setItem('baseline_setups_v2',JSON.stringify([a,c]));applyBackup(storage,backup);assert.deepEqual(JSON.parse(storage.getItem('baseline_setups_v2')).map(s=>s.id),['a','c','b']);assert.equal(JSON.parse(storage.getItem('baseline_setups_v2'))[0].name,a.name);
});
test('Backup storage failure rolls back completed writes including previously absent keys',()=>{
 const storage=backupStorage({'baseline_matches':'[]'}),before=JSON.stringify([...storage.data]);const write=storage.setItem;
 storage.setItem=(k,v)=>{if(k==='baseline_setups_v2')throw new Error('Quota');write(k,v);};
 assert.throws(()=>applyBackup(storage,{version:2,matches:[],practice:[],setups:[{...newSetup(),id:'a'}]}),/previous records were restored/);assert.equal(JSON.stringify([...storage.data]),before);
});
test('Corrupt saved data stops backup import before any writes and malformed backups are rejected',()=>{
 const storage=backupStorage({'baseline_setups_v2':'corrupt'}),before=JSON.stringify([...storage.data]);assert.throws(()=>applyBackup(storage,{version:2,matches:[],practice:[],setups:[]}));assert.equal(JSON.stringify([...storage.data]),before);
 for(const text of ['null','{}',JSON.stringify({version:3,matches:[],practice:[],setups:[]})])assert.throws(()=>parseBackup(text));
});
