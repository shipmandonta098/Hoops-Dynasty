const {spawn}=require('child_process');const jobs=[];
if(process.argv[2]==='season')for(const league of ['nba','wnba'])for(const seed of (league==='nba'?[101,102]:[101,102,103,104]))jobs.push(['dev/audit-phase7-season.cjs',league,''+seed,'phase7']);
else for(const variant of ['baseline','candidate'])for(const league of ['nba','wnba']){jobs.push(['dev/phase7-matchups.cjs',league,'identical','400','901',variant]);for(const world of [303,304])jobs.push(['dev/phase7-matchups.cjs',league,'league','160',''+world,variant]);}
let i=0;async function worker(){while(i<jobs.length){const args=jobs[i++];await new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{stdio:'inherit'});p.on('exit',c=>c?reject(Error(args+' exit '+c)):resolve())})}}
Promise.all(Array.from({length:3},worker)).then(()=>console.log('COMPLETE')).catch(e=>{console.error(e);process.exitCode=1});
