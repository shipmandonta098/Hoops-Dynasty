const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function loadLeague({seed=1,strictDOM=true,sourceTransform=(name,code)=>process.env.HOOPS_VARIANT?require(path.resolve(process.env.HOOPS_VARIANT))(name,code):code}={}){
 let initialized=false,value=seed>>>0;const math=Object.create(Math);math.random=()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296};
 const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
 const access=()=>{if(initialized&&strictDOM)throw Error('Unexpected DOM access in headless execution');return element};
 const context={console,performance,Math:math,Date,setTimeout,clearTimeout,setImmediate,structuredClone,AbortController,localStorage:{getItem(){return null},setItem(){throw Error('Unexpected localStorage write')}},document:{getElementById:access,querySelector:access,createElement:access,addEventListener(){},querySelectorAll(){if(initialized&&strictDOM)throw Error('Unexpected DOM query');return []},documentElement:element,body:element},addEventListener(){},scrollTo(){if(initialized&&strictDOM)throw Error('Unexpected scroll')}};
 context.window=context;vm.createContext(context);const root=path.resolve(__dirname,'..');
 for(const match of fs.readFileSync(path.join(root,'dist/index.html'),'utf8').matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)){
  const code=match[1]?fs.readFileSync(path.join(root,'dist',match[1].split('?')[0]),'utf8').replace('careerReady=initializeCareers();',''):match[2];
  vm.runInContext(sourceTransform(match[1]||'inline.js',code),context,{filename:match[1]||'inline.js'});
 }
 vm.runInContext(fs.readFileSync(path.join(__dirname,'headless-runner.js'),'utf8'),context,{filename:'headless-runner.js'});
 vm.runInContext('simulationExecution.isolated=true;',context);initialized=true;
 return {context,run:code=>vm.runInContext(code,context,{timeout:5000}),setRandomSeed:seed=>{value=seed>>>0}};
}
module.exports={loadLeague};
