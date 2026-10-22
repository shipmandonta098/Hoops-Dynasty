const {spawn}=require('child_process');
(async()=>{
 for(const seed of [104,105]){
  await new Promise((resolve,reject)=>{
   const p=spawn(process.execPath,['dev/audit-phase8-season.cjs','wnba',String(seed),'phase11hq'],{env:{...process.env,HOOPS_VARIANT:'dev/phase11/hold-quick.cjs'},stdio:'inherit'});
   p.on('exit',code=>code!==0?reject(Error(seed)):resolve());
  });
 }
})().catch(e=>{console.error(e);process.exitCode=1});
