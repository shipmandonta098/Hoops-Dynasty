// Season year = the year a season ends. NBA 2026 runs October 2025 – June 2026 and is labeled 2025–26; WNBA 2024 runs
// May–September 2024 and is labeled 2024. Historical presets, setup hints, internal stamps and older saves stay consistent.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const iso=d=>d.slice(0,10);
const setup=(league,seed)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.lg=league;
 l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Calendar';
  if(lg==='wnba'){d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};}
  state=validateCareerData(buildSetupCareer(d));`);
 return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
// NBA: 2026 = 2025–26 (October 2025 – spring 2026), with the All-Star break in February 2026 and the draft labeled 2026.
const {l,run}=setup('nba',141);
const nba=run(`({year:state.year,first:scheduleDate(1).toISOString(),last:scheduleDate(seasonLength()).toISOString(),label:seasonLabel(),crosses:seasonCrossesYear(),
 breakDates:state.allStarCalendar?[scheduleDate(state.allStarCalendar.breakStart).toISOString(),scheduleDate(state.allStarCalendar.breakEnd).toISOString()]:null,protectedBreak:seasonMilestones().protectedBreak,
 range:(r=>[r.start.toISOString(),r.end.toISOString()])(seasonDateRange(2026,{seasonStart:'10-28',seasonEnd:'04-19'})),draft:ensureDraft().year,
 })`);
assert.equal(nba.year,2026);assert.equal(iso(nba.first),'2025-10-28');assert.match(nba.last,/^2026-0[4-6]/);assert.equal(nba.label,'2025–26');assert.equal(nba.crosses,true);
assert.deepEqual(nba.range.map(iso),['2025-10-28','2026-04-19']);
assert(nba.breakDates.every(d=>d.startsWith('2026-02')),'All-Star break falls in February 2026: '+nba.breakDates);assert.equal(nba.protectedBreak,true);
assert.equal(new Date(nba.breakDates[0]).getUTCDay(),4,'the break starts on the Thursday before All-Star Weekend in the displayed calendar');
assert.equal(nba.draft,2026,'the June 2026 draft after the 2025–26 season is the 2026 Draft');
const schedulePage=run(`scheduleView()`);assert(/2025–26 SEASON/.test(schedulePage)&&!/2026–27/.test(schedulePage),'schedule header reads 2025–26');
// Labels everywhere use the season label; the next season is 2026–27 and the start button names it.
assert.equal(run(`seasonLabel(state.year+1)`),'2026–27');
assert.equal(run(`contractSeason(2027)`),'2026–27');assert.equal(run(`franchiseSeasonLabel(2026)`),'2025–26');
// Internal injury/dissatisfaction stamps keep their original epoch so saved stamps stay comparable.
assert.equal(run(`medicalStamp()-Math.floor(Date.UTC(state.year,9,28)/86400000)`),run('state.day'));
// Settings form shows full dates in the right calendar years; setup explains the season year.
const settingsHtml=run(`leagueSettingsMarkup(leagueRules(),state.year)`);assert(settingsHtml.includes('value="2025-'+run('leagueRules().seasonStart')+'"'),'season start date input uses 2025');assert(settingsHtml.includes('value="2026-'+run('leagueRules().seasonEnd')+'"'));
assert.equal(run(`setupSeasonMeaning({year:2026,meetings:2,leagueSettings:{}})`),'2026 → 2025–26 season');
assert.equal(run(`setupSeasonMeaning({year:2024,meetings:'custom',leagueSettings:{seasonStart:'05-14',seasonEnd:'09-15'}})`),'2024 → 2024 season');
// Historical presets take the season year and read the start-year reference data (2026 = 2025–26 data).
const hist=run(`(()=>{const p=historicalPreset('nba',1985),q=historicalPresetFromStart('nba',1984),r=historicalPreset('nba',2026),s=historicalPresetFromStart('nba',2025);
 return {title:p.title,cap:p.cap,sameCap:p.cap===q.cap,year:p.rules.historicalYear,recent:r.title,sameRules:JSON.stringify({...r.rules,historicalYear:0})===JSON.stringify({...s.rules,historicalYear:0}),first:historicalPreset('nba',1947).title,options:historicalYearOptions('nba',2026).match(/<option value="(\\d+)"[^>]*>([^<]+)/g).slice(0,2),wnba:historicalPreset('wnba',2024).title}})()`);
assert.equal(hist.title,'NBA 1984–85');assert.equal(hist.cap,3.6,'1984–85 salary cap');assert(hist.sameCap&&hist.sameRules);assert.equal(hist.year,1985);assert.equal(hist.recent,'NBA 2025–26');assert.match(hist.first,/^NBA 1946–47/);assert.equal(hist.wnba,'WNBA 2024');
assert(/value="2027"[^>]*>2026–27/.test(hist.options[0])&&/value="2026"[^>]*>2025–26/.test(hist.options[1]),hist.options.join(' | '));
assert.throws(()=>l.run(`historicalPreset('nba',1946)`),/historical season/);assert.throws(()=>l.run(`historicalPreset('nba',2028)`),/historical season/);
// Leap-year safety: a custom season saved under the start-year convention keeps its calendar length.
const leap=run(`(()=>{const rules={...leagueRules(),seasonStart:'10-28',seasonEnd:'04-19'};return {now:seasonDateRange(2027,rules).days,legacy:legacySeasonDays(2027,rules)}})()`);assert.equal(leap.legacy,leap.now+1,'2027 legacy span (Oct 2027–Apr 2028) includes February 29');
// Older saves: dates shift back one year with the calendar, NBA preset years move to the season year, new saves round-trip.
const migrated=run(`(()=>{const r=JSON.parse(JSON.stringify(state));delete r.seasonYears;r.leagueSettings.historicalSource='nba';r.leagueSettings.historicalYear=2024;r.decisions={...(r.decisions||{agentTrust:0,fanSentiment:0,chemistry:0}),entries:[]};
 const sample=(()=>{const before=state;state=JSON.parse(JSON.stringify(state));const e=typeof addDecision==='function'?(addDecision({type:'Signing',description:'Test entry',date:'2026-11-05'}),state.decisions.entries.at(-1)):null;const out=e?JSON.parse(JSON.stringify(e)):null;state=before;return out})();
 if(sample){r.decisions={...r.decisions,...JSON.parse(JSON.stringify((()=>{const s=JSON.parse(JSON.stringify(state));return {agentTrust:s.decisions?.agentTrust??0,fanSentiment:s.decisions?.fanSentiment??0,chemistry:s.decisions?.chemistry??0}})())),entries:[sample]}}
 const v=validateCareerData(r),again=validateCareerData(JSON.parse(JSON.stringify(v)));return {flag:v.seasonYears,hy:v.leagueSettings.historicalYear,date:v.decisions?.entries?.[0]?.date??null,stable:JSON.stringify(again.decisions)===JSON.stringify(v.decisions)&&again.leagueSettings.historicalYear===v.leagueSettings.historicalYear,sample:!!sample}})()`);
assert.equal(migrated.flag,'end');assert.equal(migrated.hy,2025,'an NBA preset saved as 2024 (2024–25) becomes 2025');assert(migrated.stable,'migration runs once');
assert(migrated.sample,'a decision entry was recorded for the migration check');assert.equal(migrated.date,'2025-11-05','stored decision dates shift with the calendar');
assert.equal(run(`seasonYearsShiftDate('2024-02-29')`),'2023-03-01');assert.equal(run(`seasonYearsShiftDate('not a date')`),'not a date');
assert.throws(()=>l.run(`validateCareerData({...JSON.parse(JSON.stringify(state)),seasonYears:'start'})`),/season year convention/);
assert.equal(run(`validateCareerData(JSON.parse(JSON.stringify(state))).seasonYears`),'end');
// WNBA: 2024 runs May–September 2024 and is labeled 2024.
const w=setup('wnba',142);
const wnba=w.run(`({year:state.year,fmt:state.scheduleFormat,first:scheduleDate(1).toISOString(),last:scheduleDate(seasonLength()).toISOString(),label:seasonLabel(),crosses:seasonCrossesYear(),next:seasonLabel(state.year+1),draft:ensureDraft().year,contract:contractSeason(2025)})`);
assert.equal(wnba.year,2024);assert.equal(wnba.fmt,'custom');assert.match(wnba.first,/^2024-05/);assert.match(wnba.last,/^2024-0[89]/);
assert.deepEqual([wnba.label,wnba.crosses,wnba.next,wnba.draft,wnba.contract],['2024',false,'2025',2024,'2025']);
const wOld=w.run(`(()=>{const r=JSON.parse(JSON.stringify(state));delete r.seasonYears;r.expansion=r.expansion;const v=validateCareerData(r);return {flag:v.seasonYears,hy:v.leagueSettings.historicalYear}})()`);
assert.deepEqual(wOld,{flag:'end',hy:2024},'single-year WNBA saves keep their years');
console.log('Season years: NBA 2026 = Oct 2025–spring 2026 (2025–26), WNBA 2024 = May–Sep 2024, presets, labels, stamps and save migration passed.');
