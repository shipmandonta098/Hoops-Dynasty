// Draft pick news: picks 1–N (draftNewsPicks, default 10) and the user's picks get their own item (full team name,
// "first overall" / "the No. N pick" / "Round 2, Pick 4 (34th overall)", the draft year, position, college or club,
// age, "via TEAM"); the user's picks reach the GM inbox; the other picks are grouped in a recap per round, posted when
// the round ends; slides (top-10 board prospects falling 5+ spots) and steals; WNBA-format drafts; saves.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const make=(seed,setup,playoff)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
 l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Picks';${setup}state=validateCareerData(buildSetupCareer(d));
  const ranked=[...state.teams].sort((a,b)=>b.id-a.id);rankStandings=()=>ranked;ownerPlayoffClub=t=>t.id<${playoff};draftReady=()=>true;gmCanAdvance=()=>true;draftCommit=async()=>true;
  var you=controlledTeamId();var draftNews=()=>newsStore().items.filter(n=>n.category==='Draft').reverse().map(n=>({h:n.headline,d:n.detail,t:n.teams}));
  var pickOne=()=>{const dr=state.draft,club=state.teams[draftOrder(dr)[dr.picks.length]],p=[...dr.prospects].sort((a,b)=>draftScore(b,club)-draftScore(a,club))[0];return draftPickInternal(p.id)};`);
 return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
(async()=>{
 // NBA format: 30 teams, two rounds. Team 5 owns the No. 1 pick; the user (team 0) is a playoff team.
 const {l,run}=make(41,'',16);assert.equal(run('you'),0);
 await l.run('runDraftLottery()');
 l.run(`state.tradePickOwners=[{year:state.year,origin:state.draft.order[0],round:1,owner:5},{year:state.year,origin:state.draft.order[19],round:1,owner:7}];newsStore().items=newsStore().items.filter(n=>n.category!=='Draft')`);
 const year=run('state.year'),label=String(year),board=run('state.draft.newsBoard');assert.equal(board,undefined,'board taken at the first pick');
 // Picks one at a time: recap 1 only once the round ends.
 l.run('for(let i=0;i<29;i++)pickOne()');assert(!run('draftNews()').some(n=>n.h.startsWith('Round 1 recap')),'no recap before the round ends');
 l.run('pickOne()');assert.equal(run('draftNews()').filter(n=>n.h.startsWith('Round 1 recap')).length,1,'recap when the round ends');assert(!run('draftNews()').some(n=>n.h.startsWith('Round 2 recap')));
 l.run('while(state.draft.picks.length<60)pickOne()');
 const news=run('draftNews()'),picks=run('state.draft.picks'),names=run('state.teams.map(t=>t.city+" "+t.name)'),abbr=run('state.teams.map(t=>t.abbr)'),origin=run('draftBaseOrder(state.draft)'),rank=run('Object.fromEntries(state.draft.newsBoard.map((id,i)=>[id,i+1]))');
 assert.equal(run("newsStore().items.filter(n=>/ selects /.test(n.headline)).length"),0,'old one-line pick items are gone');
 // 1. No. 1 pick, traded: full name, "first overall", draft year, detail with position, school, age and via.
 const first=picks[0],one=news.find(n=>n.h.includes(' first overall'));
 assert.equal(one.h,`${names[5]} select ${first.name} first overall in the ${label} Draft.`);assert.equal(first.team,5);
 assert.match(one.d,new RegExp('^'+first.pos+' · [^·]+ · Age \\d+ · via '+abbr[origin[0]]+'$'),one.d);assert.deepEqual(one.t.sort((a,b)=>a-b),[5,origin[0]].sort((a,b)=>a-b));
 const feed=run('newsFeedView()'),onRoster=run(`state.teams[5].roster.some(p=>p.id===${first.id})`);assert(feed.includes('onclick="newsOpenTeam(5)"'),'team name links');if(onRoster)assert(feed.includes(`onclick="profile(${first.id})"`),'drafted player links');
 console.log('PASS No. 1 pick:',one.h,'|',one.d);
 // 2. Picks 2–10: "the No. N pick".
 for(const p of picks.slice(1,10))assert(news.some(n=>n.h===`${names[p.team]} select ${p.name} with the No. ${p.number} pick in the ${label} Draft.`),'pick '+p.number);
 assert(!news.some(n=>new RegExp(' with the No\\. (1[1-9]|2\\d|30) pick').test(n.h)&&!n.t.includes(0)),'picks 11+ only for the user');
 console.log('PASS picks 2–10 individual items');
 // 3. User team: every pick gets an item (round 2 format) and an inbox message; none appear in recaps.
 const mine=picks.filter(p=>p.team===0);assert(mine.length>=2);
 for(const p of mine){const phrase=p.round>1?`Round ${p.round}, Pick ${p.number-30} (${p.number}${['th','st','nd','rd'][p.number%10]&&![11,12,13].includes(p.number%100)?['th','st','nd','rd'][p.number%10]:'th'} overall)`:`the No. ${p.number} pick`;
  assert(news.some(n=>n.h===`${names[0]} select ${p.name} with ${phrase} in the ${label} Draft.`),'user pick item: '+p.number+' '+phrase)}
 const inbox=run("inboxStore().items.filter(m=>m.type==='Draft'&&m.subject.startsWith('Draft: we select ')).map(m=>({s:m.subject,b:m.body}))");assert.equal(inbox.length,mine.length);
 for(const p of mine)assert(inbox.some(m=>m.s.startsWith('Draft: we select '+p.name+' with ')&&m.b.startsWith(p.name+' — '+p.pos+' · ')&&/rookie contract|Draft rights held/.test(m.b)),'inbox '+p.name);
 const r2=mine.find(p=>p.round===2);assert.match(news.find(n=>n.h.includes(r2.name)&&n.h.includes(' select ')).h,/with Round 2, Pick \d+ \(\d+(st|nd|rd|th) overall\) in the /);
 console.log('PASS user team:',mine.map(p=>p.number).join(', '),'—',inbox.at(-1).s);
 // 4. Round recaps: remaining picks only, pick/team/player/position, "via" for traded picks, round 2 format.
 const rec1=news.find(n=>n.h.startsWith('Round 1 recap')),rec2=news.find(n=>n.h.startsWith('Round 2 recap'));
 const rest1=picks.filter(p=>p.round===1&&p.number>10&&p.team!==0),rest2=picks.filter(p=>p.round===2&&p.team!==0);
 assert.equal(rec1.h,`Round 1 recap: picks ${rest1[0].number}–${rest1.at(-1).number}.`);assert.equal(rec1.d.split(' · ').length,rest1.length);
 for(const p of rest1)assert(rec1.d.includes(`${p.number}. ${abbr[p.team]}${origin[p.number-1]!==p.team?' (via '+abbr[origin[p.number-1]]+')':''} — ${p.name}, ${p.pos}`),'recap entry '+p.number);
 assert(rec1.d.includes('(via '+abbr[origin[19]]+')'),'traded pick in the recap');assert(!mine.some(p=>rec1.d.includes(p.name)||rec2.d.includes(p.name)),'user picks not repeated in recaps');
 assert.equal(rec2.d.split(' · ').length,rest2.length);assert.match(rec2.d,/^Pick \d+ \(\d+(st|nd|rd|th)\) [A-Z]+/);assert(rec2.d.includes(`Pick ${rest2[0].number-30} (${rest2[0].number}`));
 console.log('PASS recaps:',rec1.h,'/',rec2.h,'|',rec1.d.split(' · ').slice(0,2).join(' · '));
 // 5. Slides and steals follow the pre-draft board.
 const slides=picks.filter(p=>rank[p.id]<=10&&p.number-rank[p.id]>=5),steals=picks.filter(p=>rank[p.id]>10&&p.number>10&&p.number-rank[p.id]>=10&&p.number>=2*rank[p.id]);
 assert.equal(news.filter(n=>/ slides to /.test(n.h)).length,slides.length);for(const p of slides)assert(news.some(n=>n.h.startsWith(p.name+' slides to ')&&n.h.includes('ranking No. '+rank[p.id]+' on the pre-draft board')));
 assert.equal(news.filter(n=>n.h.startsWith('Steal? ')).length,steals.length);for(const p of steals)assert(news.some(n=>n.h.startsWith(`Steal? ${abbr[p.team]} land ${p.name}, No. ${rank[p.id]} on the pre-draft board`)));
 assert(slides.length+steals.length>0,'some slide or steal in a 60-pick draft');console.log('PASS slides',slides.length,'and steals',steals.length,':',news.filter(n=>/ slides to |^Steal\? /.test(n.h)).map(n=>n.h).slice(0,2).join(' | '));
 // 6. Saves: the board round-trips and is checked; old saves without it still load.
 const s6=loadLeague({seed:44,strictDOM:false});s6.setRandomSeed(44);const run6=c=>{const v=s6.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
 s6.run(`render=()=>{};toast=()=>{};save=async()=>true;showResult=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};state=validateCareerData(fresh(defaultTeams().slice(0,6),1));`);
 await s6.run('(async()=>{await sim(seasonLength());await playoffs();await runDraftLottery();await autoDraft(true)})()');assert(run6('state.draft.newsBoard.length')>0&&run6('state.draft.picks.length')>0,'mid-draft save with a board');
 const ok=run6(`(()=>{const s=JSON.parse(JSON.stringify(state)),kept=JSON.stringify(validateCareerData(s).draft.newsBoard)===JSON.stringify(state.draft.newsBoard);s.draft.newsBoard=[1,1];let bad=false;try{validateCareerData(s)}catch(e){bad=/draft board/.test(e.message)}delete s.draft.newsBoard;const old=validateCareerData(s);state=old;return {kept,bad,old:'newsBoard' in old.draft}})()`);
 assert.deepEqual(ok,{kept:true,bad:true,old:false});
 await s6.run('autoDraft(false)');assert(run6('draftComplete()'),'an old mid-draft save finishes the draft');assert.equal(run6("newsStore().items.filter(n=>/ slides to |^Steal\\? /.test(n.headline)).length"),0,'no board: no slides or steals');assert(run6("newsStore().items.some(n=>/^Round 2 recap/.test(n.headline))"));
 console.log('PASS saves: board kept and checked; old mid-draft saves load without it and skip slides and steals');
 // 7. Configurable count.
 const c=make(42,'',16);c.l.run("state.leagueSettings.draftNewsPicks=3");await c.l.run('runDraftLottery()');c.l.run('while(state.draft.picks.length<30)pickOne()');
 const cn=c.run('draftNews()');assert.equal(cn.filter(n=>/ select .* (first overall|with the No\. [23] pick)/.test(n.h)).length,3);assert.match(cn.find(n=>n.h.startsWith('Round 1 recap')).h,/^Round 1 recap: picks 4–30\.$/);
 assert.equal(c.run("readLeagueSettings({},state).draftNewsPicks"),10,'old saves default to 10');assert.throws(()=>c.run("readLeagueSettings({draftNewsPicks:99},state)"));
 // Crafted board: the No. 30 pick ranked 12th is a steal; the No. 19 pick ranked 3rd slides; a No. 25 pick ranked 20th is neither.
 const crafted=c.run(`(()=>{const dr=state.draft,ids=dr.picks.map(p=>p.id),order=ids.filter(id=>![dr.picks[29].id,dr.picks[18].id,dr.picks[24].id].includes(id));order.splice(2,0,dr.picks[18].id);order.splice(11,0,dr.picks[29].id);order.splice(19,0,dr.picks[24].id);dr.newsBoard=order;
  const n=newsStore().items.length;for(const k of [18,24,29])draftPickNews(dr,dr.picks[k]);return {items:newsStore().items.slice(0,newsStore().items.length-n).map(i=>i.headline),p19:dr.picks[18],p30:dr.picks[29],p25:dr.picks[24],abbr:state.teams.map(t=>t.abbr)}})()`);
 assert(crafted.items.includes(`${crafted.p19.name} slides to No. 19 after ranking No. 3 on the pre-draft board.`),crafted.items.join(' | '));
 assert(crafted.items.includes(`Steal? ${crafted.abbr[crafted.p30.team]} land ${crafted.p30.name}, No. 12 on the pre-draft board, at No. 30.`),crafted.items.join(' | '));
 assert(!crafted.items.some(h=>h.includes(crafted.p25.name)&&/slides|Steal/.test(h)),'rank 20 at pick 25 is neither');
 console.log('PASS crafted board:',crafted.items.filter(h=>/slides|Steal/.test(h)).join(' | '));
 console.log('PASS draftNewsPicks=3: three individual items, recap picks 4–30; default 10');
 // 8. WNBA format: 12 teams, single-year season label, its own round count.
 const w=make(43,"d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};syncAlignment(d);",8);
 assert(w.run('wnbaEnabled()'));await w.l.run('runDraftLottery()');const rounds=w.run('draftRoundCount()');w.l.run('while(state.draft.picks.length<12*draftRoundCount())if(!pickOne())break');
 const wn=w.run('draftNews()'),wp=w.run('state.draft.picks'),wy=w.run('state.year');assert.equal(wp.length,12*rounds,'WNBA draft completes');assert.equal(w.run('seasonLabel()'),String(wy),'single-year league');
 assert(wn.some(n=>n.h.endsWith(` first overall in the ${wy} Draft.`)));assert(!wn.some(n=>/\d{4}–\d{2} Draft/.test(n.h)),'one year in the draft name');
 for(let r=1;r<=rounds;r++)if(wp.some(p=>p.round===r&&(r>1||p.number>10)&&p.team!==w.run('you')))assert(wn.some(n=>n.h.startsWith(`Round ${r} recap: pick`)),'WNBA round '+r+' recap');
 const wr=wn.find(n=>n.h.startsWith('Round 1 recap'));assert.equal(wr.h,'Round 1 recap: pick'+(wp.filter(p=>p.round===1&&p.number>10&&p.team!==w.run('you')).length>1?'s 11–12.':' '+wp.find(p=>p.round===1&&p.number>10&&p.team!==w.run('you')).number+'.'));
 assert(wn.some(n=>/ with Round 2, Pick \d+ \(\d+(st|nd|rd|th) overall\)/.test(n.h))||!wp.some(p=>p.round===2&&p.team===w.run('you')),'WNBA second-round wording');
 console.log('PASS WNBA:',rounds,'rounds,',wp.length,'picks;',wn.filter(n=>/recap/.test(n.h)).map(n=>n.h).join(' / '));
})().catch(e=>{console.error(e);process.exit(1)});
