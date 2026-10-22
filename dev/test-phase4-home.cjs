const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');const output=[];
for(const [league,year]of [['nba',1997],['nba',2025],['wnba',1997],['wnba',2006],['wnba',2024]]){
 const courts=[];
 for(const candidate of [false,true]){const l=loadLeague({seed:44,strictDOM:false,sourceTransform:candidate?require('./phase4-candidate.cjs'):(n,s)=>['attributes.js','home-court.js'].includes(n.split('?')[0])?fs.readFileSync('dev/phase4/phase3-'+n.split('?')[0],'utf8'):s});l.run(require('./feat-fixture.cjs'));l.context.year=year;l.context.gender=league==='wnba'?'female':'male';courts.push(l.run(`state.year=year;state.leagueGender=gender;activeGameAtmosphere={fillRate:.75,fanEnergy:2,fanSentimentScore:0};var court=createHomeCourt('Regular season',state.teams[1]);var neutral=createHomeCourt('Neutral',state.teams[1]);({court,neutral})`));}
 for(const k of ['strength','roadShot','roadFoul','roadTurnover']){assert(Math.abs(courts[1].court[k]-courts[0].court[k]*(year>=2023?.6:1))<1e-12);assert.equal(courts[1].neutral[k],0)}output.push({league,year,courts});
}
fs.writeFileSync('dev/phase4/home-regression.json',JSON.stringify(output));console.log('PASS modern crowd scale .6, historical scale unchanged, neutral effects zero across five formats');
