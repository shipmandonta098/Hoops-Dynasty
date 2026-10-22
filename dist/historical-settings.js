/* Historical references are explicit, one-time presets, never automatic rule evolution.
 * Monetary tables use nominal USD millions, not inflation-adjusted dollars.
 * Unsupported rules and missing data are disclosed; they are never filled by interpolation.
 */
const HISTORICAL_LAST_YEAR=2026;
const HISTORICAL_SOURCES={
 nbaStyle:['Annual NBA statistical references · Gryko et al. / Basketball Reference','https://www.mdpi.com/1660-4601/20/3/1924'],
 wnbaStyle:['Annual WNBA statistics · Her Hoop Stats','https://herhoopstats.com/stats/wnba/league/'],
 contractHistory:['NBA CBA contract-term history','https://atlhawksfanatic.github.io/NBA-CBA-1995/length-of-player-contracts.html'],
 nba1990Floor:['1990–91 payroll minimum','https://www.latimes.com/archives/la-xpm-1990-08-01-sp-1702-story.html'],
 nbaFinance:['NBA salary-cap history · RealGM','https://basketball.realgm.com/nba/info/salary_cap'],
 nbaCurrent:['NBA 2026–27 official cap release','https://www.nba.com/news/nba-salary-cap-2026-27-season'],
 nbaHistory:['NBA season archives','https://www.nba.com/news/history-season-recaps-index'],
 nbaLottery:['NBA lottery history','https://www.nba.com/news/nba-draft-lottery-explainer'],
 wnbaHistory:['WNBA history','https://www.wnba.com/history'],
 wnbaEarly:['WNBA financial history · ESPN','https://www.espn.com/wnba/story/_/id/47813218/wnba-cba-collective-bargaining-agreement-negotiations-salary-cap'],
 wnba2014:['WNBPA 2014 CBA','https://wnbpa-uploads.s3.amazonaws.com/docs/WNBA%20CBA%202014-2021Final.pdf'],
 wnba2020:['Her Hoop Stats WNBA CBA FAQ · 2020 agreement','https://herhoopstats.com/wnba_cba_salary_cap_explained'],
 wnba2026:['WNBPA 2026 signed CBA','https://www.wnbpa.com/_files/ugd/8121a3_675911316ca142178932adc1e56519ac.pdf'],
 wnbaPlayoffs:['WNBA playoff format history','https://www.wnba.com/news/wnba-approves-new-playoff-format'],
 wnbaFinals:['WNBA seven-game Finals','https://pr.nba.com/wnba-finals-regular-season-expanded-format/']
};
const HISTORICAL_NBA_CAPS=[3.6,4.233,4.945,6.164,7.232,9.802,11.871,12.5,14,15.175,15.964,23,24.363,26.9,30,34,35.5,42.5,40.271,43.84,43.87,49.5,53.135,55.63,58.68,57.7,58.044,58.044,58.044,58.679,63.065,70,94.143,99.093,101.869,109.14,109.14,112.414,123.655,136.021,140.588,154.647,164.961];
const HISTORICAL_NBA_MIN=[.065,.070,.075,.075,.100,.110,.120,.130,.140,.150,.150,.200,.220,.242,.287500,.301875,.316969,.332817,.349458,.366931,.385277,.398762,.412718,.427163,.442114,.457588,.473604,.473604,.473604,.490180,.507336,.525093,.543471,.815615,.838464,.898310,.898310,.925258,1.017781,1.119563,1.157153,1.272870,1.357763];
const HISTORICAL_NBA_MAX=[14,14,14,14.875,14.094850,15.344,15.355,16.8,17.437,18.257750,19.261200,18.928700,19.045250,18.091071,19.136250,19.181750,20.644400,22.970500,30.963450,34.682550,35.654150,38.199,38.199,39.344900,43.279250,47.607350,49.205800,54.126450,57.736350];
const HISTORICAL_NBA_TAX={2002:52.88,2003:54.556722,2005:61.7,2006:65.42,2007:67.865,2008:71.15,2009:69.92,2010:70.307,2011:70.307,2012:70.307,2013:71.748,2014:76.829,2015:84.74,2016:113.287,2017:119.266,2018:123.733,2019:132.627,2020:132.627,2021:136.606,2022:150.267,2023:165.294,2024:170.814,2025:187.895,2026:200.428};
// 2003–2013 published cap/minimum/maximum. 2014–19 cap follows the
// actual 2% CBA growth factor, rounding to $100; salary scales are explicit.
const HISTORICAL_WNBA_EARLY=[
 [.622,.030,.085],[.647,.0306,.087],[.673,.0312,.089],[.700,.0318,.091],[.728,.0324,.093],
 [.772,.0345,.0975],[.803,.03519,.0995],[.827,.03588,.1015],[.852,.03675,.1035],[.878,.03726,.1055],[.913,.03795,.1075],
 [.901,.03815,.1075],[.9193,.038913,.1095],[.9379,.039676,.1115],[.9569,.040439,.1135],[.9763,.041202,.1155],[.9961,.041965,.1175]
];
// 2020–25 cap, minimum team payroll, lowest veteran minimum, supermax, #1 rookie.
const HISTORICAL_WNBA_MODERN=[
 [1.3,1.0881,.057,.215,.068],[1.339,1.12077,.05871,.22145,.07004],[1.3792,1.15434,.060471,.228094,.072141],
 [1.4205,1.18899,.062285,.234936,.074305],[1.4632,1.22463,.064154,.241984,.076535],[1.5071,1.26144,.066079,.249244,.078831],
 [7,5.95,.270,1.4,.500]
];
function historicalPreset(league,year){
 if(!['nba','wnba'].includes(league)||!Number.isInteger(year)||year<(league==='nba'?1946:1997)||year>HISTORICAL_LAST_YEAR)throw Error('Choose an available NBA or WNBA historical season.');
 const profile=historicalEraProfile(league,year),nba=league==='nba',r={...profile.rules,historicalSource:league,historicalYear:year,gamePeriods:nba?4:year<2006?2:4,periodMinutes:nba?12:year<2006?20:10,overtimeMinutes:5,courtPlayers:5,foulLimit:nba&&year===1946?5:6,threePointers:!nba||year>=1979};
 const notes=['This is a one-time rules snapshot. Later seasons keep these settings until you edit them; historical rules do not advance automatically.','Existing teams, players, signed contracts and history are not replaced. These are fictional leagues using historical rule references.','Court dimensions, shot-clock eras, defensive-rule changes, cap exceptions, service-based salary tiers, contract options and historical revenue/operating costs are not fully modeled.'],sources=nba?['nbaFinance','nbaHistory','nbaLottery']:['wnbaHistory','wnbaEarly','wnba2014','wnba2020','wnbaPlayoffs','wnbaFinals'];
 let cap=null,games=null;
 if(nba){
  if(year>=1984){cap=HISTORICAL_NBA_CAPS[year-1984];r.salaryCapType='soft';r.minContract=HISTORICAL_NBA_MIN[year-1984];}
  else if(year>1946){r.salaryCapType='none';notes.push('No modern team salary cap in this era. Historical contract salary scales are not verified here; the cap value is retained and unavailable salary amounts use model defaults.');}
  else notes.push('The inaugural BAA team payroll restriction and salary scales are not modeled. The cap value is retained and unavailable salary amounts use model defaults; this is a partial 1946–47 rules preset.');
  if(year>=1998){r.maxContract=HISTORICAL_NBA_MAX[year-1998];notes.push('Contract bounds use the rookie minimum and highest service-tier maximum. Individual eligibility tiers remain simplified.');}
  else notes.push('No historical individual salary maximum applies. See the technical ceiling explanation below.');
  r.luxuryTaxEnabled=Object.hasOwn(HISTORICAL_NBA_TAX,year);
  if(r.luxuryTaxEnabled){r.luxuryTaxThreshold=HISTORICAL_NBA_TAX[year];notes.push('Tax threshold is historical; the game’s progressive/repeater tax calculation is an approximation for this era.');}
  if(year>=2013)r.minimumPayroll=Math.round(cap*.9*1e6)/1e6;
  else if(!r.minimumPayroll)notes.push('A verified minimum team payroll is not supplied for this year; the payroll floor is disabled (0), not carried over from another era.');
  if(year===2026){r.minimumPayroll=148.465;sources.push('nbaCurrent');}
  if(year===1946)games=60;else if(year===1947)games=48;else if(year>=1967)games=year===1998?50:year===2011?66:year===2020?72:year===2019?null:82;
  if(games===null)notes.push('Uniform per-team game count is not supplied for this season (early/unequal schedules or the 2019–20 interruption). Your calendar stays unchanged.');
  if(year>=1983){Object.assign(r,{playoffFormat:'sixteen',firstRoundByes:0,splitPlayoffs:true,seriesGames:7,seriesFirstGames:year<2002?5:7,seriesQuarterGames:7,seriesSemiGames:7,seriesFinalGames:7});}
  else {r.seriesFinalGames=7;notes.push('Early playoff qualification and asymmetric rounds are not recreated. Only the best-of-seven Finals setting is applied.');}
  // NBA reference year is the START of a season; its draft takes place next year.
  const draftYear=year+1;
  if(draftYear>=1989)r.draftRounds=2;else if(draftYear===1988)r.draftRounds=3;else notes.push('Historical drafts with more than five rounds are not supported; draft-round count stays unchanged.');
  if(draftYear>=2019)Object.assign(r,{lotteryMode:'custom',lotterySelections:4,lotteryChances:'14,14,14,12.5,10.5,9,7.5,6,4.5,3,2,1.5,1,0.5'});
  else if(draftYear>=2005)Object.assign(r,{lotteryMode:'custom',lotterySelections:3,lotteryChances:'25,19.9,15.6,11.9,8.8,6.3,4.3,2.8,1.7,1.1,0.8,0.7,0.6,0.5'});
  else if(draftYear>=1990&&draftYear<=1993)Object.assign(r,{lotteryMode:'custom',lotterySelections:3,lotteryChances:'11,10,9,8,7,6,5,4,3,2,1'});
  else if(draftYear>=1985&&draftYear<=1989)Object.assign(r,{lotteryMode:'equal',lotterySelections:draftYear<1987?36:3});
  else notes.push('This year’s coin-flip, territorial or changing-size weighted lottery is not supplied; draft ordering stays unchanged.');
  if(year>=2005)r.prospectAgeMin=19;
 }else{
  Object.assign(r,{dunkEnabled:false,risingStarsEnabled:false,splitPlayoffs:year>=1999&&year<2016,luxuryTaxEnabled:false,tradeSalaryMatch:0});
  games=year===1997?28:year===1998?30:year<=2002?32:year<=2019?34:year===2020?22:year===2021?32:year===2022?36:year<=2024?40:44;
  if(year>=2003){const f=year<2020?HISTORICAL_WNBA_EARLY[year-2003]:HISTORICAL_WNBA_MODERN[year-2020];cap=f[0];Object.assign(r,{salaryCapType:'hard',minContract:year<2020?f[1]:f[2],maxContract:year<2020?f[2]:f[3]});
   if(year>=2020)Object.assign(r,{minimumPayroll:f[1],rookieScaleEnabled:true,rookieTopMode:'fixed',rookieTopSalary:f[4],rookieSalary:1});
   else {r.minimumPayroll=0;r.rookieTopSalary=Math.round(cap*.05*1e6)/1e6;notes.push('A verified payroll floor and rookie scale are unavailable for this year. The floor is disabled; #1 pick salary uses an explicitly approximate 5% of the cap, bounded by the contract limits.');}
   notes.push('Minimum/maximum contracts use the lowest minimum and highest eligible maximum. Service tiers and hardship exceptions are not reproduced.');
  }else notes.push('1997–2002 predates the published team-cap series. Centralized contracts and early salary scales are not supplied; the cap value is retained and unavailable contract amounts use model defaults. This is a partial rules preset, not a verified financial reconstruction.');
  if(year>=2009)Object.assign(r,{rosterMin:year>=2026?12:11,rosterMax:year<2014?11:12});
  else notes.push('Early active/inactive roster rules are not supplied; roster limits stay unchanged.');
  r.draftRounds=year<=2002?4:3;
  Object.assign(r,{seriesGames:year===1997?1:3,seriesFirstGames:0,seriesQuarterGames:3,seriesSemiGames:year===1997?1:year<2016?3:5,seriesFinalGames:year===1997?1:year<2005?3:year<2025?5:7});
  if(year<=1998)Object.assign(r,{playoffFormat:'top4',firstRoundByes:0});
  else if(year===1999)Object.assign(r,{playoffFormat:'eight',firstRoundByes:2,seriesQuarterGames:1});
  else if(year>=2000&&year<2016||year>=2022)Object.assign(r,{playoffFormat:'eight',firstRoundByes:0});
  else notes.push('2016–21 double-bye/reseeding format is not supported. Qualification/byes stay unchanged; semifinal and Finals lengths are applied.');
  notes.push('The WNBA draft is held before its season in real life; Hoops Dynasty retains its postseason draft timing. WNBA lottery ranking/expansion rules are not reproduced, so lottery settings stay unchanged.');
  if(year>=2026){sources.push('wnba2026');notes.push('2026 includes the signed new CBA. Two developmental roster slots and their separate contracts are not modeled.');}
 }
 notes.push(...profile.notes);sources.push(...profile.sources);
 notes.push('Rookie pick-by-pick scales, domestic/international eligibility distinctions, and special draft allocations remain simplified. Fields not covered by historical evidence are identified as model defaults or retained settings.');
 return {league,year,title:nba?`NBA ${year}–${String(year+1).slice(-2)}${year<1949?' · BAA era':''}`:`WNBA ${year}`,rules:r,cap,games,notes,sources};
}
function historicalSchedulePatch(p,teams,before){
 if(p.games===null)return {};
 // Keep the current matchup proportions; exact historical opponents require historical teams.
 const eligible=[0,1,2].filter(c=>teams.every((t,i)=>teams.some((o,j)=>i!==j&&customCategory(t,o)===c)));
 if(!eligible.length)throw Error('The league alignment cannot support a uniform historical schedule.');
 const old=[before.divisionGames,before.conferenceGames,Math.max(0,before.seasonGames-before.divisionGames-before.conferenceGames)],weights=eligible.map(c=>old[c]||1),sum=weights.reduce((a,b)=>a+b,0),counts=[0,0,0];
 let remaining=p.games;eligible.forEach((c,i)=>{counts[c]=i===eligible.length-1?remaining:Math.min(remaining,2*Math.floor(p.games*weights[i]/sum/2));remaining-=counts[c]});
 return {seasonGames:p.games,divisionGames:counts[0],conferenceGames:counts[1],seasonStart:p.league==='wnba'?'05-01':'10-01',seasonEnd:p.league==='wnba'?'09-30':'04-30'};
}
function historicalPlan(league,year,before,cap,teams){
 const p=historicalPreset(league,year),rules={...before,...p.rules,...historicalSchedulePatch(p,teams,before)};
 readLeagueSettings(rules,{year,teams,salaryCap:p.cap??cap});validatePlayoffRules(rules,teams);
 return {...p,rules,cap:p.cap??cap};
}
function historicalMoney(n){return '$'+Math.round(n*1e6).toLocaleString('en-US');}
function historicalPresetMarkup(rules,year,locked=false){
 const league=rules.historicalSource==='wnba'?'wnba':'nba',selected=rules.historicalSource==='custom'?Math.min(HISTORICAL_LAST_YEAR,Math.max(league==='nba'?1946:1997,year)):rules.historicalYear;
 return `<details class="league-settings-group historical-presets"><summary>Historical NBA / WNBA settings<span>1946–2026 · 1997–2026</span></summary><div class="note"><p>Choose a real season, review the supported rules, then apply them to this form. ${onSetup?'The starting year and player gender will match the preset.':'Your career year and existing players stay unchanged. Save settings to commit.'}</p><div class="tm-grid"><label>League<select id="historical-league" onchange="refreshHistoricalPreview(true)"><option value="nba" ${league==='nba'?'selected':''}>NBA / BAA · From 1946</option><option value="wnba" ${league==='wnba'?'selected':''}>WNBA · From 1997</option></select></label><label>Historical season<select id="historical-year" onchange="refreshHistoricalPreview()">${historicalYearOptions(league,selected)}</select></label></div><div id="historical-preview">${historicalPreview(league,selected)}</div><p>${rules.historicalSource==='custom'?'No historical preset applied.':`Last applied reference: ${escapeHTML(historicalPreset(rules.historicalSource,rules.historicalYear).title)}. Individual settings can be customized afterward.`}</p><input type="hidden" name="rule_historicalSource" value="${rules.historicalSource}"><input type="hidden" name="rule_historicalYear" value="${rules.historicalYear}"><button type="button" class="primary" onclick="applyHistoricalPreset()" ${locked?'disabled':''}>Apply historical settings</button>${locked?'<p class="setting-lock">Available before the first game of a season. Existing phase locks still apply.</p>':''}<p id="historical-feedback" role="status"></p></div></details>`;
}
function historicalYearOptions(league,selected){const start=league==='nba'?1946:1997;return Array.from({length:HISTORICAL_LAST_YEAR-start+1},(_,i)=>HISTORICAL_LAST_YEAR-i).map(y=>`<option value="${y}" ${y===selected?'selected':''}>${league==='nba'?`${y}–${String(y+1).slice(-2)}`:y}</option>`).join('');}
function historicalPreview(league,year){const p=historicalPreset(league,year),values=[...(p.cap!==null?[['Salary cap',historicalMoney(p.cap)]]:[]),...Object.entries(p.rules).filter(([k])=>!k.startsWith('historical')).map(([k,v])=>{const field=LEAGUE_SETTING_FIELDS.find(f=>f[0]===k),range=field?.[3];return [field?.[1]||k,Array.isArray(range?.[0])?range.find(([value])=>value===v)?.[1]:String(v)]})];return `<h3>${escapeHTML(p.title)}</h3><p>${p.games===null?'Schedule unchanged.':`${p.games} games per team. Calendar uses an adapted October–April / May–September window and your alignment, not historical dates or opponents.`}</p><details><summary>Settings applied (${values.length})</summary><div class="scroll"><table><tbody>${values.map(([k,v])=>`<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('')}</tbody></table></div></details><details open><summary>Coverage and limitations</summary><ul>${p.notes.map(n=>`<li>${escapeHTML(n)}</li>`).join('')}</ul></details><details><summary>Sources · verified October 2026</summary><ul>${p.sources.map(k=>`<li><a href="${HISTORICAL_SOURCES[k][1]}" target="_blank" rel="noopener noreferrer">${escapeHTML(HISTORICAL_SOURCES[k][0])}</a></li>`).join('')}</ul></details>`;}
function refreshHistoricalPreview(changedLeague=false){const league=document.getElementById('historical-league').value,select=document.getElementById('historical-year');if(changedLeague)select.innerHTML=historicalYearOptions(league,Math.max(league==='nba'?1946:1997,Number(select.value)));document.getElementById('historical-preview').innerHTML=historicalPreview(league,Number(select.value));document.getElementById('historical-feedback').textContent='';}
function applyHistoricalPreset(){
 const feedback=document.getElementById('historical-feedback');try{
  if(settingsBusy||saveActionBusy)throw Error('Wait for the current save to finish.');
  if(!onSetup&&seasonSettingsLocked())throw Error('Historical presets are locked after the first regular-season game.');
  const league=document.getElementById('historical-league').value,year=Number(document.getElementById('historical-year').value),form=document.getElementById('historical-league').closest('form');
  if(onSetup)captureSetup();
  const values=Object.fromEntries(new FormData(form)),before=onSetup?setupLeagueRules():readLeagueSettingsForm(values),teams=onSetup?setupDraft.teams:state.teams,cap=Number(values.cap??(onSetup?setupDraft.cap:salaryCap())),plan=historicalPlan(league,year,before,cap,teams);
  if(!onSetup){for(const field of LEAGUE_SETTING_FIELDS)if(leagueSettingLock(field)&&plan.rules[field[0]]!==before[field[0]])throw Error(field[1]+': '+leagueSettingLock(field));if(teams.some(t=>t.roster.length<plan.rules.rosterMin||t.roster.length>plan.rules.rosterMax))throw Error('Current roster sizes do not fit this preset. Adjust rosters first, or use it in New Career.');}
  if(plan.games!==null)customSeasonSchedule(teams,onSetup?year:state.year,plan.rules);
  if(onSetup){Object.assign(setupDraft,{year,cap:plan.cap,leagueGender:league==='wnba'?'female':'male',leagueSettings:plan.rules});if(plan.games!==null)setupDraft.meetings='custom';renderSetupLeagueSettings();document.querySelector('.historical-presets').open=true;document.getElementById('historical-feedback').textContent='Applied to League Settings, including finances, contracts, rookie contracts, game rules and tendencies. Review the fields below, then Start Career.';}
  else {for(const field of LEAGUE_SETTING_FIELDS){const input=form.elements['rule_'+field[0]];if(input)input.value=field[3]==='date'?`${state.year+(field[0]==='seasonEnd'&&plan.rules.seasonEnd<plan.rules.seasonStart?1:0)}-${plan.rules[field[0]]}`:String(plan.rules[field[0]]);}form.elements.cap.value=plan.cap;if(plan.games!==null)form.elements.format.value='custom';feedback.textContent='Applied to this form, including finances, contracts and tendencies. Review, then Save settings. Existing signed salaries remain unchanged.';}
 }catch(e){feedback.textContent=e.message;}
}
const markupBeforeHistorical=leagueSettingsMarkup;
leagueSettingsMarkup=function(rules=leagueRules(),year=state.year,lock=leagueSettingLock,groups=LEAGUE_SETTING_GROUPS,capAmount=salaryCap()){return historicalPresetMarkup(rules,year,!!lock([null,null,null,null,null,'season']))+markupBeforeHistorical(rules,year,lock,groups.filter(([name])=>name!=='Historical reference'),capAmount);};
