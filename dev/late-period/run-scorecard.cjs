// Phase 13-style season scorecard for the late-period change on the fresh seeds in reserved-seeds.json.
// Usage (repo root): node dev/late-period/run-scorecard.cjs <label=lpcand> [controlRoot] [workers=4]
// Runs dev/audit-phase13-season.cjs for every reserved seed in this checkout (label) and, when a control
// checkout path is given (e.g. a worktree of main), the same seeds there as label 'lpctrl'. Season files
// land in each checkout's dev/phase13/; summarize with dev/late-period/scorecard.py.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const label=process.argv[2]||'lpcand',control=process.argv[3],workers=+(process.argv[4]||4);
const seeds=JSON.parse(fs.readFileSync(path.join(__dirname,'reserved-seeds.json'))).seeds;
const jobs=[],root=path.resolve(__dirname,'../..');
for(const [cwd,lab] of [[root,label],...(control?[[path.resolve(control),'lpctrl']]:[])])for(const league of ['nba','wnba'])for(const seed of seeds[league])jobs.push({cwd,lab,league,seed});
let cursor=0;const failures=[];
async function worker(){while(cursor<jobs.length){const j=jobs[cursor++],out=path.join(j.cwd,`dev/phase13/${j.lab}-${j.league}-${j.seed}.json`);if(fs.existsSync(out))continue;
 const code=await new Promise(r=>{const p=spawn(process.execPath,['dev/audit-phase13-season.cjs',j.league,String(j.seed),j.lab],{cwd:j.cwd,stdio:['ignore','ignore','inherit']});p.on('exit',r);p.on('error',()=>r(-1))});
 console.log(new Date().toISOString(),j.lab,j.league,j.seed,code===0?'done':'FAILED '+code);if(code!==0)failures.push(j);}}
Promise.all(Array.from({length:workers},worker)).then(()=>{console.log('SCORECARD FINISHED failures',failures.length);if(failures.length)process.exitCode=1});
