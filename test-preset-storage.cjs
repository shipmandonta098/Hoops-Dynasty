// Preset storage: errors name their cause (storage full, storage blocked, anything else) and are logged; presets move
// once from localStorage into the careers database (the old key is read until the move succeeds); export → import
// round trip; one-time persistent-storage warning with the iOS Home Screen tip.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:73,strictDOM:false});const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
const go=async c=>{const v=await l.run(`(async()=>{${c}})()`);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;var toasts=[];toast=t=>toasts.push(t);var errors=[];console={...console,error:(...a)=>errors.push(a.map(String).join(' '))};var modal='',modalTitle='';editorModal=(t,b)=>{modalTitle=t;modal=b};titleModal=(t,b)=>{modalTitle=t;modal=b};closeTitleModal=()=>{modal=''};renderSetup=()=>{};onSetup=true;
 setupDraft=makeDraft();setupDraft.gmName='Presets';
 var mem={};var goodStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};localStorage=goodStorage;
 var fail=(name,message='x')=>Object.assign(Error(message),{name});
 var memoryStore=(opts={})=>{const data={};return {data,getSetting:async k=>{if(opts.readFail)throw opts.readFail;return data[k]===undefined?undefined:JSON.parse(JSON.stringify(data[k]))},putSetting:async (k,v)=>{if(opts.putFail)throw opts.putFail;data[k]=JSON.parse(JSON.stringify(v))}}};`);
(async()=>{
// 1. Real causes. localStorage path first (no database yet).
await go(`await createPreset('First league','all');`);assert.equal(run(`readPresets().length`),1);
let r=await go(`toasts.length=0;errors.length=0;localStorage={...goodStorage,setItem:()=>{throw fail('QuotaExceededError','The quota has been exceeded.')}};const ok=await writePresets([]);return {ok,toast:toasts.at(-1),logged:errors.length,kept:readPresets().length}`);
assert.equal(r.ok,false);assert.match(r.toast,/storage is full/);assert.equal(r.logged,1,'error logged to the console');assert.equal(r.kept,1,'stored list unchanged');
r=await go(`toasts.length=0;localStorage={getItem:()=>{throw fail('SecurityError','The operation is insecure.')},setItem:()=>{throw fail('SecurityError','The operation is insecure.')}};const ok=await writePresets([]);const list=readPresets();return {ok,toast:toasts.at(-1),read:presetError,list:list.length}`);
assert.equal(r.ok,false);assert.match(r.toast,/blocking site storage \(private browsing or cookie blocking\)/);assert.match(r.read,/blocking site storage/,'reads explain blocking too');assert.equal(r.list,0);
r=await go(`toasts.length=0;localStorage=null;const ok=await writePresets([]);return {ok,toast:toasts.at(-1)}`);assert.equal(r.ok,false);assert.match(r.toast,/blocking site storage/,'storage unavailable counts as blocked');
r=await go(`toasts.length=0;localStorage={...goodStorage,setItem:()=>{throw TypeError('Converting circular structure to JSON')}};const ok=await writePresets([]);return {ok,toast:toasts.at(-1)}`);
assert.equal(r.ok,false);assert.equal(r.toast,'Could not save presets: Converting circular structure to JSON','anything else shows the actual message');
assert(!run(`toasts.some(t=>/may be full/.test(t))`),'the old catch-all message is gone');
// 2. Moving old presets. A failed move keeps reading (and writing) the old key; a verified move switches to the database.
l.run(`localStorage=goodStorage;`);const before=run(`readPresets()`);
r=await go(`careerStore=memoryStore({putFail:fail('QuotaExceededError')});let threw='';try{await movePresetsToDatabase()}catch(e){threw=e.name}return {threw,active:presetStoreActive(),list:readPresets(),key:PRESET_KEY in mem}`);
assert.equal(r.threw,'QuotaExceededError');assert.equal(r.active,false);assert.deepEqual(r.list,before,'still read from the old key');assert.equal(r.key,true,'old key kept');
r=await go(`careerStore=memoryStore();const moved=await movePresetsToDatabase();return {moved,active:presetStoreActive(),db:careerStore.data.presets,list:readPresets(),key:PRESET_KEY in mem}`);
assert.deepEqual([r.moved,r.active,r.key],[true,true,false]);assert.deepEqual(r.db,before);assert.deepEqual(r.list,before);
// Saves now go to the database; a database quota error is reported and leaves the cached list alone.
await go(`await createPreset('Second league','structure');`);assert.deepEqual(run(`careerStore.data.presets.map(p=>p.name)`),['First league','Second league']);assert.equal(run(`PRESET_KEY in mem`),false);
r=await go(`toasts.length=0;const real=careerStore.putSetting;careerStore.putSetting=async()=>{throw fail('QuotaExceededError')};await deletePreset(0);careerStore.putSetting=real;return {toast:toasts.at(-1),list:readPresets().length}`);
assert.match(r.toast,/storage is full/);assert.equal(r.list,2);
// Already moved: the database wins and the old key is not read.
r=await go(`const s=memoryStore();s.data.presets=[{id:'x',name:'Kept',scope:'settings',updatedAt:new Date().toISOString(),data:{}}];mem[PRESET_KEY]='[]';presetCache=null;careerStore=s;await movePresetsToDatabase();return readPresets().map(p=>p.name)`);
assert.deepEqual(r,['Kept']);
// Unreadable old presets are not moved and stay in place.
r=await go(`presetCache=null;mem[PRESET_KEY]='{broken';careerStore=memoryStore();const moved=await movePresetsToDatabase();return {moved,key:mem[PRESET_KEY],db:careerStore.data.presets===undefined}`);
assert.deepEqual(r,{moved:false,key:'{broken',db:true});
// 3. Export → import round trip.
l.run(`presetCache=null;delete mem[PRESET_KEY];careerStore=memoryStore();`);await go(`await movePresetsToDatabase();await createPreset('Round trip A','all');await createPreset('Round trip B','settings');`);
const exported=run(`JSON.stringify(presetExportPayload())`);const original=run(`readPresets()`);
assert.equal(JSON.parse(exported).format,'hoops-dynasty-presets');
r=await go(`careerStore=memoryStore();presetCache=null;await movePresetsToDatabase();const file={size:${exported.length},text:async()=>${JSON.stringify(exported)}};const ok=await importPresetFile(file);return {ok,list:readPresets(),toast:toasts.at(-1)}`);
assert.equal(r.ok,true);assert.deepEqual(r.list,original,'identical after the round trip');assert.match(r.toast,/Imported 2 presets/);
// Loading an imported preset works.
r=await go(`setupDraft=makeDraft();setupDraft.gmName='Other';loadPreset(0);return [setupDraft.gmName,toasts.at(-1)]`);assert.deepEqual(r,['Presets','Preset applied.']);
// Re-importing the same file updates by id; a different preset with a taken name is renamed; damaged files change nothing.
r=await go(`const f=t=>({size:t.length,text:async()=>t});await importPresetFile(f(${JSON.stringify(exported)}));const other=JSON.parse(${JSON.stringify(exported)});other.presets=[{...other.presets[0],id:'preset-new'}];await importPresetFile(f(JSON.stringify(other)));
 const names=readPresets().map(p=>p.name);const n=names.length;await importPresetFile(f('{"format":"hoops-dynasty-presets","presets":[{"name":"","scope":"all","data":{}}]}'));const bad=toasts.at(-1);await importPresetFile(f('not json'));return {names,same:readPresets().length===n,bad,json:toasts.at(-1)}`);
assert.deepEqual(r.names,['Round trip A','Round trip B','Round trip A (imported)']);assert(r.same);assert.match(r.bad,/damaged.*Nothing was imported/);assert.match(r.json,/not valid JSON/);
// The dialog offers Export / Import.
l.run(`openPresets(false)`);const dialog=run('modal');assert(/>Export presets</.test(dialog)&&/>Import presets</.test(dialog)&&/type="file"/.test(dialog));
// 4. First launch: persistence request and one-time warning; iOS Safari gets the Home Screen tip.
const persist=async({persisted,granted,ua='Mozilla/5.0 (Windows NT 10.0)'})=>go(`modal='';let asked=0;navigator={userAgent:${JSON.stringify(ua)},maxTouchPoints:5,storage:{persisted:async()=>${persisted},persist:async()=>{asked++;return ${granted}}}};const result=await checkStoragePersistence();return {result,asked,modal,title:modalTitle}`);
l.run(`careerStore=memoryStore();mem={};`);
r=await persist({persisted:true,granted:true});assert.deepEqual([r.result,r.asked,r.modal],[true,0,''],'already persistent: no prompt, no warning');
r=await persist({persisted:false,granted:true});assert.deepEqual([r.result,r.asked,r.modal],[true,1,''],'granted on request: no warning');
r=await persist({persisted:false,granted:false,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
assert.equal(r.result,false);assert.equal(r.title,'Keep your saves safe');assert.match(r.modal,/Home Screen/);assert.match(r.modal,/7 days/);
r=await persist({persisted:false,granted:false});assert.equal(r.modal,'','shown only once');
l.run(`careerStore=memoryStore();mem={};`);r=await persist({persisted:false,granted:false});assert(r.modal&&!/Home Screen/.test(r.modal),'no iOS tip on other browsers');
console.log('Preset storage: real error causes, logged errors, verified move to the careers database, export/import round trip, one-time persistence warning passed.');
})().catch(e=>{console.error(e);process.exit(1)});
