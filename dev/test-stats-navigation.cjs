const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
(async()=>{
 const c={console,setTimeout,clearTimeout,indexedDB,IDBKeyRange,structuredClone};vm.createContext(c);
 vm.runInContext(`let activeSaveId='A',state={year:2026},view='Overview',onTitle=false,onSetup=false,onLoadCareers=false;
 let careerStore,renderCount=0;function render(){renderCount++}function go(v){view=v;render()}
 function simulationHeadless(){return false}function openPlayerProfile(){}function newSeason(){}function openSavedCareer(){}
 function hallOfFameView(){}function hallSetFilter(){}function openFranchiseSeason(){}function playerStatsYears(){return [2026]}
 function statsChange(){}function statsSort(){}function leagueStatsView(){return 'CURRENT STATS'}
 function escapeHTML(s){return s.replaceAll('<','&lt;')}function toast(s){throw Error('Unexpected toast '+s)}
 `,c);
 vm.runInContext(fs.readFileSync('dist/storage-integration.js','utf8'),c);
 const run=s=>vm.runInContext(s,c);
 let resolve,reject;
 c.pending=new Promise((a,b)=>{resolve=a;reject=b});run('careerStore={getArchiveYears:()=>pending}');
 const navigation=run("go('Player stats')");assert.equal(run('view'),'Player stats');assert.equal(run('renderCount'),1);
 reject(Error('Database transaction aborted; previous save remains intact.'));await navigation;
 assert.match(run('leagueStatsView()'),/CURRENT STATS/);assert.match(run('leagueStatsView()'),/Retry history/);assert.match(run('leagueStatsView()'),/transaction aborted/);
 console.log('PASS aborted archive read does not block current stats; failure and retry remain visible');
 run('careerStore={getArchiveYears:async()=>[2024,2025]}');await run('refreshStorageStatsYears()');
 assert.deepEqual(Array.from(run('playerStatsYears()')),[2026,2025,2024]);assert.doesNotMatch(run('leagueStatsView()'),/could not load/);
 console.log('PASS retry restores historical season choices');
 c.pending=new Promise(a=>resolve=a);run('careerStore={getArchiveYears:()=>pending}');const delayed=run("go('Player stats')");run("go('Overview')");const renders=run('renderCount');resolve([2023]);await delayed;assert.equal(run('view'),'Overview');assert.equal(run('renderCount'),renders);
 console.log('PASS delayed read does not navigate back after leaving stats');
 c.pending=new Promise(a=>resolve=a);const switched=run("go('Player stats')");run("activeSaveId='B';storageStatsYears=[]");resolve([2001]);await switched;assert.deepEqual(Array.from(run('storageStatsYears')),[]);
 console.log('PASS old league read cannot populate another career');
 vm.runInContext(fs.readFileSync('dist/league-repository.js','utf8'),c);
 const repo=await run("openNormalizedCareerDatabase({name:'stats-navigation'})");
 await new Promise((resolve,reject)=>{const tx=repo.db.transaction('archives','readwrite');for(const kind of ['statsArchive','playerPostseasonArchive'])for(const year of [1997,2025])for(let i=0;i<3;i++)tx.objectStore('archives').put({leagueId:'B',kind,id:year+':'+i,seasonId:year,value:{year}});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
 c.repo=repo;run('careerStore=repo');await run("go('Player stats')");assert.deepEqual(Array.from(run('playerStatsYears()')),[2026,2025,1997]);assert.equal((await repo.archivePage('B','statsArchive',{seasonId:1997})).rows.length,3);repo.close();
 console.log('PASS real IndexedDB archive years, duplicate-year deduplication, historical rows and stats navigation');
})().catch(e=>{console.error(e);process.exitCode=1});
