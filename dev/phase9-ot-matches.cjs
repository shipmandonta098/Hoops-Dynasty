const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const variant=process.argv[6]||'candidate';
const league=process.argv[2]||'nba',label=process.argv[3]||'identical',n=+(process.argv[4]||160),world=+(process.argv[5]||901),path=`dev/phase9/${variant}-${league}-${label}-${world}.json`;
if(fs.existsSync(path)||fs.existsSync(path+'.gz'))process.exit(0);
const l=loadLeague({seed:world,strictDOM:false,sourceTransform:(name,src)=>variant==='hold'?require('./phase9/hold-variant.cjs')(name,src):src});l.context.league=league;l.context.label=label;
l.run(require('./feat-fixture.cjs'));l.run(`if(label==='league'){d.teams=makeDraft().teams;if(league==='wnba')d.teams=d.teams.slice(0,12);d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});syncAlignment(d);}d.year=league==='nba'?2025:2024;d.leagueGender=league==='nba'?'male':'female';var plan=historicalPlan(league,d.year,setupLeagueRules(d),d.cap,defaultTeams());d.cap=plan.cap;d.leagueSettings={...d.leagueSettings,...plan.rules,seasonGames:10,divisionGames:0,conferenceGames:10,playoffFormat:'top4',firstRoundByes:0,splitPlayoffs:false};state=buildSetupCareer(d);state.teams.forEach(t=>{coachFor(t);for(const p of t.roster)p.bio??=generatePlayerBio(p,d.year,[{abbr:'FA'}]);});`);
l.run(fs.readFileSync('dev/rotation-quality-diagnostic.js','utf8'));
if(label!=='league')l.run(`
 const basePersonality=personality;personality=p=>basePersonality({...p,id:p.auditOriginalId||p.id});
 const baseCourt=createHomeCourt;createHomeCourt=(...a)=>({...baseCourt(...a),strength:0,roadShot:0,roadFoul:0,roadTurnover:0});
 restDays=()=>1;playerEnergy=()=>100;teamBackToBack=()=>false;rivalryHomeAdjustment=()=>0;rivalryFoulMultiplier=()=>1;
 for(let i=0;i<6;i+=2){const a=state.teams[i],b=state.teams[i+1];for(const p of a.roster){delete p.medicalInfo;p.injury=0;delete p.workload;p.moraleAdjustment=0;}b.roster=copy(a.roster).map((p,j)=>({...p,auditOriginalId:p.id,id:900000+i*100+j}));b.coach=copy(a.coach);delete a.rotationPlan;delete b.rotationPlan;a.elevationFt=b.elevationFt=0;
  const shift=(keys,delta,bench=false)=>b.roster.forEach((p,j)=>{if(!bench||j>=5)for(const k of keys)p.attributes[k]=Math.max(25,Math.min(99,p.attributes[k]+delta))});
  if(label==='defense')shift(['per','rim','diq','stl','sbl'],12);
  if(label==='poor-defense')shift(['per','rim','diq','stl','sbl'],-12);
  if(label==='bench')shift(['lay','post','fg','tp','ft','drb','pss','oiq','per','rim','diq','stl','sbl','reb'],-15,true);
  if(label==='fatigue')shift(['endu'],-25);
  if(label==='three')shift(['tp'],15);
  if(label==='rebounds')shift(['reb'],15);
  if(label==='handling')shift(['drb','pss'],15);
  if(label==='pace')b.coach.tempo=95;
  if(label==='coaching'){b.coach.attributes.defense=95;b.coach.attributes.tactics=95;}
  if(label==='selection')for(const p of b.roster){p.tendencies??={};p.tendencies.three=95;p.tendencies.midrange=10;}
 }
`);
if(variant==='no-momentum')l.run('homeCourtEvent=()=>{};homeCourtTick=()=>{};homeCourtTimeout=()=>{};const shotBefore=homeCourtShot;homeCourtShot=(c,s,f)=>shotBefore({...c,momentum:0},s,f)');
l.run('var fixture=copy(state),qualityCache=new Map();simulationExecution.mode="headless";');
const games=[];
for(let i=0;i<n;i++){
 l.context.i=i;l.context.world=world;
 l.run(`state=copy(fixture);var a=label==='league'?i%state.teams.length:i%3*2,b=label==='league'?(a+1+Math.floor(i/state.teams.length))%state.teams.length:a+1;if(a===b)b=(b+1)%state.teams.length;var q=[a,b].map(id=>{if(!qualityCache.has(id))qualityCache.set(id,projectedRotationQuality(state.teams[id]));return qualityCache.get(id)});Math.random=scheduleRandom(world*10000+i);globalThis.p6draws=[];globalThis.p6slots=[];var oldSpread=projectedHomeSpread(a,b);var g=play(a,b);`);
 const g=l.run('g');assert(g.summaryData.complete);assert.notEqual(g.sa,g.sb);
 const totals=[0,1].map(side=>{const rows=g.box.filter(r=>r.team===g.summaryData.teams[side].abbr);const t={};for(const k of ['pts','fga','fgm','tpa','tpm','fta','ftm','orb','tov','mp'])t[k]=rows.reduce((n,r)=>n+(r[k]||0),0);assert.equal(t.pts,side?g.sb:g.sa);assert.equal(t.pts,2*t.fgm+t.tpm+t.ftm);assert(Math.abs(t.mp-(g.gameRules.periodMinutes*g.gameRules.gamePeriods+(g.summaryData.periods-g.gameRules.gamePeriods)*g.gameRules.overtimeMinutes)*g.gameRules.courtPlayers)<.1);return t;});
 const quarter=Array.from({length:g.summaryData.periods},(_,q)=>g.summaryData.events.filter(e=>e.period===q).reduce((x,e)=>(x[e.side]+=e.points,x),[0,0]));
 const end=g.gameRules.periodMinutes*g.gameRules.gamePeriods*60;let tieUnder24=false,last=0,score=[0,0];const ev=g.summaryData.events.filter(e=>e.period<g.gameRules.gamePeriods);for(const e of [...ev,{seconds:end,side:0,points:0}]){if(score[0]===score[1]&&Math.max(last,end-24)<Math.min(e.seconds,end))tieUnder24=true;score[e.side]+=e.points;last=e.seconds;}games.push({tieUnder24,seed:world*10000+i,score:[g.sa,g.sb],quarter,totals,ot:g.summaryData.periods>g.gameRules.gamePeriods,rotationEvents:g.rotationEvents});
 if(i%40===39)console.log(league,label,world,i+1);
}
fs.writeFileSync(path+'.gz',require('zlib').gzipSync(JSON.stringify({league,label,world,n,variant,games}))); console.log('DONE',path);
