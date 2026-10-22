const assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');
const l=loadLeague({seed:71,strictDOM:false});l.context.assert=assert;l.run(require('./feat-fixture.cjs'));
l.run(`
var rows=new Map([[1,{tech:0}],[2,{tech:0}]]),events=[],penalties=[],ejections=[],logs=[];
var hooks={rows,record:(type,side,p,value=0)=>{const e={seq:events.length,type,side,playerId:p.id,value,index:2,seconds:120,timeMs:120000,period:0,score:[0,0],before:[0,0]};events.push(e);return e},log:(side,text)=>logs.push(text),freeThrow:s=>penalties.push(s),eject:(s,p)=>ejections.push(p.id)};
applyGameTechnicals([{side:0,p:{id:1,name:'One'}}],hooks);assert.equal(rows.get(1).tech,1);assert.deepEqual(penalties,[1]);assert.equal(ejections.length,0);
applyGameTechnicals([{side:0,p:{id:1,name:'One'}}],hooks);assert.deepEqual(ejections,[1]);assert.equal(events[1].type,'technical');
rows.get(1).tech=0;events=[];penalties=[];ejections=[];
applyGameTechnicals([{side:0,p:{id:1,name:'One'}},{side:1,p:{id:2,name:'Two'}}],hooks);assert.deepEqual(penalties,[]);assert.equal(rows.get(1).tech,1);assert.equal(rows.get(2).tech,1);assert.equal(events.length,2);assert(events.every(e=>e.type==='doubleTechnical'));
var g={a:0,b:1,sa:0,sb:0,box:[{playerId:1,name:'One'},{playerId:2,name:'Two'}],summaryData:{featActions:events},playByPlay:Array(5)};
assert.equal(disciplineHighlights(g,{final:false,index:1}).length,0);assert.equal(disciplineHighlights(g,{final:false,index:2}).length,1);assert(disciplineHighlights(g,{final:true})[0].text.includes('One and Two'));readFeatActions(events,4,m=>{throw Error(m)});
applyGameTechnicals([{side:0,p:{id:1,name:'One'}},{side:1,p:{id:2,name:'Two'}}],hooks);assert.deepEqual(ejections,[1,2]);assert.equal(penalties.length,0);
for(const type of [1,2]){events=[{seq:0,type:'flagrant',side:0,playerId:1,otherPlayerId:2,value:type,index:3,period:0,timeMs:120000,seconds:120,score:[2,0],before:[2,0]}];g.summaryData.featActions=events;assert(disciplineHighlights(g,{final:true})[0].text.includes('Flagrant '+type));readFeatActions(events,4,m=>{throw Error(m)});}
assert.throws(()=>readFeatActions([{...events[0],value:3}],4,m=>{throw Error(m)}));assert.throws(()=>readFeatActions([{...events[0],otherPlayerId:1}],4,m=>{throw Error(m)}));
`);
console.log('PASS single/second technical, paired technicals, offset penalties, ejections, FF1/FF2, live visibility, one row per paired call and validation');
(async()=>{let games=0,techs=0,flagrants=0;for(const gender of ['male','female']){
 const v=loadLeague({seed:71,strictDOM:false});v.context.assert=assert;v.run(require('./feat-fixture.cjs').replace('syncAlignment(d);',`d.leagueGender='${gender}';syncAlignment(d);`));v.run("simulationExecution.mode='headless';render=()=>{};");await v.run('sim(10)');
 const counts=v.run(`for(const g of state.history){readGameSummaryData(g.summaryData,m=>{throw Error(m)});const es=g.summaryData.featActions;for(const p of g.box){assert.equal(es.filter(e=>e.playerId===p.playerId&&['technical','doubleTechnical'].includes(e.type)).length,p.tech);assert.equal(es.filter(e=>e.playerId===p.playerId&&e.type==='flagrant').length,p.flagrant);assert.equal(es.filter(e=>e.playerId===p.playerId&&e.type==='ejection').length,p.ejected);}}var before=JSON.parse(JSON.stringify(state.history.map(g=>g.summaryData)));state=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(JSON.parse(JSON.stringify(state.history.map(g=>g.summaryData))),before);({games:state.history.length,techs:state.history.flatMap(g=>g.box).reduce((n,p)=>n+p.tech,0),flagrants:state.history.flatMap(g=>g.box).reduce((n,p)=>n+p.flagrant,0)})`);games+=counts.games;techs+=counts.techs;flagrants+=counts.flagrants;
 console.log('PASS',gender,'production simulation, foul-event/box totals and save/load',counts);
}console.log('TOTAL',JSON.stringify({games,techs,flagrants}));})().catch(e=>{console.error(e.message);process.exitCode=1});
