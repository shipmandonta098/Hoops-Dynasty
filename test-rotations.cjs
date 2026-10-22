const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`(async()=>{
 state=validateCareerData(fresh());render=()=>{};toast=()=>{};save=async()=>true;
 autoAllocateRotation();const plan=draftRotation();assert.equal(Object.values(plan.targets).reduce((a,b)=>a+b,0),240);assert.equal(rotationErrors(plan,team()).length,0);
 plan.staggerStars=true;const timeline=buildRotationTimeline(team(),plan);assert.equal(timeline.length,48);
 for(const unit of timeline)assert.equal(new Set(unit).size,5);
 for(const p of team().roster)assert.equal(timeline.filter(unit=>unit.includes(p.id)).length,plan.targets[p.id]);
 assert.deepEqual([...timeline[0]].sort(),ROTATION_POSITIONS.map(pos=>plan.depth[pos][0]).sort());
 await applyRotationPlan();assert(rotationValid(team()));assert(team().rotationPlan.staggerStars);
 const reloaded=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(reloaded.teams[0].rotationPlan,team().rotationPlan);
 const runtime=createGameRotation(team()),rows=new Map(team().roster.map(p=>[p.id,{mp:0,pf:0}])),events=[],starter=team().roster[0];
 refreshGameRotation(team(),runtime,0,rows,events);recordRotationFoul(starter,team(),runtime,rows,events);recordRotationFoul(starter,team(),runtime,rows,events);
 assert(!rotationEligible(starter,runtime,rows,11));assert(!rotationEligible(starter,runtime,rows,23));assert(rotationEligible(starter,runtime,rows,24));
 refreshGameRotation(team(),runtime,6,rows,events);assert(!runtime.court.has(starter.id));assert.equal(runtime.court.size,5);
 rows.get(starter.id).pf=6;assert(!rotationEligible(starter,runtime,rows,46));
 const result=play(0,1);for(const t of [state.teams[0],state.teams[1]]){const mins=result.box.filter(p=>p.team===t.abbr).reduce((s,p)=>s+p.mp,0);assert(Math.abs(mins/5-Math.round(mins/5))<.01);assert(mins>=239.99);assert.equal(result.box.filter(p=>p.team===t.abbr).reduce((s,p)=>s+p.pts,0),t.id===0?result.sa:result.sb)}
 assert(result.box.every(p=>p.played===(p.mp>0)));assert(result.rotationEvents.length<=120);
 rotationDraft=null;draftRotation();clearRotationMinutes();assert(rotationErrors(draftRotation(),team()).length>0);
 const html=rotationsView();for(const text of ['Primary Backup','Copy to Simulation','Stagger Stars','Stamina'])assert(html.includes(text));
 console.log('PASS: exact 240-minute schedule, five-player units, starters, draft/apply persistence, Q1 foul holds and halftime return, foul-out exclusion, actual game minutes, clear validation and UI.');
})()`,context).catch(e=>{console.error(e);process.exitCode=1});
