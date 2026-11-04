// Positional versatility, both leagues.
// Stage 1: positional fit judges height against the player's own league (women's position heights for women), so WNBA
// players get secondary positions in both directions, like NBA players; NBA (men's) fit is unchanged.
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
