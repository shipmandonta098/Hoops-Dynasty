/* Deterministic postgame reactions; the existing morale tiers apply game attributes. */
let moralePerformanceContext=null;
function performanceMood(p){return state.moralePerformance?.players?.[p.id]}
function performancePersonality(p){return hasTrait(p,'professional')?'Professional':hasTrait(p,'diva')?'Diva':hasTrait(p,'fiery')?'Competitor':p.age<=23&&!hasTrait(p,'leader')?'Sponge':'Balanced'}
function performanceStore(){if(!state.moralePerformance)state.moralePerformance={year:state.year,players:{}};if(state.moralePerformance.year!==state.year)state.moralePerformance={year:state.year,players:{}};return state.moralePerformance}
function performancePregame(club,opponent){
 const order=rank(),games=state.history.filter(g=>(g.a===club.id||g.b===club.id)&&g.stage==='Regular season');let streak=0;
 for(const g of games){const sign=g.winner===club.id?1:-1;if(streak&&Math.sign(streak)!==sign)break;streak+=sign}
 return {streak,chemistry:teamChemistry(club).score,quality:opponent.w+opponent.l>=5?(order[0]?.id===opponent.id?'top':order.at(-1)?.id===opponent.id?'bottom':'normal'):'normal',rival:rivalryDetails(club,opponent).types.length>0,players:new Map(club.roster.map(p=>[p.id,{injured:injuryDays(p)>0,average:p.gp>=3?p.pts/p.gp:null,expected:expectedPlayerRole(p)[1]*gameMinutes()/48,deep:club.roster.indexOf(p)>=9,score:moraleDetails(p,club).score}]))};
}
const playBeforePerformanceMood=play;play=function(a,b,stage='Regular season'){const previous=moralePerformanceContext;performanceStore();moralePerformanceContext=new Map([[a,performancePregame(state.teams[a],state.teams[b])],[b,performancePregame(state.teams[b],state.teams[a])]]);try{return playBeforePerformanceMood(a,b,stage)}finally{moralePerformanceContext=previous}};
function performanceMoraleChange(p,club,won){
 const context=moralePerformanceContext?.get(club.id),g=state.history[0],pre=context?.players.get(p.id);if(!context||!g||!pre)return won?2:-2;
 const store=performanceStore(),m=store.players[p.id]??={recent:[],slump:false,clutchGames:0,clutchBoost:0,reasons:[]};
 if(m.clutchGames>0&&!pre.injured){m.clutchGames--;if(!m.clutchGames)m.clutchBoost=0}
 const row=g.box.find(r=>r.playerId===p.id),kind=performancePersonality(p),reasons=[];let result=won?2+Math.min(4,Math.max(0,context.streak)*.6):context.streak>=5?-1:-2-Math.min(6,Math.max(0,-context.streak)*1.2);
 if(won&&context.quality==='top'){result+=5;reasons.push('Beat the league leader')}
 if(!won&&context.quality==='bottom'){result-=5;reasons.push('Lost to the last-place team')}
 if(context.rival){result*=1.5;if(won&&pre.score<40)result+=5;reasons.push(won?'Rivalry win lifts the locker room':'Rivalry loss stings')}
 if(kind==='Competitor')result*=won?1.5:2;
 reasons.push(won?'Winning momentum':'Losing momentum');
 let personal=0;
 if(!pre.injured){
  const sample={mp:row?.mp||0,pts:row?.pts||0,fgm:row?.fgm||0,fga:row?.fga||0};m.recent.push(sample);m.recent=m.recent.slice(-3);
  const avg=m.recent.reduce((s,r)=>s+r.mp,0)/m.recent.length;
  if(m.recent.length===3&&avg<pre.expected*.7){personal-=Math.min(6,(pre.expected-avg)*.25);reasons.push('Three-game minutes below role expectations')}
  if(row?.mp>0){
   if(p.ovr>=85&&pre.average!==null&&row.pts<pre.average*.6){personal-=4;reasons.push('Scoring well below personal average')}
   if(pre.deep&&row.mp>=5&&Math.abs(g.sa-g.sb)>=20){personal+=2;reasons.push('Garbage-time opportunity')}
   if(pre.deep&&row.mp>=Math.max(10,pre.expected)&&row.fga>=3&&row.fgm/row.fga>=.6){personal+=7;reasons.push('Efficient breakout from the deep bench')}
   if(kind==='Diva'&&row.mp>=10&&row.fga<Math.max(6,pre.expected*.3)){personal-=6;reasons.push('Too few offensive opportunities')}
   const cold=m.recent.length===3&&m.recent.every(r=>r.fga>=5&&r.fgm/r.fga<=.2);
   const breakout=row.fga>=8&&row.fgm/row.fga>=.5&&row.pts>=Math.max(15,(pre.average||15)*1.2);
   if(m.slump&&breakout){m.slump=false;personal+=6;reasons.push('Breakout ends the shooting slump');moraleAnnounce(club,'Slump broken',p.name+' breaks out of a shooting slump.')}
   else if(cold&&!m.slump){m.slump=true;moraleAnnounce(club,'Shooting slump',p.name+' enters a shooting slump after three games at 20% or worse (at least five attempts each).')}
   if(m.slump){personal-=3;reasons.push('Shooting slump drains confidence')}
  }
 }
 if(kind==='Sponge'){const influence=Math.max(-5,Math.min(3,(context.chemistry-60)/8));personal+=influence;reasons.push('Absorbs the locker-room mood')}
 const shot=won&&g.moraleWinningShot?.playerId===p.id?g.moraleWinningShot:g.moraleFinalShot;
 if(shot?.playerId===p.id&&shot.remaining<=5){
  if(shot.made&&won&&shot.beforeMargin<=0&&shot.afterMargin>0&&shot.afterMargin-shot.beforeMargin===shot.value&&Math.abs(g.sa-g.sb)<=shot.value){m.clutchGames=3;m.clutchBoost=kind==='Professional'?4:12;reasons.push('Game-winning shot: confidence boost for three games');moraleAnnounce(club,'Game-winning confidence',p.name+' hits the game-winning shot and carries a confidence boost into the next three games.')}
  else if(!shot.made&&!won&&shot.beforeMargin+shot.value>=0){personal-=personality(p).loyalty<50||(hasTrait(p,'fiery')?85:25+(p.id*13+29)%71)<50?9:6;reasons.push('Missed a final-seconds tying or winning shot')}
 }
 if(kind==='Professional'){result*=.2;personal*=.2}
 const delta=(Math.round(Math.max(-18,Math.min(15,result+personal)))||0);m.reasons=reasons;m.lastChange=delta;return delta;
}
const detailsBeforePerformanceMood=moraleDetails;moraleDetails=function(p,club){const out=detailsBeforePerformanceMood(p,club),m=state.moralePerformance?.year===state.year?performanceMood(p):null;if(!m)return out;if(m.clutchGames>0){for(const k of ['happiness','focus','satisfaction'])out[k]=clampMorale(out[k]+m.clutchBoost);out.score=clampMorale((out.happiness+out.focus+out.satisfaction)/3);out.label=moraleTier(out.score)}out.reasons.push(...(m.reasons||[]));return out};
const profileBeforePerformanceMood=moraleProfile;moraleProfile=function(ctx){const m=state.moralePerformance?.year===state.year?performanceMood(ctx.p):null;return profileBeforePerformanceMood(ctx)+(m?playerCard('RECENT CONFIDENCE',`<p>${m.slump?'Shooting slump · confidence drains until a breakout.':'No active shooting slump.'}${m.clutchGames?' Game-winner confidence: '+m.clutchGames+' games remaining.':''}</p><p>Last game: ${m.lastChange>=0?'+':''}${m.lastChange||0} morale adjustment.</p><ul>${m.reasons.map(s=>'<li>'+escapeHTML(s)+'</li>').join('')}</ul>`):'')};
const validateBeforePerformanceMood=validateCareerData;validateCareerData=function(raw){const out=validateBeforePerformanceMood(raw),m=raw.moralePerformance;if(m===undefined)return out;if(!m||!Number.isInteger(m.year)||m.year<1900||m.year>out.year||!m.players||Array.isArray(m.players)||typeof m.players!=='object')throw Error('Invalid performance morale');const players={};for(const [id,p]of Object.entries(m.players)){if(!/^\d+$/.test(id)||Number(id)>10000000||!p||!Array.isArray(p.recent)||p.recent.length>3||p.recent.some(r=>!['mp','pts','fgm','fga'].every(k=>Number.isFinite(r[k])&&r[k]>=0&&r[k]<=500)||r.fgm>r.fga)||typeof p.slump!=='boolean'||!Number.isInteger(p.clutchGames)||p.clutchGames<0||p.clutchGames>3||![0,4,12].includes(p.clutchBoost)||!Array.isArray(p.reasons)||p.reasons.length>12||p.reasons.some(s=>typeof s!=='string'||s.length>150)||p.lastChange!==undefined&&(!Number.isFinite(p.lastChange)||Math.abs(p.lastChange)>18))throw Error('Invalid player performance morale');players[id]=copy(p)}out.moralePerformance={year:m.year,players};return out};
