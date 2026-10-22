const assert=require('assert/strict');module.exports=(name,s)=>{
 if(name.split('?')[0]==='game.js'){
  assert(s.includes('if(year>=2020)widenInitialRosterQuality(teams)'));
  s=s.replace('if(year>=2020)widenInitialRosterQuality(teams)','if(year>=2020)widenInitialRosterQuality(teams,leagueGender)');
  s=s.replace('function widenInitialRosterQuality(teams){',"function widenInitialRosterQuality(teams,leagueGender='male'){");
  assert(s.includes('target=initial*1.15**2'));
  s=s.replace('target=initial*1.15**2',`target=initial*(leagueGender==='female'?${Number(process.env.P13_SPREAD||1.45)}:1.15)**2`);
 }
 return s;
};
