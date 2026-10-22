const {spawn}=require('child_process'),fs=require('fs');let i=0;
const jobs=[...['baseline','145'].flatMap(label=>[111,112,113,114,115].map(seed=>({seed,label})))];
async function worker(){while(i<jobs.length){const {seed,label}=jobs[i++];const output=`dev/phase13/cal${label}-wnba-${seed}.json`;if(fs.existsSync(output))continue;await new Promise((res,rej)=>{const p=spawn(process.execPath,['dev/audit-phase13-season.cjs','wnba',String(seed),'cal'+label],{env:{...process.env,...(label==='baseline'?{}:{P13_SPREAD:'1.45'})},stdio:'inherit'});p.on('exit',c=>c?rej(Error(c)):res())})}}
Promise.all(Array.from({length:6},worker)).catch(e=>{console.error(e);process.exitCode=1});
