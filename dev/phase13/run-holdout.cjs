const fs=require('fs'),crypto=require('crypto'),{spawn}=require('child_process');
const P='dev/phase13',freeze=JSON.parse(fs.readFileSync(P+'/freeze.json')),reserved=JSON.parse(fs.readFileSync(P+'/reserved-seeds.json'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function verify(){for(const [file,hash]of Object.entries(freeze.files))if(sha(fs.readFileSync(file))!==hash)throw Error('Frozen input changed: '+file);}
if(process.env.P13_SPREAD||process.env.HOOPS_VARIANT||process.env.P5_BASELINE)throw Error('Holdout must run unmodified production');
verify();const jobs=Object.entries(reserved.seeds).flatMap(([league,seeds])=>seeds.map(seed=>({league,seed})));let cursor=0;
const audit={startedAtUTC:new Date().toISOString(),frozenBuildSHA256:freeze.productionBuildSHA256,completed:[],failures:[]};
fs.writeFileSync(P+'/holdout-run.json',JSON.stringify(audit,null,2));
async function worker(){while(cursor<jobs.length){const job=jobs[cursor++],{league,seed}=job;verify();const out=`${P}/holdout-${league}-${seed}.json`;
 if(fs.existsSync(out)){const d=JSON.parse(fs.readFileSync(out));if(d.frozenBuildSHA256!==freeze.productionBuildSHA256)throw Error('Wrong build for '+out);audit.completed.push({...job,reused:true});continue;}
 const code=await new Promise(resolve=>{const p=spawn(process.execPath,['dev/audit-phase13-season.cjs',league,String(seed),'holdout'],{env:{...process.env,P13_FROZEN_HASH:freeze.productionBuildSHA256},stdio:'inherit'});p.on('exit',resolve);p.on('error',()=>resolve(-1));});
 if(code===0)audit.completed.push(job);else audit.failures.push({...job,exitCode:code});
 fs.writeFileSync(P+'/holdout-run.json',JSON.stringify(audit,null,2));
}}
Promise.all(Array.from({length:10},worker)).then(()=>{verify();audit.finishedAtUTC=new Date().toISOString();audit.hashesUnchanged=true;fs.writeFileSync(P+'/holdout-run.json',JSON.stringify(audit,null,2));if(audit.failures.length)process.exitCode=1;console.log('HOLDOUT FINISHED',audit.completed.length,'failures',audit.failures.length);}).catch(e=>{console.error(e);process.exitCode=1});
