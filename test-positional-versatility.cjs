// Positional versatility, both leagues.
// Stage 1: positional fit judges height against the player's own league (women's position heights for women), so WNBA
// players get secondary positions in both directions, like NBA players; NBA (men's) fit is unchanged.
// Stage 2: starting lineups use a bounded positional preference (OVR + 4 main / 3 secondary / +2…−8 by fit), so natural fits win
// close calls, clearly better players start out of position, and a guard isn't put at center over a real big.
// Stage 3: 40-minute games split bench minutes by quality (as 48-minute games do); team total and starter minutes unchanged.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const leagues={};
for(const g of ['male','female']){const l=loadLeague({seed:g==='male'?71:72,strictDOM:false});l.setRandomSeed(g==='male'?71:72);l.context.gender=g;
 l.run(`render=()=>{};toast=()=>{};save=async()=>true;confirm=()=>true;var d=makeDraft();d.gmName='Versatility';if(gender==='female'){d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});const plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};syncAlignment(d)}state=validateCareerData(buildSetupCareer(d));
  var base={hgt:60,stre:60,spd:60,jmp:60,endu:60,dur:80,lay:60,post:60,dnk:60,fg:60,tp:60,ft:70,drb:60,pss:60,per:60,rim:60,stl:60,sbl:60,reb:60,oiq:60,diq:60};
  var mk=(pos,h,a={})=>({id:900000,pos,gender,ovr:75,bio:{heightInches:h},attributes:{...base,...a}});`);
 leagues[g]=l}
const run=(g,c)=>{const v=leagues[g].run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
const sec=(g,pos,h,a)=>run(g,`computeSecondaryPositions(mk('${pos}',${h},${JSON.stringify(a)}))[0]||'none'`);
// The same archetypes at NBA and WNBA heights (same place in each league's height range) get the same positions.
const A={powerWing:['SF',80,73,{per:68,tp:60,reb:78,stre:76,diq:68,stl:58,fg:62,post:66,sbl:60,drb:58},'PF'],
 tall3andD:['SG',79,71,{tp:80,per:80,diq:74,stl:70,fg:70,drb:62,pss:55,reb:58},'SF'],
 comboGuard:['SG',75,69,{pss:78,drb:80,oiq:75,tp:78,per:65,fg:72},'PG'],
 stretchFour:['PF',81,73,{tp:80,fg:72,reb:64,stre:60,post:55,sbl:50,per:66,diq:66,stl:56},'SF'],
 rimProtector:['PF',84,74,{reb:85,sbl:85,rim:80,stre:80,tp:40,post:60},'C'],
 stretchFive:['C',84,77,{reb:70,sbl:66,rim:66,stre:66,post:60,tp:78,fg:72},'PF'],
 traditionalC:['C',85,78,{reb:82,sbl:80,rim:80,stre:80,post:72,tp:25},'none']};
for(const [name,[pos,hm,hw,a,want]] of Object.entries(A)){assert.equal(sec('male',pos,hm,a),want,'NBA '+name);assert.equal(sec('female',pos,hw,a),want,'WNBA '+name)}
// Height scale: identity for men; women's heights map onto the men's scale in order, centers to center height.
assert.equal(run('female','heightOnFitScale(80,"male")'),80);
const scale=run('female','[65,68,71,74,77,80].map(h=>heightOnFitScale(h,"female"))');assert(scale.every((x,i)=>!i||x>scale[i-1]),'monotonic');
assert(Math.abs(scale[4]-86)<1.5&&Math.abs(scale[1]-75.3)<1.5,'a 6\'5" center ≈ 7\'2", a 5\'8" guard ≈ 6\'3": '+scale);
// League distribution: WNBA secondaries go both ways (bigger and smaller), as in the NBA.
for(const g of ['male','female']){const d=run(g,`(()=>{const P=['PG','SG','SF','PF','C'],c={};for(const p of allLeaguePlayers()){const s=secondaryPositions(p)[0];if(!s)continue;const k=P.indexOf(s)>P.indexOf(p.pos)?'up':'down';c[p.pos+k]=(c[p.pos+k]||0)+1}return c})()`);
 for(const k of ['PGup','SGup','SGdown','SFup','SFdown','PFup','PFdown','Cdown'])assert(d[k]>0,g+' has '+k+': '+JSON.stringify(d))}
console.log('Stage 1 (league-relative positional fit): NBA and WNBA archetypes agree, height scale, two-way secondaries in both leagues passed.');

// Stage 2. A club built by hand: realistic generated ratings for each position and mid-range heights for the league.
for(const g of ['male','female'])leagues[g].run(`var club=state.teams[3];var H=gender==='female'?{PG:68,SG:69,SF:72,PF:72,C:77}:{PG:74,SG:77,SF:80,PF:82,C:85};
 var build=specs=>{club.roster.forEach((p,i)=>{const [pos,ovr,sec]=specs[i]||['C',45,[]];Object.assign(p,{gender,pos,ovr,injuredUntil:0,medicalInfo:undefined,attributes:null,tendencies:null,archetype:undefined,bio:{...p.bio,heightInches:H[pos]}});withBasketballAttributes(p);p.secondaryPos=sec||[]});delete club.rotationPlan;club.lineupMode='auto'};
 var starters=()=>{const a=lineupAssignment(club);return Object.fromEntries(Object.entries(a).map(([pos,id])=>{const p=club.roster.find(p=>p.id===id);return [pos,p.ovr+' '+p.pos]}))};`);
for(const g of ['male','female']){const L=g==='male'?'NBA':'WNBA';
 // A natural fit wins a close call: a 76 SG starts at SG over a 77 SF (a near fit at SG is worth at most +2, the main position +4).
 leagues[g].run(`build([['PG',80],['SG',76],['SF',82],['PF',78],['C',78],['SF',77]])`);assert.equal(run(g,'starters().SG'),'76 SG',L+' close call → natural SG');
 // A clearly better player starts out of position: a 93 PG doesn't sit behind an 80 PG for a 74 SG.
 leagues[g].run(`build([['PG',93],['PG',80],['SG',74],['SF',76],['PF',76],['C',76]])`);assert(Object.values(run(g,'starters()')).includes('80 PG')&&Object.values(run(g,'starters()')).includes('93 PG'),L+' both point guards start');
 // A 45 end-of-bench center doesn't start over a 70 guard; with no healthy big at all the lineup goes small.
 leagues[g].run(`build([['PG',80],['PG',78],['SG',77],['SF',72],['SG',70],['SF',66]])`);assert(!Object.values(run(g,'starters()')).includes('45 C'),L+' no 45 C over 70+ players');
 // But a guard isn't put at center over a real big: an 80 C starts over an 85 PG.
 leagues[g].run(`build([['PG',88],['PG',85],['SG',80],['SF',80],['PF',80],['C',80]])`);assert.equal(run(g,'starters().C'),'80 C',L+' real center over a guard');
 // The rotation view explains an auto out-of-position starter.
 leagues[g].run(`build([['PG',93],['PG',80],['SG',74],['SF',76],['PF',76],['C',76]]);club.id=controlledTeamId();rotationDraft=null`);
}
const reason=run('male',`(()=>{const st=lineupAssignment(club),out=lineupOutOfPosition(club,st);return out.map(x=>lineupOutReason(club,st,x)).join()})()`);assert.match(reason,/ahead of .*74 OVR SG/,'reason names the weaker natural fit: '+reason);
console.log('Stage 2 (bounded lineup preference): close calls go to natural fits, clearly better players start out of position, no scrub center over real players, no guard at center over a real big, reasons shown — both leagues passed.');

// Stage 3. Every WNBA team, healthy: 200 minutes, nobody over 40, no reserve above a starter, bench minutes follow OVR.
const m3=run('female',`state.teams.map(t=>{for(const p of t.roster){p.injuredUntil=0;p.medicalInfo=undefined}applyAutoLineup(t);const m=allocateGameMinutes(t),st=t.roster.slice(0,5).map(p=>m.get(p.id)),bench=[...t.roster.slice(5)].sort((a,b)=>b.ovr-a.ovr||a.id-b.id).map(p=>[p.ovr,m.get(p.id)]);
  return {total:[...m.values()].reduce((a,b)=>a+b,0),pm:t.roster.reduce((n,p)=>n+playerMinutes(p,t),0),max:Math.max(...m.values()),minStarter:Math.min(...st),bench}})`);
for(const t of m3){assert.equal(t.total,200);assert.equal(t.pm,200,'playerMinutes uses the same split');assert(t.max<=40);assert(t.bench.every(([,x])=>x<=t.minStarter),'no reserve above a starter');
 assert(t.bench.every(([o,x],i)=>!i||x<=t.bench[i-1][1]||o===t.bench[i-1][0]),'bench minutes follow OVR: '+JSON.stringify(t.bench));assert(t.bench[0][1]>=2*t.bench.at(-1)[1]&&t.bench[0][1]>=12,'the best reserve plays real minutes: '+JSON.stringify(t.bench))}
console.log('Stage 3 (40-minute bench minutes by quality): totals, caps, no reserve above a starter, minutes by OVR passed for every WNBA team.');
