/* Draft lottery news. runDraftLottery (draft.js) stores the lottery on the draft: pre-lottery seeds, each team's odds
   for the No. 1 pick, the picks won in the draw and the final first-round order (draft.lottery). After the lottery
   (and any commissioner decision) this posts the No. 1 headline, the drawn picks, the biggest jumps and slides,
   traded-pick notes and the user's result (news and GM inbox); the Draft screen shows the same table. Record-order
   modes post a plain "Draft order set by record" item instead. Old saves without a lottery record post nothing extra. */
if(typeof INBOX_TYPES!=='undefined'&&!INBOX_TYPES.includes('Draft'))INBOX_TYPES.push('Draft');
const LOTTERY_MODES=['weighted','equal','custom','record','random','snake'];
function lotteryDrawnMode(l){return l.draws>0||l.mode==='random'}
function lotteryPct(p){return p===null||p===undefined?'—':(p*100).toFixed(p>0&&p<.01?2:1)+'%'}
// One row per first-round pick: number, origin and owner, pre-lottery seed, odds for No. 1, movement (seed − pick).
function lotteryRows(d=state.draft){const l=d?.lottery;if(!l)return [];return l.order.map((origin,i)=>{const seed=l.seeds.indexOf(origin)+1;return {pick:i+1,origin,owner:typeof tradePickOwner==='function'?tradePickOwner({year:d.year,origin,round:1}):origin,seed,odds:l.odds[seed-1]??null,move:seed-(i+1),drawn:l.drawn.includes(origin)}})}
function lotteryTeamLabel(r){const owner=state.teams[r.owner].abbr;return r.owner===r.origin?owner:owner+' (via '+state.teams[r.origin].abbr+')'}
function lotteryNewsItems(d=state.draft){const l=d.lottery,rows=lotteryRows(d),abbr=id=>state.teams[id].abbr,name=id=>state.teams[id].city+' '+state.teams[id].name,items=[];
 const add=(headline,detail,teams)=>items.push({category:'Draft',headline,detail,teams:[...new Set(teams)]});
 if(!lotteryDrawnMode(l)){const top=rows.slice(0,5).map(r=>r.pick+'. '+lotteryTeamLabel(r)).join(' · ');add('Draft order set by record: '+top+'.','The first round follows reverse standings'+(l.mode==='snake'?', with later rounds snaking.':'.'),rows.slice(0,5).map(r=>r.owner));return items}
 // Drawn picks: the teams won in the draw (an expansion team seeded first is placed, not drawn); random order: the top 4.
 const drawn=l.mode==='random'?rows.slice(0,4):rows.filter(r=>r.drawn);if(!drawn.length)return items;
 const first=drawn[0],via=first.owner!==first.origin?' via '+abbr(first.origin):'',odds=lotteryPct(first.odds),slot=first.pick===1?'the No. 1 pick':'the top lottery pick (No. '+first.pick+')';
 add(first.seed===first.pick?name(first.owner)+' hold serve and win '+slot+via+' ('+odds+' odds).':name(first.owner)+' win '+slot+via+' from the No. '+first.seed+' pre-lottery seed ('+odds+' odds).','Pre-lottery seed '+first.seed+' · odds for No. 1: '+odds+'.',[first.owner,first.origin]);
 add('Lottery results: '+drawn.map(r=>r.pick+'. '+lotteryTeamLabel(r)+' (seed '+r.seed+', '+lotteryPct(r.odds)+')').join(' · ')+'.',(l.mode==='random'?'Top '+drawn.length+' after the random draw.':drawn.length+' pick'+(drawn.length===1?' was':'s were')+' drawn.'),drawn.map(r=>r.owner));
 // Jumps into the drawn picks (beyond No. 1, already the headline) and the biggest slide.
 for(const r of drawn.slice(1))if(r.move>0)add(abbr(r.owner)+' '+(r.move>=3?'jump':'move up')+' from No. '+r.seed+' to No. '+r.pick+(r.owner!==r.origin?' via '+abbr(r.origin):'')+' in the lottery ('+lotteryPct(r.odds)+' odds for No. 1).','',[r.owner,r.origin]);
 const slide=rows.filter(r=>r.move<0).sort((a,b)=>a.move-b.move||a.seed-b.seed)[0];if(slide)add(abbr(slide.owner)+' slide from No. '+slide.seed+' to No. '+slide.pick+(slide.owner!==slide.origin?' (pick via '+abbr(slide.origin)+')':'')+' in the lottery.','Pre-lottery odds for No. 1: '+lotteryPct(slide.odds)+'.',[slide.owner,slide.origin]);
 // Traded picks among the drawn picks not already named with their "via".
 for(const r of drawn.slice(1))if(r.owner!==r.origin&&r.move<=0)add(name(r.owner)+' win the No. '+r.pick+' pick via '+abbr(r.origin)+'.','Seed '+r.seed+' · odds for No. 1: '+lotteryPct(r.odds)+'.',[r.owner,r.origin]);
 return items}
// The user's picks: always mentioned, plus a GM inbox message.
function lotteryUserLines(d=state.draft){const you=controlledTeamId();if(you<0)return [];return lotteryRows(d).filter(r=>r.owner===you).map(r=>'No. '+r.pick+(r.owner!==r.origin?' (via '+state.teams[r.origin].abbr+')':'')+' — pre-lottery seed '+r.seed+(r.odds?', '+lotteryPct(r.odds)+' odds for No. 1':'')+(r.move>0?', up '+r.move:r.move<0?', down '+(-r.move):', unchanged'))}
function lotteryPost(d=state.draft){const l=d.lottery,you=controlledTeamId(),items=lotteryNewsItems(d);
 for(const item of items.slice().reverse())addNewsItem(item);
 if(you>=0){const lines=lotteryUserLines(d),club=state.teams[you],drawn=lotteryDrawnMode(l),subject=lines.length?(drawn?'Draft lottery':'Draft order')+': you pick '+lines.map(x=>x.split(' — ')[0]).join(' and ')+' in the first round':(drawn?'Draft lottery':'Draft order')+': no first-round pick';
  if(!items.some(i=>i.teams.includes(you)))addNewsItem({category:'Draft',headline:club.city+' '+club.name+' '+(lines.length?'will pick '+lines.map(x=>x.split(' — ')[0]).join(' and ')+' in the first round.':'have no first-round pick this year.'),detail:lines.join(' · '),teams:[you]});
  addGMMessage('Draft','Scouting Department',subject+'.',(lines.length?'Our first-round position'+(lines.length>1?'s':'')+': '+lines.join('; ')+'.':'We do not hold a first-round pick in this draft.')+(drawn?' The lottery drew '+(l.draws||'the full order')+(l.draws?' pick'+(l.draws===1?'':'s'):'')+'.':' The order follows reverse standings.'))}
 l.posted=true}
const lotteryNewsBefore=runDraftLottery;
runDraftLottery=function(...args){const result=lotteryNewsBefore(...args),post=async()=>{const d=state.draft;if(!d?.lottery||d.lottery.posted||d.year!==state.year||!d.order.length)return;d.lottery.order=[...d.order];lotteryPost(d);if(!simulationHeadless()){await save();render()}};
 return result&&typeof result.then==='function'?result.then(async v=>{await post();return v}):(post(),result)};
// Draft screen: lottery results table.
function lotteryResultsMarkup(d=state.draft){const l=d?.lottery;if(!l||d.year!==state.year)return '';const rows=lotteryRows(d),drawn=lotteryDrawnMode(l),you=controlledTeamId();
 return `<section class="panel lottery-results"><div class="panelhead"><h2>${drawn?'Lottery results':'Draft order set by record'}</h2><span class="muted">${drawn?(l.draws?l.draws+' pick'+(l.draws===1?'':'s')+' drawn':'Random order'):'Reverse standings'}</span></div><div class="tablewrap"><table><thead><tr><th>Pick</th><th>Team</th><th>Pre-lottery seed</th><th>Odds for No. 1</th><th>Movement</th></tr></thead><tbody>${rows.map(r=>`<tr class="${r.owner===you?'you':''}${r.drawn?' lottery-drawn':''}"><td>${r.pick}</td><td>${escapeHTML(lotteryTeamLabel(r))}</td><td>${r.seed}</td><td>${lotteryPct(r.odds)}</td><td>${r.move>0?'▲ '+r.move:r.move<0?'▼ '+(-r.move):'—'}</td></tr>`).join('')}</tbody></table></div></section>`}
const lotteryDraftViewBefore=draftView;draftView=function(...args){const html=lotteryDraftViewBefore(...args),table=lotteryResultsMarkup();if(!table)return html;const at=html.indexOf('</nav>');return at<0?table+html:html.slice(0,at+6)+table+html.slice(at+6)};
// Saves: the lottery record is checked and kept with the draft.
function readDraftLottery(raw,count,bad){if(raw===undefined)return undefined;const perm=a=>Array.isArray(a)&&a.length===count&&new Set(a).size===count&&a.every(id=>Number.isInteger(id)&&id>=0&&id<count);
 if(!raw||raw.version!==1||!LOTTERY_MODES.includes(raw.mode)||!Number.isInteger(raw.draws)||raw.draws<0||raw.draws>36||!perm(raw.seeds)||!perm(raw.order)||!Array.isArray(raw.odds)||raw.odds.length!==count||raw.odds.some(p=>p!==null&&(typeof p!=='number'||!Number.isFinite(p)||p<0||p>1))||!Array.isArray(raw.drawn)||raw.drawn.length>raw.draws||new Set(raw.drawn).size!==raw.drawn.length||raw.drawn.some(id=>!Number.isInteger(id)||id<0||id>=count)||typeof raw.posted!=='boolean')bad('invalid draft lottery');
 return {version:1,mode:raw.mode,draws:raw.draws,seeds:[...raw.seeds],odds:[...raw.odds],drawn:[...raw.drawn],order:[...raw.order],posted:raw.posted}}
const lotteryValidateBefore=validateCareerData;validateCareerData=function(raw){const data=lotteryValidateBefore(raw);if(data.draft&&raw?.draft?.lottery!==undefined)data.draft.lottery=readDraftLottery(raw.draft.lottery,data.teams.length,m=>{throw Error('Invalid save: '+m)});return data};
