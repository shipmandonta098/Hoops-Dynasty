// Full-season verification for the franchise presets (NBA + WNBA).
// Usage (repo root): node dev/franchise-presets/season-check.cjs [nba|wnba] [seed]
// A: league created with presets from setup → full season incl. playoffs, offseason, rollover.
// B: a preset admitted through the real expansion draft → next full season.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {loadLeague}=require('../load-league.cjs');
const league=process.argv[2]||'nba',seed=+(process.argv[3]||7101),out=path.join(__dirname,`season-check-${league}-${seed}.json`);
(async()=>{
 const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);Object.assign(l.context,{auditLeague:league,assert,FormData:class{constructor(form){return Object.entries(form)}}});
 // Setup exactly as the UI does: presets appended to the draft, alignment synced, saved through validation.
 l.run(`var d=makeDraft();d.gmName='Preset check';d.year=auditLeague==='nba'?2025:2024;
  const presetPicks=auditLeague==='nba'?['CGY','NWK']:['TPA','WPG'];
  if(auditLeague==='wnba'){d.teams=d.teams.slice(0,10);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}
  for(const abbr of presetPicks){const def=presetTeamDefinition(franchisePreset(abbr));d.teams.push(auditLeague==='wnba'?{...def,conferenceId:'league',divisionId:''}:def)}
  syncAlignment(d);
  // Leagues other than 30 NBA-aligned teams need the Custom season format: the default round-robin fallback
  // cannot satisfy the existing opening-night Day-3 rule (pre-existing; see report).
  if(auditLeague==='nba'&&!nbaAlignment(d.teams))d.meetings='custom';
  var plan=historicalPlan(auditLeague,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(auditLeague==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:d.meetings==='custom'?{seasonGames:82}:{})};
  state=validateCareerData(buildSetupCareer(d));render=()=>{};save=async()=>true;ownerCanManage=()=>true;`);
 const report={league,seed,checks:[],seasons:[]};const check=(name,ok,detail)=>{report.checks.push({name,ok:!!ok,...(detail!==undefined?{detail}:{})});assert(ok,name+(detail!==undefined?' '+JSON.stringify(detail):''))};
 const presetIds=l.run(`state.teams.filter(t=>t.logoAtlas==='preset').map(t=>t.id)`);
 check('setup presets present with preset logos',presetIds.length===2,presetIds);
 check('team ids unique and contiguous',l.run('state.teams.every((t,i)=>t.id===i)&&new Set(state.teams.map(t=>t.key)).size===state.teams.length'));
 const debut=l.run(`(()=>{const first=new Set();state.schedule.slice(0,3).flat(2).forEach(id=>first.add(id));return {teams:state.teams.length,debutByDay3:state.teams.filter(t=>first.has(t.id)).length,openingNight:state.schedule[0]?.length,rule:leagueRules().openingNight??null}})()`);
 check('all teams including presets debut by League Day 3',debut.debutByDay3===debut.teams,debut);
 check('save/load round trip keeps preset identity',l.run(`(()=>{const before=JSON.stringify(state.teams.map(t=>[t.key,t.abbr,t.logoAtlas,t.logoIndex,t.arenaName,t.stadiumCapacity,t.colors]));state=validateCareerData(JSON.parse(JSON.stringify(state)));return before===JSON.stringify(state.teams.map(t=>[t.key,t.abbr,t.logoAtlas,t.logoIndex,t.arenaName,t.stadiumCapacity,t.colors]))})()`));
 const seasonSummary=()=>l.run(`({year:state.year,teams:state.teams.length,champion:state.leagueHistory?.at(-1)?.champion??null,presetGames:state.teams.filter(t=>t.logoAtlas==='preset').map(t=>({abbr:t.abbr,city:t.city,games:state.history.filter(g=>g.stage==='Regular season'&&(g.a===t.id||g.b===t.id)).length}))})`);
 // A: one complete season (regular season, All-Star, playoffs, offseason, rollover) with headless validators.
 const start=Date.now();
 const r=await l.run(`simulateMultipleSeasonsHeadless(1,{seed:${seed},log:false})`);
 check('season A completed without validation errors',r.status==='completed'&&!r.errors.length,{status:r.status,errors:r.errors.slice(0,3)});
 report.seasons.push({phase:'A',status:r.status,games:r.gamesSimulated,seconds:(Date.now()-start)/1000,champion:r.seasons?.[0]?.champion??null});
 check('franchise archive records preset teams after season A',l.run(`(()=>{const a=JSON.stringify(state.franchiseArchive||{});return state.teams.filter(t=>t.logoAtlas==='preset').every(t=>a.includes(t.key))})()`));
 // B: next season's regular season + playoffs, then expansion (where league rules allow) and a relocation.
 l.run(`globalThis.presetExpansionAbbr=auditLeague==='nba'?'STL':'BUF';globalThis.relocationAbbr=auditLeague==='nba'?'OTT':'SJO';simulationExecution.mode='headless';simulationExecution.autopilot=true;globalThis.toasts=[];toast=m=>toasts.push(m);`);
 await l.run(`(async()=>{while(state.day<seasonLength())await simulateDayHeadless();await headlessAllStar();while(state.champion===null){const slot=playoffSeriesSlots().find(s=>!s.complete);await simulatePlayoffGame(...slot.nextPair)}})()`);
 check('expansion window open after playoffs',l.run('expansionWindow()'));
 const p=l.run(`(()=>{const p=franchisePreset(presetExpansionAbbr);return {abbr:p.abbr,city:p.city,name:p.name,arenaName:p.arenaName,capacity:p.capacity,colors:presetTeamDefinition(p).colors}})()`);
 const target=l.run('rosterMinimum()');
 l.context.expansionValues={preset:p.abbr,city:p.city,name:p.name,abbr:p.abbr,arenaName:p.arenaName,divisionId:l.run('state.divisions[0]?.id||""'),newDivision:l.run('state.divisions.length?"":"Expansion"'),conferenceId:l.run('state.conferences[0].id'),marketSize:'Medium',primary:p.colors[0].hex,secondary:p.colors[1].hex,cap:'standard',seed:'equal',capacity:p.capacity,ticket:80,protect:4,maximum:2,target,fee:500,hype:80,rebuild:'on'};
 report.expansionRosterState=l.run('({min:rosterMinimum(),max:rosterMaximum(),sizes:state.teams.map(t=>t.roster.length)})');
 await l.run(`(async()=>{toasts.length=0;await beginExpansion({preventDefault(){},target:{...expansionValues,protect:0}});})()`);
 const started=l.run('!!state.expansion?.active');let expansionId=null;
 if(!started){report.expansionBlocked=l.run('toasts.join(" | ")');check('expansion refusal comes from the existing roster-capacity rule',/cannot supply/.test(report.expansionBlocked),report.expansionBlocked);}
 else{
  // Salaries trimmed only so an automated cheapest-first pick list fits the expansion cap.
  await l.run(`(async()=>{state=validateCareerData(JSON.parse(JSON.stringify(state)));await lockExpansionProtections();for(let i=0;i<expansionValues.target;i++){const pool=expansionAvailable().sort((a,b)=>a.p.salary-b.p.salary);expansionSelection(pool[0].p.id)}await finishExpansion();if(state.expansion.active)throw Error('expansion not finished: '+toasts.join(' | '))})()`);
  const club=l.run(`(()=>{const t=state.teams.at(-1);return {id:t.id,key:t.key,abbr:t.abbr,logoAtlas:t.logoAtlas,logoIndex:t.logoIndex,stadiumCapacity:t.stadiumCapacity,colors:t.colors,roster:t.roster.length,history:state.expansion.history.at(-1).config.preset}})()`);expansionId=club.id;report.expansionClub=club;
  check('expansion club carries preset identity',club.abbr===p.abbr&&club.logoAtlas==='preset'&&club.stadiumCapacity===p.capacity&&club.history===p.abbr&&club.colors[2].hex===p.colors[2].hex,club);
  check('expansion roster meets league minimum',club.roster>=target,club.roster);
  check('expansion club has a unique franchise id/key',l.run(`state.teams.filter(t=>t.key===${JSON.stringify(club.key)}).length===1&&state.teams.length===${club.id+1}`));
  check('expansion save/load round trip',l.run(`(()=>{state=validateCareerData(JSON.parse(JSON.stringify(state)));const t=state.teams.at(-1);return t.logoAtlas==='preset'&&t.abbr===${JSON.stringify(p.abbr)}&&state.expansion.history.at(-1).config.preset===${JSON.stringify(p.abbr)}})()`));
 }
 // Relocation: team 1 moves to a preset city via the team editor's apply path (same values the preset loader fills).
 const before=l.run(`(()=>{const t=state.teams[1];return {key:t.key,abbr:t.abbr,city:t.city,roster:t.roster.map(p=>p.id+':'+p.salary+':'+p.contractThrough).join(','),wins:t.w,histAbbr:state.history.filter(g=>g.a===1||g.b===1).length}})()`);
 l.run(`(()=>{const t=state.teams[1],p=franchisePreset(relocationAbbr),def=presetTeamDefinition(p),idx=PRESET_LOGO_OFFSET+FRANCHISE_PRESETS.indexOf(p);const v={city:p.city,name:p.name,abbr:p.abbr,arenaName:p.arenaName,stadiumCapacity:String(p.capacity),marketSize:p.marketSize,logo:String(idx),secondaryLogoIndex:String(idx),arenaCity:'',elevationFt:'',...(state.scheduleFormat==='nba82'?{swap:''}:{divisionId:t.divisionId||'@'+t.conferenceId})};def.colors.forEach((c,i)=>{v['color'+i]=c.hex;v['colorName'+i]=c.name});applyManagedTeam(1,v)})()`);
 const after=l.run(`(()=>{const t=state.teams[1];return {key:t.key,abbr:t.abbr,city:t.city,roster:t.roster.map(p=>p.id+':'+p.salary+':'+p.contractThrough).join(','),wins:t.w,logoAtlas:t.logoAtlas,stadiumCapacity:t.stadiumCapacity,altitudeFt:altitudeVenue(t).feet,oldAbbrInBoxes:state.history.some(g=>g.box.some(b=>b.team===${JSON.stringify(before.abbr)}))}})()`);
 report.relocation={before:{...before,roster:undefined},after:{...after,roster:undefined}};
 check('relocation keeps key, roster and contracts',after.key===before.key&&after.roster===before.roster&&after.wins===before.wins,{key:[before.key,after.key]});
 check('relocation applies preset identity, arena and altitude',after.abbr===l.run('relocationAbbr')&&after.logoAtlas==='preset'&&after.altitudeFt===l.run('franchisePreset(relocationAbbr).elevationFt'),after);
 check('relocation re-keys archived box scores to the new abbreviation',after.oldAbbrInBoxes===false);
 check('relocation save/load round trip',l.run(`(()=>{state=validateCareerData(JSON.parse(JSON.stringify(state)));return state.teams[1].abbr===relocationAbbr&&state.teams[1].logoAtlas==='preset'})()`));
 const s2=Date.now();
 // WNBA only: the existing 2026 rookie-transition gate requires the user's "freeze financial environment" setting (unrelated to presets).
 if(league==='wnba')report.wnbaFinanceFrozen=await l.run(`(async()=>{if(state.wnbaFinance?.progression&&wnbaTransitionError()){settingsBusy=false;await toggleWNBAProgression();return !state.wnbaFinance.progression}return false})()`);
 await l.run(`(async()=>{try{await headlessOffseason({boundary:async()=>{}})}catch(e){throw Error(e.message+' toasts='+toasts.slice(-5).join(' | ')+' draft='+JSON.stringify({gm:gmCanAdvance(),ready:draftReady(),mode:simulationExecution.mode,auto:simulationExecution.autopilot,iso:simulationExecution.isolated,order:state.draft?.order?.length,picks:state.draft?.picks?.length,prospects:state.draft?.prospects?.length}))}newSeason();validateHeadlessLeague();})()`);
 check('rollover advances to a fresh schedule',l.run('state.day===0&&state.schedule.length>0'));
 const debut2=l.run(`(()=>{const first=new Set();state.schedule.slice(0,3).flat(2).forEach(id=>first.add(id));return {teams:state.teams.length,debutByDay3:state.teams.filter(t=>first.has(t.id)).length}})()`);
 check('every team (incl. new/relocated) debuts by Day 3',debut2.debutByDay3===debut2.teams,debut2);
 await l.run(`(async()=>{while(state.day<seasonLength())await simulateDayHeadless();await headlessAllStar();while(state.champion===null){const slot=playoffSeriesSlots().find(s=>!s.complete);await simulatePlayoffGame(...slot.nextPair)}validateHeadlessLeague()})()`);
 const sum=seasonSummary();
 for(const id of [1,...(expansionId!==null?[expansionId]:[])]){const g=l.run(`({played:state.history.filter(g=>g.stage==='Regular season'&&(g.a===${id}||g.b===${id})).length,scheduled:state.schedule.flat().filter(g=>g.includes(${id})).length,abbr:state.teams[${id}].abbr})`);check(g.abbr+' played its full schedule',g.played===g.scheduled&&g.played>0,g)}
 check('all regular-season games completed with legal scores',l.run(`state.history.filter(g=>g.stage==='Regular season').length===state.schedule.flat().length&&state.history.every(g=>g.sa!==g.sb)`));
 check('champion recorded after season B',l.run('state.champion!==null'));
 check('final save/load round trip after season B',l.run(`(()=>{const before=JSON.stringify(state.teams.map(t=>[t.key,t.abbr,t.logoAtlas,t.logoIndex,t.w,t.l]));state=validateCareerData(JSON.parse(JSON.stringify(state)));return before===JSON.stringify(state.teams.map(t=>[t.key,t.abbr,t.logoAtlas,t.logoIndex,t.w,t.l]))})()`));
 report.seasons.push({phase:'B',seconds:(Date.now()-s2)/1000,...sum,champion:l.run('state.champion')});
 fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({league,seed,passed:report.checks.filter(c=>c.ok).length,total:report.checks.length,seasons:report.seasons},null,1));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
