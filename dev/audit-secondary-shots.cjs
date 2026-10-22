/* Paired full-game diagnostic; no game events or probabilities are added. */
const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const label=process.argv[2]||'after',count=Number(process.argv[3]||250),out=[];
for(const league of ['nba','wnba']){
 const l=loadLeague({seed:101,strictDOM:false,sourceTransform:(name,code)=>{
  if(label==='before'&&name!=='inline.js')code=fs.readFileSync((process.env.HOOPS_BASELINE_DIST||'/workspace/balance-continuation-before-dist')+'/'+name.split('?')[0],'utf8').replace('careerReady=initializeCareers();','');
  if(name.split('?')[0]==='attributes.js'){
   code=code.replace('function possessionCore(side){','function possessionCore(side){globalThis.shotPath="primary";');
   code=code.replace("rr.fga++;const denied=", "globalThis.shotPath='putback';rr.fga++;const denied=");
   code=code.replace("machine.transition('shot');rr.fga++;if(value===3)","machine.transition('shot');globalThis.shotPath='kickout';rr.fga++;if(value===3)");
  }return code;
 }});
 l.context.league=league;l.run(`var d=makeDraft();d.gmName='Secondary-shot audit';d.year=league==='nba'?2025:2024;d.leagueGender=league==='nba'?'male':'female';if(league==='wnba'){d.teams=d.teams.slice(0,12);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(league,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(league==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};syncAlignment(d);state=buildSetupCareer(d);var fixture=copy(state);var originalShotProbability=shotMakeProbability;var pathTotals={};shotMakeProbability=function(base,shot,court,side){var result=originalShotProbability(base,shot,court,side),key=shotPath+':'+shot.kind;var t=pathTotals[key]??={attempts:0,probability:0};t.attempts++;t.probability+=result;return result;};`);
 const games=[];
 for(let seed=0;seed<count;seed++){
  const g=l.run(`state=copy(fixture);simulationExecution.mode='headless';Math.random=scheduleRandom(${70000+seed});play(${seed%(league==='wnba'?6:15)*2},${seed%(league==='wnba'?6:15)*2+1})`);
  assert.equal(g.box.reduce((n,r)=>n+r.pts,0),g.sa+g.sb);
  games.push({seed,score:[g.sa,g.sb],totals:Object.fromEntries(['fga','fgm','fta','ftm','tov','orb','drb','pf','tpa','tpm','poss'].map(k=>[k,g.box.reduce((n,r)=>n+(r[k]||0),0)/(k==='poss'?10:2)]))});
 }
 out.push({league,games,paths:l.run('pathTotals')});fs.mkdirSync('dev/secondary-shot-audit',{recursive:true});fs.writeFileSync('dev/secondary-shot-audit/'+label+'.json',JSON.stringify(out));console.log(label,league,count,'complete');
}
fs.mkdirSync('dev/secondary-shot-audit',{recursive:true});fs.writeFileSync('dev/secondary-shot-audit/'+label+'.json',JSON.stringify(out));
