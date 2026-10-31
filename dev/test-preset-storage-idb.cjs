// Presets in the real careers database (fake-indexeddb): settings round trip, the startup move from localStorage,
// and presets surviving a reopen. Run: HD_TEST_NODE_MODULES=<dir with fake-indexeddb> node dev/test-preset-storage-idb.cjs
const assert=require('node:assert/strict'),{indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
const {loadLeague}=require('./load-league.cjs');
(async()=>{const l=loadLeague({seed:74,strictDOM:false});l.context.indexedDB=indexedDB;l.context.IDBKeyRange=IDBKeyRange;
 const go=async c=>{const v=await l.run(`(async()=>{${c}})()`);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
 l.run(`render=()=>{};toast=()=>{};titleModal=()=>{};var mem={};localStorage={getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}};
  mem[PRESET_KEY]=JSON.stringify([{id:'p1',name:'Old browser preset',scope:'settings',updatedAt:'2026-01-01T00:00:00.000Z',data:{meetings:2}}]);
  openCareerDatabase=()=>openNormalizedCareerDatabase({name:'preset-test'});`);
 assert.equal(await go(`return await initializeCareers()`),true);
 let r=await go(`return {active:presetStoreActive(),names:readPresets().map(p=>p.name),stored:(await careerStore.getSetting('presets')).length,key:PRESET_KEY in mem}`);
 assert.deepEqual(r,{active:true,names:['Old browser preset'],stored:1,key:false});console.log('PASS startup move from localStorage into IndexedDB');
 r=await go(`const list=readPresets();list.push({id:'p2',name:'New',scope:'settings',updatedAt:new Date().toISOString(),data:{}});await writePresets(list);careerStore.close();presetCache=null;await initializeCareers();return readPresets().map(p=>p.name)`);
 assert.deepEqual(r,['Old browser preset','New']);console.log('PASS presets persist across reopen');
 r=await go(`await careerStore.putSetting('other',{a:1});return [await careerStore.getSetting('other'),await careerStore.getSetting('missing')]`);assert.deepEqual(r,[{a:1},null]);console.log('PASS settings get/put');
})().catch(e=>{console.error(e);process.exit(1)});
