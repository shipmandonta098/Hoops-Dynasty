const fs=require('fs'),assert=require('assert/strict');
module.exports=(name,s)=>{
 name=name.split('?')[0];const mode=process.env.P12_MODE||'port';
 if(fs.existsSync(`dev/phase12/baseline-dist/${name}`))s=fs.readFileSync(`dev/phase12/baseline-dist/${name}`,'utf8');
 const rep=(a,b)=>{assert(s.includes(a),name+': '+a);s=s.replace(a,b)};
 if(mode==='baseline')return s;
 if(name==='game.js')rep("leagueGender==='male'&&year>=2020","year>=2020");
 if(name==='attributes.js'){
 rep("if(state.leagueGender==='female'||state.year<2020)return true","if(state.year<2020)return true");
 rep("((state.leagueGender==='female'||state.year<2020)&&Math.random()","(state.year<2020&&Math.random()");
 if(['hq','pace'].includes(mode))rep("quickTwo:state.leagueGender!=='female'&&state.year>=2020","quickTwo:state.year>=2020");
 }
 if(name==='late-game.js'){
 if(['hq','pace'].includes(mode))rep("state.leagueGender!=='female'&&state.year>=2020&&margin===0","state.year>=2020&&margin===0");
 if(mode==='pace')rep('protect?Math.max(neutral,Math.min(15,shotClock-9,remaining-8))','protect?(state.year>=2020&&remaining<=60&&margin<=6?Math.min(4,shotClock-3):Math.max(neutral,Math.min(15,shotClock-9,remaining-8)))');
 }
 return s;
};
