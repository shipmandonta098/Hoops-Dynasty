// Draft lottery news: runDraftLottery stores pre-lottery seeds, odds for No. 1, the drawn picks and the final order on
// the draft; news names the No. 1 winner (seed, odds, "hold serve"), the drawn picks, jumps and the biggest slide, and
// traded picks ("via"); the user's result is always mentioned and lands in the GM inbox; the Draft screen shows a
// Lottery results table; record order posts one plain item; old saves without the record load and post nothing.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:31,strictDOM:false});l.setRandomSeed(31);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
const go=async c=>{const v=await l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
// 14 lottery teams (ids 16–29, id 16 worst), 16 playoff teams; the user's club (id 0) owns the worst team's pick.
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Lottery';state=validateCareerData(buildSetupCareer(d));
 const ranked=[...state.teams].sort((a,b)=>b.id-a.id);rankStandings=()=>ranked;ownerPlayoffClub=t=>t.id<16;draftReady=()=>true;gmCanAdvance=()=>true;draftCommit=async()=>true;
 var you=controlledTeamId();var reset=mode=>{state.leagueSettings={...state.leagueSettings,lotteryMode:mode,lotterySelections:4};const dr=ensureDraft();dr.order=[];delete dr.lottery;state.newsFeed=undefined;state.gmInbox=undefined};
 var news=()=>newsStore().items.filter(n=>n.category==='Draft').map(n=>({h:n.headline,d:n.detail,t:n.teams}));`);
assert.equal(run('you'),0);
(async()=>{
 // 1. Weighted lottery: the record and the news.
 l.run(`reset('weighted');state.tradePickOwners=[{year:state.year,origin:16,round:1,owner:you}]`);
 let r;for(let k=0;k<40;k++){l.setRandomSeed(100+k);l.run(`reset('weighted')`);await l.run('runDraftLottery()');r=run(`({lot:state.draft.lottery,order:state.draft.order,news:news(),inbox:inboxStore().items,rows:lotteryRows()})`);if(r.rows.slice(1,4).some(x=>x.move>0)&&r.rows[0].seed!==1)break}
 const lot=r.lot;assert.equal(lot.version,1);assert.equal(lot.mode,'weighted');assert.equal(lot.draws,4);assert.equal(lot.posted,true);
 assert.deepEqual(lot.seeds.slice(0,14),Array.from({length:14},(_,i)=>16+i),'lottery teams worst first');assert.deepEqual(lot.seeds.slice(14),Array.from({length:16},(_,i)=>i),'then playoff teams');
 assert(Math.abs(lot.odds[0]-14/105)<1e-12&&Math.abs(lot.odds[13]-1/105)<1e-12&&lot.odds.slice(14).every(p=>p===0),'linear odds for No. 1');
 assert.equal(lot.drawn.length,4);assert.deepEqual(lot.drawn,r.order.slice(0,4));assert.deepEqual(lot.order,r.order);
 const top=r.rows[0],name=run(`(id=>state.teams[id].city+' '+state.teams[id].name)(${top.owner})`),pct=(top.odds*100).toFixed(1)+'%';
 const head=r.news.find(n=>n.h.includes('the No. 1 pick'));assert(head,'No. 1 headline');assert(head.h.startsWith(name),head.h);assert(head.h.includes('from the No. '+top.seed+' pre-lottery seed ('+pct+' odds)'),head.h);
 const results=r.news.find(n=>n.h.startsWith('Lottery results: '));assert(results);assert.equal((results.h.match(/\(seed \d+, [\d.]+%\)/g)||[]).length,4,'four drawn picks with seeds and odds: '+results.h);
 const jump=r.rows.slice(1,4).find(x=>x.move>0);assert(r.news.some(n=>new RegExp(' (jump|move up) from No\\. '+jump.seed+' to No\\. '+jump.pick).test(n.h)),'jump item');
 const slide=r.rows.filter(x=>x.move<0).sort((a,b)=>a.move-b.move||a.seed-b.seed)[0];assert(r.news.some(n=>n.h.includes(' slide from No. '+slide.seed+' to No. '+slide.pick)),'slide item');
 assert.equal(run(`newsStore().items.filter(n=>n.headline==='Draft lottery complete. The first-round order is locked.').length`),1,'the existing lock notice stays');
 console.log('PASS weighted lottery:',head.h,'|',results.h);
 // 2. Traded picks: the user owns the worst team's pick.
 const mine=r.rows.find(x=>x.origin===16);assert.equal(mine.owner,0);
 const viaItem=r.news.find(n=>n.t.includes(0));assert(viaItem,'user team mentioned');assert.match(viaItem.h,/via [A-Z]{2,4}/,'pick owned via another team: '+viaItem.h);
 if(mine.pick<=4&&mine.pick>1&&mine.move<=0)assert(r.news.some(n=>new RegExp(' win the No\\. '+mine.pick+' pick via ').test(n.h)));
 // Wording for every traded drawn pick: hand the picks to team 1 and rebuild the items.
 const traded=run(`(()=>{state.tradePickOwners=state.draft.order.slice(0,4).map(origin=>({year:state.year,origin,round:1,owner:origin===1?2:1}));return lotteryNewsItems().map(i=>i.headline)})()`);
 assert(/^\S+ \S+.* win (the No\. 1 pick|the No\. 1 pick via [A-Z]+)|hold serve/.test(traded[0])&&/ via [A-Z]+/.test(traded[0]),'No. 1 via: '+traded[0]);
 assert(traded.some(h=>/ win the No\. [234] pick via [A-Z]+\./.test(h))||traded.filter(h=>/(jump|move up) .* via [A-Z]+/.test(h)).length>=1,'"wins the No. N pick via" or a jump via: '+traded.join(' | '));
 assert(traded[1].includes('(via '),'results list names the original team');
 console.log('PASS traded picks:',traded.filter(h=>/via/.test(h)).join(' | '));
 // 3. User team: inbox message.
 const msg=r.inbox.find(m=>m.type==='Draft');assert(msg,'GM inbox message');assert.equal(msg.sender,'Scouting Department');assert(msg.subject.includes('No. '+mine.pick+' (via '),msg.subject);assert(msg.body.includes('pre-lottery seed 1')&&msg.body.includes('13.3% odds for No. 1'),msg.body);
 assert(run(`INBOX_TYPES.includes('Draft')`));console.log('PASS user team:',msg.subject,'—',msg.body);
 // 4. Draft screen table, and posting happens once.
 l.run(`state.tradePickOwners=[{year:state.year,origin:16,round:1,owner:you}]`);const html=run('draftView()');assert(html.includes('Lottery results')&&html.includes('Pre-lottery seed')&&html.includes('Odds for No. 1')&&html.includes('Movement'));
 assert.equal((html.match(/<tr class="[^"]*">/g)||[]).length,30,'one row per first-round pick');assert(/[▲▼]/.test(html)&&html.includes('(via '),'movement and via');
 const count=run(`news().length`);await l.run('runDraftLottery()');assert.equal(run('news().length'),count,'running again posts nothing');
 console.log('PASS Draft screen: Lottery results table with',30,'rows; no repeat posts');
 // 5. Record order (and snake): one plain item, no jumps, user still told.
 for(const mode of ['record','snake']){l.run(`reset('${mode}');state.tradePickOwners=[]`);await l.run('runDraftLottery()');const n=run('news()'),lo=run('state.draft.lottery');
  assert.equal(lo.draws,0);assert(lo.odds.every(p=>p===null));assert.deepEqual(lo.drawn,[]);assert.equal(n.filter(x=>x.h.startsWith('Draft order set by record: 1. ')).length,1,mode);assert(!n.some(x=>/jump|slide|Lottery results|No\. 1 pick/.test(x.h)),mode+': no lottery headlines');
  assert(n.some(x=>x.t.includes(0)),'user mentioned');const m=run(`inboxStore().items.find(m=>m.type==='Draft')`);assert(m.subject.startsWith('Draft order: you pick No. '),m.subject);
  assert(run('draftView()').includes('Draft order set by record'))}
 console.log('PASS record and snake: one "Draft order set by record" item, user message, table');
 // 6. Equal, custom and random modes.
 for(const [mode,extra] of [['equal',''],['custom',",lotteryChances:'140,140,140,125,105,90,75,60,45,30,20,15,10,5'"],['random','']]){l.run(`reset('${mode}');state.leagueSettings={...state.leagueSettings${extra}}`);await l.run('runDraftLottery()');const lo=run('state.draft.lottery'),n=run('news()');
  if(mode==='equal')assert(lo.odds.slice(0,14).every(p=>Math.abs(p-1/14)<1e-12));if(mode==='custom')assert(Math.abs(lo.odds[0]-.14)<1e-12);if(mode==='random')assert(lo.odds.every(p=>Math.abs(p-1/30)<1e-12)&&lo.draws===0);
  assert(n.some(x=>/the No\. 1 pick/.test(x.h))&&n.some(x=>x.h.startsWith('Lottery results: ')),mode)}
 console.log('PASS equal, custom and random lotteries post the winner and results');
 // 7. Saves (a real finished season): the record round-trips and is checked; old saves without it load, render and post nothing.
 const s2=loadLeague({seed:32,strictDOM:false});s2.setRandomSeed(32);const run2=c=>{const v=s2.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
 s2.run(`render=()=>{};toast=()=>{};save=async()=>true;showResult=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};state=validateCareerData(fresh(defaultTeams().slice(0,6),1));`);await s2.run('(async()=>{await sim(seasonLength());await playoffs()})()');assert(run2('draftReady()'),'season finished');
 await s2.run('runDraftLottery()');assert.equal(run2('state.draft.lottery.posted'),true,'real season lottery recorded');
 const saved=run2('JSON.stringify(state)');s2.context.saved=saved;
 assert.deepEqual(run2('validateCareerData(JSON.parse(saved)).draft.lottery'),run2('state.draft.lottery'));
 for(const edit of ['s.draft.lottery.version=2',"s.draft.lottery.mode='x'",'s.draft.lottery.seeds[0]=s.draft.lottery.seeds[1]','s.draft.lottery.odds[0]=2','s.draft.lottery.order.pop()','s.draft.lottery.posted=1'])assert.throws(()=>s2.run(`(()=>{const s=JSON.parse(saved);${edit};validateCareerData(s)})()`),/draft lottery/,edit);
 const old=run2(`(()=>{const s=JSON.parse(saved);delete s.draft.lottery;state=validateCareerData(s);return {has:'lottery' in state.draft,view:draftView().includes('Lottery results')}})()`);assert.deepEqual(old,{has:false,view:false});
 const before=run2(`newsStore().items.length`);await s2.run('runDraftLottery()');assert.equal(run2('newsStore().items.length'),before,'a locked old-save order posts nothing');
 console.log('PASS saves: lottery record validated; old saves load without it and skip the extra news');
})().catch(e=>{console.error(e);process.exit(1)});
