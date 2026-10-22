const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');
const prior=require('./transition-observers.cjs'),{candidate}=require('./running-eligibility-candidate.cjs');
const mode=process.argv[2]||'fixture',count=Number(process.argv[3]||(mode==='fixture'?150:100));
function instrument(name,source){let s=prior.instrument(name,source);if(name==='pick-and-roll.js'){
 const a='function playPickAndRoll(handler,screener,onBall,big,offense,defense,defenders,context,log){';
 assert.equal(s.split(a).length-1,1);s=s.replace(a,a+'__audit.current.pnrCalls=(__audit.current.pnrCalls||0)+1;');
 }return s;}
const base=loadLeague({strictDOM:false,sourceTransform:instrument}),exp=loadLeague({strictDOM:false,sourceTransform:(n,s)=>candidate(n,instrument(n,s))});
const rawBase=loadLeague({strictDOM:false}),rawExp=loadLeague({strictDOM:false,sourceTransform:candidate});
rawBase.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");
const fixture=JSON.parse(rawBase.run('JSON.stringify(fixture)'));for(const r of [base,exp,rawExp])r.context.fixture=fixture;
let circle=Array.from({length:30},(_,i)=>i),pairs=[];for(let round=0;round<10;round++){for(let i=0;i<15;i++){const p=[circle[i],circle[29-i]];pairs.push(round%2?p.reverse():p)}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)]}
const mean=(a,f)=>a.length?a.reduce((n,s)=>n+f(s),0)/a.length:null;
const rim=s=>s.kind==='inside'&&s.skill==='lay'&&!/Float/.test(s.name);
const cat=s=>s.kind==='three'?'three':s.skill==='dnk'?'dunk':s.skill==='post'?'post':s.kind==='mid'?'midrange':/Float/.test(s.name)?'floater':'rim';
function group(a){const f=a.filter(s=>s.recorded);return{evaluations:a.length,FGA:f.length,made:f.filter(s=>s.made).length,FG:mean(f,s=>+s.made),base:mean(a,s=>s.base),context:mean(a,s=>s.context),contextDelta:mean(a,s=>s.context-s.base),probability:mean(a,s=>s.prob),recordedProbability:mean(f,s=>s.prob),blockRate:mean(f,s=>+s.blocked),finishing:mean(f,s=>s.rating),defense:mean(f,s=>s.rim)}}
const dict=(a,k)=>Object.fromEntries([...new Set(a.map(k))].map(key=>[key,group(a.filter(s=>k(s)===key))]));
function metrics(t,games){return{PPG:t.pts/games/2,pace:t.poss/5/games/2,ORtg:t.pts/(t.poss/5)*100,FG:t.fgm/t.fga,twoP:(t.fgm-t.tpm)/(t.fga-t.tpa),threeP:t.tpm/t.tpa,FT:t.ftm/t.fta,eFG:(t.fgm+.5*t.tpm)/t.fga,TS:t.pts/(2*(t.fga+.44*t.fta)),FGA:t.fga/games/2,twoPA:(t.fga-t.tpa)/games/2,threePA:t.tpa/games/2,FTA:t.fta/games/2,TOV:t.tov/games/2,OREB:t.orb/games/2}}
function makeBag(){return{shots:[],possessions:[],flags:[],entries:[],games:[],totals:Object.fromEntries(['pts','fga','fgm','tpa','tpm','fta','ftm','poss','tov','orb'].map(k=>[k,0]))}}
function summarize(b){const p=b.shots.filter(s=>s.path==='primary'),r=p.filter(rim),running=r.filter(s=>s.name==='Running Layup'),pnr=b.possessions.filter(p=>p.pnrCalls),pr=p.filter(s=>s.pnr),prs=pr.filter(rim),three=b.shots.filter(s=>s.kind==='three'&&s.recorded),tt=three.filter(s=>s.earlyThree||s.key==='runningThree'&&s.transition),put=b.shots.filter(s=>s.path==='putback');
 return {games:count,totals:b.totals,league:metrics(b.totals,count),running:{...group(running),evaluationsPerTeamGame:running.length/count/2,FGAperTeamGame:running.filter(s=>s.recorded).length/count/2,evalShare:running.length/r.length,FGAShare:running.filter(s=>s.recorded).length/r.filter(s=>s.recorded).length,origins:dict(running,s=>s.origin),allPathOrigins:dict(b.shots.filter(s=>s.name==='Running Layup'),s=>s.origin)},primaryRim:group(r),variants:dict(r,s=>s.name),floaterVariants:dict(p.filter(s=>s.kind==='inside'&&s.skill==='lay'&&/Float/.test(s.name)),s=>s.key),categories:dict(b.shots,cat),primaryCategories:dict(p,cat),PNR:{rootPossessions:pnr.length,actionCalls:pnr.reduce((n,p)=>n+p.pnrCalls,0),points:pnr.reduce((n,p)=>n+p.points,0),PPP:mean(pnr,p=>p.points),shotEvaluations:pr.length,rim:group(prs),runningEvaluations:prs.filter(s=>s.name==='Running Layup').length,screenBoostEvaluations:pr.filter(s=>s.mods.screenBoost>0).length,rimScreenBoostEvaluations:prs.filter(s=>s.mods.screenBoost>0).length,uncontestedRim:group(prs.filter(s=>!s.contest))},transition:{evaluations:b.flags.length,eventRate:mean(b.flags,s=>+s.actual),tempoOnlyRate:mean(b.flags,s=>+(!s.actual&&s.transition)),mergedRate:mean(b.flags,s=>+s.transition),rootEventRate:mean(b.entries.filter(s=>!s.recursive),s=>+s.actual)},transitionThrees:{early:tt.filter(s=>s.earlyThree).length,other:tt.filter(s=>!s.earlyThree).length,total:tt.length,FG:mean(tt,s=>+s.made),tempoOnly:tt.filter(s=>s.origin==='coach tempo').length},putbacks:{...group(put),perTeamGame:put.length/count/2,layups:group(put.filter(s=>s.skill==='lay'))},gameMetrics:b.games};
}
function batch(setting){const bags=[makeBag(),makeBag()],start=performance.now();
 for(let i=0;i<count;i++)for(const [variant,r]of [base,exp].entries()){
  const [a,b]=mode==='defense'?(i%2?[29,0]:[0,29]):pairs[i];
  const setup=mode==='tempo'?`state.teams.forEach(t=>coachFor(t).tempo=${setting});`:mode==='defense'?`for(const t of [state.teams[0],state.teams[29]])for(const p of t.roster){p.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));p.tendencies=Object.fromEntries(TENDENCY_KEYS.map(k=>[k,50]));}for(const p of state.teams[29].roster)for(const k of ['per','rim','diq','stl','sbl'])p.attributes[k]=${setting};`:'';
  const run=r=>{r.run(`state=copy(fixture);${setup}simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);return JSON.parse(JSON.stringify(r.run(`play(${a},${b})`)))};
  const obs=prior.createObserver();r.context.__audit=obs;const game=run(r);
  if(mode==='fixture'||i<3){const raw=variant?rawExp:rawBase;assert.deepEqual(game,run(raw),'instrumented game parity');assert.equal(r.run('JSON.stringify(state)'),raw.run('JSON.stringify(state)'),'state parity');}
  assert.equal(obs.shots.filter(s=>s.recorded).length,game.box.reduce((n,s)=>n+s.fga,0),'FGA accounting');assert.equal(obs.totalPoints,game.sa+game.sb);
  if(variant){assert(obs.shots.filter(s=>s.name==='Running Layup').every(s=>s.entry?.actual),'Running requires actual event');assert(!obs.shots.some(s=>s.name==='Running Layup'&&s.pnr),'no PNR Running');}
  const bag=bags[variant];bag.shots.push(...obs.shots);bag.possessions.push(...obs.possessions);bag.flags.push(...obs.flags);bag.entries.push(...obs.entries);
  const box=mode==='defense'?game.box.filter(s=>s.team===fixture.teams[0].abbr):game.box;
  const gameTot=Object.fromEntries(Object.keys(bag.totals).map(k=>[k,box.reduce((n,s)=>n+(s[k]||0),0)]));for(const k in gameTot)bag.totals[k]+=gameTot[k];
  bag.games.push(metrics(gameTot,mode==='defense'?.5:1));
  if(variant&&(i+1)%25===0)console.log(`${mode} ${setting??'default'} ${i+1}/${count} pairs`);
 }
 const [baseline,experiment]=bags.map(summarize);
 if(mode==='defense')for(const r of [baseline,experiment]){const t=r.totals;r.defense={rating:setting,OPPG:t.pts/count,FG:t.fgm/t.fga,twoP:(t.fgm-t.tpm)/(t.fga-t.tpa),threeP:t.tpm/t.tpa,eFG:(t.fgm+.5*t.tpm)/t.fga,PPP:t.pts/(t.poss/5),TOVforced:t.tov/count,opponentPace:t.poss/5/count};}
 return {setting,runtimeSeconds:(performance.now()-start)/1000,parityPairs:mode==='fixture'?count:Math.min(3,count),baseline,experiment};
}
const result=mode==='fixture'?batch(null):(mode==='tempo'?[20,50,80]:[60,75,90]).map(batch);
if(mode==='fixture'&&count===150){const old=JSON.parse(fs.readFileSync('dev/transition-baseline.json'));for(const k of ['PPG','pace','ORtg','twoP','threeP'])assert.equal(result.baseline.league[k],old.league[k]);assert.equal(result.baseline.running.evaluations,1397);assert.equal(result.baseline.PNR.runningEvaluations,405);}
if(mode==='tempo'&&count===100){const old=JSON.parse(fs.readFileSync('dev/transition-controls.json'));for(let i=0;i<3;i++)for(const k of ['PPG','pace','ORtg','twoP','threeP'])assert.equal(result[i].baseline.league[k],old[i].league[k]);}
fs.writeFileSync(`dev/running-experiment-${mode}.json`,JSON.stringify(result,null,2));console.log('PASS: '+mode+' semantic assertions, reconciliation and retained-baseline checks.');
