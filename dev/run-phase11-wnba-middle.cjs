const {spawn}=require('child_process');Promise.all([102,103].map(seed=>new Promise((resolve,reject)=>{
 const p=spawn(process.execPath,['dev/audit-phase8-season.cjs','wnba',String(seed),'phase11hq'],{env:{...process.env,HOOPS_VARIANT:'dev/phase11/hold-quick.cjs'},stdio:'inherit'});p.on('exit',c=>c!==0?reject(Error(seed)):resolve());
}))).catch(e=>{console.error(e);process.exitCode=1});
