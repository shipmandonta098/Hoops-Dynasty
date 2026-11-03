// Export files: names (HoopsDynasty_<Team>_<Season>_Day<day>_<date>.json, safe characters, length limit), delivery
// (share sheet on touch devices that can share files, keeping the name; download elsewhere; cancel is silent; a lost
// tap gets a "Save export" button), the same for presets, and import of new and old exports.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const {indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
const l=loadLeague({seed:9,strictDOM:false});Object.assign(l.context,{indexedDB,IDBKeyRange,File,Blob,crypto:globalThis.crypto,URL:{createObjectURL:()=>'blob:x',revokeObjectURL(){}}});
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
// Browser stand-ins: share/canShare, pointer type, the download anchor and the modal dialog.
l.run(`var toasts=[],shares=[],downloads=[],shareMode='ok',coarse=true,canShareFiles=true,dialog={open:false,innerHTML:'',className:'',showModal(){this.open=true},close(){this.open=false}};
 toast=m=>toasts.push(m);render=()=>{};matchMedia=q=>({matches:q.includes('coarse')&&coarse});
 navigator={userAgent:'test',platform:'Linux',maxTouchPoints:0,canShare:d=>canShareFiles&&Array.isArray(d.files),share:async d=>{if(shareMode==='abort'){const e=Error('cancel');e.name='AbortError';throw e}if(shareMode==='tap'){shareMode='ok';const e=Error('no gesture');e.name='NotAllowedError';throw e}shares.push({name:d.files[0].name,title:d.title,type:d.files[0].type,text:await d.files[0].text()})}};
 document.createElement=()=>{const a={click(){downloads.push(a.download)},remove(){}};return a};document.body.appendChild=()=>{};const getEl=document.getElementById;document.getElementById=id=>id==='profile'?dialog:getEl(id);`);
(async()=>{
 // Names.
 const day=new Date(2026,10,2);l.context.day=day;
 assert.equal(run(`careerExportFilename({team:{city:'Minnesota',name:'Lynx'},data:{year:2026,day:0,scheduleFormat:'custom',leagueSettings:{seasonStart:5,seasonEnd:10}}},day)`),'HoopsDynasty_Minnesota-Lynx_2026_Day0_2026-11-02.json');
 assert.equal(run(`careerExportFilename({team:{city:'Boston',name:'Celtics'},data:{year:2026,day:57,scheduleFormat:'nba82',leagueSettings:{}}},day)`),'HoopsDynasty_Boston-Celtics_2025-26_Day57_2026-11-02.json');
 assert.equal(run(`careerExportFilename({team:{city:'Montréal',name:'Étoile/Été!*'},data:{year:2026,day:3,scheduleFormat:'nba82'}},day)`),'HoopsDynasty_Montreal-Etoile-Ete_2025-26_Day3_2026-11-02.json');
 const long=run(`careerExportFilename({team:{city:'A'.repeat(80),name:'B'.repeat(80)},data:{year:2026,day:1,scheduleFormat:'nba82'}},day)`);
 assert.match(long,/^HoopsDynasty_A{40}_2025-26_Day1_2026-11-02\.json$/);assert(long.length<=90);
 assert.equal(run(`careerExportFilename({name:'<My Save>',data:{year:2026,day:2,scheduleFormat:'nba82'}},day)`),'HoopsDynasty_My-Save_2025-26_Day2_2026-11-02.json','falls back to the save name');
 assert.equal(run(`presetExportFilename(3,day)`),'HoopsDynasty_Presets_3_2026-11-02.json');
 // A real career: create it in IndexedDB and export it.
 const id=await l.run(`(async()=>{careerStore=await openNormalizedCareerDatabase({name:'export-files'});const d=makeDraft();d.gmName='Export';const r=await createCareerRecord(buildSetupCareer(d));return r.id})()`);
 // Touch device that can share files: the share sheet gets a named JSON file; nothing downloads.
 await l.run(`exportCareer('${id}')`);
 const shared=run('shares[0]');assert.match(shared.name,/^HoopsDynasty_[A-Za-z0-9-]+_\d{4}(-\d{2})?_Day0_\d{4}-\d{2}-\d{2}\.json$/);assert.equal(shared.title,shared.name);assert.equal(shared.type,'application/json');
 assert.deepEqual(run('downloads'),[]);assert.deepEqual(run('toasts'),['Save export ready.']);
 // Cancelling the share sheet: no error, no toast, no download.
 l.run(`toasts=[];shareMode='abort'`);await l.run(`exportCareer('${id}')`);assert.deepEqual(run('toasts'),[]);assert.deepEqual(run('downloads'),[]);
 // Share lost its tap (slow export): a Save export button finishes the share.
 l.run(`toasts=[];shares=[];shareMode='tap'`);await l.run(`exportCareer('${id}')`);
 assert(run('dialog.open')&&run('dialog.innerHTML').includes('Save export')&&run('dialog.innerHTML').includes(shared.name.slice(0,25)));assert.deepEqual(run('shares'),[]);
 await l.run('exportFinishShare()');assert.equal(run('shares.length'),1);assert.equal(run('dialog.open'),false);
 // Desktop (fine pointer) and devices that can't share files: a normal download with the same name.
 l.run(`shares=[];toasts=[];shareMode='ok';coarse=false`);await l.run(`exportCareer('${id}')`);assert.equal(run('downloads.length'),1);assert.equal(run('downloads[0]'),shared.name);assert.deepEqual(run('shares'),[]);assert.deepEqual(run('toasts'),['Save export downloaded.']);
 l.run(`downloads=[];coarse=true;canShareFiles=false`);await l.run(`exportCareer('${id}')`);assert.equal(run('downloads.length'),1);
 // Presets use the same path.
 l.run(`downloads=[];shares=[];toasts=[];canShareFiles=true;readPresets=()=>[{id:'p1',name:'One'},{id:'p2',name:'Two'}];presetError=null`);await l.run('exportPresets()');
 assert.equal(run('shares[0].name'),'HoopsDynasty_Presets_2_'+run('exportDate()')+'.json');assert.equal(JSON.parse(run('shares[0].text')).presets.length,2);assert.deepEqual(run('toasts'),['Exported 2 presets.']);
 // Import: the new export file, and old exports (single-file career format v1, and the database backup format) whatever
 // their file names.
 const json=shared.text;
 const imported=await l.run(`(async()=>{const before=(await careerStore.list()).length;await importCareerFile({files:[{name:'HoopsDynasty_x.json',text:async()=>${JSON.stringify(json)}}],value:''});return (await careerStore.list()).length-before})()`);
 assert.equal(imported,1,'new export imports');
 const old=await l.run(`(async()=>{const r=await careerStore.get('${id}'),doc=JSON.stringify(careerExportDocument(r),null,2),before=(await careerStore.list()).length;
  await importCareerFile({files:[{name:'4e83be98-4f64-4fc8-b385-378d99785b54.json',text:async()=>doc}],value:''});return (await careerStore.list()).length-before})()`);
 assert.equal(old,1,'old single-file export imports');
 assert(run('toasts').filter(t=>/imported/.test(t)).length===2,'both imports reported: '+run('toasts').join(' | '));
 console.log('Export files: names (team, season label, day, date; safe characters; length limit), share sheet on touch devices, silent cancel, Save button after a lost tap, desktop download, presets, and import of new and old exports.');
})().catch(e=>{console.error(e);process.exit(1)});
