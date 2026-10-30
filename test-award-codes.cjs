// Award codes: season-end finishes (top five) and tiered teams are saved, teams are position-balanced, codes appear
// on profile and league stats tables with tooltips and links, league prefixes, and older saves show only stored honors.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const setup=async(league,seed)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.lg=league;
 l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Awards';
  if(lg==='wnba'){d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};}
  if(lg==='nba'){var plan=historicalPlan('nba',2024,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings=plan.rules;}
  state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';`);
 for(let i=0;i<10;i++)await l.run('simulateDayHeadless()');
 return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
const endSeason=`(()=>{const day=state.day;state.day=seasonLength();finalizeRegularAwards();state.day=day;return awardResultsFor(state.year)})()`;
(async()=>{
const {l,run}=await setup('custom',151);
// 1. Season end saves the top five for each player award, matching the announced winners.
const res=run(endSeason),regular=run('state.regularAwards.at(-1)');
for(const [key,code] of [['mvp','MVP'],['dpoy','DPOY'],['roy','ROY'],['sixth','6MOY'],['clutch','CPOY']]){assert(res.finishes[code].length>=1&&res.finishes[code].length<=5,code);assert.equal(res.finishes[code][0],regular[key].id,code+' winner is rank 1')}
assert.deepEqual(res.finishes.MVP,run(`awardCandidates('mvp').map(r=>r.id)`),'MVP finishes are the final top five');
assert.equal(res.league,'ALL');assert.deepEqual(Object.keys(res.teams).sort(),['ALL1','ALL2','ALL3','DEF1','DEF2','ROOK1','ROOK2']);
// Finalizing again does not change saved results.
run(endSeason);assert.equal(run('state.awardResults.length'),1);
// 2. Position balance: 2 guards, 2 forwards, 1 center per All-League/All-Defensive team; no player on two tiers.
const groups=run(`Object.fromEntries(Object.entries(awardResultsFor(state.year).teams).map(([k,ids])=>[k,ids.map(id=>awardPositionGroup(awardPlayerPos(id))).sort().join('')]))`);
for(const k of ['ALL1','ALL2','ALL3','DEF1','DEF2'])assert.equal(groups[k],'CFFGG',k+' '+groups[k]);
const allIds=Object.entries(res.teams).filter(([k])=>/^ALL/.test(k)).flatMap(([,v])=>v);assert.equal(new Set(allIds).size,15);
const balancedCheck=run(`(()=>{const ranked=[{id:1,pos:'PG'},{id:2,pos:'SG'},{id:3,pos:'PG'},{id:4,pos:'C'},{id:5,pos:'C'},{id:6,pos:'SF'},{id:7,pos:'PF'},{id:8,pos:'SG'}];return {balanced:awardTeams(ranked,1,true)[0],free:awardTeams(ranked,1,false)[0],short:awardTeams([{id:1,pos:'PG'},{id:2,pos:'PG'},{id:3,pos:'PG'},{id:4,pos:'PG'},{id:5,pos:'PG'},{id:6,pos:'C'}],1,true)[0]}})()`);
assert.deepEqual(balancedCheck.balanced,[1,2,4,6,7],'skips a third guard and second center for the forwards');assert.deepEqual(balancedCheck.free,[1,2,3,4,5]);assert.deepEqual(balancedCheck.short,[1,2,6,3,4],'a short position is filled by the best remaining players');
// Position-less league setting.
const free=run(`(()=>{const saved=state.leagueSettings.awardTeamPositions;state.leagueSettings.awardTeamPositions='positionless';const r=computeAwardResults();state.leagueSettings.awardTeamPositions=saved;const top=awardRaceRows().filter(r=>Number.isFinite(r.score)).sort((a,b)=>b.score-a.score||a.id-b.id).slice(0,5).map(r=>r.id);return {first:r.teams.ALL1,top}})()`);
assert.deepEqual(free.first,free.top);
// 3. All-Star, All-Star MVP and Finals MVP flow into archived seasons as AS, ASMVP and FMVP.
const archived=run(`(()=>{const ids=state.teams.flatMap(t=>t.roster).slice(0,3).map(p=>p.id);state.allStarVoting={year:state.year,phase:'final',selected:ids.map(id=>({id})),game:{mvp:ids[1]}};const before=seasonHonors;seasonHonors=()=>({finalsMvp:{id:ids[2],name:'x',team:'y'}});try{archiveStatsSeason()}finally{seasonHonors=before;delete state.allStarVoting}
 const rows=state.statsArchive.filter(r=>r.year===state.year),of=id=>rows.find(r=>r.id===id)?.awards.map(awardCodeText)||[];const mvp3=awardResultsFor(state.year).finishes.MVP[2];return {as:ids.map(of),mvp3:of(mvp3),every:rows.every(r=>Array.isArray(r.awards)),fmvp:awardResultsFor(state.year).fmvp===ids[2]}})()`);
assert(archived.as[0].includes('AS')&&archived.as[1].includes('ASMVP')&&archived.as[2].includes('FMVP')&&archived.fmvp,JSON.stringify(archived.as));
assert(archived.mvp3.includes('MVP-3'),'third in MVP voting reads MVP-3');assert(archived.every);
// Tooltips and ordering.
assert.equal(run(`awardCodeTitle({code:'MVP',rank:3})`),'3rd in MVP voting');assert.equal(run(`awardCodeTitle({code:'MVP',rank:1})`),'Most Valuable Player');
assert.equal(run(`awardCodeTitle({code:'NBA2'})`),'All-NBA 2nd Team');assert.equal(run(`awardCodeTitle({code:'DEF1'})`),'All-Defensive 1st Team');assert.equal(run(`awardCodeTitle({code:'ROOK2'})`),'All-Rookie 2nd Team');assert.equal(run(`awardCodeTitle({code:'6MOY',rank:2})`),'2nd in Sixth Player of the Year voting');
assert.equal(run(`awardSort([{code:'NBA1'},{code:'AS'},{code:'MVP',rank:3}]).map(awardCodeText).join(', ')`),'MVP-3, AS, NBA1');
// 4. Display: profile regular-season table (with past seasons and an empty Career cell) and league stats tables.
const shown=run(`(()=>{const id=awardResultsFor(state.year).finishes.MVP[2],p=playerContext(id).p;state.year++;state.history=[];
 profileStatsStage='regular';profileStatsView='traditional';const html=referenceStatsTable({p,club:playerContext(id).club});
 statsUI.competition='regular';statsUI.tab='traditional';statsUI.season=String(state.year-1);statsUI.team='all';statsUI.split='all';const league=leagueStatsView();statsUI.season='career';const career=leagueStatsView();statsUI.season=String(state.year-1);
 statsUI.tab='progression';const progression=leagueStatsView();statsUI.season='current';statsUI.tab='traditional';state.year--;return {html,league,career,progression,id}})()`);
assert(/<th scope="col">Awards<\/th>/.test(shown.html),'profile table has an Awards column');
assert(/title="MVP-3: 3rd in MVP voting"[^>]*onclick="openSeasonAwards\(\d+\);return false">MVP-3<\/a>/.test(shown.html),'codes link to the season awards page with a tooltip');
assert(/<th scope="row">Career<\/th>(?:(?!<\/tr>).)*<td><\/td><\/tr>/.test(shown.html),'Career row has an empty Awards cell');
assert(/white-space:normal;display:inline-block[^"]*max-width:9rem/.test(shown.html),'the column wraps instead of widening');
assert(/>Awards</.test(shown.league)&&/>MVP-3<\/a>/.test(shown.league),'league stats show codes for a past season');assert(!/>MVP-3<\/a>/.test(shown.career),'career view shows no codes');
assert(/>MVP-3<\/a>/.test(shown.progression),'year-by-year table shows codes');
// The awards page opens for that season.
assert(/Most Valuable Player voting/.test(run(`(()=>{let html='';const t=titleModal;titleModal=(a,b)=>{html=a+b};try{openSeasonAwards(state.year)}finally{titleModal=t}return html})()`)));
// Clutch race tab renders.
assert(/Clutch Player of the Year/.test(run(`(()=>{awardRaceTab='clutch';return awardRacesView()})()`)));
// 5. Save/load: results and season codes round-trip; bad data is rejected.
const rt=run(`(()=>{const v=validateCareerData(JSON.parse(JSON.stringify(state)));return {results:JSON.stringify(v.awardResults)===JSON.stringify(state.awardResults),codes:JSON.stringify(v.statsArchive.map(r=>r.awards))===JSON.stringify(state.statsArchive.map(r=>r.awards))}})()`);
assert(rt.results&&rt.codes);
for(const [label,mut] of [['bad code',"r.statsArchive[0].awards=[{code:'GOAT'}]"],['bad rank',"r.statsArchive[0].awards=[{code:'MVP',rank:9}]"],['bad finishes',"r.awardResults[0].finishes.MVP=[1,1]"],['bad team',"r.awardResults[0].teams.NBA4=[1]"]])
 assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));${mut};validateCareerData(r)})()`),/award/,label);
// 6. Old saves: winners → -1, MVP shares → MVP rank, allLeague/allDefense → ALL/DEF, family All-Star records → AS; nothing invented.
const old=run(`(()=>{const r=JSON.parse(JSON.stringify(state));delete r.awardResults;const y=r.year-3,ps=r.teams.flatMap(t=>t.roster).slice(0,6);
 r.statsArchive=ps.map((p,i)=>({id:p.id,name:p.name,team:'AAA',year:y,age:p.age,pos:p.pos,gp:60,ovr:70,high_pts:null,high_reb:null,high_ast:null,high_blk:null,high_stl:null,...Object.fromEntries(STATS_COUNTS.map(k=>[k,100])),mvpShare:[0,.4,.3,.2,0,.1][i],allLeague:i<3,allDefense:i===4}));
 r.regularAwards=[{year:y,mvp:{id:ps[0].id,name:ps[0].name,team:'A'},dpoy:{id:ps[4].id,name:ps[4].name,team:'A'},roy:null,sixth:null}];r.leagueHistory=[{year:y,finalsMvp:{name:ps[1].name,team:'A'}}];
 r.family={...(r.family||{}),people:[...(r.family?.people||[]),...(r.family?.people?.length?[]:[])]};const v=validateCareerData(r);return v.statsArchive.filter(x=>x.year===y).map(x=>x.awards.map(awardCodeText).join(', '))})()`);
assert.deepEqual(old,['MVP-1, ALL','MVP-2, FMVP, ALL','MVP-3, ALL','MVP-4','DPOY-1, DEF','MVP-5'],'old save codes: '+JSON.stringify(old));
// Family records supply All-Star selections for old seasons when they exist.
const fam=run(`(()=>{const r=JSON.parse(JSON.stringify(state));delete r.awardResults;const y=r.year-3,p=r.teams[2].roster[0];r.statsArchive=[{id:p.id,name:p.name,team:'AAA',year:y,age:p.age,pos:p.pos,gp:60,...Object.fromEntries(STATS_COUNTS.map(k=>[k,100]))}];const data={statsArchive:r.statsArchive,family:{people:[{playerId:p.id,seasons:[{year:y,allStar:1}]}]}};legacySeasonAwards(data);return data.statsArchive[0].awards})()`);
assert.deepEqual(fam,[{code:'AS'}]);
// 7. League prefixes: NBA presets use NBA1–3; WNBA leagues use WNBA1–2.
const nba=await setup('nba',152);assert.deepEqual(Object.keys(nba.run(endSeason).teams).filter(k=>/\d/.test(k)&&!/DEF|ROOK/.test(k)),['NBA1','NBA2','NBA3']);
const wnba=await setup('wnba',153);const wres=wnba.run(endSeason);assert.equal(wres.league,'WNBA');assert.deepEqual(Object.keys(wres.teams).filter(k=>/^WNBA/.test(k)),['WNBA1','WNBA2']);
console.log('Award codes: top-five finishes and tiered teams saved at season end, position balance, codes/tooltips/links on profile and league tables, save/load and old-save migration passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
