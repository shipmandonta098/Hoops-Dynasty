/* Career-owned rule controls. Defaults preserve existing game behavior. */
const LEAGUE_SETTING_GROUPS=[
 ['Historical reference',[
 ['historicalSource','Last applied historical league','custom',[['custom','Custom'],['nba','NBA / BAA'],['wnba','WNBA']],'Reference only; individual values remain editable.','season'],
 ['historicalYear','Historical reference year',2026,[1946,2027,1],'Season year: the year an NBA season ends (2026 = 2025–26); WNBA calendar year.','season']]],
 ['Schedule',[
 ['openingNightFormat','Opening night format','auto',[['auto','Automatic · 2 featured games'],['double','Double-header · 2 games'],['triple','Triple-header · 3 games'],['solo','Legacy solo · next calendar uses 2 games'],['standard','Legacy standard · next calendar uses 2 games']],'Uses roster quality, prior records, playoff success and competitive storylines. New calendars feature 2 or 3 games and require all debuts by day 3; impossible configurations are rejected.','season'],
 ['openingWindowDays','Legacy first-game preference',3,[1,7,1],'Retained for save compatibility. New calendars require every team to debut by day 3 regardless of this legacy value.','season'],
 ['restDistribution','Balance rest patterns',true,[[true,'Enabled'],[false,'Disabled']],'Targets roughly 60% standard, 15% extended, 15% back-to-back and 8% long gaps. Dates and matchup requirements take priority. Applies to new calendars.','season'],
 ['restLoadManagement','Automatic fatigue load management',true,[[true,'Enabled'],[false,'Disabled']],'On back-to-backs, players below 70 energy target at most 18 minutes. Short healthy rosters may require more.'],
 ['seasonGames','# of games per season',82,[1,120,1],'Exact games per team. Editing these totals or dates creates a custom calendar.','season'],
 ['divisionGames','# of division games',16,[0,120,1],'Games per team against its own division.','season'],
 ['conferenceGames','# of conference games',36,[0,120,1],'Against the same conference, excluding division games. Remaining games are interconference.','season'],
 ['seasonStart','Start date','10-28','date','First day of the regular season; month and day repeat each year.','season'],
 ['seasonEnd','End date','04-19','date','Last day of the regular season. An earlier month/day means the following year.','season'],
 ['scheduleAudience','Default schedule view','team',[['team','Your team'],['league','Entire league']],'Applies when opening a career or resetting the schedule view.'],
 ['scheduleScope','Default date range','month',[['month','Month'],['week','Week'],['season','Full season'],['remaining','Remaining games']],'Calendar display only. Schedule format is set in Season rules above.']]],
 ['Standings',[
 ['tieHeadToHead','Head-to-head priority',1,[0,6,1],'Win percentage against the other tied teams. 1 is first; 0 disables this criterion.','season'],
 ['tieDivisionLeader','Division winner priority',2,[0,6,1],'A division winner ranks above a non-winner. 0 disables this criterion.','season'],
 ['tieDivisionRecord','Division record priority',3,[0,6,1],'Win percentage within the division, used only when all tied teams share a division. 0 disables.','season'],
 ['tieConferenceRecord','Conference record priority',4,[0,6,1],'Win percentage within the conference, used only when all tied teams share a conference. 0 disables.','season'],
 ['tiePointDifferential','Point differential priority',5,[0,6,1],'Total regular-season points scored minus points allowed. 0 disables.','season'],
 ['tiePointRatio','Point ratio priority',0,[0,6,1],'Total regular-season points scored divided by points allowed. 0 disables. Coin toss is always the final fallback.','season'],
 ['standingsGrouping','Group standings by','conference',[['conference','Conference'],['division','Division']],'Also updates the grouping buttons in Standings.']]],
 ['Playoffs',[
 ['playoffFormat','Playoff field','auto',[['auto','Automatic · 16 or 4 slots'],['top4','4 bracket slots'],['eight','8 bracket slots'],['sixteen','16 bracket slots']],'Automatic uses 16 bracket slots in leagues of at least 16 teams; otherwise 4. Byes reduce the number of qualifying teams.','season'],
 ['seriesGames','Default playoff series length',7,[[1,'1 · Single elimination'],[3,'Best of 3'],[5,'Best of 5'],[7,'Best of 7']],'A series ends as soon as a team wins the majority of its games. Round overrides are below.','playoffs'],
 ['seriesFirstGames','First round',0,[[0,'Use league default'],[1,'1 · Single elimination'],[3,'Best of 3'],[5,'Best of 5'],[7,'Best of 7']],'Used in 8- and 16-team brackets.','playoffs'],
 ['seriesQuarterGames','Conference semifinals / Quarterfinals',0,[[0,'Use league default'],[1,'1 · Single elimination'],[3,'Best of 3'],[5,'Best of 5'],[7,'Best of 7']],'Used in 16-team brackets.','playoffs'],
 ['seriesSemiGames','Conference finals / Semifinals',0,[[0,'Use league default'],[1,'1 · Single elimination'],[3,'Best of 3'],[5,'Best of 5'],[7,'Best of 7']],'The round before the championship, including 4-team brackets.','playoffs'],
 ['seriesFinalGames','Championship / Finals',0,[[0,'Use league default'],[1,'1 · Single elimination'],[3,'Best of 3'],[5,'Best of 5'],[7,'Best of 7']],'The championship series in every bracket.','playoffs'],
 ['firstRoundByes','First-round byes',0,[0,8,1],'Top seeds advance automatically. Byes reduce qualifiers; use an even number when splitting by conference.','season'],
 ['splitPlayoffs','Split by conference',true,[[true,'Enabled'],[false,'Disabled']],'With exactly two conferences and enough teams for each side, seed the top N from each separately. Otherwise use league-wide seeds.','season']]],
 ['Players',[
 ['awardTeamPositions','All-League and All-Defensive teams','balanced',[['balanced','Position-balanced · 2 guards, 2 forwards, 1 center'],['positionless','Position-less · best five']],'Applies to award teams chosen at the end of each regular season. All-Rookie teams are always position-less.'],
 ['developmentRate','Player development / decline multiplier',1,[0,2,.1],'Scales offseason rating changes, including decline. 0 freezes overall development; aging continues.']]],
 ['Teams',[
 ['captainDesignations','Official captains','captainCo',[['captainCo','Captain and co-captain'],['captainOnly','Captain only'],['none','No official captains']],'Head coaches choose captains by appointment, player vote or consultation. Teams may also go without a formal captain.'],
 ['rosterMin','Minimum roster size',14,[5,30,1],'Minimum retained after roster moves and required to finish free agency. Existing rosters are not automatically changed.'],
 ['rosterMax','Maximum roster size',15,[5,30,1],'Maximum for signings, trades and drafted players. Excess draft picks are held as unsigned rights.'],
 ['altitudeStrength','Altitude fatigue strength',1,[0,2,.1],'0 disables altitude. 1 uses modest estimated fatigue and recovery effects. Independent of crowd advantage; no direct shooting penalty.'],
 ['homeAdvantage','Home-court advantage (%)',.8,[0,3,.1],'Baseline home FG/FT bonus in percentage points, scaled by attendance. Road shooting, turnovers and foul risk respond to crowd energy, sentiment, age, focus and chemistry. Also scales rebound edges and brief momentum. 0 disables these effects. Shared-crowd rivalries and neutral exhibitions receive no venue advantage.']]],
 ['Draft',[
 ['lotterySelections','# of lottery selections',4,[0,36,1],'Number of first-round slots drawn among non-playoff teams, capped at the eligible field.','lottery'],
 ['lotteryChances','Custom lottery chances','14,14,14,12.5,10.5,9,7.5,6,4.5,3,2,1.5,1,0.5','weights','Comma-separated weights, worst eligible record first. The first N entries are used for N eligible teams; weights are normalized each draw.','lottery'],
 ['tradePickSeasons','# of tradeable draft-pick seasons',5,[0,10,1],'Includes the current draft. 0 disables pick trading. Previously traded picks retain their owners.'],
 ['draftRounds','# of draft rounds',2,[1,5,1],'Applies to future classes. Already traded future-round picks must remain available.','draftClass'],
 ['prospectAgeMin','Minimum prospect age',19,[16,30,1],'Age when prospects are generated. Existing classes stay unchanged.','draftClass'],
 ['prospectAgeMax','Maximum prospect age',22,[16,30,1],'Set both ages to the same value for a single-age class.','draftClass'],
 ['lotteryMode','Draft type','weighted',[['weighted','Weighted lottery'],['equal','Equal-chance lottery'],['custom','Custom lottery'],['record','Reverse standings'],['random','Random order · All teams'],['snake','Snake · Reverse standings']],'Expansion seeding rules still apply.','lottery'],
 ['draftStrength','Future draft class rating adjustment',0,[-10,10,1],'Adjusts overall and potential when a new class is generated. Existing prospects stay unchanged.','draftClass']]],
 ['Finances',[
 ['minimumPayroll','Minimum payroll ($M)',0,[0,1000,.000001],'Season-end shortfalls are charged as payroll. 0 disables the payroll floor.','season'],
 ['luxuryTaxThreshold','Luxury tax threshold ($M)',165,[0,2000,.000001],'Payroll above this amount is taxed at the final season review.','season'],
 ['luxuryTaxEnabled','Luxury tax',true,[[true,'Enabled'],[false,'Disabled']],'Disables tax charges without changing the salary cap.','season'],
 ['luxuryTaxRate','Luxury tax base rate ($ per $ over)',1.5,[0,10,.1],'Each $5M band adds 0.5 to this rate; repeaters add 1. The multiplier below scales the total.','season'],
 ['salaryCapType','Salary cap type','soft',[['hard','Hard'],['soft','Soft'],['none','None']],'Hard: no exceptions above cap. Soft: offseason exceptions up to 130%. None: no team payroll ceiling; individual contract limits still use the cap amount.','season'],
 ['budgetEnabled','Basketball operations budget',true,[[true,'Enabled'],[false,'Disabled']],'When disabled, removes budget expenses and funding bonuses/penalties. Other revenue and expenses continue.','season'],
 ['tradeSalaryMatch','Trade salary match (%)',110,[0,300,1],'Over-cap incoming salary may equal this percentage of outgoing salary plus $0.1M. 0 disables matching. No-cap leagues ignore matching.','season'],
 ['taxMultiplier','Luxury-tax multiplier',1,[0,3,.1],'0 disables future luxury-tax charges; payroll and spending limits still apply.','season'],
 ['operatingCosts','Operating-cost multiplier',1,[.5,2,.1],'Scales future operations ledger charges, not player payroll or past expenses.','season']]],
 ['All Star',[
 ['allStarRestLength','All-Star break length (days)',7,[7,8,1],'Protected league break, with the event schedule centered inside it. Applies to new calendars.','season'],
 ['allStarEventDays','Event schedule length (days)',3,[1,7,1],'Rising Stars opens the schedule, contests fall in the middle, and the All-Star Game closes it. Events run consecutively inside the protected league break.','season'],
 ['risingStarsEnabled','Rising Stars',true,[[true,'Enabled'],[false,'Disabled']],'An exhibition for first- and second-year players. Does not affect regular-season statistics.','season'],
 ['allStarSchedule','Game scheduling','auto',[['auto','Automatic · Existing season break'],['custom','Custom · Season progress below']],'Controls where the break falls in newly generated calendars. In-progress calendars are preserved.','season'],
 ['allStarPercent','All-Star Game at season progress (%)',65,[1,100,1],'Used for custom scheduling. Used for custom scheduling. The break is placed near this point in the calendar.','season'],
 ['allStarPlayers','# of players per team',12,[5,30,1],'Uses the available player pool if the league has fewer eligible players.','season'],
 ['allStarAssignment','Team assignment','conference',[['conference','By conference'],['draft','Captains draft'],['mixed','Mixed']],'Conference teams require two conferences with enough players. Otherwise use balanced mixed teams. Captains draft automatically in snake order.','season'],
 ['allStarSelection','Selection positions','locked',[['locked','Starters: two guards, three frontcourt'],['positionless','Positionless']],'Reserve places follow the coaches poll. Small pools fill remaining places by overall voting score.','season'],
 ['allStarElam','Untimed target-score fourth quarter',false,[[true,'Enabled'],[false,'Disabled']],'After three quarters, the target is the leading score plus 24. Exhibition only.','season'],
 ['dunkEnabled','Dunk contest',true,[[true,'Enabled'],[false,'Disabled']],'Selects contestants by dunking and jumping ratings.','season'],
 ['dunkParticipants','# of dunk contest participants',4,[2,36,1],'Limited to the available player pool.','season'],
 ['threeContestEnabled','3pt contest',true,[[true,'Enabled'],[false,'Disabled']],'Selects contestants by three-point shooting rating.','season'],
 ['threeParticipants','# of players in 3pt contest',8,[2,36,1],'Limited to the available player pool.','season'],
 ['allStarEnabled','All-Star showcases',true,[[true,'Enabled'],[false,'Disabled']],'Controls ceremonial results and calendar event labels. Existing rest days are retained.','season']]],
 ['Inflation',[
 ['inflationMin','Minimum inflation (%)',0,[-20,50,.1],'Lower bound for each annual inflation draw. Negative values allow deflation.'],
 ['inflationMax','Maximum inflation (%)',10,[-20,50,.1],'Upper bound for each annual inflation draw.'],
 ['capInflation','Average inflation (%)',0,[-20,50,.1],'Mean of the annual normal draw, clamped to your minimum and maximum. Scales cap, payroll floor, tax threshold and new contract salary limits.'],
 ['inflationStdDev','Inflation standard deviation (percentage points)',0,[0,30,.1],'0 uses the average every year. Existing signed salaries and ticket prices stay unchanged.']]],
 ['Contracts',[
 ['minContract','Minimum contract ($M / year)',1,[.000001,1000,.000001],'Minimum annual salary for new contracts. Existing signed deals remain unchanged.','freeAgency'],
 ['maxContract','Maximum contract ($M / year)',52.5,[.000001,1000,.000001],'Maximum annual salary for new contracts, including in no-cap leagues.','freeAgency'],
 ['minContractYears','Minimum contract length (seasons)',1,[1,10,1],'Applies to new free-agent contracts and extension terms. Rookie lengths are configured separately.','freeAgency'],
 ['maxContractYears','Maximum contract length (seasons)',4,[1,10,1],'Applies to new human and CPU contracts and total future seasons on an extension. Existing contracts stay unchanged.','freeAgency'],
 ['salaryDemand','New salary-demand multiplier',1,[.5,2,.1],'Scales new free-agent salary quotes. Existing offers and signed salaries stay unchanged.','freeAgency']]],
 ['Rookie Contracts',[
 ['rookieScaleEnabled','Rookie salary scale',true,[[true,'Enabled'],[false,'Disabled']],'Disabled gives all draft picks the minimum salary. Rookie term settings still apply.','draftPicks'],
 ['rookieTopMode','#1 pick salary basis','fixed',[['fixed','Fixed salary'],['percent','% of maximum contract']],'Choose which of the next two values determines the top pick salary.','draftPicks'],
 ['rookieTopSalary','#1 pick salary ($M / year)',6,[.000001,1000,.000001],'Used in fixed-salary mode before applying the scale multiplier. Later picks decrease by 2.5% of this amount per pick, with a 25% floor.','draftPicks'],
 ['rookieMaxPercent','% of maximum contract',11.4,[0,100,.1],'Used in percentage mode before applying the scale multiplier. Rookie salaries stay within contract salary limits.','draftPicks'],
 ['rookieMinimumRounds','Rounds with minimum contracts',1,[0,5,1],'Number of final draft rounds on minimum salaries. 0 uses the scale for every round; capped at the number of rounds.','draftPicks'],
 ['rookieRoundYears','Rookie contract lengths by round','0','years','Comma-separated lengths for rounds 1–5, e.g. 4,2. Repeat the final value for later rounds. 0 uses the default length below.','draftPicks'],
 ['rookieYears','Default rookie contract length (seasons)',2,[1,10,1],'A rookie is signed through draft year plus this number of seasons.','draftPicks'],
 ['rookieSalary','Rookie salary-scale multiplier',1,[.5,2,.1],'Applies to scaled draft salaries, excluding rounds with minimum contracts. Existing rookie contracts stay unchanged.','draftPicks']]],
 ['Injuries',[
 ['injuriesEnabled','Injuries',true,[[true,'Enabled'],[false,'Disabled']],'Disables new game and training injuries. Existing injuries continue recovering.'],
 ['injuryFrequency','Injury frequency multiplier',1,[0,3,.1],'0 prevents new game and training injuries. Existing injuries still recover normally.'],
 ['injuryDuration','New injury duration multiplier',1,[.25,2,.25],'Scales recovery days assigned to new injuries only.'],
 ['practiceInjuries','Practice injuries',true,[[true,'Enabled'],[false,'Disabled']],'Teams practice on some off days during the regular season (never the day before a back-to-back). Practice injuries are mostly minor.'],
 ['practiceInjuryFrequency','Practice injury frequency multiplier',1,[0,3,.1],'Scales practice injury chances on top of the injury frequency multiplier. 0 prevents practice injuries.']]],
 ['Game Simulation',[
 ['foulLimit','Foul limit',6,[2,12,1],'Personal fouls before disqualification.','season'],
 ['bonusFouls','# of fouls until bonus',5,[1,12,1],'The Nth defensive team foul awards bonus free throws. Resets each period, including overtime.','season'],
 ['threePointers','Three pointers',true,[[true,'Enabled'],[false,'Disabled']],'Disabled removes three-point attempts; all field goals are worth two.','season'],
 ['gamePeriods','Number of periods per game',4,[1,8,1],'Regulation periods. Total regulation time cannot exceed 60 minutes.','season'],
 ['periodMinutes','Period length (minutes)',12,[1,20,1],'Clock length per regulation period.','season'],
 ['overtimeMinutes','Overtime period length (minutes)',5,[1,10,1],'Additional periods are played when regulation ends tied.','season'],
 ['courtPlayers','# of players on court',5,[3,5,1],'Players per team: 3, 4, or 5. Rotation minute totals adjust automatically.','season'],
 ['playbackSpeed','Default Courtside speed',1,[[.25,'0.25×'],[.5,'0.5×'],[.75,'0.75×'],[1,'1×'],[2,'2×'],[4,'4×'],[8,'8×']],'Used when opening a new Courtside viewer. Current playback keeps its selected speed.'],
 ['shootingRate','Primary shot conversion multiplier',1,[.75,1.25,.05],'Scales primary field-goal chances; free throws and follow-up putbacks retain their existing formulas.'],
 ['shootingFouls','Shooting-foul frequency multiplier',1,[0,2,.001],'Scales shooting fouls on primary attempts. Other foul types retain their existing probabilities.']]],
 ['Tendencies',[
 ['paceMultiplier','Pace multiplier',1,[.5,1.5,.001],'Scales possessions for both teams, including overtime. 1 is the current pace; at least one possession per team per minute is retained.'],
 ['threeAccuracy','Three-point accuracy',1,[0,2,.001],'Multiplier for three-point make probabilities. 0 prevents makes; the three-pointer toggle still controls attempts.'],
 ['layupAccuracy','Layup accuracy',1,[0,2,.001],'Multiplier for layups, floaters and layup putbacks.'],
 ['dunkAccuracy','Dunk accuracy',1,[0,2,.001],'Multiplier for dunks, alley-oops and dunk putbacks.'],
 ['midrangeAccuracy','Midrange accuracy',1,[0,2,.001],'Multiplier for midrange jumpers and pull-ups.'],
 ['postAccuracy','Post accuracy',1,[0,2,.001],'Multiplier for post hooks, post fades and turnaround jumpers.'],
 ['ftAccuracy','FT accuracy',1,[0,2,.001],'Multiplier for normal and technical free throws.'],
 ['blockTendency','Block tendency',1,[0,2,.001],'Scales block attempts, including putbacks.'],
 ['stealTendency','Steal tendency',1,[0,2,.001],'Scales on-ball steals, passing-lane attempts and pick-and-roll interceptions.'],
 ['offRebTendency','Offensive rebound tendency',1,[0,2,.001],'Scales offensive rebound selection weight; defensive rebounding stays unchanged.'],
 ['foulRate','Foul rate',1,[0,2,.001],'Scales defensive, offensive, shooting and technical fouls. 0 disables new foul calls.'],
 ['assistTendency','Assist tendency',1,[0,2,.001],'Scales assist credit on made baskets following a pass. Never awards an assist without a passer.'],
 ['passingTendency','Passing preference multiplier',1,[0,2,.001],'Scales existing player passing tendencies, capped at 100.'],
 ['driveTendency','Driving preference multiplier',1,[0,2,.001],'Scales existing drive tendencies, capped at 100.'],
 ['threeTendency','Three-point tendency',1,[0,2,.001],'Scales three-point zone preference, capped at 100.'],
 ['isolationTendency','Isolation preference multiplier',1,[0,2,.001],'Scales playbook isolation preference. Late-clock and mismatch reads remain available.'],
 ['pickAndRollRate','Pick-and-roll frequency multiplier',1,[0,2,.001],'Scales coach-based half-court pick-and-roll selection. 0 disables these plays.']]]
];
const LEAGUE_SETTING_FIELDS=LEAGUE_SETTING_GROUPS.flatMap(g=>g[1]);
const LEAGUE_SETTING_DEFAULTS=Object.fromEntries(LEAGUE_SETTING_FIELDS.map(([key,,value])=>[key,value]));
function leagueRules(){if(state.leagueSettings?.historicalSource===undefined||state.leagueSettings?.seriesFinalGames===undefined||state.leagueSettings?.openingNightFormat===undefined||state.leagueSettings?.restDistribution===undefined||state.leagueSettings?.allStarEventDays===undefined||!state.leagueSettings?.seasonStart||state.leagueSettings.tieHeadToHead===undefined||state.leagueSettings.rosterMin===undefined||state.leagueSettings.salaryCapType===undefined||state.leagueSettings.minContract===undefined||state.leagueSettings.gamePeriods===undefined||state.leagueSettings.paceMultiplier===undefined)state.leagueSettings=readLeagueSettings(state.leagueSettings,state);return state.leagueSettings}
function readLeagueSettings(raw,career=state){
 if(raw===undefined)raw={};
 if(raw&&typeof raw==='object'&&!Array.isArray(raw)){raw={...raw};delete raw.allStarBreakDays;}
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!Object.hasOwn(LEAGUE_SETTING_DEFAULTS,k)))throw Error('Invalid league settings.');
 const out={...LEAGUE_SETTING_DEFAULTS,...calendarSettingDefaults(career),luxuryTaxThreshold:Math.round((career?.salaryCap||150)*1.1*10)/10,maxContract:Math.max(1,Math.round((career?.salaryCap||150)*.35*10)/10),...(raw.rosterMin===undefined&&career?.teams?.some(t=>t.roster)?{rosterMin:8}:{}),...raw};
 for(const [key,label,,range] of LEAGUE_SETTING_FIELDS){const value=out[key];if(range==='years'){parseRookieLengths(value)}else if(range==='weights'){parseLotteryChances(value)}else if(range==='date'){if(!seasonMonthDay(value))throw Error('Invalid '+label+'.')}else if(Array.isArray(range[0])){if(!range.some(([v])=>v===value))throw Error('Invalid '+label+'.')}else if(typeof value!=='number'||!Number.isFinite(value)||value<range[0]||value>range[1]||(range[2]===1&&!Number.isInteger(value)))throw Error('Invalid '+label+'.')}
 if(out.historicalSource==='wnba'&&out.historicalYear<1997)throw Error('WNBA historical seasons begin in 1997.');
 if(out.gamePeriods*out.periodMinutes>60)throw Error('Regulation time cannot exceed 60 minutes.');validateContractRules(out);validateTiebreakerRules(out);if(out.rosterMin>out.rosterMax)throw Error('Minimum roster size cannot exceed maximum roster size.');if(out.prospectAgeMin>out.prospectAgeMax)throw Error('Minimum prospect age cannot exceed maximum prospect age.');return out;
}
function leagueSettingLock(field){const lock=field[5];return lock==='playoffs'&&(state.playoffConfig||playoffGames().length)?'Locked after playoffs begin':lock==='season'&&seasonSettingsLocked()?'Locked until next preseason':lock==='lottery'&&state.draft?.order?.length?'Locked after lottery order is drawn':lock==='draftClass'&&state.draft?.year===state.year?'Locked after this draft class is generated':lock==='draftPicks'&&state.draft?.picks?.length?'Locked after the first draft selection':lock==='freeAgency'&&state.freeAgency?.year===state.year?'Locked while this offseason’s free agency exists':''}
function readLeagueSettingsForm(values){const before=leagueRules(),next={...before};for(const field of LEAGUE_SETTING_FIELDS){const [key,,def]=field,value=values['rule_'+key];if(value===undefined)continue;if(typeof def==='boolean'&&!['true','false'].includes(value))throw Error('Invalid '+field[1]+'.');next[key]=field[3]==='date'?String(value).slice(-5):typeof def==='boolean'?value==='true':typeof def==='number'?Number(value):value;if(leagueSettingLock(field)&&next[key]!==before[key])throw Error(field[1]+': '+leagueSettingLock(field)+'.')}return readLeagueSettings(next)}
function leagueSettingsMarkup(rules=leagueRules(),year=state.year,lock=leagueSettingLock,groups=LEAGUE_SETTING_GROUPS,capAmount=salaryCap()){return `<div class="league-settings-groups">${groups.map(([name,fields])=>`<details class="league-settings-group"><summary>${name}<span>${fields.length+(name==='Finances'?1:0)} setting${fields.length===1?'':'s'}</span></summary><div class="tm-grid">${name==='Finances'?`<label for="league-cap">Salary cap ($M)<input id="league-cap" name="cap" type="number" min="0.000001" max="1000" step="0.000001" value="${capAmount}" ${lock([null,null,null,null,null,'season'])?'disabled':''} required><small>Used for cap rules and individual contract salary limits.</small></label>`:''}${fields.map(field=>{const [key,label,,range,help]=field,locked=lock(field),id='rule_'+key;return `<label for="${id}"><span>${label}</span>${['weights','years'].includes(range)?`<input id="${id}" name="${id}" type="text" maxlength="600" value="${escapeHTML(rules[key])}" ${locked?'disabled':''} required>`:range==='date'?`<input id="${id}" name="${id}" type="date" value="${year-(key==='seasonStart'&&rules.seasonEnd<rules.seasonStart?1:0)}-${rules[key]}" ${locked?'disabled':''} required>`:Array.isArray(range[0])?`<select id="${id}" name="${id}" ${locked?'disabled':''}>${range.map(([value,text])=>`<option value="${value}" ${rules[key]===value?'selected':''}>${text}</option>`).join('')}</select>`:`<input id="${id}" name="${id}" type="number" min="${range[0]}" max="${range[1]}" step="${range[2]}" value="${rules[key]}" ${locked?'disabled':''} required>`}<small>${help}</small>${locked?`<strong class="setting-lock">${locked}</strong>`:''}</label>`}).join('')}</div></details>`).join('')}</div>`}
const settingsBeforeLeagueRules=settingsView;settingsView=function(){return settingsBeforeLeagueRules().replace('<p id="settings-error"',leagueSettingsMarkup()+'<p id="settings-error"')};
const validateBeforeLeagueRules=validateCareerData;validateCareerData=function(raw){const settings=readLeagueSettings(raw?.leagueSettings,raw),out=validateBeforeLeagueRules(raw);out.leagueSettings=settings;if(raw.playoffConfig)out.playoffConfig=readPlayoffConfig(raw.playoffConfig,out);return out};
const developmentBeforeRules=traitDevelopment;traitDevelopment=function(...args){return Math.round(developmentBeforeRules(...args)*leagueRules().developmentRate)};
const injuryChanceBeforeRules=durabilityInjuryChance;durabilityInjuryChance=function(...args){return Math.min(1,injuryChanceBeforeRules(...args)*(leagueRules().injuriesEnabled?leagueRules().injuryFrequency:0))};
const injuryDetailsBeforeRules=durabilityInjuryDetails;durabilityInjuryDetails=function(...args){const details=injuryDetailsBeforeRules(...args);return {...details,days:Math.max(1,Math.round(details.days*leagueRules().injuryDuration))}};
const taxBeforeRules=financeTax;financeTax=function(...args){return taxBeforeRules(...args)*leagueRules().taxMultiplier};
const postBeforeRules=financePost;financePost=function(f,key,amount,cost=false){return postBeforeRules(f,key,amount*(cost&&key==='operations'?leagueRules().operatingCosts:1),cost)};
const groupsBeforeRules=conferencePlayoffGroups;conferencePlayoffGroups=function(){return leagueRules().playoffFormat==='top4'?null:groupsBeforeRules()};
const tendencyBeforeRules=tendency;tendency=function(p,key){const multiplier={block:'blockTendency',onBallSteal:'stealTendency',passLane:'stealTendency',passing:'passingTendency',drive:'driveTendency',three:'threeTendency',isolation:'isolationTendency'}[key];return Math.min(1,tendencyBeforeRules(p,key)*(multiplier?leagueRules()[multiplier]:1))};
const demandBeforeRules=faDemand;faDemand=function(p){return contractSalary(demandBeforeRules(p)*leagueRules().salaryDemand)};
const quoteBeforeRules=freeAgentQuote;freeAgentQuote=function(p,...args){return contractSalary(quoteBeforeRules(p,...args)*leagueRules().salaryDemand)};
const standingsGroupsBeforeRules=standingsGroups;standingsGroups=function(){standingsGrouping=leagueRules().standingsGrouping;return standingsGroupsBeforeRules()};
setStandingsGrouping=function(mode){if(!['conference','division'].includes(mode))return;state.leagueSettings={...leagueRules(),standingsGrouping:mode};standingsGrouping=mode;save();render()};
function applyCapInflation(){if(wnbaEnabled()){wnbaAdvance();return;}if(state.inflationApplied?.year===state.year)return;const r=leagueRules(),percent=annualInflationRate(r,state.year),rate=1+percent/100;const historical=r.historicalSource!=='custom',salaryFloor=historical?.000001:.1,rounded=value=>historical?Math.round(value*1e6)/1e6:Math.round(value*10)/10;state.salaryCap=Math.max(historical?.000001:1,Math.min(1000,rounded(salaryCap()*rate)));for(const [key,ceiling,floor] of [['minimumPayroll',1000,0],['luxuryTaxThreshold',2000,0],['minContract',1000,salaryFloor],['maxContract',1000,salaryFloor],['rookieTopSalary',1000,salaryFloor]])r[key]=Math.max(floor,Math.min(ceiling,rounded(r[key]*rate)));state.inflationApplied={year:state.year,rate:percent};}
