const {spawn}=require('child_process');
const jobs=['nba','wnba'].flatMap(l=>['no-fouling','no-choice','timing-only'].map(c=>[l,c]));let failures=0;
async function work(){while(jobs.length){const [league,c]=jobs.shift();await new Promise(resolve=>{const p=spawn(process.execPath,['--max-old-space-size=512','dev/phase5-diagnostics.cjs',league,'200'],{env:{...process.env,P5_CASE:c},stdio:'inherit'});p.on('exit',code=>{if(code)failures++;resolve()})})}}
Promise.all([work(),work()]).then(()=>{process.exitCode=failures?1:0});
