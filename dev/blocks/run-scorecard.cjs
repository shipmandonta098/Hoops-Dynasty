// Season scorecard for the help-side blocking change on the fresh seeds in reserved-seeds.json.
// Usage (repo root): node dev/blocks/run-scorecard.cjs [controlRoot] [workers=4]
// Runs dev/audit-phase13-season.cjs for each reserved seed here (label blkcand) and, if a control checkout
// (e.g. a worktree of main) is given, the same seeds there (label blkctrl). Summarize with scorecard.py.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process');
const control=process.argv[2],workers=+(process.argv[3]||4),root=path.resolve(__dirname,'../..');
const seeds=JSON.parse(fs.readFileSync(path.join(__dirname,'reserved-seeds.json'))).seeds,jobs=[];
for(const [cwd,lab] of [[root,'blkcand'],...(control?[[path.resolve(control),'blkctrl']]:[])])for(const league of ['nba','wnba'])for(const seed of seeds[league])jobs.push({cwd,lab,league,seed});
let cursor=0;const failures=[];
async function worker(){while(cursor<jobs.length){const j=jobs[cursor++],out=path.join(j.cwd,`dev/phase13/${j.lab}-${j.league}-${j.seed}.json`);if(fs.existsSync(out))continue;
 const code=await new Promise(r=>{const p=spawn(process.execPath,['dev/audit-phase13-season.cjs',j.league,String(j.seed),j.lab],{cwd:j.cwd,stdio:['ignore','ignore','inherit']});p.on('exit',r);p.on('error',()=>r(-1))});
 console.log(new Date().toISOString(),j.lab,j.league,j.seed,code===0?'done':'FAILED '+code);if(code!==0)failures.push(j);}}
Promise.all(Array.from({length:workers},worker)).then(()=>{console.log('SCORECARD FINISHED failures',failures.length);if(failures.length)process.exitCode=1});
