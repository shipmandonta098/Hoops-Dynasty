const {spawn}=require('child_process'),fs=require('fs');
const leagues=process.argv[2]?[process.argv[2]]:['nba','wnba'];if(leagues.some(l=>!['nba','wnba'].includes(l)))throw Error('Unknown league');
const first=Number(process.argv[3]||101),last=Number(process.argv[4]||110);if(first<101||last>110||first>last)throw Error('Seed range must be within 101–110');
const jobs=leagues.flatMap(league=>Array.from({length:last-first+1},(_,i)=>[league,first+i]));let failed=0;
async function worker(){while(jobs.length){const [league,seed]=jobs.shift(),file=`dev/balance-audit/secondary-${league}-${seed}.json`;if(fs.existsSync(file))continue;await new Promise(resolve=>{const p=spawn(process.execPath,['dev/audit-competitiveness.cjs',league,''+seed,'secondary'],{stdio:['ignore','pipe','pipe']});p.stdout.on('data',s=>process.stdout.write(s));p.stderr.on('data',s=>process.stderr.write(s));p.on('error',e=>{failed++;console.error(e)});p.on('close',(code,signal)=>{if(code!==0||signal||!fs.existsSync(file)){failed++;console.error('FAILED',league,seed,code,signal)}resolve()})})}}
Promise.all([worker(),worker()]).then(()=>{console.log('BATCH COMPLETE failures',failed);process.exitCode=failed?1:0});
