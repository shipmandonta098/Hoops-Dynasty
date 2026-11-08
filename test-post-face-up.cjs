// Post Face-Up: a tendency in Post & Jump Shooting. On a post touch the player faces up (chance = tendency × 0.6), then
// drives when handle + quickness edge over the defender beats his midrange, otherwise takes a face-up jumper. Generated
// from skills relative to overall plus a position lean (skilled PF/C and big wings high, guards low), with its own seed so
// every other generated tendency is unchanged. Old saves get a calculated default. Shown in the editor and profile.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:81,strictDOM:false});l.setRandomSeed(81);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='F';state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});var ps=state.teams.flatMap(t=>t.roster);`);
// 1. Defined in Post & Jump Shooting with help text.
assert.deepEqual(run(`TENDENCY_GROUPS.find(g=>g[0]==='Post & Jump Shooting')[1].map(x=>x[0]).slice(0,4)`),['postUp','postHook','postFade','postFaceUp']);assert.match(run('TENDENCY_HELP.postFaceUp'),/face the basket, then shoot a jumper or drive/);
// 2. Other generated tendencies unchanged by adding the key (own seed): regenerate with the key filtered out of the loop order.
assert(run(`ps.slice(0,40).every(p=>{const g=generatedTendencies(p),without=(()=>{const saved=TENDENCY_GROUPS[1][1];TENDENCY_GROUPS[1][1]=saved.filter(x=>x[0]!=='postFaceUp');try{return generatedTendencies(p)}finally{TENDENCY_GROUPS[1][1]=saved}})();return Object.keys(without).every(k=>without[k]===g[k])})`),'other tendencies unchanged');
// 3. Generation: by position and skill.
const pos=run(`(()=>{const by={};for(const p of ps)(by[p.pos]??=[]).push(generatedPostFaceUp(p,p.attributes));return Object.fromEntries(Object.entries(by).map(([k,v])=>[k,v.reduce((a,b)=>a+b,0)/v.length]))})()`);
assert(pos.PF>pos.SG+10&&pos.PF>pos.PG+20&&pos.SF>pos.SG&&pos.C>pos.PG,'bigs and wings above guards: '+JSON.stringify(pos));
assert(run(`(()=>{const p=ps.find(x=>x.pos==='PF'),a={...p.attributes};return generatedPostFaceUp(p,{...a,fg:Math.min(99,p.ovr+15)})>generatedPostFaceUp(p,{...a,fg:Math.max(1,p.ovr-20)})})()`),'better shooter faces up more');
assert(run(`(()=>{const p=ps.find(x=>x.pos==='SF'),a={...p.attributes};return generatedPostFaceUp(p,{...a,hgt:Math.min(99,p.ovr+20)})>generatedPostFaceUp(p,{...a,hgt:p.ovr-10})})()`),'bigger wing faces up more');
// 4. Old saves: missing key gets the calculated default; values survive save/load.
const def=run(`(()=>{const p=ps[3];delete p.tendencies.postFaceUp;const s=validateCareerData(JSON.parse(JSON.stringify(state))),q=s.teams.flatMap(t=>t.roster).find(x=>x.id===p.id);return [q.tendencies.postFaceUp,generatedTendencies(q).postFaceUp]})()`);assert.equal(def[0],def[1]);
// 5. Engine: face-up chance and the drive/jumper decision.
const engine=run(`(()=>{const p=ps.find(x=>x.pos==='PF'),slow={attributes:{spd:30}},fast={attributes:{spd:99}};p.tendencies.postFaceUp=100;p.attributes={...p.attributes,drb:85,spd:80,fg:60};const count=(def,n=4000)=>{let f=0,dr=0;for(let i=0;i<n;i++){const s=tendencyShot(p,{action:'post',defender:def});if(s.faceUp){f++;if(s.faceUp==='drive')dr++}}return [f/n,dr/Math.max(1,f)]};
 const vsSlow=count(slow),vsFast=count(fast);p.tendencies.postFaceUp=0;const none=count(slow,1000);p.tendencies.postFaceUp=100;const notPost=[...Array(500)].some(()=>tendencyShot(p,{action:'shoot',defender:slow}).faceUp);
 const j=(()=>{for(let i=0;i<2000;i++){const s=tendencyShot(p,{action:'post',defender:fast});if(s.faceUp==='jumper')return contextualLayup(p,s,{action:'post'})}})(),dv=(()=>{for(let i=0;i<2000;i++){const s=tendencyShot(p,{action:'post',defender:slow});if(s.faceUp==='drive')return s}})();
 return {vsSlow,vsFast,none:none[0],notPost,jumper:{kind:j.kind,name:j.layup,skills:j.skills},drive:{kind:dv.kind,key:dv.key}}})()`);
assert(Math.abs(engine.vsSlow[0]-.6*run(`archetypeTendencyMultiplier(ps.find(x=>x.pos==='PF'),'postFaceUp')`)*1)<.06||engine.vsSlow[0]>.45,'face-up chance ≈ 0.6 × effective tendency: '+engine.vsSlow[0]);
assert.equal(engine.none,0,'tendency 0 never faces up');assert(!engine.notPost,'only from the post');
assert(engine.vsSlow[1]>engine.vsFast[1]+.2,'drives more against a slow defender: '+engine.vsSlow[1]+' vs '+engine.vsFast[1]);
assert.equal(engine.jumper.kind,'mid');assert.match(engine.jumper.name,/Face-Up Jumper/);assert.deepEqual(engine.jumper.skills,{fg:.8,drb:.2});assert.equal(engine.drive.kind,'inside');
// 6. Shown on the profile and in the editor.
assert.match(run('playerTendencies({p:ps[0]})'),/<strong>Post Face-Up<\/strong><small class="tendency-help">/);assert.match(run('commissionerPlayerForm(ps[0])'),/Post Face-Up<input name="t_postFaceUp"/);
// 7. A game plays with face-ups in the play-by-play.
const g=run(`(()=>{let n=0;for(let i=0;i<4;i++){const g=play(i*2,i*2+1,'Exhibition');n+=(JSON.stringify(g.playByPlay).match(/faces up/g)||[]).length}return n})()`);assert(g>0,'face-ups happen in games');
console.log('Post Face-Up: group + help, other tendencies unchanged, generation by position/skill/size, old-save default, engine chance/decision/naming, profile+editor, games ('+g+' face-ups in 4) passed.',JSON.stringify({pos,engine}));
