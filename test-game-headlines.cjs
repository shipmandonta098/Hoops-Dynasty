// Game result headlines: built games for every story type (comeback, overtime, close/late winner, blowout, milestones,
// playoff series, clinch/elimination, individual games, fallback), deficit and quarter math, venue wording, score at
// the end, template rotation, and saved news compatibility.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:131,strictDOM:false});l.setRandomSeed(131);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Headlines';state=validateCareerData(buildSetupCareer(d));
 // Built games: events are [period, seconds left in period, side (0 = home team a), points, player id].
 var pid=(team,i=0)=>state.teams[team].roster[i].id;
 var mk=({a=1,b=2,events,periods=4,stage='Regular season',day=10,box=null})=>{const evs=events.map(([period,left,side,points,player],index)=>({index,seconds:headlinePeriodEnd({gamePeriods:4,periodMinutes:12,overtimeMinutes:5},period)-left,period,side,points,playerId:player??pid(side?b:a),paint:false,fast:false,second:false,turnover:false}));
  const sa=evs.filter(e=>e.side===0).reduce((n,e)=>n+e.points,0),sb=evs.filter(e=>e.side===1).reduce((n,e)=>n+e.points,0),rows=box||[a,b].flatMap(id=>state.teams[id].roster.slice(0,5).map(p=>({playerId:p.id,name:p.name,team:state.teams[id].abbr,played:true,mp:30,pts:8,reb:4,ast:3,stl:1,blk:0})));
  return {a,b,sa,sb,winner:sa>sb?a:b,stage,day,box:rows,gameRules:{gamePeriods:4,periodMinutes:12,overtimeMinutes:5},summaryData:{version:1,events:evs,milestones:[],periods,complete:true}}};
 // A steady game the winner (home side 0) leads throughout: 10 baskets each period for the winner, 8 for the loser.
 var steady=(extra=[])=>{const e=[];for(let p=0;p<4;p++)for(let i=0;i<10;i++){e.push([p,700-i*60,0,2]);if(i<8)e.push([p,690-i*60,1,2])}return e.concat(extra)};
 var story=g=>{state.history=[g,...(globalThis.prior||[])];return gameHeadlineStory(g,new Map())};
 var prior=[];`);
const s=code=>run(`(()=>{${code}})()`);
// 1. Comeback: deficit and quarter come from the scoring timeline.
const comeback=s(`const e=[];for(let i=0;i<8;i++)e.push([1,700-i*40,1,2]);e.push([1,300,1,1]);for(let i=0;i<12;i++)e.push([2,700-i*50,0,2]);e.push([3,600,1,2],[3,500,0,3],[3,400,0,2]);const g=mk({events:e});const st=story(g);return {st,line:gameHeadline(g).headline}`);
assert.equal(comeback.st.type,'comeback');assert.equal(comeback.st.deficit,17);assert.equal(comeback.st.when,'second quarter');
assert.match(comeback.line,/17/);assert.match(comeback.line,/second.quarter/);assert.match(comeback.line,/at home, \d+–\d+$/);
// The largest deficit is reported, with the quarter in which it was reached (here the third, after leading early).
const third=s(`const e=[[0,700,0,3],[0,600,0,3]];for(let i=0;i<9;i++)e.push([2,700-i*30,1,2]);for(let i=0;i<10;i++)e.push([3,700-i*40,0,2]);const g=mk({events:e});return story(g)`);
assert.deepEqual([third.type,third.deficit,third.when],['comeback',12,'third quarter']);
// Q4 rule: an 8-point fourth-quarter deficit counts even when the game's largest deficit is under 12.
const q4=s(`const e=[[0,700,0,2]];for(let i=0;i<5;i++)e.push([3,700-i*20,1,2]);for(let i=0;i<6;i++)e.push([3,500-i*30,0,2]);const g=mk({events:e});return story(g)`);
assert.deepEqual([q4.type,q4.deficit,q4.when],['comeback',8,'fourth quarter']);
// Entering the fourth down 8 counts as a fourth-quarter deficit; down 7 does not.
const entering=s(`const e=[];for(let i=0;i<4;i++)e.push([2,600-i*30,1,2]);for(let i=0;i<6;i++)e.push([3,600-i*30,0,2]);return story(mk({events:e}))`);
assert.deepEqual([entering.type,entering.deficit,entering.when],['comeback',8,'fourth quarter']);
const seven=s(`const e=[[2,600,1,3],[2,500,1,2],[2,400,1,2]];for(let i=0;i<5;i++)e.push([3,600-i*30,0,2]);return story(mk({events:e}))`);
assert.notEqual(seven.type,'comeback');
// Away comeback reads "on the road".
const road=s(`const e=[];for(let i=0;i<7;i++)e.push([0,700-i*30,0,2]);for(let i=0;i<9;i++)e.push([1,700-i*30,1,2]);return gameHeadline(mk({events:e})).headline`);
assert.match(road,/14 down|14-point|Down 14/);assert.match(road,/on the road/);
// 2. Overtime names; a comeback that also went to overtime is still the comeback story.
for(const [periods,name] of [[5,'overtime'],[6,'double overtime'],[7,'triple overtime']]){const o=s(`const e=[[0,700,0,2],[0,600,1,2],[3,10,0,2],[3,5,1,2]];for(let p=4;p<${periods};p++)e.push([p,200,0,2],[p,100,1,2]);e.push([${periods-1},20,0,3]);const g=mk({events:e,periods:${periods}});return {st:story(g),line:gameHeadline(g).headline}`);assert.equal(o.st.type,'overtime');assert.equal(o.st.ot,name);assert(o.line.includes(name)&&/, \d+–\d+$/.test(o.line),o.line)}
// 3. Close finish (margin ≤3) and a late winner (go-ahead score with ≤10 seconds left), with the shooter and clock.
const close=s(`return story(mk({events:[[0,700,0,3],[1,600,1,2],[3,300,0,2],[3,200,1,1]]}))`);
assert.equal(close.type,'close');assert(close.margin<=3);
const late=s(`const e=[[0,700,0,2],[1,700,1,2],[3,30,1,2],[3,4,0,3,pid(1,2)],[3,1,0,3]];const g=mk({events:e});const st=story(g);return {st,name:state.teams[1].roster[2].name,line:gameHeadline(g).headline}`);
assert.equal(late.st.type,'lateWinner');assert.equal(late.st.seconds,4);assert.equal(late.st.shot,'three-pointer');assert.equal(late.st.player,late.name);assert(late.st.margin>3,'late winner applies beyond a 3-point margin');
assert(late.line.includes(late.name)&&/4 seconds/.test(late.line),late.line);
// A go-ahead score with 11 seconds left is not a late winner.
assert.notEqual(s(`return story(mk({events:[[0,700,0,2],[1,700,1,2],[3,30,1,2],[3,11,0,3],[3,1,0,3]]})).type`),'lateWinner');
// 4. Blowout.
const blow=s(`const e=steady();for(let i=0;i<8;i++)e.push([3,40-i*4,0,2]);return story(mk({events:e}))`);assert.equal(blow.type,'blowout');assert(blow.margin>=20);
// 5. Milestones (a steady 10-point home win, so no earlier story applies).
const steadyGame=(extra='')=>s(`${extra};return story(mk({events:steady(),a:1,b:2}))`);
assert.equal(steadyGame(`prior=[]`).type,'opener');
const hist=(team,opp,results,home=true)=>`...[${results.map((w,i)=>`{a:${home?team:opp},b:${home?opp:team},sa:${w?100:90},sb:${w?90:100},winner:${w?(home?team:opp):(home?opp:team)},stage:'Regular season',day:${9-i},box:[]}`).join(',')}].map(g=>({...g,winner:g.sa>g.sb?g.a:g.b}))`;
assert.equal(steadyGame(`prior=[${hist(1,5,[1],true)}]`).type,'spoilOpener');
assert.equal(steadyGame(`prior=[${hist(1,5,[1],false)},${hist(2,5,[1],false)}]`).type,'homeOpener');
assert.equal(steadyGame(`prior=[${hist(1,5,[1,1,1,1,1],true)},${hist(2,6,[0],true)}]`).n,6,'extend: the streak includes this win');
assert.deepEqual((({type,n})=>({type,n}))(steadyGame(`prior=[${hist(1,5,[0,0,0,0,0],true)},${hist(2,6,[0],true)}]`)),{type:'endSkid',n:5});
assert.deepEqual((({type,n})=>({type,n}))(steadyGame(`prior=[${hist(1,5,[1],true)},${hist(2,6,[1,1,1,1],true)}]`)),{type:'snapStreak',n:4});
assert.equal(steadyGame(`prior=[${hist(1,5,[1,1],true)},${hist(2,6,[0],true)}]`).type!=='extendStreak',true,'streaks under 4 are not news');
// Rivalry: a geography rivalry pair with ordinary prior games.
const rival=run(`(()=>{for(const x of state.teams)for(const y of state.teams)if(x.id<y.id&&rivalryDetails(x,y).types.length)return [x.id,y.id]})()`);
assert.equal(s(`prior=[${hist(rival[0],(rival[0]+3)%30,[1],true)},${hist(rival[1],(rival[1]+3)%30,[0],true)}];return story(mk({events:steady(),a:${rival[0]},b:${rival[1]}}))`).type,'rivalry');
// Playoff series moments use the series record after the game.
const series=(w,lw,bestOf=7,stage='First round')=>s(`prior=[];const before=[playoffSeriesSlots,playoffGames,playoffRoundGames];const g=mk({events:steady(),stage:'${stage}'}),games=[g,...Array.from({length:${w-1}},(_,i)=>({...g,day:i})),...Array.from({length:${lw}},(_,i)=>({...g,winner:2,day:20+i}))];
 playoffSeriesSlots=()=>[{pair:[1,2]}];playoffGames=()=>games;playoffRoundGames=()=>${bestOf};try{const st=story(g);return {st,line:gameHeadline(g).headline}}finally{[playoffSeriesSlots,playoffGames,playoffRoundGames]=before}`);
let r=series(3,1);assert.equal(r.st.type,'seriesLead');assert.match(r.line,/3–1/);
r=series(3,3);assert.equal(r.st.type,'decider');assert.match(r.line,/Game 7/);
r=series(4,2);assert.equal(r.st.type,'seriesWin');assert(/4–2|Game 6/.test(r.line),r.line);
r=series(2,2);assert.equal(r.st.type,'seriesEven');
r=series(1,2);assert.equal(r.st.type,'seriesCut');assert(/1–2|Game 3/.test(r.line),r.line);
r=series(4,1,7,'Championship');assert.equal(r.st.type,'title');assert(/champion|title/.test(r.line),r.line);
// Clinch and elimination: guaranteed outcomes only, and only when this game changed the status.
const playoff=s(`prior=[];state.history=[];const before=ownerGames;ownerGames=()=>82;const W=state.teams[1],conf=state.teams.filter(t=>t.conference===W.conference),L=conf.find(t=>t.id!==W.id),info=headlinePlayoffPool(W),slots=info.min,byes=info.max-info.min,pool=info.pool.filter(t=>t.id!==W.id&&t.id!==L.id);
 try{const g=mk({events:steady(),a:W.id,b:L.id});for(const t of state.teams){t.w=30;t.l=40}W.w=60;W.l=12;L.w=30;L.l=41;
  // slots-1 rivals can still reach 60 and one can reach exactly 59: this win (59 → 60) is what clinches.
  pool.forEach((t,i)=>{if(i<slots-1){t.w=58;t.l=22}else if(i===slots-1){t.w=57;t.l=23}else{t.w=40;t.l=40}});const clinch=story(g).type;
  pool.forEach(t=>{t.w=58;t.l=22});const open=story(g).type;
  pool.forEach((t,i)=>{if(i<slots-1){t.w=40;t.l=40}});W.w=61;const already=story(g).type;
  // Elimination: the loser falls to a 22-win ceiling while slots+byes rivals already have 23.
  for(const t of state.teams){t.w=30;t.l=40}W.w=40;W.l=40;L.w=20;L.l=60;pool.forEach((t,i)=>{if(i<slots+byes){t.w=23;t.l=50}});const eliminate=story(g).type;
  L.l=59;W.w=39;const notYet=story(g).type;return {open,clinch,already,eliminate,notYet,slots}}finally{ownerGames=before;for(const t of state.teams)t.w=t.l=0}`);
assert.notEqual(playoff.open,'clinch');assert.equal(playoff.clinch,'clinch');assert.notEqual(playoff.already,'clinch','already clinched before the game');assert.equal(playoff.eliminate,'eliminate');
// 6. Individual games: 40+, triple-double, 20/20, tracked career high (with 10+ games), the loser's star.
const box=(extra)=>`const rows=mk({events:steady()}).box;Object.assign(rows[0],${extra});return story(mk({events:steady(),box:rows}))`;
assert.deepEqual((({type,pts,forWinner})=>({type,pts,forWinner}))(s(`prior=[${hist(1,5,[1],true)},${hist(2,6,[0],true)}];${box('{pts:44}')}`)),{type:'forty',pts:44,forWinner:true});
assert.deepEqual((({type,line})=>({type,line}))(s(`${box('{pts:14,reb:11,ast:10}')}`)),{type:'tripleDouble',line:'14-11-10'});
assert.equal(s(`${box('{pts:22,reb:21}')}`).type,'twentyTwenty');
const ch=s(`const rows=mk({events:steady()}).box,p=playerContext(rows[0].playerId).p;p.bio={...p.bio,debutYear:state.year};state.gameHighs={start:state.year,players:{[p.id]:{pts:24,games:12}}};rows[0].pts=27;const g=mk({events:steady(),box:rows});state.history=[g,...prior];const st=gameHeadlineStory(g,new Map([[p.id,{pts:24,games:12}]]));
 const few=gameHeadlineStory(g,new Map([[p.id,{pts:24,games:5}]])).type,untracked=(p.bio.debutYear=state.year-1,gameHeadlineStory(g,new Map([[p.id,{pts:24,games:12}]])).type);return {type:st.type,pts:st.pts,few,untracked}`);
assert.deepEqual(ch,{type:'careerHigh',pts:27,few:'result',untracked:'result'});
const loserStar=s(`const rows=mk({events:steady()}).box,i=rows.findIndex(r=>r.team===state.teams[2].abbr);rows[i].pts=41;const g=mk({events:steady(),box:rows});const st=story(g);return {st,line:HEADLINE_TEMPLATES.forty[0](st)}`);
assert.equal(loserStar.st.forWinner,false);assert.match(loserStar.line,/not enough/);
// 7. Fallback verbs follow the game: cruise past (12+), rally past (trailed in the second half).
assert.equal(s(`return story(mk({events:steady()}))`).verb,'cruise past');
assert.equal(s(`const e=[[0,700,0,3],[0,600,0,3],[2,700,1,3],[2,650,1,3],[2,600,1,2],[3,700,0,3],[3,600,0,3],[3,500,0,2]];return story(mk({events:e}))`).verb,'rally past');
// Every headline keeps the score at the end, winner first.
for(const t of Object.keys(run('HEADLINE_TEMPLATES')))for(const line of run(`HEADLINE_TEMPLATES['${t}'].map(f=>f({W:'Alpha Hawks',L:'Beta Owls',venue:' at home',score:'100–99',margin:1,deficit:12,when:'third quarter',ot:'overtime',player:'Sam Doe',shot:'basket',seconds:3,w:3,l:1,game:4,next:5,n:5,label:'Metro Rivalry',pts:41,reb:20,line:'12-11-10',forWinner:true,verb:null}))`))assert(/, 100–99$/.test(line),t+': '+line);
// Template rotation: the same story template is not used back-to-back on a day.
const rot=s(`prior=[];state.newsFeed=undefined;const out=[];for(const [a,b] of [[1,2],[3,4],[5,6],[7,8]]){const g=mk({events:steady().concat([[3,40,0,2],[3,35,0,2],[3,30,0,2],[3,25,0,2],[3,20,0,2],[3,15,0,2]]),a,b,day:12});state.history=[g];const h=gameHeadline(g);addNewsItem({category:'Results',headline:h.headline,story:h.story,day:12});out.push(h.story)}return out`);
for(let i=1;i<rot.length;i++)assert.notEqual(rot[i],rot[i-1],'consecutive same-day templates differ: '+rot.join());
// Links: headline names resolve to clickable team buttons.
assert(/news-entity-link/.test(run(`(()=>{const item=newsStore().items[0];return newsLinkedText(item.headline,item,newsLinkEntities())})()`)));
// Saves: story references and game highs round-trip; old items without a story still load; bad values are rejected.
l.run(`state.history=[];state.gameHighs={start:state.year,players:{5:{pts:30,games:12}}};newsStore().items.push({id:9999,year:null,day:null,phase:'Earlier update',category:'Results',headline:'Old Town defeat Other Town, 100–90',detail:'',teams:[],game:null});`);
const saved=run(`(()=>{const v=validateCareerData(JSON.parse(JSON.stringify(state)));return {story:v.newsFeed.items[0].story,old:v.newsFeed.items.find(n=>n.id===9999).headline,highs:v.gameHighs}})()`);
assert.match(saved.story,/^[a-zA-Z]+:\d$/);assert.equal(saved.old,'Old Town defeat Other Town, 100–90','old headlines are unchanged');assert.deepEqual(saved.highs,{start:run('state.year'),players:{5:{pts:30,games:12}}});
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.newsFeed.items[0].story='<b>';validateCareerData(r)})()`),/news story/);
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.gameHighs.players['5'].pts=-1;validateCareerData(r)})()`),/game high/);
console.log('Game headlines: comeback (deficit/quarter math), overtime, close/late winner, blowout, milestones, series, clinch/elimination, individual games, fallback verbs, score suffix, rotation and saves passed.');
