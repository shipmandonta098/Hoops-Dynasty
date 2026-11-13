// Past-season games keep what is still read back (teams, score, stage, headline facts; box scores in their own store)
// and drop the replay data (summary event log, box timeline, rotation/coach events, play-by-play: ~70 KB a game) once
// the season is over. The current season is never trimmed. Runs once per season; removing a save clears its marker.
const assert=require('node:assert/strict'),{indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
const {loadLeague}=require('./dev/load-league.cjs');
const HEAVY=['summaryData','boxTimeline','rotationEvents','playByPlay','coachEvents'];
(async()=>{const r=loadLeague({seed:58,strictDOM:false});Object.assign(r.context,{indexedDB,IDBKeyRange,Blob});
 r.run("const setup=makeDraft();setup.gmName='Trim Test';setup.teams=setup.teams.slice(0,6);setup.meetings=2;state=validateCareerData(buildSetupCareer(setup));simulationExecution.mode='headless';");
 await r.run('sim(4)');r.run('simulationExecution.mode="normal";');
 const played=JSON.parse(r.run('JSON.stringify(state)')),year=played.year,n=played.history.length;assert(n>0);
 assert(played.history.every(g=>g.summaryData&&g.playByPlay),'fresh games carry replay data');
 r.context.repoPromise=r.run("openNormalizedCareerDatabase({name:'trim-test'})");const repo=await r.context.repoPromise;
 const rows=async(id,season)=>(await repo.getGamesForSeason(id,season,{limit:500})).rows;
 const marker=async id=>(await new Promise(res=>{const q=repo.db.transaction('metadata').objectStore('metadata').get('trimmedGames:'+id);q.onsuccess=()=>res(q.result)}))?.value;
 // Saving during the season keeps every field of the season's games.
 await repo.put({id:'T',name:'Trim',data:played});await repo.put(await repo.get('T'));
 assert.equal((await rows('T',year)).length,n);assert((await rows('T',year)).every(row=>HEAVY.every(k=>k in row.value)),'current season untouched');
 assert.deepEqual(JSON.parse(JSON.stringify((await repo.get('T')).data.history)),played.history,'current season loads exactly');
 const sizeBefore=JSON.stringify((await rows('T',year)).map(x=>x.value)).length;
 console.log('PASS current-season games keep their replay data across saves');
 // New season: last season's games are trimmed; results, headline facts and box scores remain.
 const next=await repo.get('T');next.data.year=year+1;next.data.history=[];next.data.day=0;for(const t of next.data.teams)Object.assign(t,{w:0,l:0});await repo.put(next);
 const old=await rows('T',year);assert.equal(old.length,n);
 for(const row of old){const before=played.history[row.order];assert(HEAVY.every(k=>!(k in row.value)),'heavy fields dropped');for(const k of Object.keys(before).filter(k=>k!=='box'&&!HEAVY.includes(k)))assert.deepEqual(row.value[k],before[k],'kept '+k)}
 const sizeAfter=JSON.stringify(old.map(x=>x.value)).length;assert(sizeAfter<sizeBefore*.2,`old games ${sizeBefore} → ${sizeAfter} bytes`);
 assert.equal(await marker('T'),year);
 // News archive results for the old season still build from the trimmed rows (headline and top scorer).
 const days=[...new Set(played.history.map(g=>g.day))];r.context.dayGames=await repo.getDayGames('T',year,days[0]);r.context.year=year;
 const items=JSON.parse(r.run('JSON.stringify(dayGames.map((g,i)=>newsResultItem(g,year,i)).filter(Boolean))'));
 assert.equal(items.length,played.history.filter(g=>g.day===days[0]).length);assert(items.every(x=>x.headline&&/PTS/.test(x.detail)),'headline and top scorer');
 r.context.fullDay=played.history.filter(g=>g.day===days[0]);assert.equal(JSON.stringify(items),r.run('JSON.stringify(fullDay.map((g,i)=>newsResultItem(g,year,i)).filter(Boolean))'),'same news items as from the full games');
 console.log('PASS new season trims last season (',(sizeBefore/n/1e3).toFixed(1),'→',(sizeAfter/n/1e3).toFixed(2),'KB a game ); news results identical; box scores kept');
 // Later saves in the same season do not scan again (marker); a later season trims the next one.
 let scans=0;const realTransact=repo.db.transaction.bind(repo.db);repo.db.transaction=(stores,...rest)=>{if(Array.isArray(stores)&&stores.length===2&&stores.includes('games')&&stores.includes('metadata'))scans++;return realTransact(stores,...rest)};
 await repo.put(await repo.get('T'));await repo.put(await repo.get('T'));assert.equal(scans,0,'no rescan within a season');repo.db.transaction=realTransact;
 console.log('PASS later saves in the same season skip the trim pass');
 // A league with no marker yet (an imported backup, or a save from before this change) is trimmed on its first save.
 await new Promise((res,rej)=>{const tx=repo.db.transaction(['games','metadata'],'readwrite'),store=tx.objectStore('games');tx.objectStore('metadata').delete('trimmedGames:T');for(const row of old)store.put({...row,value:{...row.value,summaryData:{x:1},playByPlay:['a']}});tx.oncomplete=res;tx.onerror=rej});
 r.context.repoPromise=r.run("openNormalizedCareerDatabase({name:'trim-test'})");const fresh=await r.context.repoPromise;
 assert((await rows('T',year)).every(row=>'summaryData' in row.value));await fresh.put(await fresh.get('T'));
 assert((await rows('T',year)).every(row=>!('summaryData' in row.value)),'trimmed on first save without a marker');assert.equal(await marker('T'),year);fresh.close();
 console.log('PASS a league without a marker (imported backup, older save) is trimmed on its first save');
 // Removing a save removes its marker.
 await repo.remove('T');assert.equal(await marker('T'),undefined);
 console.log('PASS removing a save clears its marker');
 repo.close();
})().catch(e=>{console.error(e);process.exit(1)});
