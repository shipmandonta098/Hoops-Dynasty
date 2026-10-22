const {spawn}=require('child_process'),fs=require('fs');
const mode=process.argv[2],jobs=[];
if(mode==='seasons')for(const league of ['nba','wnba'])for(let seed=101;seed<=110;seed++)jobs.push(['dev/audit-phase6-season.cjs',league,String(seed),'phase6']);
else {for(const league of ['nba','wnba'])for(const name of ['identical','selection','defense','poor-defense','coaching','bench','fatigue','three','rebounds','handling','pace'])jobs.push(['dev/phase6-diagnostic.cjs',league,name,'160','901']);for(const league of ['nba','wnba'])for(const seed of [301,302,303,304])jobs.push(['dev/phase6-diagnostic.cjs',league,'league','160',String(seed)]);}
jobs.reverse();let i=0,fail=0;
async function worker(){while(i<jobs.length){const args=jobs[i++];await new Promise(resolve=>{const p=spawn(process.execPath,['--max-old-space-size=768',...args],{stdio:'inherit'});p.on('exit',code=>{if(code){fail++;console.error('FAILED',args)}resolve()})})}}
Promise.all(Array.from({length:2},worker)).then(()=>{console.log('COMPLETE',mode,'failures',fail);process.exitCode=fail?1:0});
