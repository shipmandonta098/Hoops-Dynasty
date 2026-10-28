/* Game result headlines: pick the most notable story from the game's own data (scoring timeline, periods, venue,
   records, streaks, rivalries, playoff series, box score). Applies to new games; saved headlines are never rewritten.
   Priority: comeback, overtime, close finish, blowout, milestone, individual performance, then a plain result. */
const HEADLINE_PERIOD_WORDS=['first','second','third','fourth'];
function headlineHash(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h}
function headlinePeriodName(period,regulation){if(period>=regulation)return 'overtime period';return (HEADLINE_PERIOD_WORDS[period]||'final')+(regulation===2?' half':' quarter')}
function headlineOvertimeName(n){return n===1?'overtime':n===2?'double overtime':n===3?'triple overtime':n+' overtimes'}
function headlinePeriodEnd(rules,period){return period<rules.gamePeriods?(period+1)*rules.periodMinutes*60:rules.gamePeriods*rules.periodMinutes*60+(period-rules.gamePeriods+1)*rules.overtimeMinutes*60}
// Timeline facts from summaryData.events (side 0 = team a). Only used when the events reproduce the final score.
function headlineTimeline(g){
 const data=g.summaryData,rules={gamePeriods:4,periodMinutes:12,overtimeMinutes:5,...(g.gameRules||{})};if(!data?.complete||!Array.isArray(data.events))return null;
 const w=g.winner===g.a?0:1,score=[0,0];let deficit=0,deficitPeriod=null,lateDeficit=0,lastLeadChange=null,leadChanges=0,leader=null,secondHalfDeficit=0;
 const finalStart=rules.gamePeriods-1;
 for(const e of data.events){
  const before=score[w]-score[1-w];if(e.period===finalStart&&lateDeficit<-before)lateDeficit=-before;
  score[e.side]+=e.points;const margin=score[w]-score[1-w];
  if(-margin>deficit){deficit=-margin;deficitPeriod=e.period}
  if(e.period===finalStart&&-margin>lateDeficit)lateDeficit=-margin;
  if(e.period>=Math.floor(rules.gamePeriods/2)&&-margin>secondHalfDeficit)secondHalfDeficit=-margin;
  const now=margin>0?w:margin<0?1-w:null;if(now!==null&&now!==leader){if(leader!==null)leadChanges++;leader=now}
  if(e.side===w&&before<=0&&margin>0)lastLeadChange=e;
 }
 if(score[0]!==g.sa||score[1]!==g.sb)return null;
 const winningShot=lastLeadChange&&lastLeadChange.period===data.periods-1?{event:lastLeadChange,secondsLeft:headlinePeriodEnd(rules,lastLeadChange.period)-lastLeadChange.seconds}:null;
 return {rules,periods:data.periods,deficit,deficitPeriod,lateDeficit,secondHalfDeficit,leadChanges,winningShot,overtimes:Math.max(0,data.periods-rules.gamePeriods)};
}
function headlineTeamGames(club,g){return state.history.filter(x=>x!==g&&x.stage==='Regular season'&&(x.a===club.id||x.b===club.id))}
// Streak before this game: positive = consecutive wins, negative = consecutive losses (state.history is newest first).
function headlineStreak(club,g){let n=0;for(const x of headlineTeamGames(club,g)){const s=x.winner===club.id?1:-1;if(n&&Math.sign(n)!==s)break;n+=s}return n}
// Conservative playoff math: claims are made only when no remaining results can change them (ties count against).
function headlinePlayoffPool(club){const c=playoffConfig(),teams=state.teams.filter(t=>!expansionPendingSeason(t)),pool=c.split?teams.filter(t=>t.conference===club.conference):teams,side=c.split?c.sides.find(s=>s.teams.some(id=>state.teams[id]?.conference===club.conference)):c.sides[0];const min=side?.teams.length||0;return {pool,min,max:min+(c.byes||0)}}
function headlinePlayoffStatus(club,adjust=new Map()){
 const rec=t=>{const d=adjust.get(t.id)||{w:0,l:0};return {w:t.w+d.w,left:ownerGames(t)-(t.w+d.w+t.l+d.l)}},{pool,min,max}=headlinePlayoffPool(club),me=rec(club);if(!min)return null;
 const others=pool.filter(t=>t.id!==club.id).map(rec);
 if(others.filter(o=>o.w+o.left>=me.w).length<min)return 'clinched';
 if(others.filter(o=>o.w>me.w+me.left).length>=max)return 'eliminated';return null;
}
function headlineSeries(g){
 if(g.stage==='Regular season')return null;const slot=playoffSeriesSlots().find(s=>s.pair?.length===2&&s.pair.includes(g.a)&&s.pair.includes(g.b));if(!slot)return null;
 const bestOf=playoffRoundGames(playoffConfig(),g.stage),need=Math.ceil(bestOf/2),games=playoffGames().filter(x=>x.stage===g.stage&&slot.pair.includes(x.a)&&slot.pair.includes(x.b));
 const w=games.filter(x=>x.winner===g.winner).length,l=games.length-w;return {bestOf,need,w,l,game:games.length,final:g.stage==='Championship'};
}
// Career highs are tracked only for players whose whole careers the league has recorded (debut on or after tracking began).
// Snapshot of tracked highs before game g; the store starts from this season's history (excluding g) when first used.
function gameHighsPrior(g){if(!state.gameHighs){state.gameHighs={start:state.year,players:{}};for(const x of [...state.history].reverse())if(x!==g)gameHighsRecord(x)}return new Map(Object.entries(state.gameHighs.players).map(([id,h])=>[Number(id),{...h}]))}
function gameHighTracked(p,store){return !!p&&(p.bio?.debutYear??-Infinity)>=store.start}
function gameHighsRecord(g){const store=state.gameHighs;for(const row of g.box||[]){if(row.played===false||!(row.mp>0))continue;const p=playerContext(row.playerId)?.p;if(!gameHighTracked(p,store))continue;const h=store.players[row.playerId]??={pts:0,games:0};h.games++;h.pts=Math.max(h.pts,row.pts||0)}}
function headlineIndividual(g,prior){
 const store=state.gameHighs;
 const lines=[];for(const row of g.box||[]){if(row.played===false)continue;const cats=[['pts','points'],['reb','rebounds'],['ast','assists'],['stl','steals'],['blk','blocks']].filter(([k])=>(row[k]||0)>=10),p=playerContext(row.playerId)?.p,h=prior.get(row.playerId);
  const kind=row.pts>=40?'forty':cats.length>=3?'tripleDouble':row.pts>=20&&row.reb>=20?'twentyTwenty':gameHighTracked(p,store)&&h&&h.games>=10&&row.pts>=20&&row.pts>h.pts?'careerHigh':null;
  if(kind)lines.push({row,kind,cats,rank:{forty:4,tripleDouble:3,twentyTwenty:2,careerHigh:1}[kind]})}
 return lines.sort((a,b)=>b.rank-a.rank||b.row.pts-a.row.pts)[0]||null;
}
function headlinePossessive(name){return name+(/s$/i.test(name)?"'":"'s")}
function headlineArticle(name){return /^[AEIOU]/i.test(name)?'an':'a'}
function headlineOrdinal(n){const v=n%100;return n+(v>=11&&v<=13?'th':['th','st','nd','rd'][n%10]||'th')}
function headlineShotName(e){return e.points===3?'three-pointer':e.points===1?'free throw':'basket'}
// Facts → story. Each story carries the claim-specific values its templates use.
function gameHeadlineStory(g,prior=gameHighsPrior(g)){
 const W=state.teams[g.winner],L=state.teams[g.winner===g.a?g.b:g.a],t=headlineTimeline(g),margin=Math.abs(g.sa-g.sb),hi=Math.max(g.sa,g.sb),lo=Math.min(g.sa,g.sb);
 const neutral=/all.star|rising|exhibition|neutral/i.test(g.stage),venue=neutral?'':g.winner===g.a?' at home':' on the road',base={W:W.city+' '+W.name,L:L.city+' '+L.name,venue,score:hi+'–'+lo,margin};
 if(t&&(t.deficit>=12||t.lateDeficit>=8)){const late=t.deficit<12;return {...base,type:'comeback',deficit:late?t.lateDeficit:t.deficit,when:late?headlinePeriodName(t.rules.gamePeriods-1,t.rules.gamePeriods):headlinePeriodName(t.deficitPeriod,t.rules.gamePeriods)}}
 if(t?.overtimes)return {...base,type:'overtime',ot:headlineOvertimeName(t.overtimes)};
 const late=t?.winningShot&&t.winningShot.secondsLeft<=10?t.winningShot:null;
 if(margin<=3||late){const row=late&&g.box.find(r=>r.playerId===late.event.playerId);return {...base,type:late&&row?'lateWinner':'close',player:row?.name,shot:late?headlineShotName(late.event):null,seconds:late?Math.max(1,late.secondsLeft):null}}
 if(margin>=20)return {...base,type:'blowout'};
 const series=headlineSeries(g);if(series){const kind=series.w===series.need?(series.final?'title':'seriesWin'):series.w===series.need-1&&series.l===series.need-1&&series.bestOf>1?'decider':series.w>series.l?'seriesLead':series.w===series.l?'seriesEven':'seriesCut';if(kind)return {...base,type:kind,w:series.w,l:series.l,game:series.game,next:series.game+1}}
 if(g.stage==='Regular season'){
  const adjust=new Map([[W.id,{w:-1,l:0}],[L.id,{w:0,l:-1}]]);
  if(headlinePlayoffStatus(W)==='clinched'&&headlinePlayoffStatus(W,adjust)!=='clinched')return {...base,type:'clinch'};
  if(headlinePlayoffStatus(L)==='eliminated'&&headlinePlayoffStatus(L,adjust)!=='eliminated')return {...base,type:'eliminate'};
  const ws=headlineStreak(W,g),ls=headlineStreak(L,g);
  if(ls>=4)return {...base,type:'snapStreak',n:ls};
  if(ws<=-4)return {...base,type:'endSkid',n:-ws};
  if(ws>=3)return {...base,type:'extendStreak',n:ws+1};
  const wGames=headlineTeamGames(W,g).length,lGames=headlineTeamGames(L,g).length,home=state.teams[g.a];
  if(!wGames)return {...base,type:'opener'};
  if(!lGames)return {...base,type:'spoilOpener'};
  if(!neutral&&!headlineTeamGames(home,g).some(x=>x.a===home.id))return {...base,type:home.id===W.id?'homeOpener':'spoilHomeOpener'};
 }
 const rivalry=rivalryDetails(state.teams[g.a],state.teams[g.b]).types[0];if(rivalry)return {...base,type:'rivalry',label:rivalry.label};
 const star=headlineIndividual(g,prior);if(star)return {...base,type:star.kind,player:star.row.name,pts:star.row.pts,reb:star.row.reb,line:star.cats.slice(0,3).map(([k])=>star.row[k]).join('-'),forWinner:star.row.team===W.abbr};
 const verb=t&&t.secondHalfDeficit>0?'rally past':margin>=12?'cruise past':t&&t.leadChanges>=8?'outlast':margin<=6&&t&&t.deficit===0?'hold off':null;
 return {...base,type:'result',verb};
}
const HEADLINE_TEMPLATES={
 comeback:[s=>`${s.W} rally from ${s.deficit} down in the ${s.when} to beat ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} erase a ${s.deficit}-point ${s.when.replace(' ','-')} deficit${s.venue} and top ${s.L}, ${s.score}`,s=>`Down ${s.deficit} in the ${s.when}, ${s.W} storm back past ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} climb out of a ${s.deficit}-point ${s.when.replace(' ','-')} hole to beat ${s.L}${s.venue}, ${s.score}`],
 overtime:[s=>`${s.W} outlast ${s.L} in ${s.ot}${s.venue}, ${s.score}`,s=>`${s.W} survive ${s.ot} to beat ${s.L}${s.venue}, ${s.score}`,s=>`It takes ${s.ot}, but ${s.W} get past ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} prevail over ${s.L} after ${s.ot}${s.venue}, ${s.score}`],
 lateWinner:[s=>`${headlinePossessive(s.player)} go-ahead ${s.shot} with ${s.seconds} ${s.seconds===1?'second':'seconds'} left lifts ${s.W} past ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} edge ${s.L}${s.venue} on ${headlinePossessive(s.player)} ${s.shot} with ${s.seconds} ${s.seconds===1?'second':'seconds'} to go, ${s.score}`,s=>`${s.player} puts ${s.W} ahead for good with ${s.seconds} ${s.seconds===1?'second':'seconds'} left against ${s.L}${s.venue}, ${s.score}`],
 close:[s=>`${s.W} hold off ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} edge ${s.L} in a tight finish${s.venue}, ${s.score}`,s=>`${s.W} escape with a ${s.margin}-point win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} squeeze past ${s.L}${s.venue}, ${s.score}`],
 blowout:[s=>`${s.W} rout ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} cruise past ${s.L} by ${s.margin}${s.venue}, ${s.score}`,s=>`${s.W} roll to a ${s.margin}-point win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} blow out ${s.L}${s.venue}, ${s.score}`],
 title:[s=>`${s.W} win the championship, beating ${s.L} in Game ${s.game}, ${s.score}`,s=>`${s.W} are champions after taking the series ${s.w}–${s.l} over ${s.L}, ${s.score}`,s=>`${s.W} close out ${s.L} to win the title, ${s.score}`],
 seriesWin:[s=>`${s.W} eliminate ${s.L}, take the series ${s.w}–${s.l}, ${s.score}`,s=>`${s.W} close out ${s.L} in Game ${s.game}, ${s.score}`,s=>`${s.W} advance past ${s.L} with a Game ${s.game} win, ${s.score}`],
 decider:[s=>`${s.W} force Game ${s.next} against ${s.L}, ${s.score}`,s=>`${s.W} even the series ${s.w}–${s.l} and force a deciding Game ${s.next} with ${s.L}, ${s.score}`,s=>`${s.W} stay alive, forcing Game ${s.next} against ${s.L}, ${s.score}`],
 seriesLead:[s=>`${s.W} take a ${s.w}–${s.l} series lead over ${s.L}, ${s.score}`,s=>`${s.W} beat ${s.L} in Game ${s.game} to go up ${s.w}–${s.l}, ${s.score}`,s=>`${s.W} move ahead ${s.w}–${s.l} in the series with ${s.L}, ${s.score}`],
 seriesEven:[s=>`${s.W} even the series with ${s.L} at ${s.w}–${s.l}, ${s.score}`,s=>`${s.W} answer back in Game ${s.game}, tying the series with ${s.L} ${s.w}–${s.l}, ${s.score}`,s=>`${s.W} level the series against ${s.L}, ${s.score}`],
 seriesCut:[s=>`${s.W} cut the series deficit to ${s.w}–${s.l} against ${s.L}, ${s.score}`,s=>`${s.W} win Game ${s.game} to pull within ${s.w}–${s.l} of ${s.L}, ${s.score}`,s=>`${s.W} stay alive against ${s.L}, trailing the series ${s.w}–${s.l}, ${s.score}`],
 clinch:[s=>`${s.W} clinch a playoff spot with a win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} lock up a playoff berth, beating ${s.L}${s.venue}, ${s.score}`,s=>`Playoffs secured: ${s.W} top ${s.L}${s.venue}, ${s.score}`],
 eliminate:[s=>`${s.W} knock ${s.L} out of playoff contention${s.venue}, ${s.score}`,s=>`${s.L} eliminated from playoff contention after loss to ${s.W}, ${s.score}`,s=>`${s.W} end ${headlinePossessive(s.L)} playoff hopes${s.venue}, ${s.score}`],
 snapStreak:[s=>`${s.W} snap ${headlinePossessive(s.L)} ${s.n}-game winning streak${s.venue}, ${s.score}`,s=>`${s.W} end ${headlinePossessive(s.L)} run at ${s.n} straight wins${s.venue}, ${s.score}`,s=>`${headlinePossessive(s.L)} ${s.n}-game win streak ends against ${s.W}, ${s.score}`],
 endSkid:[s=>`${s.W} snap a ${s.n}-game losing streak against ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} end ${s.n}-game skid with a win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} stop the slide at ${s.n} by beating ${s.L}${s.venue}, ${s.score}`],
 extendStreak:[s=>`${s.W} extend winning streak to ${s.n} with a win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} make it ${s.n} straight, beating ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} stay hot, winning a ${headlineOrdinal(s.n)} straight game against ${s.L}${s.venue}, ${s.score}`],
 opener:[s=>`${s.W} open the season with a win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} start the season on a winning note against ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} win their season opener against ${s.L}${s.venue}, ${s.score}`],
 spoilOpener:[s=>`${s.W} spoil ${headlinePossessive(s.L)} season opener${s.venue}, ${s.score}`,s=>`${s.L} drop their season opener to ${s.W}, ${s.score}`,s=>`${s.W} hand ${s.L} a season-opening loss${s.venue}, ${s.score}`],
 homeOpener:[s=>`${s.W} win their home opener against ${s.L}, ${s.score}`,s=>`${s.W} christen the home schedule with a win over ${s.L}, ${s.score}`,s=>`${s.W} give the home crowd an opening-night win over ${s.L}, ${s.score}`],
 spoilHomeOpener:[s=>`${s.W} spoil ${headlinePossessive(s.L)} home opener, ${s.score}`,s=>`${s.L} drop their home opener to ${s.W}, ${s.score}`,s=>`${s.W} crash ${headlinePossessive(s.L)} first home game of the season, ${s.score}`],
 rivalry:[s=>`${s.W} take the ${s.label} clash with ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} get the better of ${s.L} in the ${s.label}${s.venue}, ${s.score}`,s=>`${s.label}: ${s.W} beat ${s.L}${s.venue}, ${s.score}`],
 forty:[s=>s.forWinner?`${s.player} scores ${s.pts} as ${s.W} beat ${s.L}${s.venue}, ${s.score}`:`${headlinePossessive(s.player)} ${s.pts} points not enough as ${s.W} beat ${s.L}${s.venue}, ${s.score}`,s=>s.forWinner?`${s.player} pours in ${s.pts} in ${headlineArticle(s.W)} ${s.W} win over ${s.L}${s.venue}, ${s.score}`:`${s.W} survive ${headlinePossessive(s.player)} ${s.pts}-point night to beat ${s.L}${s.venue}, ${s.score}`,s=>`${s.player} erupts for ${s.pts}${s.forWinner?', '+s.W+' top '+s.L:' but '+s.W+' top '+s.L}${s.venue}, ${s.score}`],
 tripleDouble:[s=>`${s.player} posts a triple-double (${s.line}) as ${s.W} beat ${s.L}${s.venue}, ${s.score}`,s=>`${headlinePossessive(s.player)} ${s.line} triple-double ${s.forWinner?'powers':'not enough as'} ${s.W}${s.forWinner?' past':' beat'} ${s.L}${s.venue}, ${s.score}`,s=>`Triple-double for ${s.player} (${s.line}) in ${headlineArticle(s.W)} ${s.W} win over ${s.L}${s.venue}, ${s.score}`],
 twentyTwenty:[s=>`${s.player} goes for ${s.pts} and ${s.reb} as ${s.W} beat ${s.L}${s.venue}, ${s.score}`,s=>`${s.player} posts a ${s.pts}-point, ${s.reb}-rebound night in ${headlineArticle(s.W)} ${s.W} win over ${s.L}${s.venue}, ${s.score}`,s=>`${s.pts} and ${s.reb} for ${s.player} as ${s.W} top ${s.L}${s.venue}, ${s.score}`],
 careerHigh:[s=>`${s.player} scores a career-high ${s.pts} as ${s.W} beat ${s.L}${s.venue}, ${s.score}`,s=>`Career night for ${s.player} (${s.pts} points) in ${headlineArticle(s.W)} ${s.W} win over ${s.L}${s.venue}, ${s.score}`,s=>s.forWinner?`${s.player} sets a career high with ${s.pts} in ${headlineArticle(s.W)} ${s.W} win over ${s.L}${s.venue}, ${s.score}`:`${headlinePossessive(s.player)} career-high ${s.pts} not enough as ${s.W} beat ${s.L}${s.venue}, ${s.score}`],
 result:[s=>`${s.W} ${s.verb||'top'} ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} ${s.verb||'beat'} ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} ${s.verb||'get past'} ${s.L}${s.venue}, ${s.score}`,s=>`${s.W} ${s.verb||'down'} ${s.L}${s.venue}, ${s.score}`]
};
// Template choice is seeded by the game; the same template never runs twice in a row for one story type on a day.
function gameHeadline(g){
 const prior=gameHighsPrior(g),story=gameHeadlineStory(g,prior),list=HEADLINE_TEMPLATES[story.type];let i=headlineHash(state.year+':'+g.day+':'+g.a+':'+g.b+':'+g.stage)%list.length;
 const previous=newsStore().items.find(n=>n.category==='Results'&&n.year===state.year&&n.day===g.day&&n.story?.startsWith(story.type+':'));
 if(previous&&Number(previous.story.split(':')[1])===i)i=(i+1)%list.length;
 gameHighsRecord(g);return {headline:list[i](story),story:story.type+':'+i};
}
const validateBeforeGameHighs=validateCareerData;validateCareerData=function(raw){
 const data=validateBeforeGameHighs(raw),h=raw.gameHighs;if(h===undefined)return data;
 if(!h||!Number.isInteger(h.start)||h.start<1900||h.start>10001||!h.players||typeof h.players!=='object'||Array.isArray(h.players)||Object.keys(h.players).length>20000)throw Error('Invalid save: game highs');
 const players={};for(const [id,p] of Object.entries(h.players)){if(!/^\d+$/.test(id)||!p||!Number.isInteger(p.pts)||p.pts<0||p.pts>300||!Number.isInteger(p.games)||p.games<0||p.games>100000)throw Error('Invalid save: game high');players[id]={pts:p.pts,games:p.games}}
 data.gameHighs={start:h.start,players};return data;
};
