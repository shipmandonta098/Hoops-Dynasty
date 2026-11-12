// Season labels follow the season's dates, not the schedule format: a season crosses New Year only when its end
// month/day comes before its start (seasonCrossesYear matches seasonDateRange). NBA-style Oct–Apr → '2025–26';
// WNBA-style May–Sep → '2026' on every schedule format (custom, 82-game, round robin); a custom league crossing New Year
// → a two-year label. Displayed dates, the stats season picker and owner goal text agree with the label.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const wnba=(meetings)=>`d.year=2026;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings=${JSON.stringify(meetings)};d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',2026,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules};d.meetings=${JSON.stringify(meetings)};syncAlignment(d);`;
const cases=[
 ['NBA default (82 games, Oct–Apr)','',{format:'nba82',label:'2025–26',first:'2025-10-28',crosses:true}],
 ['NBA round robin ×1 (Oct 28–Nov 25, inside one year)','d.meetings=1;',{format:'roundRobin',label:'2026',first:'2026-10-28',crosses:false}],
 ['NBA round robin ×4 (Oct–Feb, crosses New Year)','d.meetings=4;',{format:'roundRobin',label:'2025–26',first:'2025-10-28',crosses:true}],
 ['WNBA preset, custom','d.year=2026;'+wnba('custom').slice('d.year=2026;'.length),{format:'custom',label:'2026',first:'2026-05-16',crosses:false}],
 ['WNBA preset, round robin ×1',wnba(1),{format:'roundRobin',label:'2026',first:'2026-05-16',crosses:false}],
 ['WNBA preset, round robin ×2',wnba(2),{format:'roundRobin',label:'2026',first:'2026-05-16',crosses:false}],
 ['WNBA preset, round robin ×4',wnba(4),{format:'roundRobin',label:'2026',first:'2026-05-16',crosses:false}],
 ['May–Sep dates, 82 games',`d.year=2026;d.leagueSettings={...setupLeagueRules(d),seasonStart:'05-16',seasonEnd:'09-11'};`,{format:'nba82',label:'2026',first:'2026-05-16',crosses:false}],
 ['Custom league crossing New Year (Nov–Mar)',`d.year=2026;d.teams=d.teams.slice(0,12);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});d.leagueSettings={...setupLeagueRules(d),seasonStart:'11-01',seasonEnd:'03-31',seasonGames:40,divisionGames:0,conferenceGames:40};syncAlignment(d);`,{format:'custom',label:'2025–26',first:'2025-11-01',crosses:true}],
];
for(const [name,setup,want] of cases){const l=loadLeague({seed:4,strictDOM:false});l.setRandomSeed(4);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
 l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='L';${setup}state=validateCareerData(buildSetupCareer(d));`);
 const got=run(`({format:state.scheduleFormat,label:seasonLabel(),crosses:seasonCrossesYear(),first:scheduleDate(1).toISOString().slice(0,10),last:scheduleDate(seasonLength()).toISOString().slice(0,10),startYear:seasonStartYear(),range:seasonDateRange(state.year,leagueRules()).start.toISOString().slice(0,10)})`);
 assert.equal(got.format,want.format,name+' format');assert.equal(got.label,want.label,name+' label');assert.equal(got.crosses,want.crosses,name+' crosses');assert.equal(got.first,want.first,name+' first date');
 assert.equal(got.range,got.first,name+': displayed dates match seasonDateRange');assert.equal(got.startYear,Number(got.first.slice(0,4)),name+': start year');
 // Single-year seasons never show a two-year label anywhere; cross-year seasons always do.
 const yearly=want.crosses?/^\d{4}–\d{2}$/:/^\d{4}$/;assert.match(run('seasonLabel(state.year-1)'),yearly,name+' previous season label');
 // The league stats season picker shows the same label as the rest of the game.
 const view=run(`(()=>{try{return leagueStatsView()}catch(e){return 'ERR '+e.message}})()`);assert(!view.startsWith('ERR'),view);assert(view.includes('>'+got.label+'<'),name+': stats picker shows '+got.label);
 assert.doesNotMatch(view,new RegExp('>'+(Number(got.first.slice(0,4))+(want.crosses?1:0))+'–'+(Number(got.first.slice(0,4))+(want.crosses?2:1))+'<'),'no off-by-one range');
 if(!want.crosses)assert(got.last.slice(0,4)===got.first.slice(0,4),name+': whole season inside one calendar year');
}
// The stats season picker and owner goals use seasonLabel (no hand-built 'YYYY–YY').
const src=f=>require('fs').readFileSync('dist/'+f,'utf8');
assert.doesNotMatch(src('league-stats.js'),/y\+'–'\+\(y\+1\)/);assert.match(src('league-stats.js'),/seasonLabel\(y\)\]/);
assert.match(src('owners.js'),/\$\{seasonLabel\(c\.startYear\)\} to \$\{seasonLabel\(c\.startYear\+2\)\}/);
assert.doesNotMatch(src('custom-season.js'),/format!=='custom'\|\|rules\.seasonEnd<rules\.seasonStart/);
console.log('Season labels: NBA 2025–26, NBA round robin ×1 2026 / ×4 2025–26, WNBA-style 2026 on custom / round robin ×1 ×2 ×4 / 82-game, custom Nov–Mar 2025–26; dates match seasonDateRange passed.');
