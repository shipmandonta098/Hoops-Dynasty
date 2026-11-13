// Save export after a season: one season of 30-team game summaries passed the browser's ~512M-character string limit
// when the backup went through a single JSON.stringify(...,null,2) ("Invalid string length", no file). The file export
// is now streamed into a Blob row by row (format version 3, still valid JSON, one row per line), the current season's
// games are written once (tables.games) instead of also in record.data.history, and large files import line by line.
const assert=require('node:assert/strict'),{indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
const {loadLeague}=require('./dev/load-league.cjs');
(async()=>{const r=loadLeague({seed:91,strictDOM:false});Object.assign(r.context,{indexedDB,IDBKeyRange,Blob,File,ReadableStream,TextDecoderStream,TextEncoder});
 r.run("const setup=makeDraft();setup.gmName='Export Stream';setup.teams=setup.teams.slice(0,6);setup.meetings=2;state=validateCareerData(buildSetupCareer(setup));simulationExecution.mode='headless';");
 await r.run('sim(4)');r.run('simulationExecution.mode="normal";');
 const played=JSON.parse(r.run('JSON.stringify(state)'));assert(played.history.length>0,'games played');
 r.context.repoPromise=r.run("openNormalizedCareerDatabase({name:'export-stream'})");const repo=await r.context.repoPromise;
 await repo.put({id:'S',name:'Stream',data:played});
 // Streamed export: valid JSON, version 3, current-season games only in tables.
 const blob=await repo.exportBackupBlob('S'),text=await blob.text(),raw=JSON.parse(text);
 assert.equal(raw.format,'hoops-dynasty-database');assert.equal(raw.formatVersion,3);assert.deepEqual(raw.record.data.history,[]);
 assert.equal(raw.tables.games.length,played.history.length);assert.equal(raw.tables.boxScores.length,played.history.length);
 assert(text.split('\n').length>raw.tables.games.length*2,'one row per line');
 const old=await repo.exportBackup('S'),oldText=JSON.stringify(old,null,2);assert(text.length<oldText.length*.6,`streamed file smaller (${text.length} vs ${oldText.length})`);
 console.log('PASS streamed export is valid JSON, version 3, games once,',(text.length/1e3).toFixed(0)+'KB vs',(oldText.length/1e3).toFixed(0)+'KB before');
 // Line-by-line reader gives exactly what JSON.parse gives, even with chunks split mid-line.
 const streamOf=(s,size=4097)=>new ReadableStream({start(c){for(let i=0;i<s.length;i+=size)c.enqueue(s.slice(i,i+size));c.close()}});
 r.context.streamOf=streamOf;r.context.exportText=text;
 assert.deepEqual(JSON.parse(JSON.stringify(await r.run('parseBackupLines(streamOf(exportText))'))),raw);
 await assert.rejects(r.run('parseBackupLines(streamOf(exportText.slice(0,exportText.length-40)))'),/incomplete|JSON|Unexpected/);
 r.context.oldText=oldText;await assert.rejects(r.run('parseBackupLines(streamOf(oldText))'),e=>e.notStreamed===true);
 // readExportFile: small files parse directly; a file over the threshold uses the streamed reader.
 r.context.small=new File([text],'x.json');assert.equal((await r.run('readExportFile(small)')).formatVersion,3);
 r.context.big={size:1e9,stream:()=>new Blob([text]).stream(),text:()=>{throw Error('text() should not be used for large files')}};assert.equal((await r.run('readExportFile(big)')).tables.games.length,played.history.length);
 r.context.bigOld={size:1e9,stream:()=>new Blob([oldText]).stream(),text:async()=>oldText};assert.equal((await r.run('readExportFile(bigOld)')).formatVersion,2);
 console.log('PASS line reader matches JSON.parse, rejects truncated files, falls back for old pretty-printed files');
 // Import: version 3 rebuilds the season's games and gives exactly the save a version 2 backup of the same league gives
 // (import validation normalizes a few live fields, the same for both), including every archive, game and box score.
 const imported=await repo.importBackup(raw,'I3'),viaOld=await repo.importBackup(old,'I2');
 assert.equal(imported.data.history.length,played.history.length);assert.equal(viaOld.data.history.length,played.history.length);
 r.context.a=(await repo.get('I3',{full:true})).data;r.context.b=(await repo.get('I2',{full:true})).data;assert.equal(r.run('hdCanonical(a)'),r.run('hdCanonical(b)'));
 r.context.h=(await repo.get('S')).data.history;assert.equal(r.run('JSON.stringify(a.history)'),r.run('JSON.stringify(h)'),'current season games identical');
 const broken=JSON.parse(text);broken.tables.boxScores.pop();await assert.rejects(repo.importBackup(broken,'bad'),/missing box/);assert.equal(await repo.get('bad'),null);
 console.log('PASS version 3 import rebuilds the season games exactly and matches a version 2 import; missing box score rejected without a slot');
 // A save that changes mid-export is refused rather than written inconsistently.
 const realQuery=repo.query;let once=false;repo.query=async(...a)=>{if(!once){once=true;const rec=await repo.get('S');await repo.put(rec)}return realQuery(...a)};await assert.rejects(repo.exportBackupBlob('S'),/changed during export/);repo.query=realQuery;
 console.log('PASS export refuses a save that changed while it was written');
 // File names use the same season-label rule as the game (dates decide).
 r.context.rec=(start,end,year=2026)=>({team:{city:'Test',name:'Club'},data:{year,day:3,leagueSettings:{seasonStart:start,seasonEnd:end},scheduleFormat:'roundRobin'}});
 assert.match(r.run("careerExportFilename(rec('05-16','09-11'),new Date(2026,10,13))"),/^HoopsDynasty_Test-Club_2026_Day3_2026-11-13\.json$/);
 assert.match(r.run("careerExportFilename(rec('10-28','04-19'),new Date(2026,10,13))"),/_2025-26_Day3_/);
 console.log('PASS export file names: May–Sep league 2026, Oct–Apr league 2025-26');
 repo.close();
})().catch(e=>{console.error(e);process.exit(1)});
