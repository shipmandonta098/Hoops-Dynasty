const {loadLeague}=require('./load-league.cjs');const x=loadLeague({strictDOM:false});const fixture=x.run("(()=>{const d=makeDraft();d.gmName='Regression';return JSON.stringify(buildSetupCareer(d))})()");
const fs=require('fs'),http=require('http');const root=require('path').join(__dirname,'../dist/');const assert=require('node:assert/strict');const server=http.createServer((q,r)=>{const p=q.url==='/'?'index.html':q.url.slice(1);const send=()=>{try{r.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.css')?'text/css':'text/html');r.end(fs.readFileSync(root+p))}catch{r.writeHead(404).end()}};if(p==='draft-roster-rules.js')setTimeout(send,2000);else send()});
(async()=>{await new Promise(r=>server.listen(8766,r));const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');const binary=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/@sparticuz/chromium':'@sparticuz/chromium');const b=await chromium.launch({executablePath:await binary.executablePath(),args:binary.args,headless:true});try{const p=await b.newPage();await p.addInitScript(s=>localStorage.setItem('hoops-dynasty-v1',s),fixture);await p.goto('http://localhost:8766');await p.evaluate(()=>careerReady);assert.equal(await p.evaluate(()=>careerStorageError),'');
for(const custom of [false,true]){
 await p.getByRole('button',{name:'NEW CAREER',exact:true}).click();await p.locator('[name="gmName"]').fill(custom?'Custom Lottery Test':'Default Lottery Test');
 if(custom)await p.evaluate(()=>{setupDraft.leagueSettings={...setupDraft.leagueSettings,lotteryMode:'custom',lotterySelections:3,lotteryChances:'20,18,16,12,10,8,6,4,3,2,1,1,0.5,0.5'}});
 await p.getByRole('button',{name:'START CAREER',exact:true}).first().click();await p.waitForFunction(()=>!onSetup&&!onTitle&&!!activeSaveId);await p.evaluate(()=>saveQueue);
 assert.match(await p.locator('#app').innerText(),/GM DASHBOARD/i);
 const saved=await p.evaluate(()=>({id:activeSaveId,settings:JSON.stringify(state.leagueSettings)}));
 await p.reload();await p.evaluate(()=>careerReady);await p.getByRole('button',{name:'LOAD CAREER',exact:true}).click();
 await p.locator(`button[onclick="openSavedCareer('${saved.id}')"]`).click();await p.waitForFunction(()=>!onTitle&&!onLoadCareers);assert.match(await p.locator('#app').innerText(),/GM DASHBOARD/i);
 assert.equal(await p.evaluate(()=>JSON.stringify(state.leagueSettings)),saved.settings);
 await p.evaluate(()=>returnToTitle());console.log('PASS: '+(custom?'custom':'default')+' Start Career → IndexedDB → reload → Load Career → GM Dashboard; settings preserved');
}
console.log('PASS: delayed draft script with legacy save migration; no startup error');}finally{await b.close();server.close()}})().catch(e=>{console.error(e);process.exitCode=1});
