const fs=require('fs'),assert=require('assert/strict');
module.exports=(name,s)=>{name=name.split('?')[0];const rep=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b)};
if(name==='game.js'){
 s+= '\n'+fs.readFileSync('dev/phase10/roster.js','utf8');
 rep('teams.forEach(t=>t.roster.sort((a,b)=>b.ovr-a.ovr));return{version:1',"teams.forEach(t=>t.roster.sort((a,b)=>b.ovr-a.ovr));if(leagueGender==='male'&&year>=2020)widenInitialRosterQuality(teams);return{version:1");
}
if(name==='attributes.js'){
 rep('function possessionCore(side){',`function p10Transition(side,source){if(state.leagueGender==='female'||state.year<2020)return true;const roster=clubs[side].roster.filter(p=>rotation(clubs[side],p));const speed=roster.reduce((s,p)=>s+p.attributes.spd,0)/Math.max(1,roster.length);const chance=(source==='steal'?.85:.32)+(plans[side].tempo-64)*.003+(speed-70)*.001;return Math.random()<Math.max(.12,Math.min(.95,chance));}\nfunction possessionCore(side){`);
 rep("rows.get(defender.id).stl++;transitionTeam=1-side;", "rows.get(defender.id).stl++;transitionTeam=p10Transition(1-side,'steal')?1-side:null;");
 s=s.replaceAll('transitionTeam=1-side;',"transitionTeam=p10Transition(1-side,'rebound')?1-side:null;");
 rep('const transition=transitionAdvantage||Math.random()<(plans[side].tempo/250);',"const transition=transitionAdvantage||((state.leagueGender==='female'||state.year<2020)&&Math.random()<(plans[side].tempo/250));");
}return s;};
