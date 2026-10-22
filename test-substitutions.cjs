const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=fresh();const club=team(),rows=new Map(club.roster.map(p=>[p.id,{mp:0,pf:0}])),events=[],rt=createGameRotation(club);
refreshGameRotation(club,rt,0,rows,events);const opening=[...rt.court];refreshGameRotation(club,rt,.5,rows,events);assert.deepEqual([...rt.court],opening);
const tired=club.roster.find(p=>rt.court.has(p.id));rt.stamina.set(tired.id,40);refreshGameRotation(club,rt,2,rows,events);assert(!rt.court.has(tired.id));assert.equal(rt.court.size,5);
const before=rt.stamina.get(tired.id);accrueRotationMinutes(club,rt,rows,1);assert(rt.stamina.get(tired.id)>before);
const foulPlayer=club.roster.find(p=>rt.court.has(p.id));rows.get(foulPlayer.id).pf=6;refreshGameRotation(club,rt,2.1,rows,events);assert(!rt.court.has(foulPlayer.id));rows.get(foulPlayer.id).pf=0;
for(const p of club.roster){rows.get(p.id).pf=0;rt.stamina.set(p.id,50)}rt.held.clear();
refreshGameRotation(club,rt,44,rows,events,4);const starters=new Set(ROTATION_POSITIONS.map(pos=>rt.plan.depth[pos][0]));assert([...rt.court].every(id=>starters.has(id)));
refreshGameRotation(club,rt,44,rows,events,25);assert([...rt.court].every(id=>!starters.has(id)));
const r2=createGameRotation(club);for(const p of club.roster)rows.get(p.id).pf=0;refreshGameRotation(club,r2,12,rows,events);const troubled=club.roster.find(p=>r2.court.has(p.id));rows.get(troubled.id).pf=3;r2.deadBall=true;refreshGameRotation(club,r2,13,rows,events);assert(!r2.court.has(troubled.id));
assert(events.some(e=>e.includes(' in; ')&&e.includes(' out (')));console.log('PASS: controlled intervals, fatigue swaps, bench recovery, foul-outs, Q2 foul protection, clutch starters and garbage-time bench.');
`,context);
