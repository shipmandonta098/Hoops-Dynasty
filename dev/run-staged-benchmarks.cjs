/* Opt-in developer stress test. Stop immediately when a smaller size fails. */
const {spawnSync}=require('node:child_process');
for(const seasons of [1,5,10,25,50,100]){
 const result=spawnSync(process.execPath,['dev/benchmark.cjs',String(seasons),process.argv[2]||'2026',`dev/benchmark-${seasons}.json`],{stdio:'inherit'});
 if(result.status!==0){console.error(`[FAST SIM] Stopped at ${seasons} seasons. Larger benchmarks were not attempted.`);process.exitCode=result.status||1;break;}
}
