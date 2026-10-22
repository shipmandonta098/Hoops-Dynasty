const {spawn}=require('child_process');
const jobs=['nba','wnba'].flatMap(league=>['neutral','home','crowd-low','crowd-high','altitude'].map(scenario=>[league,scenario]));let failed=0;
async function worker(){while(jobs.length){const job=jobs.shift();await new Promise(resolve=>{const p=spawn(process.execPath,['--max-old-space-size=768','dev/phase4-diagnostics.cjs',...job,'500'],{env:{...process.env,HOOPS_VARIANT:'dev/phase4-candidate.cjs',PHASE3_LABEL:'candidate'},stdio:'inherit'});p.on('exit',(code,signal)=>{if(code!==0){failed++;console.error('FAILED',job,code,signal)}resolve()})})}}
Promise.all(Array.from({length:2},worker)).then(()=>{process.exitCode=failed?1:0});
