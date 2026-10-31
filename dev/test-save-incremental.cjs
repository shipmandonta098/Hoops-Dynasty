// Saves skip rows that cannot change (played games, archive rows two or more seasons back) once written, and the
// league still reloads exactly. Run: HD_TEST_NODE_MODULES=<dir with fake-indexeddb> node dev/test-save-incremental.cjs
const assert=require('node:assert/strict'),{indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
const {loadLeague}=require('./load-league.cjs');
(async()=>{const l=loadLeague({seed:91,strictDOM:false});l.context.indexedDB=indexedDB;l.context.IDBKeyRange=IDBKeyRange;
 const go=async c=>{const v=await l.run(`(async()=>{${c}})()`);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
 l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Incremental';d.teams=d.teams.slice(0,6);d.meetings=2;state=validateCareerData(buildSetupCareer(d));
  var rowFor=(year,i)=>({id:i,name:'Old '+i,team:state.teams[0].abbr,year,gp:10,pts:100+i});
  state.statsArchive=[...[state.year-4,state.year-3,state.year-2,state.year-1].flatMap(y=>[0,1,2].map(i=>rowFor(y,i)))];
  var writes=0;`);
 await go(`globalThis.repo=await openNormalizedCareerDatabase({name:'incremental'});const realTransact=null;`);
 // Count object-store puts per save by wrapping IDBObjectStore.prototype.put.
 const {IDBObjectStore}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
 let puts=0;const realPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...a){puts++;return realPut.apply(this,a)};
 const save=async()=>{puts=0;await go(`await repo.put({id:'L',name:'L',data:snapshotState()})`);return puts};
 const first=await save(),second=await save();
 assert(second<first,`second save writes fewer rows (${first} → ${second})`);
 let full=await go(`const r=await repo.get('L',{full:true});return hdCanonical(r.data)===hdCanonical(JSON.parse(JSON.stringify(state)))`);assert.equal(full,true,'reload matches after a skipped save');
 // Recent rows (last completed season) still save when they change; old rows are kept intact.
 await go(`state.statsArchive.find(r=>r.year===state.year-1&&r.id===0).pts=999;state.statsArchive.push(rowFor(state.year-1,7));`);await save();
 full=await go(`const r=await repo.get('L',{full:true});return {same:hdCanonical(r.data)===hdCanonical(JSON.parse(JSON.stringify(state))),pts:r.data.statsArchive.find(x=>x.year===state.year-1&&x.id===0).pts,old:r.data.statsArchive.filter(x=>x.year<=state.year-2).length}`);
 assert.deepEqual(full,{same:true,pts:999,old:9},'recent change saved, old rows intact');
 // A new session (fresh repository) writes everything once, then skips again.
 await go(`repo.close();globalThis.repo=await openNormalizedCareerDatabase({name:'incremental'});await repo.get('L',{adoptRevision:true});`);
 const fresh=await save(),again=await save();assert(again<fresh,`new session: ${fresh} → ${again}`);
 assert.equal(await go(`const r=await repo.get('L',{full:true});return hdCanonical(r.data)===hdCanonical(JSON.parse(JSON.stringify(state)))`),true);
 // snapshotState shares finished history and copies the rest.
 const shared=await go(`const s=snapshotState();return {oldShared:s.statsArchive.find(r=>r.year===state.year-3)===state.statsArchive.find(r=>r.year===state.year-3),teamsCopied:s.teams!==state.teams&&s.teams[0]!==state.teams[0],equal:hdCanonical(JSON.parse(JSON.stringify(s)))===hdCanonical(JSON.parse(JSON.stringify(state)))}`);
 assert.deepEqual(shared,{oldShared:true,teamsCopied:true,equal:true});
 IDBObjectStore.prototype.put=realPut;console.log('PASS incremental saves skip finished rows and reload exactly ('+first+' → '+second+' puts)');
})().catch(e=>{console.error(e);process.exit(1)});
