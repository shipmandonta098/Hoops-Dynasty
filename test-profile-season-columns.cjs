// Player profile season statistics: G, GS, MPG (MP in totals), … TOV, PF, PTS. GS is a count in both views; MPG and PF
// are per game; totals show whole minutes. Archived seasons and the Career row carry the same columns; Per 36 is unchanged.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:17,strictDOM:false});l.setRandomSeed(17);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Stats';state=validateCareerData(buildSetupCareer(d));for(let i=1;i<=6;i++)play(0,i);
 var p=team().roster[0],ctx=playerContext(p.id),games=playerGameRows(p).filter(g=>g.played!==false&&g.stage==='Regular season');
 state.statsArchive=[...(state.statsArchive||[]),{id:p.id,year:state.year-1,name:p.name,team:team().abbr,age:p.age-1,pos:p.pos,gp:70,gs:65,mp:2240,pf:150,pts:1200,reb:300,ast:400,fgm:450,fga:900,tpm:100,tpa:280,ftm:200,fta:240,stl:60,blk:20,tov:150,orb:50,drb:250}];
 profileStatsView='traditional';profileStatsStage='regular';`);
const table=mode=>{l.run(`profileStatsMode='${mode}'`);const html=run('referenceStatsTable(ctx)');const head=[...html.matchAll(/<th scope="col">([^<]*)<\/th>/g)].map(m=>m[1]);const rows=[...html.matchAll(/<tr class="[^"]*">([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(x=>x[1]));return {html,head,rows,col:(row,label)=>rows[row][head.indexOf(label)]}};
const per=table('pergame');
assert.deepEqual(per.head.slice(0,8),['Season','Age','Team','Pos','G','GS','MPG','FG'],'G, GS, MPG after the season columns');
assert.deepEqual(per.head.slice(-4),['TOV','PF','PTS','Awards'],'PF between TOV and PTS');
const g=run('games.length'),gs=run('games.reduce((n,x)=>n+(x.gs||0),0)'),mp=run('games.reduce((n,x)=>n+x.mp,0)'),pf=run('games.reduce((n,x)=>n+x.pf,0)');
assert.equal(per.col(0,'G'),String(g));assert.equal(per.col(0,'GS'),String(gs),'games started is a count');assert(gs>0,'the player started games');
assert.equal(per.col(0,'MPG'),(mp/g).toFixed(1),'minutes per game');assert.equal(per.col(0,'PF'),(pf/g).toFixed(1),'fouls per game');
// Archived season and Career.
assert.equal(per.col(1,'GS'),'65');assert.equal(per.col(1,'MPG'),(2240/70).toFixed(1));assert.equal(per.col(1,'PF'),(150/70).toFixed(1));
const last=per.rows.length-1;assert.match(per.rows[last][0],/Career/);assert.equal(per.col(last,'GS'),String(65+gs));assert.equal(per.col(last,'MPG'),((2240+mp)/(70+g)).toFixed(1));
assert.match(per.html,/GS = games started; MPG = minutes per game; PF = personal fouls\./);
// Totals: MP is whole minutes, GS still the count.
const tot=table('totals');assert(tot.head.includes('MP')&&!tot.head.includes('MPG'));assert.equal(tot.col(0,'MP'),String(Math.round(mp)));assert.equal(tot.col(0,'GS'),String(gs));assert.equal(tot.col(0,'PF'),String(pf));assert.match(tot.html,/MP = minutes played/);
// Per 36 keeps its own columns.
const per36=run('referenceStatsTable(ctx,true)'),h36=[...per36.matchAll(/<th scope="col">([^<]*)<\/th>/g)].map(m=>m[1]);
assert.deepEqual(h36,['Season','Age','Team','Pos','G','MP','FG','FGA','FG%','3P','3PA','3P%','2P','2PA','2P%','eFG%','FT','FTA','FT%','ORB','DRB','TRB','AST','STL','BLK','TOV','PF','PTS'],'Per 36 unchanged');
console.log('PASS season statistics: G',g,'GS',gs,'MPG',(mp/g).toFixed(1),'PF',(pf/g).toFixed(1),'; archived season and Career; totals MP',Math.round(mp),'; Per 36 unchanged');
