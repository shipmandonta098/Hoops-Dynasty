/* Season-year convention: the season year is the year a season ends (NBA 2026 = 2025–26). Careers saved before this
   convention used the start year, so their cross-year calendars display one year earlier after loading; stored
   calendar date strings shift with them so every displayed date stays consistent. Internal day stamps are unchanged. */
function seasonYearsShiftDate(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;const shifted=new Date(Date.UTC(Number(value.slice(0,4))-1,Number(value.slice(5,7))-1,Number(value.slice(8,10))));return shifted.toISOString().slice(0,10)}
function seasonYearsMigrate(data){
 const rules=data.leagueSettings||{},cross=data.scheduleFormat!=='custom'||(rules.seasonEnd||'04-19')<(rules.seasonStart||'10-28');
 if(cross){for(const d of data.decisions?.entries||[])d.date=seasonYearsShiftDate(d.date);for(const h of data.expansion?.history||[])h.date=seasonYearsShiftDate(h.date)}
 // NBA presets were stored by start year; the same season is now its end year.
 if(rules.historicalSource==='nba'&&Number.isInteger(rules.historicalYear))rules.historicalYear+=1;
 data.seasonYears='end';return data;
}
const freshBeforeSeasonYears=fresh;fresh=function(...args){const data=freshBeforeSeasonYears(...args);data.seasonYears='end';return data};
const validateBeforeSeasonYears=validateCareerData;validateCareerData=function(raw){
 if(raw?.seasonYears!==undefined&&raw.seasonYears!=='end')throw Error('Invalid save: season year convention');
 const data=validateBeforeSeasonYears(raw);if(raw.seasonYears==='end'){data.seasonYears='end';return data}return seasonYearsMigrate(data);
};
