const fs=require('fs'),{spawn}=require('child_process');
const jobs=['nba','wnba'].flatMap(l=>Array.from({length:10},(_,i)=>[l,String(101+i)]));let fail=0;
async function work(){while(jobs.length){const job=jobs.shift();if(fs.existsSync(`dev/balance-audit/phase5-${job[0]}-${job[1]}.json`))continue;
 await new Promise(resolve=>{const child=spawn(process.execPath,['--max-old-space-size=768','dev/audit-phase5-season.cjs',...job,'phase5'],{stdio:'inherit',env:{...process.env,HOOPS_VARIANT:''}});child.on('exit',(code,signal)=>{if(code!==0){fail++;console.error('FAILED',job,code,signal)}resolve()});});
}}
Promise.all(Array.from({length:2},work)).then(()=>{console.log('DONE failures',fail);process.exitCode=fail?1:0});
