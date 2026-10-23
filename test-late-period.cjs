// Late-period strategies: end-of-quarter live clock (2-for-1, last-shot hold, buzzer heave) and hack-a
// intentional fouling under the era away-from-play rule. Scorecard: dev/late-period/run-scorecard.cjs.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:21,strictDOM:false});l.setRandomSeed(21);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
const setup=(league,year,extra='')=>{l.context.L=league;l.context.Y=year;l.run(`var d=makeDraft();d.gmName='Late';d.year=Y;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})${extra}};state=validateCareerData(buildSetupCareer(d));render=()=>{};`)};
setup('nba',2025);
// 1. Quarter-end policy windows (shot clock 24).
const plan=(rem,sc,tac)=>run(`(()=>{const m={};for(let i=0;i<2000;i++){const p=quarterEndPlan(${rem},${sc},${tac},64);m[p.mode]=(m[p.mode]||0)+1;if(p.mode==='lastShot'&&(${rem}-p.setup<5||${rem}-p.setup>7))return 'bad setup';if(p.setup<0||p.setup>${rem})return 'bad setup'}return m})()`);
assert.deepEqual(Object.keys(plan(2,24,80)),['heave']);
const hi=plan(34,24,95),lo=plan(34,24,45);assert(hi.twoForOne>lo.twoForOne,'2-for-1 adherence scales with tactics');assert(hi.twoForOne/2000>.85&&lo.twoForOne/2000<.65);
for(const rem of [26,27,41,50])assert.equal(plan(rem,24,95).twoForOne,undefined,'no 2-for-1 outside shot clock +4..+16 at '+rem);
const hold=plan(18,24,70);assert(hold.lastShot>1500&&hold.lastShot<2000,'holds for the last shot when the game clock is under the shot clock');
assert.equal(plan(6,24,95).lastShot,undefined,'no hold with too little time; the final-shot path takes over');
// 2. Away-from-play rule by era and setting.
const rule=(league,year,setting,period)=>{setup(league,year,setting?`,awayFromPlayRule:'${setting}'`:'');return run(`awayFromPlayRuleApplies(${period})`)};
assert.equal(rule('nba',2015,null,1),false);assert.equal(rule('nba',2015,null,3),true);assert.equal(rule('nba',2015,null,4),true,'OT');
assert.equal(rule('nba',2016,null,0),true,'2016–17 on: every period');
assert.equal(rule('wnba',2024,null,1),false);assert.equal(rule('wnba',2024,null,3),true);assert.equal(rule('wnba',2010,null,3),false);
assert.equal(rule('wnba',2024,'allPeriods',1),true);assert.equal(rule('nba',2025,'finalPeriod',1),false);assert.equal(rule('nba',2025,'none',3),false);
assert.throws(()=>run(`readLeagueSettings({...leagueRules(),awayFromPlayRule:'sometimes'})`),/Away-from-play/);
setup('nba',2025);assert.equal(run(`(()=>{const s={...leagueRules()};delete s.awayFromPlayRule;return readLeagueSettings(s).awayFromPlayRule})()`),'era','older saves read the era default');
assert(run(`intentionalFoulRate(80,'Balanced',2025)<intentionalFoulRate(80,'Balanced',2010)&&intentionalFoulRate(80,'Developmental',2010)<intentionalFoulRate(80,'Win-Now',2010)`));
// 3. Real games: end-of-quarter possessions run on the live clock, play-by-play names the strategies,
//    the score and box stay consistent, and counters are attached to (not saved with) the result.
const games=run(`(()=>{const out=[];for(let i=0;i<20;i++){const g=play(i%15*2,i%15*2+1,'Exhibition');const pts=g.box.reduce((n,p)=>n+p.pts,0);out.push({s:g.lateStrategy,ok:pts===g.sa+g.sb&&g.summaryData.complete,pbp:i===0?g.playByPlay:[],saved:Object.keys(g).includes('lateStrategy')})}return out})()`);
assert(games.every(g=>g.ok),'score conservation');assert(games.every(g=>!g.saved),'counters are not saved with results');
const tot=k=>games.reduce((n,g)=>n+g.s[k][0]+g.s[k][1],0);
assert(games.every(g=>g.s.endQuarterPossessions>=6),'final minute of Q1–Q3 is played possession by possession');
assert(tot('twoForOne')>0&&tot('lastShotHolds')>0&&tot('heaves')>0);assert(tot('twoForOneLastPossession')<=tot('twoForOne'));
const pbp=games[0].pbp;assert(pbp.some(t=>/End of Q1\./.test(t))&&pbp.some(t=>/Q[1-3] 0:\d\d .*(pushes for a 2-for-1|holds for the last shot|heave)/.test(t)),'strategies in play-by-play');
// 4. Hack-a: a 20% free-throw starter gets fouled intentionally when the defense is in the bonus; never in
//    the last two minutes of a period where the away-from-play rule applies (Q4/OT before 2016–17).
const hack=year=>{setup('nba',year);return run(`(()=>{const t=state.teams[0],p=[...t.roster].sort((a,b)=>b.ovr-a.ovr)[0];p.attributes.ft=1;state.teams.forEach(c=>coachFor(c).attributes&&Object.keys(coachFor(c).attributes).forEach(k=>coachFor(c).attributes[k]=95));
 let fouls=0,subs=0,late=[],lines=[];for(let i=0;i<12;i++){const g=play(0,1+i%5*2,'Exhibition');fouls+=g.lateStrategy.intentionalFouls[1];subs+=g.lateStrategy.hackSubOuts[0];
  const h=g.playByPlay.filter(x=>/intentionally fouls/.test(x));lines.push(...h);late.push(...h.filter(x=>{const m=x.match(/ (Q\\d|OT\\d) (\\d+):(\\d+) /);return m&&+m[2]*60+ +m[3]<=120&&(${year}>=2016||m[1]==='Q4'||m[1].startsWith('OT'))}))}
 return {fouls,subs,late,lines:lines.slice(0,3),name:p.name}})()`)};
const classic=hack(2010),modern=hack(2025);
assert(classic.fouls>0,'hack-a happens for a 20% shooter');assert(classic.fouls>=modern.fouls,'rarer in the modern era');
assert.deepEqual(classic.late,[]);assert.deepEqual(modern.late,[]);
assert(classic.lines.every(x=>x.includes(classic.name)),'the worst free-throw shooter is the target');assert(classic.subs>0,'the offensive coach can sub the target out');
console.log('Late period: quarter-end 2-for-1/hold/heave windows, away-from-play era rule and setting, live end-of-quarter play, and hack-a targeting passed.',JSON.stringify({classic:{fouls:classic.fouls,subs:classic.subs},modern:{fouls:modern.fouls}}));
