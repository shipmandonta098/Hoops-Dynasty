const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const league=process.argv[2]||'nba',scenario=process.argv[3]||'neutral',count=+(process.argv[4]||200),label=process.env.PHASE3_LABEL||'baseline';
const file=`dev/phase3/${label}-${league}-${scenario}.json`;if(fs.existsSync(file)){console.log('REUSE',file);process.exit(0)}
const l=loadLeague({seed:900,strictDOM:false,sourceTransform:(name,s)=>{
 s=require('./phase3-baseline-source.cjs')(name,s);
 if(process.env.HOOPS_VARIANT)s=require(require('path').resolve(process.env.HOOPS_VARIANT))(name,s);
 if(name.split('?')[0]!=='attributes.js')return s;
 const replace=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b)};
 replace('function possession(side){','function possession(side){globalThis.p3slot={side,margin:scores[side]-scores[1-side],minute:gameRotations[side].minute,before:[...scores]};');
 replace('machine.finish();',`globalThis.p3slots.push({...globalThis.p3slot,points:scores[side]-globalThis.p3slot.before[side],opponentPoints:scores[1-side]-globalThis.p3slot.before[1-side]});machine.finish();`);
 replace('chance*=leagueRules().shootingRate;',`globalThis.p3shots.push({side,kind,probability:chance*leagueRules().shootingRate,off:layupRating(shot,x),def:kind==='inside'?y('rim'):y('per'),fatigue:progress,defFatigue:defProgress,physical:buildMatch.post+buildMatch.drive-buildMatch.recovery,iso:isoAdjustment,lineup:lineup.shot,pnr:decision.pickAndRoll?.shotAdjustment||0});chance*=leagueRules().shootingRate;`);
 return s;
}});l.context.league=league;l.context.scenario=scenario;
l.run(`var d=makeDraft();d.gmName='Phase 3 diagnostic';d.year=league==='nba'?2025:2024;d.leagueGender=league==='nba'?'male':'female';if(league==='wnba'){d.teams=d.teams.slice(0,12);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(league,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(league==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};syncAlignment(d);state=buildSetupCareer(d);state.teams.forEach(t=>{coachFor(t);for(const p of t.roster)p.bio??=generatePlayerBio(p,2026,[{abbr:'FA'}]);});var fixture=copy(state);
 var originals={effectiveAttribute,physicalMatchup,derivedPhysicalAttributes,homeCourtEvent,createHomeCourt,createGameAtmosphere,refreshGameRotation,coachingSkill,coachFit};
 // All scenarios have identical rest and no user-team tactical advantage. These
 // fixtures isolate game-local mechanisms, not season-long injuries or travel.
 restDays=()=>1;playerEnergy=()=>100;teamBackToBack=()=>false;rivalryHomeAdjustment=()=>0;rivalryFoulMultiplier=()=>1;
 rivalryMatchup=()=>({types:[],heat:1,split:false});
 createHomeCourt=function(stage,away){const c=originals.createHomeCourt(stage,away);if(!(scenario.startsWith('population')&&scenario!=='population-no-home')&&!['home','crowd-low','crowd-high','altitude','no-momentum'].includes(scenario)){c.strength=0;c.roadShot=0;c.roadFoul=0;c.roadTurnover=0;}return c};
 createGameAtmosphere=function(...args){const x=originals.createGameAtmosphere(...args);x.fillRate=scenario==='crowd-low'?.3:scenario==='crowd-high'?1:.75;x.fanEnergy=scenario==='crowd-low'?1:scenario==='crowd-high'?3:2;x.fanSentimentScore=0;return x};
 if(scenario.endsWith('no-fatigue'))effectiveAttribute=(p,k,progress,starter,bonus)=>originals.effectiveAttribute(p,k,0,starter,bonus);
 if(scenario.endsWith('no-physical')){derivedPhysicalAttributes=p=>({...p.attributes});physicalMatchup=()=>({height:0,weight:0,contestScale:1,post:0,drive:0,recovery:0});}
 if(scenario.endsWith('no-momentum'))homeCourtEvent=()=>{};
 if(scenario.endsWith('no-coach')){coachingSkill=()=>65;coachFit=()=>60;}
 if(scenario==='population-no-archetype'){archetypeShotAdjustment=()=>0;activeLineupEffects=()=>({shot:0,turnover:0});}
 if(scenario==='population-no-isolation')isolationTrigger=()=>null;
 if(scenario==='no-garbage')refreshGameRotation=(club,runtime,minute,rows,events,margin)=>originals.refreshGameRotation(club,runtime,minute,rows,events,Math.max(-19,Math.min(19,margin)));
 `);
const games=[],shots={},slots={};const start=Date.now();
for(let i=0;i<count;i++){
 l.context.i=i;
 l.run(`state=copy(fixture);simulationExecution.mode='headless';var source=copy(state.teams[2+(Math.floor(i/50)%4)*2]);var a=state.teams[2],b=state.teams[3];a.roster=source.roster;a.coach=copy(coachFor(source));delete a.rotationPlan;b.roster=copy(a.roster).map((p,j)=>({...p,id:100000+j,name:'Matched '+j}));b.coach=copy(a.coach);delete b.rotationPlan;if(scenario.startsWith('population')){b.roster=copy(fixture.teams[3+(Math.floor(i/50)%4)*2].roster);b.coach=copy(fixture.teams[3+(Math.floor(i/50)%4)*2].coach);}a.w=b.w=a.l=b.l=0;for(const t of [a,b]){t.elevationFt=t===a&&scenario==='altitude'?5280:0;for(const p of t.roster){delete p.workload;delete p.medicalInfo;p.injury=0;p.moraleAdjustment=0;}}
 if(['elite-elite','elite-poor','poor-elite','average'].includes(scenario))for(const [side,t] of [a,b].entries())for(const p of t.roster){for(const k of ['lay','post','dnk','fg','tp','drb','pss','oiq'])p.attributes[k]=side===0?(scenario==='poor-elite'?60:scenario==='average'?75:95):75;for(const k of ['per','rim','sbl','stl','diq'])p.attributes[k]=side===1?(scenario==='elite-poor'?60:scenario==='average'?75:95):75;}
 if(scenario==='shallow')for(const p of b.roster.slice(5))for(const k of ATTRIBUTE_KEYS)if(k!=='hgt')p.attributes[k]=Math.max(1,p.attributes[k]-15);
 if(scenario==='low-stamina')for(const p of b.roster)p.attributes.endu=45;
 if(scenario==='height')for(const p of b.roster)p.bio.heightInches+=6;
 if(!scenario.startsWith('population')&&!['height'].includes(scenario)){for(let j=0;j<a.roster.length;j++){if(a.roster[j].bio.heightInches!==b.roster[j].bio.heightInches||a.roster[j].bio.weightLbs!==b.roster[j].bio.weightLbs)throw Error('Physical fixture mismatch');}}globalThis.p3shots=[];globalThis.p3slots=[];Math.random=scheduleRandom(80000+i);`);
 const g=l.run('play(2,3)');assert.equal(g.box.reduce((n,r)=>n+r.pts,0),g.sa+g.sb);
 const totals=[2,3].map(id=>{const abbr=l.run(`state.teams[${id}].abbr`),rows=g.box.filter(r=>r.team===abbr),o={};for(const k of ['pts','fgm','fga','tpm','tpa','fta','ftm','orb','drb','tov','pf','poss','mp','stamina'])o[k]=rows.reduce((n,r)=>n+(r[k]||0),0);o.poss/=5;return o});
 const sh=l.run('p3shots'),sl=l.run('p3slots');for(const s of sh){const key=s.side+':'+s.kind,v=shots[key]??={n:0,clamp:0,probability:0,off:0,def:0,fatigue:0,defFatigue:0,physical:0,iso:0,lineup:0,pnr:0};v.n++;v.clamp+=s.probability<=.02||s.probability>=.88;for(const k of ['probability','off','def','fatigue','defFatigue','physical','iso','lineup','pnr'])v[k]+=s[k];}
 for(const s of sl){const key=(s.margin<0?'-':'+')+Math.min(40,Math.floor(Math.abs(s.margin)/10)*10),v=slots[key]??={n:0,points:0,opponentPoints:0};v.n++;v.points+=s.points;v.opponentPoints+=s.opponentPoints;}
 games.push({seed:80000+i,fixture:Math.floor(i/50)%4,score:[g.sa,g.sb],totals,meanShotProbability:[0,1].map(side=>{const x=sh.filter(s=>s.side===side);return x.reduce((n,s)=>n+s.probability,0)/x.length}),altitude:g.altitude});
 if(i%50===49)console.log(league,scenario,i+1,Math.round((Date.now()-start)/1000));
}
fs.writeFileSync(file,JSON.stringify({fixtureVersion:3,league,scenario,count,games,shots,slots,seconds:(Date.now()-start)/1000}));console.log('DONE',file);
