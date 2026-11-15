const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const {JSDOM}=require('jsdom');
const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'https://private.example/dashboard#racquet-lab'});
for(const name of ['window','document','localStorage','HTMLElement','HTMLInputElement','HTMLSelectElement','CustomEvent','Event','MouseEvent','FormData']) global[name]=dom.window[name];
global.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.HTMLElement.prototype.scrollIntoView=function(){};
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
dom.window.scrollTo=function(){};
const React=require('react');
const {act}=React;
const {createRoot}=require('react-dom/client');
const cache=new Map();
function load(file){
 file=path.resolve(file); if(cache.has(file))return cache.get(file).exports;
 const m={exports:{}};cache.set(file,m);
 const compiled=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 function resolve(id){if(id.endsWith('.css')) return {};if(id==='next/link')return {__esModule:true,default:({children,...props})=>React.createElement('a',props,children)};
 if(id.startsWith('@/') || id.startsWith('.')) {let f=id.startsWith('@/')?path.resolve(id.slice(2)):path.resolve(path.dirname(file),id);return load(['.tsx','.ts',''].map(ext=>f+ext).find(p=>fs.existsSync(p)));}return require(id);}
 new Function('module','exports','require',compiled)(m,m.exports,resolve);return m.exports;
}
const Lab=load('components/RacquetLab.tsx').default;
const {newSetup,calculateSetup}=load('lib/baseline/racquet.ts');
const container=document.getElementById('root');
test('Video journal can recover storage, explain playback failure, and retry failed note saves',async()=>{
 const storage=load('lib/baseline/videos.ts');const oldList=storage.listVideos,oldSave=storage.saveVideo,oldURL=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
 const Gallery=load('components/VideoGallery.tsx').default;
 let unavailable=true,rejectSave,saveCalls=0;
 const clip={id:'phone',title:'Saque de José',notes:'Original observation',createdAt:'2026-10-12T12:00:00Z',blob:{name:'IMG.MOV',type:'video/quicktime'}};
 storage.listVideos=async()=>{if(unavailable)throw new Error('Storage blocked');return [clip];};
 storage.saveVideo=()=>{saveCalls++;return new Promise((resolve,reject)=>{rejectSave=reject;});};
 URL.createObjectURL=()=> 'blob:phone';URL.revokeObjectURL=()=>{};
 const galleryRoot=createRoot(container);
 try{
 await act(async()=>galleryRoot.render(React.createElement(Gallery)));
 assert.match(container.textContent,/Local video storage is unavailable/);assert.doesNotMatch(container.textContent,/One clip. One thing/);
 unavailable=false;await click('Retry local storage');assert.doesNotMatch(container.textContent,/Local video storage is unavailable/);
 assert.equal(container.querySelector('a[download]').download,'Saque de José.MOV');
 await act(async()=>container.querySelector('video').dispatchEvent(new dom.window.Event('error')));assert.match(container.textContent,/Your saved file is unchanged/);
 await input('Observation','Watch the contact point');await click('Save notes');assert.ok(button('Saving notes…').disabled);assert.ok(field('Observation').disabled);assert.equal(saveCalls,1);
 await act(async()=>rejectSave(new Error('Quota exceeded')));assert.match(container.textContent,/Could not save notes/);assert.equal(field('Observation').value,'Watch the contact point');assert.ok(!button('Save notes').disabled);
 let saved;storage.saveVideo=async video=>{saved=video;};await click('Save notes');assert.equal(saved.notes,'Watch the contact point');assert.match(container.textContent,/Notes saved/);
 }finally{await act(async()=>galleryRoot.unmount());storage.listVideos=oldList;storage.saveVideo=oldSave;URL.createObjectURL=oldURL;URL.revokeObjectURL=oldRevoke;}
});
test.afterEach(()=>{window.history.replaceState(null,"","#racquet-lab");});
let root;
async function mount(seed=[],trials=[]){localStorage.clear();if(seed.length)localStorage.setItem('baseline_setups_v2',JSON.stringify(seed));if(trials.length)localStorage.setItem('baseline_racket_trials_v1',JSON.stringify(trials));root=createRoot(container);await act(async()=>root.render(React.createElement(Lab)));}
async function close(){await act(async()=>root.unmount());}
function button(name){const b=[...container.querySelectorAll('button')].find(b=>b.textContent.trim()===name);assert.ok(b,`button ${name}`);return b;}
function field(name){const l=[...container.querySelectorAll('label')].find(l=>l.textContent.trim().startsWith(name));assert.ok(l,`field ${name}`);return l.querySelector('input,select,textarea');}
async function click(name){await act(async()=>button(name).click());}
async function input(name,value){await act(async()=>{const el=field(name);Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set.call(el,value);el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));});}
async function action(label){const el=[...container.querySelectorAll('button')].find(el=>el.getAttribute('aria-label')===label);assert.ok(el,`action ${label}`);await act(async()=>el.click());}
const shelfIds=()=>[...container.querySelectorAll('.setup-shelf-card')].map(el=>el.dataset.setupId);
test('Pro reference browsing compares saved rackets, separates sources, and never changes the working draft',async()=>{
 const saved={...newSetup(),id:'comparison-frame',name:'Measured match racket',condition:'ready',strings:0,overgrips:0,baseWeight:330,baseBalance:32.4,baseSW:327};
 await mount([saved]);try{
 const before=localStorage.getItem('baseline_setup_draft_v2');await click('Pro specs');
 assert.ok(container.querySelector('[aria-label="Pro racket comparison"]'));await input('Your comparison racket','comparison-frame');
 assert.match(container.querySelector('[aria-label="Weight"]').textContent,/0.0 g · yours minus pro/);
 await click('Source & year');assert.match(container.textContent,/2025-11-17/);assert.equal(container.querySelector('.pro-context a').href,'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/carlos-alcaraz-racquet/26903');assert.equal(container.querySelector('.pro-metrics'),null);
 const sinner=[...container.querySelectorAll('.pro-player-grid button')].find(b=>b.textContent.includes('Jannik Sinner'));await act(async()=>sinner.click());await click('Compare specs');assert.match(container.textContent,/Different measurement conditions/);assert.equal([...container.querySelectorAll('.pro-metric p')].filter(p=>p.textContent==='Difference unavailable').length,3);
 await click('Strings & context');assert.match(container.textContent,/HEAD Hawk Touch 1.30/);
 await click('Build');assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].name,'Measured match racket');
 assert.ok(container.querySelector('#starting-racket').open);assert.ok(!container.querySelector('#customize-racket').open);assert.ok(!container.querySelector('#save-setup').open);
 await click('Customize');assert.ok(container.querySelector('#customize-racket').open);await click('Save & share');assert.ok(container.querySelector('#save-setup').open);
 }finally{await close();}
});
test('Phone editor shortcuts focus the right section and diagram toggling preserves the draft',async()=>{
 await mount();try{
 await input('Setup name','Phone practice frame');const before=localStorage.getItem('baseline_setup_draft_v2');
 const toggle=button('Show racket diagram');assert.equal(toggle.getAttribute('aria-expanded'),'false');
 await click('Show racket diagram');assert.equal(button('Hide racket diagram').getAttribute('aria-expanded'),'true');assert.ok(container.querySelector('#racket-diagram').classList.contains('phone-diagram-open'));
 await click('Specs');assert.equal(document.activeElement.id,'starting-racket');
 await click('Customize');assert.equal(document.activeElement.id,'customize-racket');
 await click('Save & share');assert.equal(document.activeElement.id,'save-setup');
 await click('Hide racket diagram');assert.ok(!container.querySelector('#racket-diagram').classList.contains('phone-diagram-open'));assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);
 }finally{await close();}
});
const {setupFingerprint}=load('lib/baseline/racquet.ts');
const trialRecord=(id,setup,patch={})=>({id,date:'2026-10-11',minutes:30,surface:'hard',stringHours:0,decision:'keep',ratings:{control:5,timing:null,stability:null,serve:null,comfort:null},notes:'A useful depth target',setup,...patch});
test('Draft bench sheets convert tape units, validate density, export notes only by opt-in and restore focus without changing specs',async()=>{
 await mount();let blob,filename;const previousURL=URL.createObjectURL,previousRevoke=URL.revokeObjectURL,previousClick=dom.window.HTMLAnchorElement.prototype.click;
 URL.createObjectURL=b=>{blob=b;return 'blob:bench';};URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){filename=this.download;};
 try{
 await input('Setup name','Density trial');await input('12 o’clock','2');await input('3 + 9','4');await input('Inside butt cap','6');await input('On-court notes','Private tactic sentinel');await click('Save setup');const before=localStorage.getItem('baseline_setup_draft_v2'),saved=localStorage.getItem('baseline_setups_v2');
 const trigger=button('Bench sheet');trigger.focus();await click('Bench sheet');assert.equal(document.activeElement.id,'bench-setup-name');const modal=container.querySelector('dialog');assert.match(modal.querySelector('[data-bench-location="lead39"]').textContent,/2.00 g per side/);assert.match(modal.textContent,/Tape length will appear/);assert.match(modal.querySelector('.bench-specs').textContent,/Unknown/);
 await input('Tape density','0.1');let sides=modal.querySelector('[data-bench-location="lead39"]');assert.match(sides.textContent,/20.00 cm/);assert.match(sides.textContent,/40.00 cm combined/);await input('Density unit','g/in');assert.ok(Math.abs(Number(field('Tape density').value)-0.254)<1e-8);assert.match(sides.textContent,/20.00 cm/);
 await input('Tape density','0');assert.equal(field('Tape density').getAttribute('aria-invalid'),'true');assert.ok(button('Download bench sheet').disabled);await input('Tape density','0.25');assert.ok(!button('Download bench sheet').disabled);await click('Download bench sheet');assert.equal(filename,'racket-bench-density-trial.txt');assert.equal(blob.type,'text/plain;charset=utf-8');assert.doesNotMatch(await blob.text(),/Private tactic sentinel/);assert.match(await blob.text(),/20.32 cm/);
 await act(async()=>field('Include private setup notes').click());await click('Download bench sheet');assert.match(await blob.text(),/Private tactic sentinel/);await click('Close sheet');assert.equal(container.querySelector('dialog'),null);assert.equal(document.activeElement,trigger);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);assert.equal(localStorage.getItem('baseline_setups_v2'),saved);
 }finally{URL.createObjectURL=previousURL;URL.revokeObjectURL=previousRevoke;dom.window.HTMLAnchorElement.prototype.click=previousClick;await close();}
});
test('Saved and comparison bench actions open the selected snapshot without loading it into the working draft',async()=>{
 const a={...newSetup(),id:'a',name:'Side record',lead39:4},b={...newSetup(),id:'b',name:'Tip reference',lead12:2,baseSW:290};await mount([a,b]);try{
 await input('Setup name','Current working draft');await input('12 o’clock','7');const before=localStorage.getItem('baseline_setup_draft_v2'),saved=localStorage.getItem('baseline_setups_v2');await click('Saved setups');await act(async()=>container.querySelector('[data-setup-id="a"] summary').click());await action('Open bench sheet for Side record');assert.equal(container.querySelector('#bench-setup-name').textContent,'Side record');assert.ok(container.querySelector('[data-bench-location="lead39"]'));assert.equal(container.querySelector('[data-bench-location="lead12"]'),null);await click('Close sheet');
 await click('Compare2');await input('Reference setup','b');await action('Open bench sheet for Tip reference');assert.equal(container.querySelector('#bench-setup-name').textContent,'Tip reference');assert.match(container.querySelector('[data-bench-location="lead12"]').textContent,/2.00/);await click('Close sheet');assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);assert.equal(localStorage.getItem('baseline_setups_v2'),saved);
 }finally{await close();}
});
test('An archived bench sheet stays readable during an invalid draft and leaves the source archived',async()=>{
 const source={...newSetup(),id:'archived',name:'Archived frame',archived:true,butt:4};await mount([source]);try{
 await input('Starting weight','');assert.ok(button('Bench sheet').disabled);await click('Saved setups');await click('Archived setups (1)');await action('Open bench sheet for Archived frame');assert.match(container.querySelector('dialog').textContent,/ARCHIVED RECORD/);assert.match(container.querySelector('[data-bench-location="butt"]').textContent,/Weigh separately/);assert.ok(field('Include private setup notes').disabled);await click('Close sheet');await click('Build');assert.equal(field('Starting weight').value,'');assert.deepEqual(JSON.parse(localStorage.getItem('baseline_setups_v2')),[source]);
 }finally{await close();}
});
test('A failed bench download provides selectable text and unit-conversion overflow remains correctable',async()=>{
 await mount();const previousURL=URL.createObjectURL;URL.createObjectURL=()=>{throw new Error('Download unavailable');};try{
 await click('Bench sheet');await input('Tape density','1e308');await input('Density unit','g/in');assert.equal(field('Density unit').value,'g/cm');assert.ok(button('Download bench sheet').disabled);assert.match(container.querySelector('dialog').textContent,/Check the tape density/);await input('Tape density','0.1');assert.ok(!button('Download bench sheet').disabled);const before=localStorage.getItem('baseline_setup_draft_v2');await click('Download bench sheet');assert.match(container.querySelector('dialog').textContent,/download could not start/);const summary=field('Text summary');assert.ok(summary.readOnly);assert.match(summary.value,/STARTING SPECIFICATIONS/);assert.match(summary.value,/326.50 g/);await act(async()=>summary.focus());assert.equal(summary.selectionStart,0);assert.equal(summary.selectionEnd,summary.value.length);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);await click('Close sheet');
 }finally{URL.createObjectURL=previousURL;await close();}
});
test('Saved cards link exact cosmetic copies to a useful single-configuration view without replacing the draft',async()=>{
 const original={...newSetup(),id:'original',name:'Old label',lead12:2,stringName:'Poly 1.25',tension:'23 kg'};
 const copy={...original,id:'copy',name:'Renamed match frame',color:'#000000',notes:'Different notes'},changed={...original,name:'Revised frame',lead12:4};
 await mount([copy,changed],[trialRecord('one',original)]);try{
 await click('Saved setups');const exact=container.querySelector('[data-setup-id="copy"] .setup-court-evidence'),revised=container.querySelector('[data-setup-id="original"] .setup-court-evidence');assert.equal(exact.dataset.evidenceState,'tested');assert.match(exact.textContent,/1 test · 30 min/);assert.equal(revised.dataset.evidenceState,'untested');assert.match(revised.textContent,/No tests for these specs/);
 const before=localStorage.getItem('baseline_setup_draft_v2');await action('Review court feedback for Renamed match frame');const comparison=container.querySelector('.court-comparison');assert.equal(document.activeElement.id,'court-feedback-heading');assert.equal(container.querySelector('.court-feedback-view').hidden,false);assert.equal(comparison.querySelectorAll('.court-summary-card').length,1);assert.match(comparison.querySelector('.court-summary-card').textContent,/Renamed match frame/);assert.equal(field('Candidate configuration').value,'');assert.match(comparison.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/5.0/);assert.match(comparison.querySelector('.feedback-metric[aria-label="Comfort"]').textContent,/Not assessed/);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);
 const selected=field('Reference configuration').value;await input('Compare tests on','clay');assert.equal(field('Reference configuration').value,selected);assert.match(comparison.textContent,/no tests on the selected surface/);assert.match(comparison.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/Not assessed/);
 await input('Compare tests on','');assert.match(comparison.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/5.0/);await click('Court test');assert.equal(container.querySelector('.court-record-view').hidden,false);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);
 }finally{await close();}
});
test('Specification-to-feedback navigation retains the requested untested draft rather than an older version with the same ID',async()=>{
 const old={...newSetup(),id:'draft',name:'Old trial',lead12:0},draft={...old,name:'Current candidate',lead12:4},reference={...old,id:'reference',name:'Reference frame',lead12:2};
 await mount([draft,reference],[trialRecord('old',old,{ratings:{control:1,timing:null,stability:null,serve:null,comfort:null}}),trialRecord('ref',reference)]);try{
 await input('Load saved setup','draft');await click('Compare2');await input('Reference setup','reference');assert.match(container.querySelector('.draft-card .setup-court-evidence').textContent,/No tests for these specs/);const before=localStorage.getItem('baseline_setup_draft_v2');await click('Compare recorded feedback');
 const comparison=container.querySelector('.court-comparison');assert.equal(field('Reference configuration').value,setupFingerprint(reference));assert.equal(field('Candidate configuration').value,setupFingerprint(draft));assert.equal(comparison.querySelectorAll('.court-summary-card').length,2);const candidate=[...comparison.querySelectorAll('.court-summary-card')].find(el=>el.dataset.configurationKey===setupFingerprint(draft));assert.match(candidate.textContent,/No active court tests for these exact inputs/);assert.equal(candidate.querySelector('.court-summary-count > strong').textContent,'0');assert.match(comparison.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/Both need ratings/);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);
 await input('Candidate configuration',setupFingerprint(old));assert.match(comparison.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/Candidate -4.0 points/);await input('Candidate configuration','');assert.equal(comparison.querySelectorAll('.court-summary-card').length,1);
 }finally{await close();}
});
test('Identical focused configurations collapse into one sample rather than selecting unrelated feedback',async()=>{
 const a={...newSetup(),id:'a',name:'Original setup'},b={...a,id:'b',name:'Renamed setup'},other={...a,id:'other',name:'Different mass',lead12:2};
 await mount([a,b],[trialRecord('same',a),trialRecord('other-test',other)]);try{
 await input('Load saved setup','a');await click('Compare2');await input('Reference setup','b');await click('Compare recorded feedback');const comparison=container.querySelector('.court-comparison');assert.equal(comparison.querySelectorAll('.court-summary-card').length,1);assert.match(comparison.textContent,/identical recorded inputs/);assert.equal(comparison.querySelector('.court-summary-count > strong').textContent,'1');assert.equal(field('Candidate configuration').value,'');
 await input('Candidate configuration',setupFingerprint(other));assert.equal(comparison.querySelectorAll('.court-summary-card').length,2);assert.doesNotMatch(comparison.textContent,/Their tests form one configuration/);
 }finally{await close();}
});
test('Unreadable court history is shown as unavailable and preserved instead of claiming a setup has no tests',async()=>{
 const setup={...newSetup(),id:'s',name:'Stored frame'};await mount([setup],[trialRecord('one',setup)]);try{
 await act(async()=>{localStorage.setItem('baseline_racket_trials_v1','broken history');window.dispatchEvent(new CustomEvent('baseline-data',{detail:'baseline_racket_trials_v1'}));});await click('Saved setups');const card=container.querySelector('.setup-court-evidence');assert.equal(card.dataset.evidenceState,'unavailable');assert.match(card.textContent,/History unavailable/);assert.doesNotMatch(card.textContent,/No tests/);assert.ok(![...container.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')==='Review court feedback for Stored frame'));assert.equal(localStorage.getItem('baseline_racket_trials_v1'),'broken history');
 }finally{await close();}
});
test('Saved feedback remains readable during an invalid draft, with new test recording blocked',async()=>{
 const setup={...newSetup(),id:'s',name:'Tested frame'};await mount([setup],[trialRecord('one',setup)]);try{
 await input('Starting weight','');await click('Saved setups');await action('Review court feedback for Tested frame');assert.equal(container.querySelectorAll('.court-summary-card').length,1);assert.match(container.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/5.0/);await click('Record & history');assert.ok(button('Save court test').disabled);assert.match(container.querySelector('#court-feedback-editor').textContent,/Correct the draft specifications/);assert.doesNotMatch(container.querySelector('.test-snapshot').textContent,/NaN/);await click('Build');assert.equal(field('Starting weight').value,'');
 }finally{await close();}
});
test('Archiving and restoring court tests refreshes evidence cards without altering saved specifications',async()=>{
 const setup={...newSetup(),id:'s',name:'Tracked setup'};await mount([setup],[trialRecord('one',setup)]);const savedBefore=localStorage.getItem('baseline_setups_v2');try{
 await click('Saved setups');await action('Review court feedback for Tracked setup');await click('Record & history');await click('Archive');await click('Saved setups');assert.equal(container.querySelector('.setup-court-evidence').dataset.evidenceState,'untested');
 await click('Court test');await click('Archived');await click('Restore');await click('Saved setups');assert.equal(container.querySelector('.setup-court-evidence').dataset.evidenceState,'tested');assert.match(container.querySelector('.setup-court-evidence').textContent,/1 test · 30 min/);assert.equal(localStorage.getItem('baseline_setups_v2'),savedBefore);
 }finally{await close();}
});
test('Known reference specs seed all three targets; applying, undoing and saving a copy preserve both sources',async()=>{
 const base={...newSetup(),id:'base',name:'Measured baseline',condition:'ready',strings:0,overgrips:0,baseWeight:300,baseSW:290,length:68.6};
 const reference={...base,id:'reference',name:'Three-spec reference',lead12:2,lead39:4,butt:6},desired=calculateSetup(reference);
 await mount([base,reference]);try{
 await input('Load saved setup','base');await click('Compare2');await input('Reference setup','reference');await click('Build toward reference');await click('Weight, balance + SW');
 assert.equal(field('Target swingweight').value,String(desired.swingweight));assert.ok(container.querySelector('.target-feasible-range'));assert.equal(container.querySelectorAll('.target-results > div').length,3);assert.match(container.querySelector('.target-results').textContent,/2.00 g per side/);
 await click('Apply to draft');for(const [label,value] of [['12 o’clock',2],['3 + 9',4],['Inside butt cap',6]])assert.ok(Math.abs(Number(field(label).value)-value)<1e-8);
 assert.ok(button('Target reached').disabled);const applied=calculateSetup(JSON.parse(localStorage.getItem('baseline_setup_draft_v2')));assert.ok(Math.abs(applied.swingweight-desired.swingweight)<1e-8);assert.ok(Math.abs(applied.balance-desired.balance)<1e-8);
 await click('Undo change');assert.equal(field('12 o’clock').value,'0');assert.equal(field('3 + 9').value,'0');await click('Apply to draft');await click('Make a copy');await click('Save setup');
 const records=JSON.parse(localStorage.getItem('baseline_setups_v2'));assert.equal(records.length,3);assert.deepEqual(records.find(s=>s.id==='base'),base);assert.deepEqual(records.find(s=>s.id==='reference'),reference);assert.ok(Math.abs(records.find(s=>s.id!=='base' && s.id!=='reference').lead39-4)<1e-8);
 }finally{await close();}
});
test('Three-spec UI guides unknown SW, shows impossible-target bounds and cannot apply incomplete targets',async()=>{
 await mount();try{
 const current=calculateSetup(newSetup());await click('Weight, balance + SW');await input('Target weight',String(current.weight+10));await input('Target balance','32');await input('Target swingweight','330');
 assert.match(container.querySelector('.target-planner').textContent,/Enter Starting SW in Build/);assert.equal(container.querySelector('.target-feasible-range'),null);assert.ok(![...container.querySelectorAll('button')].some(b=>b.textContent==='Apply to draft'));
 await input('Starting SW','290');await input('Target swingweight','999');assert.match(container.querySelector('.target-planner').textContent,/outside the achievable range/);assert.ok(container.querySelector('.target-feasible-range'));assert.ok(![...container.querySelectorAll('button')].some(b=>b.textContent==='Apply to draft'));
 await input('Target swingweight','');assert.match(container.querySelector('.target-planner').textContent,/Enter a target swingweight/);assert.equal(field('Target swingweight').value,'');await input('Target balance','');assert.equal(container.querySelector('.target-feasible-range'),null);
 await input('Target balance','32');await input('Starting SW','');await click('Weight + balance');assert.ok(!button('Apply to draft').disabled);assert.match(container.querySelector('.target-projection').textContent,/Total SW unknown/);assert.equal(JSON.parse(localStorage.getItem('baseline_setup_draft_v2')).lead12,0);
 }finally{await close();}
});
test('Practice logging rejects future dates and invalid minutes before saving and retains a failed save for correction',async()=>{
 localStorage.clear();const Training=load('components/TrainingHub.tsx').default;const {today}=load('lib/baseline/data.ts');let saved=[],canSave=false;
 root=createRoot(container);await act(async()=>root.render(React.createElement(Training,{sessions:[],initialDrill:'serve',saveSessions:change=>{if(!canSave)return false;saved=typeof change==='function' ? change(saved) : change;return true;}})));
 async function submit(){await act(async()=>container.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));}
 try{
 await click('Log this practice');await input('Date','2099-01-01');await submit();assert.equal(saved.length,0);assert.match(container.querySelector('form').textContent,/past or current date/);
 await input('Date',today());await input('Minutes practiced','0');await submit();assert.equal(saved.length,0);assert.match(container.querySelector('form').textContent,/1–300 minutes/);
 await input('Minutes practiced','30');await input('Result & next-session note','Keep the target deep');await submit();assert.equal(saved.length,0);assert.match(container.querySelector('form').textContent,/Practice could not be saved/);assert.equal(field('Result & next-session note').value,'Keep the target deep');
 canSave=true;await submit();assert.equal(saved.length,1);assert.equal(saved[0].date,today());assert.equal(saved[0].minutes,30);assert.equal(saved[0].notes,'Keep the target deep');assert.equal(container.querySelector('form'),null);
 }finally{await close();}
});
test('Saved setups search strings, filter conditions, sort final specs and clear empty results',async()=>{
 const a={...newSetup(),id:'a',name:'Match Blade',stringName:'Tour Bite 1.25',tension:'23 kg',baseSW:290};
 const b={...newSetup(),id:'b',name:'Bare frame',strings:0,overgrips:0,baseWeight:310};
 const c={...newSetup(),id:'c',name:'Heavy trial',baseSW:280,lead12:20,notes:'Volley experiment'};
 await mount([a,b,c]);try{
 await click('Saved setups');assert.deepEqual(shelfIds(),['c','b','a']);
 await input('Search racket setups','tour bite');assert.deepEqual(shelfIds(),['a']);
 await input('Search racket setups','missing');assert.match(container.textContent,/No setups match these filters/);await click('Clear setup filters');assert.equal(shelfIds().length,3);
 await input('Final condition','unstrung');assert.deepEqual(shelfIds(),['b']);await input('Final condition','');
 await input('Sort setups by','weight');assert.deepEqual(shelfIds(),['b','a','c']);
 await input('Sort setups by','swingweight');assert.deepEqual(shelfIds(),['a','c','b']);await input('Sort order','desc');assert.deepEqual(shelfIds(),['c','a','b']);
 assert.match(container.querySelector('[data-setup-id="b"]').textContent,/Unknown/);
 }finally{await close();}
});
test('Loading an older imported setup recognizes it as saved, while copying creates a separate record',async()=>{
 const source=Object.fromEntries(Object.entries({...newSetup(),id:'legacy',name:'Legacy ordered',lead12:2}).reverse());
 await mount([source]);try{
 await click('Saved setups');await action('Load setup Legacy ordered');
 assert.equal(field('12 o’clock').value,'2');assert.match(container.querySelector('.draft-state').textContent,/^Saved setup/);assert.doesNotMatch(container.querySelector('.draft-state').textContent,/pending/);
 await click('Saved setups');await act(async()=>container.querySelector('.shelf-more-actions summary').click());await action('Copy setup Legacy ordered');
 assert.equal(field('Setup name').value,'Legacy ordered copy');assert.equal(JSON.parse(localStorage.getItem('baseline_setup_draft_v2')).id,'');
 await input('12 o’clock','4');await click('Save setup');const records=JSON.parse(localStorage.getItem('baseline_setups_v2'));
 assert.equal(records.length,2);assert.equal(records.find(s=>s.id==='legacy').lead12,2);assert.equal(records.find(s=>s.id!=='legacy').lead12,4);assert.notEqual(records[1].id,'legacy');
 }finally{await close();}
});
test('Comparing from a saved card selects that reference without replacing the draft',async()=>{
 const first={...newSetup(),id:'one',name:'First ref',lead12:1};const chosen={...newSetup(),id:'two',name:'Chosen ref',lead39:4};
 await mount([first,chosen]);try{
 await input('Setup name','Current experiment');await input('12 o’clock','3');const draft=localStorage.getItem('baseline_setup_draft_v2');
 await click('Saved setups');await action('Compare setup Chosen ref with draft');assert.equal(field('Reference setup').value,'two');assert.match(container.querySelector('.draft-card').textContent,/Current experiment/);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),draft);
 await input('Reference setup','one');await click('Saved setups');await click('Compare2');assert.equal(field('Reference setup').value,'one');
 }finally{await close();}
});
test('Shelf match-day archive and restore keep snapshots and concurrent saved records intact',async()=>{
 const source={...newSetup(),id:'source',name:'Court frame',lead12:2};
 await mount([source]);const trial={id:'test',date:'2026-10-11',minutes:30,surface:'hard',stringHours:0,decision:'keep',ratings:{control:4,timing:null,stability:null,serve:null,comfort:null},notes:'',setup:source};
 localStorage.setItem('baseline_racket_trials_v1',JSON.stringify([trial]));localStorage.setItem('baseline_matches',JSON.stringify([{id:'match',opponent:'Partner',score:'6-4',date:'2026-10-11',surface:'hard',style:'Unknown',firstServe:null,unforcedErrors:null,result:'win',setupSnapshot:source}]));
 const trialBefore=localStorage.getItem('baseline_racket_trials_v1'),matchesBefore=localStorage.getItem('baseline_matches');
 try{
 await click('Saved setups');await act(async()=>container.querySelector('.shelf-more-actions summary').click());await click('Use for match day');assert.equal(JSON.parse(localStorage.getItem('baseline_match_day_v1')),'source');assert.ok(container.querySelector('.matchday-shelf-card'));
 localStorage.setItem('baseline_setups_v2',JSON.stringify([source,{...newSetup(),id:'concurrent',name:'Other tab'}]));await action('Archive setup Court frame');assert.deepEqual(shelfIds(),['concurrent']);assert.equal(container.querySelector('.matchday-strip'),null);
 await click('Archived setups (1)');await action('Restore setup Court frame');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2')).length,2);await click('Active setups (2)');assert.ok(container.querySelector('.matchday-shelf-card'));
 assert.equal(localStorage.getItem('baseline_racket_trials_v1'),trialBefore);assert.equal(localStorage.getItem('baseline_matches'),matchesBefore);
 }finally{await close();}
});
test('Archived setups can be copied without restoring or overwriting their source',async()=>{
 const source={...newSetup(),id:'archived',archived:true,name:'Archived trial',butt:4};
 await mount([source]);try{
 await click('Saved setups');await click('Archived setups (1)');await action('Copy archived setup Archived trial');assert.equal(field('Inside butt cap').value,'4');
 const draft=JSON.parse(localStorage.getItem('baseline_setup_draft_v2'));assert.equal(draft.id,'');assert.equal(draft.archived,false);await click('Save setup');const records=JSON.parse(localStorage.getItem('baseline_setups_v2'));assert.equal(records.length,2);assert.deepEqual(records.find(s=>s.id==='archived'),source);assert.equal(records.find(s=>s.id!=='archived').archived,false);
 }finally{await close();}
});
test('An invalid draft can still browse saved setups and start a valid new frame',async()=>{
 await mount();try{
 await input('Starting weight','');await click('Saved setups');assert.match(container.textContent,/Your first setup starts in the Lab/);assert.equal(container.querySelector('[aria-label="Save current racket setup"]'),null);assert.ok(!button('Edit current draft').disabled);
 await click('New setup');assert.equal(field('Starting weight').value,'305');assert.ok(!container.querySelector('[aria-label="Save current racket setup"]').disabled);assert.equal(JSON.parse(localStorage.getItem('baseline_setup_draft_v2')).id,'');
 }finally{await close();}
});
test('Saved data finds string notes and opens the exact stored setup in Racket Lab',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#saved-data');const Workspace=load('app/dashboard/page.tsx').default;
 const setup=Object.fromEntries(Object.entries({...newSetup(),id:'saved',name:'Saved Blade',stringName:'Private poly',tension:'23 kg',notes:'Sharper volleys',lead39:4}).reverse());
 localStorage.setItem('baseline_setups_v2',JSON.stringify([setup]));root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 await click('Racket setups');await input('Search saved records','sharper volleys');assert.equal(container.querySelectorAll('.saved-records li').length,1);await action('Open setup Saved Blade in Racket Lab');
 assert.equal(field('3 + 9').value,'4');assert.equal(field('Setup name').value,'Saved Blade');assert.match(container.querySelector('.draft-state').textContent,/Saved setup/);assert.deepEqual(JSON.parse(localStorage.getItem('baseline_setups_v2')),[setup]);
 }finally{await close();window.history.replaceState(null,'','#racquet-lab');}
});
test('Save, copy, compare three setups, load, model reset, invalid input and undo',async()=>{
 await mount();try {
 await input('Setup name','Reference');await input('Starting SW','290');await click('Save setup');
 assert.match(container.querySelector('.draft-state').textContent,/Saved setup/);
 await click('Make a copy');await input('Setup name','Tip trial');await input('12 o’clock','2');await click('Save setup');
 await click('Make a copy');await input('Setup name','Side trial');await input('3 + 9','4');await click('Save setup');
 const stored=JSON.parse(localStorage.getItem('baseline_setups_v2'));assert.equal(stored.length,3);assert.equal(stored[0].lead12,0);
 await click('Compare3');await input('Reference setup',stored[0].id);await input('Third setup',stored[1].id);
 assert.equal(container.querySelectorAll('.comparison-card').length,3);assert.match(container.textContent,/Specification matrix/);
 await click('Build');await input('Frame model','Yonex EZONE 98');assert.equal(field('12 o’clock').value,'0');assert.equal(field('3 + 9').value,'0');
 await click('Undo change');assert.equal(field('3 + 9').value,'4');
 await input('Starting weight','');assert.ok(button('Update setup').disabled);
 assert.equal(field('Starting weight').getAttribute('aria-invalid'),'true');
 await click('Undo change');assert.equal(field('Starting weight').value,'305');
 }finally{await close();}
});
test('Reference target is seeded, side plan applies once, and saved reference remains intact',async()=>{
 const base={...newSetup(),id:'reference',name:'Reference target',baseSW:290,lead39:6,butt:4};
 await mount([base]);try {
 await click('Compare1');await click('Build toward reference');
 assert.equal(Number(field('Target weight').value),calculateSetup(base).weight);
 await click('3 + 9 o’clock');await click('Apply to draft');
 const draft=JSON.parse(localStorage.getItem('baseline_setup_draft_v2'));assert.ok(Math.abs(calculateSetup(draft).balance-calculateSetup(base).balance)<1e-8);
 assert.equal(button('Target reached').disabled,true);
 assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].lead39,6);
 }finally{await close();}
});
test('Court tests preserve exact snapshots through draft edits, feedback edits, archive and restore',async()=>{
 await mount();try {
 await input('Setup name','Match test');await input('12 o’clock','2');await click('Court test');await input('Depth & control','4');await input('What changed?','Better depth; test again.');
 await act(async()=>container.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 let t=JSON.parse(localStorage.getItem('baseline_racket_trials_v1'))[0];assert.equal(t.setup.lead12,2);assert.equal(t.ratings.control,4);
 await click('Build');await input('12 o’clock','6');await click('Court test');await click('Edit feedback');await input('Depth & control','5');
 await act(async()=>container.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));
 t=JSON.parse(localStorage.getItem('baseline_racket_trials_v1'))[0];assert.equal(t.setup.lead12,2);assert.equal(t.ratings.control,5);
 await click('Archive');await click('Archived');assert.ok(container.querySelector('.trial-card'));await click('Restore');await click('Active');assert.ok(container.querySelector('.trial-card'));
 await click('Load tested specs');assert.equal(field('12 o’clock').value,'2');assert.match(field('Setup name').value,/retest/);
 }finally{await close();}
});
test('Corrupt saved data and draft are preserved and reported instead of overwritten',async()=>{
 await mount();await close();localStorage.setItem('baseline_setups_v2','broken');localStorage.setItem('baseline_setup_draft_v2','broken');root=createRoot(container);await act(async()=>root.render(React.createElement(Lab)));
 try{assert.equal(localStorage.getItem('baseline_setup_draft_v2'),'broken');assert.equal(localStorage.getItem('baseline_setups_v2'),'broken');assert.match(container.textContent,/could not be opened/);assert.ok(button('Save setup').disabled);}finally{await close();}
});
test('An unstrung draft can be compared but cannot be recorded as an on-court test',async()=>{
 await mount();try {await input('Additional string mass','0');await click('Court test');assert.ok(button('Save court test').disabled);assert.match(container.textContent,/draft is unstrung/);}finally{await close();}
});
test('Frame location controls focus the correct editable mass and retain live specification updates',async()=>{
 await mount();try {
 const location=container.querySelector('button[aria-label="Adjust side weight"]');
 await act(async()=>location.click());assert.equal(document.activeElement.id,'baseline-mass-lead39');assert.equal(location.getAttribute('aria-pressed'),'true');
 await input('3 + 9','4');assert.match(container.querySelector('.frame-caption').textContent,/4.0 g/);assert.match(container.querySelector('.lab-live-summary').textContent,/330.5/);
 await act(async()=>container.querySelector('button[aria-label="Adjust butt cap weight"]').click());assert.equal(document.activeElement.id,'baseline-mass-butt');
 await input('Inside butt cap','3');await action('Save current racket setup');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].butt,3);
 }finally{await close();}
});
test('Match-day choice is saved only from a saved strung setup and survives draft edits',async()=>{
 await mount();try {
 assert.ok(button('Use for match day').disabled);await input('Setup name','Match-day Blade');await click('Save setup');await click('Use for match day');
 const choice=JSON.parse(localStorage.getItem('baseline_match_day_v1'));assert.ok(choice);assert.match(container.querySelector('.matchday-strip').textContent,/Match-day Blade/);
 await input('12 o’clock','4');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].lead12,0);assert.equal(JSON.parse(localStorage.getItem('baseline_match_day_v1')),choice);
 await click('Clear choice');assert.equal(JSON.parse(localStorage.getItem('baseline_match_day_v1')),'');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2')).length,1);
 }finally{await close();}
});
test('Feedback comparison keeps selection across surface filters, excludes unknown ratings and refreshes after archive/restore',async()=>{
 await mount();const a={id:'a',date:'2026-10-10',minutes:30,surface:'hard',stringHours:0,decision:'retest',ratings:{control:2,timing:null,stability:null,serve:null,comfort:null},notes:'Reference',setup:{...newSetup(),name:'Reference tested'}};
 const b={...a,id:'b',date:'2026-10-11',surface:'clay',ratings:{...a.ratings,control:4},setup:{...newSetup(),name:'Candidate tested',lead12:2}};
 localStorage.setItem('baseline_racket_trials_v1',JSON.stringify([a,b]));
 try{await click('Court test');await input('What changed?','Unfinished feedback');await click('Compare feedback');
 const comparison=container.querySelector('.court-comparison');assert.equal(comparison.querySelectorAll('.court-summary-card').length,2);assert.match(comparison.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/Candidate \+2.0 points/);assert.match(comparison.querySelector('.feedback-metric[aria-label="Comfort"]').textContent,/Not assessed/);
 const ref=field('Reference configuration').value,candidate=field('Candidate configuration').value;await input('Compare tests on','clay');assert.equal(field('Reference configuration').value,ref);assert.equal(field('Candidate configuration').value,candidate);assert.match(comparison.textContent,/Both configurations need at least one test/);
 await input('Compare tests on','');await click('Record & history');assert.equal(field('What changed?').value,'Unfinished feedback');await click('Archive');await click('Compare feedback');assert.match(comparison.textContent,/Test another configuration/);
 await click('Record & history');await click('Archived');await click('Restore');await click('Active');await click('Compare feedback');assert.equal(comparison.querySelectorAll('.court-summary-card').length,2);
 await click('Load candidate specs');assert.equal(field('12 o’clock').value,'2');assert.equal(field('Setup name').value,'Candidate tested retest');
 }finally{await close();}
});
test('Editing court feedback focuses the editor and updates comparison means without changing the captured specs',async()=>{
 await mount();const trial={id:'one',date:'2026-10-11',minutes:30,surface:'hard',stringHours:null,decision:'retest',ratings:{control:2,timing:null,stability:null,serve:null,comfort:null},notes:'Original',setup:newSetup()};
 localStorage.setItem('baseline_racket_trials_v1',JSON.stringify([trial,{...trial,id:'two',ratings:{...trial.ratings,control:4},setup:{...newSetup(),lead12:2}}]));
 try{await click('Court test');await click('Edit feedback');assert.equal(document.activeElement.id,'court-feedback-editor');await input('Depth & control','5');await act(async()=>container.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));await click('Compare feedback');const metric=container.querySelector('.feedback-metric[aria-label="Depth & control"]');assert.match(metric.textContent,/5.0/);assert.match(metric.textContent,/Candidate -1.0 points/);const saved=JSON.parse(localStorage.getItem('baseline_racket_trials_v1')).find(t=>t.id==='one');assert.equal(saved.setup.lead12,0);assert.equal(saved.ratings.control,5);}finally{await close();}
});
test('Match form preselects match-day specs, preserves recorded snapshots on edit, and supports manual legacy records',async()=>{
 localStorage.clear();const setup={...newSetup(),id:'saved',name:'Match setup',lead12:2,stringName:'Poly 1.25',tension:'23 kg'};
 const Form=load('components/MatchHub.tsx').MatchForm;let saved;
 async function form(initial,choices=[setup]){root=createRoot(container);await act(async()=>root.render(React.createElement(Form,{initial,setups:choices,preferredSetupId:'saved',onSave:m=>saved=m,onClose:()=>{}})));}
 async function submit(){await act(async()=>container.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));}
 await form();try {
 assert.equal(field('Saved racket setup').value,'saved:saved');await input('Opponent','Partner');await input('Score','6-4');await submit();assert.equal(saved.setupSnapshot.lead12,2);assert.equal(saved.firstServe,null);assert.match(saved.setup,/Poly 1.25/);
 }finally{await close();}
 const initial={...saved};saved=undefined;await form(initial,[{...setup,name:'Renamed',lead12:8,archived:true}]);try {
 assert.equal(field('Saved racket setup').value,'recorded');await input('Match notes','Added a reflection');await submit();assert.equal(saved.setupSnapshot.lead12,2);assert.equal(saved.setupSnapshot.name,'Match setup');
 await input('Saved racket setup','');await input('Racket / string setup','Manual frame');await submit();assert.equal(saved.setupSnapshot,undefined);assert.equal(saved.setup,'Manual frame');
 }finally{await close();}
 await form({...initial,setupSnapshot:undefined,setup:'Original manual notes'});try {assert.equal(field('Saved racket setup').value,'');assert.equal(field('Racket / string setup').value,'Original manual notes');}finally{await close();}
});
test('Recorded equipment filter shows the correct match and can review a historical snapshot',async()=>{
 localStorage.clear();const Hub=load('components/MatchHub.tsx').default;let reviewed;
 const m={id:'one',opponent:'First opponent',score:'6-4',date:'2026-10-11',surface:'hard',style:'Unknown',firstServe:null,unforcedErrors:null,result:'win',setupSnapshot:{...newSetup(),id:'one-setup',name:'Original Blade',lead12:2}};
 const second={...m,id:'two',opponent:'Second opponent',date:'2026-10-10',setupSnapshot:{...newSetup(),id:'two-setup',name:'Side trial',lead39:4}};
 root=createRoot(container);await act(async()=>root.render(React.createElement(Hub,{matches:[m,second],initialSelectedId:'two',onLog:()=>{},onEdit:()=>{},onPractice:()=>{},onReviewSetup:s=>reviewed=s})));
 try{assert.match(container.querySelector('.match-review').textContent,/Second opponent/);await act(async()=>{const el=container.querySelector('#match-equipment-filter');el.value='one-setup';el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});assert.equal(container.querySelectorAll('.match-row').length,1);await click('Review in Racket Lab');assert.equal(reviewed.lead12,2);}finally{await close();}
});
test('A saved match can be loaded as a fresh Lab draft without replacing saved setup records',async()=>{
 localStorage.clear();const historical={...newSetup(),id:'old',name:'Original specs review',lead12:2};localStorage.setItem('baseline_setups_v2',JSON.stringify([{...historical,lead12:8}]));
 root=createRoot(container);await act(async()=>root.render(React.createElement(Lab,{initialSetup:{...historical,id:'',archived:false}})));
 try{assert.equal(field('12 o’clock').value,'2');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].lead12,8);assert.equal(JSON.parse(localStorage.getItem('baseline_setup_draft_v2')).id,'');}finally{await close();}
});
test('Overview opens the clicked match and historical review opens a fresh draft in the full workspace',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#overview');const Workspace=load('app/dashboard/page.tsx').default;
 const older={id:'older',opponent:'Earlier opponent',score:'6-4',date:'2026-10-09',surface:'hard',style:'Unknown',firstServe:null,unforcedErrors:null,result:'win',setupSnapshot:{...newSetup(),id:'s',name:'Old match specs',lead12:2}};
 const latest={...older,id:'latest',opponent:'Latest opponent',date:'2026-10-11',setupSnapshot:{...older.setupSnapshot,lead12:7}};
 localStorage.setItem('baseline_matches',JSON.stringify([latest,older]));localStorage.setItem('baseline_setups_v2',JSON.stringify([{...older.setupSnapshot,lead12:9}]));localStorage.setItem('baseline_match_day_v1',JSON.stringify('s'));
 root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 assert.match(container.querySelector('.setup-overview').textContent,/YOUR MATCH-DAY SETUP/);
 await act(async()=>[...container.querySelectorAll('.recent-matches .match-row, .match-row')].find(b=>b.textContent.includes('Earlier opponent')).click());
 assert.match(container.querySelector('.match-review').textContent,/Earlier opponent/);await click('Review in Racket Lab');assert.equal(field('12 o’clock').value,'2');assert.equal(field('Setup name').value,'Old match specs review');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].lead12,9);
 await click('Overview');await click('Racket Lab');assert.equal(field('12 o’clock').value,'2');
 }finally{await close();window.history.replaceState(null,'','#racquet-lab');}
});
test('Match dialog focuses opponent and restores the trigger after cancel',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#matches');const Workspace=load('app/dashboard/page.tsx').default;
 root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{const trigger=button('Log match');trigger.focus();await click('Log match');assert.equal(document.activeElement.name,'opponent');await click('Cancel');assert.equal(document.activeElement,trigger);}finally{await close();window.history.replaceState(null,'','#racquet-lab');}
});
test('Workspace backups export court snapshots and import both legacy v2 and v3 without replacing existing IDs',async()=>{
 localStorage.clear();
 const setup={...newSetup(),id:'s',name:'Saved frame'};
 const trial={id:'t',date:'2026-10-11',minutes:30,surface:'hard',stringHours:null,decision:'keep',ratings:{control:4,timing:null,stability:null,serve:null,comfort:5},notes:'Keep it',setup:{...setup,lead12:2}};
 localStorage.setItem('baseline_setups_v2',JSON.stringify([setup]));localStorage.setItem('baseline_racket_trials_v1',JSON.stringify([trial]));localStorage.setItem('baseline_match_day_v1',JSON.stringify('s'));
 const Workspace=load('app/dashboard/page.tsx').default;
 root=createRoot(container);let blob;
 const previousURL=URL.createObjectURL, previousRevoke=URL.revokeObjectURL, previousClick=dom.window.HTMLAnchorElement.prototype.click;
 URL.createObjectURL=b=>{blob=b;return 'blob:backup';};URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){};
 try {
 await act(async()=>root.render(React.createElement(Workspace)));
 await click('Export backup');const data=JSON.parse(await blob.text());assert.equal(data.version,3);assert.equal(data.racketTrials[0].setup.lead12,2);assert.equal(data.matchDaySetupId,'s');
 async function importData(data){const el=container.querySelector('input[aria-label="Import Baseline backup"]');Object.defineProperty(el,'files',{configurable:true,value:[{size:100,text:async()=>JSON.stringify(data)}]});await act(async()=>el.dispatchEvent(new dom.window.Event('change',{bubbles:true})));if(container.querySelector('dialog[aria-label="Review your backup"]'))await click('Import records');}
 await importData({version:2,matches:[],practice:[],setups:[{...setup,lead12:9},{...setup,id:'legacy'}]});assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].lead12,0);assert.equal(JSON.parse(localStorage.getItem('baseline_racket_trials_v1')).length,1);assert.equal(JSON.parse(localStorage.getItem('baseline_match_day_v1')),'s');
 await importData({version:3,matches:[],practice:[],setups:[],racketTrials:[{...trial,id:'new-test'}]});assert.equal(JSON.parse(localStorage.getItem('baseline_racket_trials_v1')).length,2);assert.match(container.textContent,/Backup imported/);
 await importData({version:3,matches:[],practice:[],setups:[],racketTrials:[{...trial,id:'bad',ratings:{...trial.ratings,comfort:99}}]});assert.equal(JSON.parse(localStorage.getItem('baseline_racket_trials_v1')).length,2);assert.match(container.textContent,/could not be imported/);
 } finally{URL.createObjectURL=previousURL;URL.revokeObjectURL=previousRevoke;dom.window.HTMLAnchorElement.prototype.click=previousClick;await close();}
});

test('Court conditions refresh counts and ratings, retain the selected pair, and reset without changing records',async()=>{
 const {today,shiftDate}=load('lib/baseline/data.ts'),date=today();
 const a={...newSetup(),id:'filter-a',name:'Fresh reference'},b={...a,id:'filter-b',name:'Candidate',lead12:2};
 const trials=[trialRecord('fresh-a',a,{date,stringHours:0}),trialRecord('aged-a',a,{date,stringHours:16,ratings:{control:1,timing:null,stability:null,serve:null,comfort:null}}),trialRecord('older-b',b,{date:shiftDate(date,-28),stringHours:3}),trialRecord('unknown-b',b,{date,stringHours:null})];
 await mount([a,b],trials);try{
 await input('Load saved setup','a');await click('Court test');await click('Compare feedback');await input('Reference configuration',setupFingerprint(a));await input('Candidate configuration',setupFingerprint(b));
 const before=localStorage.getItem('baseline_setup_draft_v2'),records=localStorage.getItem('baseline_racket_trials_v1');
 const status=()=>container.querySelector('.court-sample-status').textContent;
 assert.match(status(),/4 of 4/);await input('Test period','28');assert.match(status(),/3 of 4/);await input('String age at test','fresh');assert.match(status(),/1 of 4/);
 assert.equal(field('Candidate configuration').value,setupFingerprint(b));assert.match(container.querySelector('.feedback-metric[aria-label="Depth & control"]').textContent,/Both need ratings/);
 assert.match(container.querySelector('.court-comparison').textContent,/selected conditions/);await input('String age at test','unknown');assert.match(status(),/1 of 4/);
 await click('Reset conditions');assert.equal(field('Test period').value,'all');assert.equal(field('String age at test').value,'all');assert.match(status(),/4 of 4/);assert.equal(field('Candidate configuration').value,setupFingerprint(b));assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);assert.equal(localStorage.getItem('baseline_racket_trials_v1'),records);
 }finally{await close();}
});

test('Session builder persists order and duration, avoids duplicate starters, and logs only actual submitted practice',async()=>{
 localStorage.clear();const Training=load('components/TrainingHub.tsx').default;let saved=[];
 root=createRoot(container);await act(async()=>root.render(React.createElement(Training,{sessions:[],saveSessions:update=>{saved=typeof update==='function'?update(saved):update;return true;}})));
 try {
 await act(async()=>container.querySelector('.session-presets button').click());await act(async()=>container.querySelector('.session-presets button').click());
 let plan=JSON.parse(localStorage.getItem('baseline_session_plan_v1'));assert.deepEqual(plan.map(b=>b.drillId),['movement','serve']);assert.equal(saved.length,0);
 await input('Minutes for Serve with a destination','30');await action('Move Serve with a destination earlier');plan=JSON.parse(localStorage.getItem('baseline_session_plan_v1'));assert.deepEqual(plan,[{drillId:'serve',minutes:30},{drillId:'movement',minutes:10}]);
 await click('Open court mode');assert.match(container.querySelector('dialog').textContent,/BLOCK 1 \/ 2/);assert.match(container.querySelector('dialog').textContent,/Serve with a destination/);await click('Next block');assert.match(container.querySelector('dialog').textContent,/Split, move, recover/);await click('Finish session view');assert.match(container.querySelector('dialog').textContent,/actually practiced/);assert.equal(saved.length,0);await action('Close dialog');
 await click('Open court mode');await click('Log this block');assert.equal(field('Minutes practiced').value,'30');await input('Minutes practiced','20');await input('Result & next-session note','Wide serve placement improved');await act(async()=>container.querySelector('dialog form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true})));assert.equal(saved.length,1);assert.equal(saved[0].drillId,'serve');assert.equal(saved[0].minutes,20);assert.equal(JSON.parse(localStorage.getItem('baseline_session_plan_v1'))[0].minutes,30);
 await action('Remove Split, move, recover from plan');assert.equal(JSON.parse(localStorage.getItem('baseline_session_plan_v1')).length,1);
 await act(async()=>root.unmount());root=createRoot(container);await act(async()=>root.render(React.createElement(Training,{sessions:saved,saveSessions:()=>true})));assert.match(container.querySelector('.session-planner').textContent,/30 MIN · 1 BLOCK/);assert.equal(field('Minutes for Serve with a destination').value,'30');
 }finally{await close();}
});
test('Oversized starters and malformed saved plans preserve the existing plan without creating practice logs',async()=>{
 const Training=load('components/TrainingHub.tsx').default,seed=[{drillId:'serve',minutes:90},{drillId:'depth',minutes:90}];localStorage.clear();localStorage.setItem('baseline_session_plan_v1',JSON.stringify(seed));root=createRoot(container);await act(async()=>root.render(React.createElement(Training,{sessions:[],saveSessions:()=>{throw new Error('Must not log');}})));
 try{await act(async()=>container.querySelector('.session-presets button').click());assert.match(container.querySelector('.session-planner').textContent,/within 180 minutes/);assert.deepEqual(JSON.parse(localStorage.getItem('baseline_session_plan_v1')),seed);assert.ok(!button('Open court mode').disabled);await action('Remove Build the rally, then attack from plan');assert.equal(JSON.parse(localStorage.getItem('baseline_session_plan_v1')).length,1);
 await act(async()=>{localStorage.setItem('baseline_session_plan_v1','broken');window.dispatchEvent(new CustomEvent('baseline-data',{detail:'baseline_session_plan_v1'}));});assert.equal(button('Open court mode').disabled,true);assert.match(container.querySelector('.session-planner').textContent,/not been overwritten/);assert.equal(localStorage.getItem('baseline_session_plan_v1'),'broken');
 }finally{await close();}
});
test('Workspace search opens with the keyboard, finds drill and string names, and navigates to the selected record',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#racquet-lab');const setup={...newSetup(),id:'search',name:'Match frame',stringName:'Confidential 1.25'};localStorage.setItem('baseline_setups_v2',JSON.stringify([setup]));const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 await act(async()=>window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true,cancelable:true})));assert.equal(document.activeElement.type,'search');await input('Search pages, drills & saved setups','Confidential');assert.equal(container.querySelectorAll('.workspace-search-results button').length,1);await act(async()=>container.querySelector('.workspace-search-results button').click());assert.equal(container.querySelector('dialog'),null);assert.equal(field('Setup name').value,'Match frame');
 await action('Search workspace');await input('Search pages, drills & saved setups','Return + one');await act(async()=>container.querySelector('.workspace-search-results button').click());assert.equal(window.location.hash,'#training');assert.match(container.querySelector('.training-detail').textContent,/Return \+ one/);
 await action('Search workspace');await input('Search pages, drills & saved setups','no-match-xyz');assert.equal(container.querySelectorAll('.workspace-search-results button').length,0);assert.match(container.querySelector('dialog').textContent,/No matches/);await act(async()=>window.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'k',metaKey:true,bubbles:true,cancelable:true})));assert.equal(container.querySelector('dialog'),null);
 }finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});
test('Court plans round-trip through workspace backups and existing plans survive imports',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#racquet-lab');const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 let blob;const oldURL=URL.createObjectURL,oldRevoke=URL.revokeObjectURL,oldClick=dom.window.HTMLAnchorElement.prototype.click;URL.createObjectURL=b=>{blob=b;return 'blob:plan';};URL.revokeObjectURL=()=>{};dom.window.HTMLAnchorElement.prototype.click=function(){};
 async function importPlan(plan){const el=container.querySelector('input[aria-label="Import Baseline backup"]');Object.defineProperty(el,'files',{configurable:true,value:[{size:200,text:async()=>JSON.stringify({version:3,matches:[],practice:[],setups:[],racketTrials:[],sessionPlan:plan})}]});await act(async()=>el.dispatchEvent(new dom.window.Event('change',{bubbles:true})));if(container.querySelector('dialog[aria-label="Review your backup"]'))await click('Import records');}
 try{
 const plan=[{drillId:'return',minutes:25}];await importPlan(plan);assert.deepEqual(JSON.parse(localStorage.getItem('baseline_session_plan_v1')),plan);await click('Export backup');assert.deepEqual(JSON.parse(await blob.text()).sessionPlan,plan);
 await importPlan([{drillId:'serve',minutes:10}]);assert.deepEqual(JSON.parse(localStorage.getItem('baseline_session_plan_v1')),plan);
 await importPlan([{drillId:'invalid',minutes:25}]);assert.match(container.textContent,/could not be imported/);assert.deepEqual(JSON.parse(localStorage.getItem('baseline_session_plan_v1')),plan);
 await click('Overview');assert.match(container.querySelector('.overview-court-plan').textContent,/25 minutes · 1 block/);
 }finally{URL.createObjectURL=oldURL;URL.revokeObjectURL=oldRevoke;dom.window.HTMLAnchorElement.prototype.click=oldClick;await close();}
});

test('First visit opens the racket editor, the optional guide counts real records, and returning visits retain drafts',async()=>{
 localStorage.clear();window.history.replaceState(null,'','/dashboard');const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 assert.ok(container.querySelector('.racket-workspace'));assert.equal(container.querySelector('.start-guide'),null);await click('Start here');assert.match(container.querySelector('.start-guide').textContent,/0 \/ 3 STARTED/);assert.equal(container.querySelector('.migration-note'),null);
 await click('Plan your next session');await act(async()=>container.querySelector('.session-presets button').click());await click('Start here');assert.match(container.querySelector('.start-guide').textContent,/0 \/ 3 STARTED/);
 await click('Start with your racket');await input('Setup name','First saved frame');await action('Save current racket setup');await click('Start here');assert.match(container.querySelector('.start-guide').textContent,/1 \/ 3 STARTED/);assert.equal(localStorage.getItem('baseline_start_state'),'done');
 await act(async()=>root.unmount());window.history.replaceState(null,'','/dashboard');root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));assert.equal(container.querySelector('.start-guide'),null);assert.equal(field('Setup name').value,'First saved frame');
 }finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});
test('Explicit deep links bypass first-visit guidance and skip navigation preserves their configuration payload',async()=>{
 const {shareSetupHash}=load('lib/baseline/racquet.ts');const shared={...newSetup(),name:'Friend’s clay setup',lead39:4,stringName:'Tour Bite',tension:'22 kg',notes:'Private sentinel'};
 localStorage.clear();const hash=shareSetupHash(shared);window.history.replaceState(null,'',hash);const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 assert.equal(container.querySelector('.start-guide'),null);assert.ok(container.querySelector('.shared-setup-preview'));assert.match(container.querySelector('.shared-setup-preview').textContent,/Tour Bite/);assert.match(container.querySelector('.shared-setup-preview').textContent,/22 kg/);assert.doesNotMatch(container.querySelector('.shared-setup-preview').textContent,/Private sentinel/);assert.notEqual(field('Setup name').value,shared.name);
 const before=localStorage.getItem('baseline_setup_draft_v2');await act(async()=>container.querySelector('.skip-link').click());assert.equal(window.location.hash,hash);assert.equal(document.activeElement.id,'workspace-content');assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);
 await click('Dismiss');assert.equal(container.querySelector('.shared-setup-preview'),null);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);assert.equal(window.location.hash,'#racquet-lab');
 }finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});
test('Shared links update a mounted Lab, preserve the draft until acceptance, and allow undo after loading',async()=>{
 const {shareSetupHash}=load('lib/baseline/racquet.ts'),own={...newSetup(),id:'own',name:'My working frame',lead12:2},incoming={...newSetup(),id:'friend',name:'Friend’s frame',lead39:4,notes:'Private notes'};
 window.history.replaceState(null,'','#racquet-lab');await mount([own]);try{
 await input('Load saved setup','own');await click('Saved setups');const original=localStorage.getItem('baseline_setup_draft_v2'),saved=localStorage.getItem('baseline_setups_v2');
 async function changeHash(hash){await act(async()=>{window.history.replaceState(null,'',hash);window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));});}
 await changeHash(shareSetupHash(incoming));assert.ok(container.querySelector('.shared-setup-preview'));assert.equal(document.activeElement.id,'shared-setup-heading');assert.equal(field('Setup name').value,own.name);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),original);
 await click('Load shared setup');const loaded=JSON.parse(localStorage.getItem('baseline_setup_draft_v2'));assert.equal(loaded.name,incoming.name);assert.equal(loaded.id,'');assert.equal(loaded.notes,'');assert.equal(localStorage.getItem('baseline_setups_v2'),saved);await click('Undo change');assert.equal(field('Setup name').value,own.name);
 const restored=localStorage.getItem('baseline_setup_draft_v2');await changeHash('#racquet-lab?setup=invalid');assert.equal(container.querySelector('.shared-setup-preview'),null);assert.match(container.textContent,/link is invalid/);assert.equal(localStorage.getItem('baseline_setup_draft_v2'),restored);assert.equal(localStorage.getItem('baseline_setups_v2'),saved);
 }finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});
test('Start guide excludes archived and future activity and avoids completion claims when records are unreadable',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#start');localStorage.setItem('baseline_setups_v2',JSON.stringify([{...newSetup(),id:'archived',archived:true}]));localStorage.setItem('baseline_practice_v2',JSON.stringify([{id:'future',drillId:'serve',date:'2099-01-01',minutes:10,notes:''}]));
 const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{assert.match(container.querySelector('.start-guide').textContent,/0 \/ 3 STARTED/);await act(async()=>{localStorage.setItem('baseline_setups_v2','broken');window.dispatchEvent(new CustomEvent('baseline-data',{detail:'baseline_setups_v2'}));});assert.doesNotMatch(container.querySelector('.start-guide').textContent,/0 \/ 3 STARTED/);assert.equal(localStorage.getItem('baseline_setups_v2'),'broken');}finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});

test('A camera retry failure preserves the previous unsaved clip and releases a stream when recorder startup fails',async()=>{
 const Recorder=load('components/StrokeRecorder.tsx').default;
 const navDescriptor=Object.getOwnPropertyDescriptor(globalThis,'navigator'),oldRecorder=global.MediaRecorder,oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL,oldPlay=dom.window.HTMLMediaElement.prototype.play;
 let denied=false,startFails=false,stopped=0,recorded=[];
 const stream={getTracks:()=>[{stop:()=>stopped++}]};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>{if(denied)throw new Error('Camera permission denied');return stream;}}}});
 global.MediaRecorder=class {static isTypeSupported(){return true;}constructor(){this.state='inactive';this.mimeType='video/webm';}start(){if(startFails)throw new Error('Recorder unavailable');this.state='recording';}stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['captured-video'],{type:'video/webm'})});this.onstop?.();}};
 URL.createObjectURL=()=> 'blob:retained-clip';URL.revokeObjectURL=()=>{};dom.window.HTMLMediaElement.prototype.play=()=>Promise.resolve();
 root=createRoot(container);await act(async()=>root.render(React.createElement(Recorder,{onRecorded:b=>recorded.push(b)})));
 try{
 await click('Record a clip');await click('Stop recording');assert.equal(recorded.length,1);assert.equal(await recorded[0].text(),'captured-video');const url=container.querySelector('video').getAttribute('src');assert.equal(url,'blob:retained-clip');
 denied=true;await click('Record again');assert.match(container.textContent,/Camera permission denied/);assert.equal(container.querySelector('video').getAttribute('src'),url);assert.ok(!button('Save to journal').disabled);assert.equal(recorded.length,1);
 denied=false;startFails=true;const priorStops=stopped;await click('Record again');assert.match(container.textContent,/Recorder unavailable/);assert.equal(container.querySelector('video').getAttribute('src'),url);assert.equal(stopped,priorStops+1);assert.equal(recorded.length,1);
 }finally{await close();if(navDescriptor)Object.defineProperty(globalThis,'navigator',navDescriptor);else delete global.navigator;if(oldRecorder===undefined)delete global.MediaRecorder;else global.MediaRecorder=oldRecorder;URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;dom.window.HTMLMediaElement.prototype.play=oldPlay;}
});
test('Dragging from a dialog field onto its backdrop does not close it; a deliberate backdrop press still closes',async()=>{
 const Modal=load('components/Modal.tsx').default;let closed=0;root=createRoot(container);await act(async()=>root.render(React.createElement(Modal,{title:'Draft entry',onClose:()=>closed++},React.createElement('input',{'aria-label':'Draft value'}))));
 try{const dialog=container.querySelector('dialog'),inputEl=container.querySelector('input');
 await act(async()=>{inputEl.dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));dialog.click();});assert.equal(closed,0);
 await act(async()=>{dialog.dispatchEvent(new dom.window.Event('pointerdown',{bubbles:true}));dialog.click();});assert.equal(closed,1);
 }finally{await close();}
});
test('Legacy account pages provide a working workspace entry when separate account services are absent',async()=>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;delete process.env.NEXT_PUBLIC_SUPABASE_URL;delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 try{for(const path of ['app/auth/login/page.tsx','app/auth/register/page.tsx']){
 const Page=load(path).default;root=createRoot(container);await act(async()=>root.render(React.createElement(Page)));assert.equal(container.querySelector('form'),null);assert.equal(container.querySelector('a').getAttribute('href'),'/dashboard');assert.match(container.textContent,/Open Baseline/);await close();
 }}finally{if(url!==undefined)process.env.NEXT_PUBLIC_SUPABASE_URL=url;if(key!==undefined)process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=key;}
});

test('Mobile menu reaches secondary pages and quick match opens the actual match form',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#racquet-lab');const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 await action('More pages');const dialog=container.querySelector('dialog[aria-label="Your workspace"]');assert.ok(dialog);const progress=[...dialog.querySelectorAll('button')].find(b=>b.querySelector('strong')?.textContent==='Progress');await act(async()=>progress.click());assert.equal(window.location.hash,'#progress');assert.equal(container.querySelector('dialog[aria-label="Your workspace"]'),null);assert.ok(container.querySelector('.mobile-dock .active'));
 await click('Log match');assert.ok(container.querySelector('dialog'));await action('Close dialog');
 }finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});
test('Backup review allows cancellation without changing records, then imports only after confirmation',async()=>{
 localStorage.clear();window.history.replaceState(null,'','#overview');const Workspace=load('app/dashboard/page.tsx').default;root=createRoot(container);await act(async()=>root.render(React.createElement(Workspace)));
 try{
 const setup={...newSetup(),id:'review-frame'};const el=container.querySelector('input[aria-label="Import Baseline backup"]');Object.defineProperty(el,'files',{configurable:true,value:[{name:'friend-backup.json',size:100,text:async()=>JSON.stringify({version:2,matches:[],practice:[],setups:[setup]})}]});
 const upload=()=>act(async()=>el.dispatchEvent(new dom.window.Event('change',{bubbles:true})));
 await upload();assert.ok(container.querySelector('dialog[aria-label="Review your backup"]'));assert.equal(localStorage.getItem('baseline_setups_v2'),null);await click('Cancel import');assert.equal(localStorage.getItem('baseline_setups_v2'),null);
 await upload();await click('Import records');assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].id,'review-frame');assert.equal(container.querySelector('dialog[aria-label="Review your backup"]'),null);
 }finally{window.history.replaceState(null,'','#racquet-lab');await close();}
});

test('Racket resets require confirmation, preserve saved data, and allow undo and invalid-field recovery',async()=>{
 const record={...newSetup(),id:'restore',name:'Keep this racket',lead12:3};await mount([record]);try{
 await input('Load saved setup','restore');await input('12 o’clock','8');const saved=localStorage.getItem('baseline_setups_v2');
 await click('Reset racket draft');await click('Keep my edits');assert.equal(field('12 o’clock').value,'8');
 await click('Reset racket draft');await click('Confirm reset');assert.equal(field('12 o’clock').value,'3');assert.equal(localStorage.getItem('baseline_setups_v2'),saved);
 await click('Undo change');assert.equal(field('12 o’clock').value,'8');
 await input('Starting weight','');await action('Reset Starting weight (g)');assert.equal(field('Starting weight').value,String(record.baseWeight));
 await input('Setup name','Changed title');const sectionReset=container.querySelector('#save-setup .section-reset');await act(async()=>sectionReset.click());await click('Confirm reset');assert.equal(field('Setup name').value,record.name);assert.equal(field('12 o’clock').value,'8');assert.equal(localStorage.getItem('baseline_setups_v2'),saved);
 }finally{await close();}
});
test('Match reset clears unsaved fields and restores controlled equipment without submitting',async()=>{
 const Form=load('components/MatchHub.tsx').MatchForm,setup={...newSetup(),id:'preferred',name:'Preferred racket'};let submitted=false;
 root=createRoot(container);await act(async()=>root.render(React.createElement(Form,{setups:[setup],preferredSetupId:'preferred',onSave:()=>submitted=true,onClose:()=>{}})));
 try{await input('Opponent','Wrong entry');await input('Saved racket setup','');await input('Racket / string setup','Changed');await click('Reset form');await click('Keep editing');assert.equal(field('Opponent').value,'Wrong entry');await click('Reset form');await click('Yes, reset form');assert.equal(field('Opponent').value,'');assert.equal(field('Saved racket setup').value,'saved:preferred');assert.equal(submitted,false);}finally{await close();}
});
test('Session plan restart is confirmed, undoable, and leaves completed practice intact',async()=>{
 const Planner=load('components/SessionPlanner.tsx').default;localStorage.clear();const original=[{drillId:'serve',minutes:20}];localStorage.setItem('baseline_session_plan_v1',JSON.stringify(original));localStorage.setItem('baseline_practice_v2','[]');
 root=createRoot(container);await act(async()=>root.render(React.createElement(Planner,{onLog:()=>{}})));
 try{await click('Restart session plan');await click('Keep current plan');assert.ok(container.querySelector('[data-plan-drill="serve"]'));await click('Restart session plan');await click('Confirm plan restart');assert.equal(container.querySelector('[data-plan-drill="serve"]'),null);await click('Undo plan restart');assert.ok(container.querySelector('[data-plan-drill="serve"]'));assert.equal(localStorage.getItem('baseline_practice_v2'),'[]');}finally{await close();}
});

test('Report year filters select a visible pro, reset all choices, and preserve saved rackets',async()=>{
 const stored={...newSetup(),id:'year-check',name:'Kept frame'};
 await mount([stored]);try{
  await click('Pro specs');const before=localStorage.getItem('baseline_setup_draft_v2');
  await input('Report year','2018');assert.equal(container.querySelectorAll('.pro-player-grid button').length,1);assert.match(container.querySelector('.pro-profile h2').textContent,/Roger Federer/);
  await input('Report year','2026');assert.equal(container.querySelectorAll('.pro-player-grid button').length,3);assert.match(container.querySelector('.pro-profile h2').textContent,/Rafael Nadal/);
  await input('Your comparison racket','year-check');await click('Reset pro comparison');assert.equal(field('Report year').value,'');assert.equal(field('Your comparison racket').value,'');assert.equal(container.querySelectorAll('.pro-player-grid button').length,6);
  assert.equal(localStorage.getItem('baseline_setup_draft_v2'),before);assert.equal(JSON.parse(localStorage.getItem('baseline_setups_v2'))[0].name,'Kept frame');
 }finally{await close();}
});
test('Invalid numeric values show an immediate explanation and field reset recovers a saveable draft',async()=>{
 await mount();try{
  await input('Starting weight','');assert.equal(field('Starting weight').getAttribute('aria-invalid'),'true');assert.match(container.querySelector('.input-notice').textContent,/highlighted fields/);assert.match(document.getElementById('error-baseWeight').textContent,/100 to 600/);assert.ok(container.querySelector('[aria-label="Save current racket setup"]').disabled);
  await action('Reset Starting weight (g)');assert.equal(field('Starting weight').value,'305');assert.equal(container.querySelector('.input-notice'),null);
  await input('Extra overgrips','1.5');assert.equal(field('Extra overgrips').getAttribute('aria-invalid'),'true');assert.match(document.getElementById('error-overgrips').textContent,/whole number/);await action('Reset Extra overgrips');assert.ok(!container.querySelector('[aria-label="Save current racket setup"]').disabled);
 }finally{await close();}
});
test('Lab tabs support arrow keys, deep links and a single active keyboard tab stop',async()=>{
 await mount();try{
  const tab=container.querySelector('#lab-tab-build');await act(async()=>tab.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true})));
  assert.equal(window.location.hash,'#racquet-lab?view=pros');assert.equal(document.activeElement.id,'lab-tab-pros');assert.equal(container.querySelectorAll('[role="tab"][tabindex="0"]').length,1);
  await close();root=createRoot(container);await act(async()=>root.render(React.createElement(Lab)));assert.ok(container.querySelector('.pro-workspace'));await click('Build');assert.equal(window.location.hash,'#racquet-lab');
 }finally{await close();}
});

test('Saving a racket succeeds when randomUUID is unavailable in the browser',async()=>{
 const descriptor=Object.getOwnPropertyDescriptor(global.crypto,'randomUUID');
 Object.defineProperty(global.crypto,'randomUUID',{configurable:true,value:undefined});
 try{
  await mount();await input('Setup name','Compatibility frame');await action('Save current racket setup');
  const saved=JSON.parse(localStorage.getItem('baseline_setups_v2'))[0];assert.equal(saved.name,'Compatibility frame');assert.match(saved.id,/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const {createRecordId}=load('lib/baseline/record-id.ts');assert.notEqual(createRecordId(),createRecordId());
 }finally{if(descriptor)Object.defineProperty(global.crypto,'randomUUID',descriptor);else delete global.crypto.randomUUID;await close();}
});
test('Specification matrix suppresses deltas for mixed strung/unstrung conditions',async()=>{
 const strung={...newSetup(),id:'strung-ref',name:'Strung reference'},unstrung={...newSetup(),id:'unstrung-alt',name:'Unstrung alternate',strings:0};
 await mount([strung,unstrung]);try{
  await click('Compare2');await input('Reference setup','strung-ref');await input('Third setup','unstrung-alt');
  const cells=container.querySelectorAll('.comparison-specs tbody tr:first-child td');assert.ok(cells[0].querySelector('.spec-delta'));assert.equal(cells[2].querySelector('.spec-delta'),null);assert.match(container.querySelector('.comparison-specs caption').textContent,/same strung\/unstrung condition/);
 }finally{await close();}
});

test('Pro choices survive editing the draft, including report year, saved comparison and source view',async()=>{
 const own={...newSetup(),id:'keep-own',name:'Saved comparison racket'};
 await mount([own]);try{
  const savedBefore=localStorage.getItem('baseline_setups_v2');
  await click('Pro specs');await input('Report year','2026');await input('Player & report','sinner-2026');await input('Your comparison racket','keep-own');await click('Strings & context');
  assert.ok(![...container.querySelectorAll('button')].some(b=>b.getAttribute('aria-label')==='Save current racket setup'));
  await click('Edit current draft');await input('Starting weight','310');await click('Pro specs');
  assert.equal(field('Report year').value,'2026');assert.equal(field('Player & report').value,'sinner-2026');assert.equal(field('Your comparison racket').value,'keep-own');
  assert.match(container.querySelector('.pro-profile h2').textContent,/Jannik Sinner/);assert.match(container.querySelector('.pro-context').textContent,/HEAD Hawk Touch/);
  await click('Compare specs');await input('Your comparison racket','');await click('Review starting specs in Build →');
  assert.equal(document.activeElement.id,'starting-racket');assert.equal(field('Starting weight').value,'310');assert.ok(container.querySelector('#starting-racket').open);
  await click('Pro specs');assert.equal(field('Player & report').value,'sinner-2026');await click('Reset pro comparison');
  assert.equal(field('Report year').value,'');assert.equal(field('Player & report').value,'alcaraz-2025');assert.equal(field('Your comparison racket').value,'');
  assert.equal(localStorage.getItem('baseline_setups_v2'),savedBefore);assert.equal(JSON.parse(localStorage.getItem('baseline_setup_draft_v2')).baseWeight,310);
 }finally{await close();}
});

test('Changing report year retains the visible player instead of reviving a hidden earlier choice',async()=>{
 await mount();try{
  await click('Pro specs');await input('Player & report','sinner-2026');await input('Report year','2018');
  assert.equal(field('Player & report').value,'federer-2018');await input('Report year','');
  assert.equal(field('Player & report').value,'federer-2018');assert.match(container.querySelector('.pro-profile h2').textContent,/Roger Federer/);
  await click('Source & year');await input('Player & report','djokovic-2022');assert.match(container.querySelector('.pro-context').textContent,/2022-08-24/);
 }finally{await close();}
});


test('Returning through a plain Lab hash restores Build and keeps the draft and pro choices',async()=>{
 await mount();try{
  await input('Starting weight','312');await click('Pro specs');await input('Report year','2018');
  await act(async()=>{window.history.pushState(null,'','#racquet-lab');window.dispatchEvent(new dom.window.Event('hashchange'));});
  assert.equal(container.querySelector('[role="tab"][aria-selected="true"]').textContent,'Build');assert.equal(field('Starting weight').value,'312');
  await click('Pro specs');assert.equal(field('Report year').value,'2018');
 }finally{await close();}
});
