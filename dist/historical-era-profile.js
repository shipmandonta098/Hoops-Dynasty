/* Annual statistical references. NBA year is season start.
 * NBA 1979–2018: Gryko et al., IJERPH 2023, Table 1 (doi:10.3390/ijerph20031924).
 * Recent NBA rows: Basketball Reference league totals.
 * WNBA: Her Hoop Stats public annual per-game table, retrieved 2026-10-04.
 * WNBA pace is a box-score estimate: (FGA - ORB + TOV + .44 FTA) * 200 / team MP.
 * Columns: pace, FGA, 3PA, 3P%, 2P%, FT%, FTA. Modifiers are model approximations, not rules. */
const HISTORICAL_NBA_STYLE={"1979":[103.1,90.6,2.8,0.28,0.488,0.764,27.8],"1980":[101.8,88.4,2.0,0.245,0.491,0.7509999999999999,28.9],"1981":[100.9,88.2,2.3,0.262,0.49700000000000005,0.746,28.6],"1982":[103.1,89.7,2.3,0.23800000000000002,0.49200000000000005,0.74,28.3],"1983":[101.4,88.4,2.4,0.25,0.499,0.76,29.7],"1984":[102.1,89.1,3.1,0.282,0.499,0.764,29.4],"1985":[102.1,88.6,3.3,0.282,0.495,0.7559999999999999,30.3],"1986":[100.8,88.8,4.7,0.301,0.49,0.763,30.5],"1987":[99.6,87.7,5.0,0.316,0.49,0.7659999999999999,29.1],"1988":[100.6,89.0,6.6,0.32299999999999995,0.49,0.768,28.8],"1989":[98.3,87.2,6.6,0.331,0.488,0.764,28.5],"1990":[97.8,87.2,7.1,0.32,0.488,0.765,27.9],"1991":[96.6,87.3,7.6,0.331,0.486,0.759,26.7],"1992":[96.8,86.0,9.0,0.336,0.489,0.754,27.7],"1993":[95.1,84.4,9.9,0.33299999999999996,0.483,0.7340000000000001,26.6],"1994":[92.9,81.5,15.3,0.359,0.491,0.737,27.1],"1995":[91.8,80.2,16.0,0.36700000000000005,0.486,0.74,26.4],"1996":[90.1,79.3,16.8,0.36,0.48,0.738,25.3],"1997":[90.3,79.7,12.7,0.34600000000000003,0.47,0.737,26.3],"1998":[88.9,78.2,13.2,0.33899999999999997,0.457,0.728,25.8],"1999":[93.1,82.1,13.7,0.353,0.46799999999999997,0.75,25.3],"2000":[91.3,80.6,13.7,0.354,0.461,0.748,24.9],"2001":[90.7,81.3,14.7,0.354,0.465,0.752,23.8],"2002":[91.0,80.8,14.7,0.349,0.46299999999999997,0.758,24.4],"2003":[90.1,79.8,14.9,0.34700000000000003,0.46,0.752,24.2],"2004":[90.9,80.3,15.8,0.35600000000000004,0.47,0.7559999999999999,26.1],"2005":[90.5,79.0,16.0,0.358,0.478,0.745,26.3],"2006":[91.9,79.7,16.9,0.358,0.485,0.752,26.1],"2007":[92.4,81.5,18.1,0.36200000000000004,0.484,0.755,24.9],"2008":[91.7,80.9,18.1,0.36700000000000005,0.485,0.7709999999999999,24.7],"2009":[92.7,81.7,18.1,0.355,0.49200000000000005,0.759,24.5],"2010":[92.1,81.2,18.0,0.358,0.48700000000000004,0.763,24.4],"2011":[91.3,81.4,18.4,0.349,0.47700000000000004,0.752,22.5],"2012":[92.0,82.0,20.0,0.359,0.483,0.753,22.2],"2013":[93.9,83.0,21.5,0.36,0.488,0.7559999999999999,23.6],"2014":[93.9,83.6,22.4,0.35,0.485,0.75,22.8],"2015":[95.8,84.6,24.1,0.354,0.491,0.757,23.4],"2016":[96.4,85.4,27.0,0.358,0.503,0.772,23.1],"2017":[97.3,86.1,29.0,0.36200000000000004,0.51,0.767,21.7],"2018":[100.0,89.2,32.0,0.355,0.52,0.7659999999999999,23.1],"2020":[99.2,88.4,34.6,0.367,0.5297397769516728,0.778,21.8],"2023":[98.5,88.90325203252033,35.103658536585364,0.366,0.5452333638087754,0.784,21.71951219512195],"2024":[98.8,89.23861788617886,37.582926829268295,0.36,0.5450567783872262,0.78,21.671544715447155]};
const HISTORICAL_WNBA_STYLE={"2026":[82.697,68.6,25.5,0.34,0.518,0.7859999999999999,20.8],"2025":[80.706,67.4,24.2,0.33799999999999997,0.496,0.787,18.2],"2024":[81.91,68.3,22.8,0.33799999999999997,0.488,0.785,18.0],"2023":[82.328,68.4,22.1,0.34700000000000003,0.486,0.8,18.5],"2022":[81.835,68.0,22.4,0.34600000000000003,0.489,0.794,18.2],"2021":[81.122,68.4,21.2,0.34299999999999997,0.475,0.8079999999999999,17.3],"2020":[82.267,68.2,21.2,0.345,0.49200000000000005,0.807,18.4],"2019":[81.468,68.6,20.0,0.33799999999999997,0.46,0.7959999999999999,17.3],"2018":[81.219,68.8,19.5,0.345,0.485,0.7929999999999999,18.6],"2017":[80.955,68.0,17.5,0.33799999999999997,0.47600000000000003,0.797,19.6],"2016":[80.284,67.5,16.1,0.336,0.474,0.7979999999999999,21.2],"2015":[77.823,65.4,14.8,0.325,0.45399999999999996,0.795,18.6],"2014":[78.172,66.3,14.1,0.32899999999999996,0.466,0.779,18.6],"2013":[78.643,66.4,14.4,0.326,0.45,0.782,18.8],"2012":[79.524,66.6,17.7,0.353,0.457,0.763,18.5],"2011":[78.94,65.7,15.8,0.353,0.462,0.77,18.8],"2010":[80.321,66.4,16.8,0.349,0.47200000000000003,0.775,20.6],"2009":[78.927,66.2,16.2,0.344,0.455,0.775,20.7],"2008":[78.579,65.1,15.6,0.33799999999999997,0.446,0.7509999999999999,21.6],"2007":[79.346,65.3,15.8,0.349,0.44299999999999995,0.7759999999999999,20.1],"2006":[77.538,64.5,15.1,0.335,0.452,0.748,20.5],"2005":[70.575,57.8,11.9,0.337,0.447,0.7390000000000001,19.1],"2004":[70.281,58.3,12.2,0.349,0.439,0.741,18.6],"2003":[71.127,59.7,13.5,0.336,0.441,0.7440000000000001,18.4],"2002":[70.628,58.4,13.1,0.34,0.44299999999999995,0.743,18.7],"2001":[70.001,58.4,12.9,0.336,0.433,0.74,17.9],"2000":[71.78,57.7,12.5,0.331,0.46,0.74,19.5],"1999":[73.019,59.0,13.2,0.321,0.45,0.732,20.0],"1998":[75.94,60.9,11.8,0.314,0.45,0.7170000000000001,20.9],"1997":[76.47,61.1,12.0,0.319,0.439,0.711,20.5]};
function historicalEraProfile(league,year){
 const nba=league==='nba',rules={},notes=[],sources=['nbaStyle','wnbaStyle','contractHistory'];
 // These controls form one coherent preset. Do not inherit a previously selected
 // era's contract, inflation, event, or tendency modifiers. UI preferences stay put.
 const resetGroups=new Set(['Contracts','Rookie Contracts','Finances','Inflation','All Star','Game Simulation','Tendencies']);
 for(const [name,fields] of LEAGUE_SETTING_GROUPS)if(resetGroups.has(name))for(const [key,,value] of fields)if(key!=='playbackSpeed')rules[key]=value;
 Object.assign(rules,{inflationMin:0,inflationMax:0,capInflation:0,inflationStdDev:0,minContractYears:1,rookieSalary:1,rookieTopMode:'fixed',rookieRoundYears:'2',rookieYears:2,rookieMinimumRounds:1});
 if(nba){
  rules.maxContractYears=year<1995?10:year<2005?7:year<2011?6:5;
  if(year<1998){rules.maxContract=1000;notes.push('Before the maximum-salary rule, $1,000M is the engine’s technical ceiling, not a historical player maximum. Before 1995, the 10-season term is also an engine ceiling; unrestricted/25-year deals are not modeled.');}
  rules.rookieScaleEnabled=year>=1995;
  rules.rookieTopSalary=year>=1984?Math.round(HISTORICAL_NBA_CAPS[year-1984]*.04*1e6)/1e6:LEAGUE_SETTING_DEFAULTS.rookieTopSalary;
  notes.push('Maximum contract length uses the longest eligible re-signing term; the engine does not distinguish new-team and incumbent-team term limits. Salary matching uses a simplified single percentage and the engine’s fixed allowance.');
  rules.rookieYears=year<1995?2:year<1998?3:4;rules.rookieRoundYears=rules.rookieYears+',2';
  if(year<1995)notes.push('No rookie scale existed in this era. Scale is disabled; the current draft engine signs unscaled rookies at the minimum with a two-year model term, rather than negotiating their individual historical deals.');
  else notes.push('The #1 pick amount uses a cap-relative model estimate (4% of the cap), not an exact historical rookie scale. Rookie terms approximate the first-round guarantee plus options (3 years before 1998, 4 afterward). Pick-by-pick dollars and options remain simplified.');
  rules.allStarEnabled=year>=1950&&year!==1998;rules.risingStarsEnabled=year>=1993&&year!==1998;rules.dunkEnabled=year>=1983&&![1997,1998].includes(year);rules.threeContestEnabled=year>=1985&&year!==1998;rules.allStarAssignment=year>=2017&&year<=2022?'draft':'conference';rules.allStarElam=year>=2019&&year<=2022;
  rules.minimumPayroll=0;
  if(year===1989)rules.minimumPayroll=7.935;
  if(year===1990)rules.minimumPayroll=9.61;
  if(year>=1995&&year<=2010)rules.minimumPayroll=Math.round(HISTORICAL_NBA_CAPS[year-1984]*.75*1e6)/1e6;
  if(year===2011||year===2012)rules.minimumPayroll=Math.round(HISTORICAL_NBA_CAPS[year-1984]*.85*1e6)/1e6;
  rules.luxuryTaxRate=year<2013?1:1.5;rules.tradeSalaryMatch=year<2005?115:125;
  if(year<1984)rules.tradeSalaryMatch=0;
  if(year===1990)sources.push('nba1990Floor');
 }else{
  rules.maxContractYears=4;rules.rookieYears=4;rules.rookieRoundYears='4,4,4,4';rules.rookieMinimumRounds=0;
  rules.allStarEnabled=year>=1999&&![2004,2008,2010,2012,2016,2020].includes(year);rules.risingStarsEnabled=false;rules.dunkEnabled=false;rules.threeContestEnabled=year===2006||year>=2017&&year!==2020;rules.allStarElam=false;rules.allStarAssignment=year>=2018?'draft':'conference';
  rules.bonusFouls=year<2006?8:5;
  notes.push('WNBA contract settings use a four-season model including rookie options; early contract lengths, core rights, and exceptions are not reproduced. Half-era bonus is eight fouls, quarter-era five; the engine uses this same threshold in overtime.');
 }
 const data=nba?HISTORICAL_NBA_STYLE:HISTORICAL_WNBA_STYLE,years=Object.keys(data).map(Number),reference=years.reduce((best,y)=>Math.abs(y-year)<Math.abs(best-year)?y:best,years[0]),row=data[reference],minutes=nba?48:40;
 const round=x=>Math.round(x*1000)/1000,limit=x=>Math.max(0,Math.min(2,round(x))),share=row[2]/row[1];
 rules.paceMultiplier=round(row[0]/(100*minutes/48));
 // Zone choice is weighted, so use odds ratios rather than a raw share ratio.
 rules.threeTendency=nba&&year<1979?0:limit((share/(1-share))/(.4/.6));
 rules.threeAccuracy=limit(row[3]/.36);rules.ftAccuracy=limit(row[5]/.78);
 const two=limit(row[4]/.52);rules.layupAccuracy=two;rules.dunkAccuracy=two;rules.midrangeAccuracy=two;rules.postAccuracy=two;
 rules.shootingFouls=limit((row[6]/row[1])/.26);
 notes.push(`Style reference: ${reference}${nba?'–'+String(reference+1).slice(-2):''}; ${row[0].toFixed(1)} ${nba?'reported':'box-score-estimated'} possessions per ${minutes} minutes, ${(share*100).toFixed(1)}% three-point attempts. Pace and shooting modifiers are model translations; coaches, ratings, fatigue and outcomes still vary.`);
 if(reference!==year)notes.push(`Exact statistical data for ${year} is not in this dataset. The nearest available season (${reference}) supplies the explicitly approximate style profile; this is not a measured ${year} average.`);
 notes.push('Unmapped injury and development settings remain unchanged. Unmapped tactical rates use neutral model defaults, not measured historical values. Inflation is set to 0% for a fixed-era league. Each value remains editable.');
 return {rules,notes,sources,style:{reference,pace:row[0],threeShare:share}};
}
