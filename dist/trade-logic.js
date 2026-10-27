/* Shared trade policy: game rules, not a complete NBA CBA implementation. All money is $M. */
function tradeTimeline(t){const top=t.roster.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,5),ovr=top.reduce((s,p)=>s+p.ovr,0)/Math.max(1,top.length),gp=t.w+t.l,pct=gp?t.w/gp:.5;return gp>=15&&pct<.4||ovr<74?'Rebuilding':ovr>=82||gp>=15&&pct>=.6?'Contender':'Standing Pat'}
function tradeYears(p){return Math.max(1,(p.contractThrough??state.year)-state.year+1)}
function tradePickKey(p){return p.year+':'+p.origin+':'+p.round}
function tradePickOwner(p){return (state.tradePickOwners||[]).find(x=>tradePickKey(x)===tradePickKey(p))?.owner??p.origin}
function tradePicks(t){const out=[];for(let year=state.year;year<state.year+leagueRules().tradePickSeasons;year++)for(const c of state.teams)for(let round=1;round<=(year===state.year?draftRoundCount():leagueRules().draftRounds);round++){const p={year,origin:c.id,round};if(year===state.year&&(state.draft?.picks.length||0)>0)continue;if(tradePickOwner(p)===t.id)out.push(p)}return out}
const TRADE_LOCK_DAYS=30;
function tradeLockDays(p){return p.tradeLockedUntil===undefined?0:Math.max(0,p.tradeLockedUntil-medicalStamp())}
function tradeRestrictionText(p){return tradeLockDays(p)>0?'Trade eligible in '+tradeLockDays(p)+' calendar days':p.tradeWait>0?'Trade eligible in '+p.tradeWait+' team games':''}
function lockTradedPlayer(p){p.tradeLockedUntil=medicalStamp()+TRADE_LOCK_DAYS;p.tradeWait=0}
function tradeMindset(t){return {Contender:'Win-Now',Rebuilding:'Rebuilding','Standing Pat':'Neutral'}[tradeTimeline(t)]}
function tradePlayerValue(p,t,roster=t.roster.filter(q=>q.id!==p.id)){
 const mindset=tradeMindset(t),years=tradeYears(p),base=2**((p.ovr-60)/6),upside=Math.max(0,p.pot-p.ovr)*Math.max(0,29-p.age)/90;
 const age=Math.max(.3,1-Math.max(0,p.age-28)*(mindset==='Win-Now'?.025:mindset==='Rebuilding'?.065:.045));
 const market=wnbaEnabled()?wnbaMillions(wnbaDemandDollars(p,t,state.year)):Math.max(1,salaryCap()*.22*2**((p.ovr-85)/12)),overpay=Math.max(0,p.salary/market-1),starException=mindset==='Win-Now'&&p.ovr>=85;
 let contract=Math.max(.25,1-overpay*.12*years*(starException?.35:mindset==='Rebuilding'?1.4:1));
 if(years===1)contract*=mindset==='Rebuilding'?1.12:mindset==='Win-Now'?.92:1.03;
 const peers=roster.filter(q=>q.pos===p.pos),quality=peers.filter(q=>q.ovr>=80).length,need=!peers.length?1.2:quality>=3?.8:peers.some(q=>q.ovr>=p.ovr)? .92:1.06;
 const fit=Math.max(.9,Math.min(1.12,1+(coachTradeValue(p,t)-p.ovr)*.012));
 return base*age*(1+upside*(mindset==='Rebuilding'?1.5:mindset==='Win-Now'?.3:.8))*contract*need*fit*(mindset==='Win-Now'&&p.ovr>=85?1.25:mindset==='Rebuilding'&&p.age>=30?.8:1);
}
function tradePickProjection(p){const count=state.teams.length,d=state.draft;if(p.year===state.year&&d?.order?.length){const order=p.round===1?d.order:d.type==='snake'?(p.round%2===0?[...d.order].reverse():d.order):d.laterOrder||d.order;return {slot:Math.max(1,order.indexOf(p.origin)+1),count,locked:true};}
 const strength=t=>{const top=t.roster.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,5),ovr=top.reduce((n,p)=>n+p.ovr,0)/Math.max(1,top.length),prior=Math.max(.15,Math.min(.85,.5+(ovr-77)*.025)),gp=t.w+t.l;return (t.w+prior*20)/(gp+20)};
 const teams=[...state.teams].sort((a,b)=>strength(a)-strength(b)||a.id-b.id);return {slot:teams.findIndex(t=>t.id===p.origin)+1,count,locked:false};
}
function tradePickValue(p,t){const projected=tradePickProjection(p),fraction=(projected.slot-1)/Math.max(1,projected.count-1),baseline=p.round===1?4+36*(1-fraction)**2:(1+5*(1-fraction)**2)/(p.round-1),mindset=tradeMindset(t);return baseline*.85**Math.max(0,p.year-state.year)*(mindset==='Rebuilding'?1.3:mindset==='Win-Now'?.7:1)}
function tradeSideAssessment(t,give,get,givePicks=[],getPicks=[],cashReceived=0,options={}){
 const roster=t.roster.filter(p=>!give.some(q=>q.id===p.id)),sent=give.reduce((s,p)=>s+tradePlayerValue(p,t,roster),0)+givePicks.reduce((s,p)=>s+tradePickValue(p,t),0),values=get.map(p=>tradePlayerValue(p,t,roster)).sort((a,b)=>b-a),rawPlayers=values.reduce((a,b)=>a+b,0),bloated=get.length>=3&&get.length>give.length+1&&Math.max(0,...get.map(p=>p.ovr))<Math.max(0,...give.map(p=>p.ovr))-4,playerReturn=bloated?values.reduce((s,v,i)=>s+v*(i===0?1:i===1?.7:.35),0):rawPlayers,received=playerReturn+getPicks.reduce((s,p)=>s+tradePickValue(p,t),0)+Math.max(-1,Math.min(1,cashReceived*.1)),reasons=[],timeline=tradeTimeline(t),mindset=tradeMindset(t),threshold=options.human===false?1.05:1.15;
 if(received<=sent*threshold)reasons.push(received<sent*.65?'The return is nowhere near the value of '+(give[0]?.name||'our draft assets')+'.':`We need more value: ${received.toFixed(1)} received versus ${(sent*threshold).toFixed(1)} required.`);
 if(bloated)reasons.push('Bundling lower-tier players discounts their combined value; we need a stronger centerpiece.');
 if(give.some(p=>p.ovr>=90)&&!get.some(p=>p.ovr>=85||p.age<=24&&p.pot>=94&&p.ovr>=80))reasons.push('A superstar requires a cornerstone player, not a bundle of lesser assets.');
 const toxic=get.filter(p=>tradeYears(p)>=3&&p.salary>Math.max(1,salaryCap()*.22*2**((p.ovr-85)/12))*1.5&&!(mindset==='Win-Now'&&p.ovr>=85)),premium=getPicks.filter(p=>p.round===1&&p.year<=state.year+2);
 if(toxic.length>premium.length)reasons.push(mindset==='Rebuilding'?'We are clearing long-term salary. '+toxic[0].name+' needs premium first-round compensation.':'Long-term overpaid contracts require premium first-round compensation.');
 if(mindset==='Win-Now'&&give.some(p=>p.ovr>=85)&&Math.max(0,...get.map(p=>p.ovr))<Math.max(...give.map(p=>p.ovr))-3)reasons.push('We are trying to win now; this package downgrades our core.');
 // A discounted package may still work if it includes enough genuine premium assets.
 const blocking=reasons.filter(r=>!r.startsWith('Bundling'));
 return {sent,received,rawReceived:rawPlayers+getPicks.reduce((s,p)=>s+tradePickValue(p,t),0),packagePenalty:rawPlayers-playerReturn,accepted:blocking.length===0,reasons,timeline,mindset,threshold,required:sent*threshold,score:Math.max(sent,received)>0?Math.max(0,Math.min(sent,received)/Math.max(sent,received)):0};
}
function tradeProposalAssessment(a,b,out,into,cash=0,outPicks=[],inPicks=[],options={}){
 const errors=tradeLegality(a,b,out,into,cash,outPicks,inPicks);
 if(!out.length&&!outPicks.length||!into.length&&!inPicks.length)errors.push('Select at least one asset on each side.');
 if(errors.length)return {sent:0,received:0,required:0,packagePenalty:0,threshold:options.human===false?1.05:1.15,score:0,accepted:false,reasons:errors,errors,timeline:tradeTimeline(b),mindset:tradeMindset(b),feedback:errors.some(s=>/salary|payroll|spending/i.test(s))?'Our finance department cannot approve this package under the league salary rules. '+errors[0]:errors[0],suggestedPick:null};
 const fair=tradeSideAssessment(b,into,out,inPicks,outPicks,cash,options);let suggestedPick=null;
 if(options.suggest&&!fair.accepted&&fair.received>=fair.sent*.65){for(const pick of tradePicks(a).filter(p=>!outPicks.some(q=>tradePickKey(p)===tradePickKey(q))).sort((p,q)=>tradePickValue(p,b)-tradePickValue(q,b))){const next=[...outPicks,pick];if(!tradeLegality(a,b,out,into,cash,next,inPicks).length&&tradeSideAssessment(b,into,out,inPicks,next,cash,options).accepted){suggestedPick=pick;break}}}
 return {...fair,errors:[],suggestedPick,feedback:fair.accepted?'The value works for us. We can agree to this package.':suggestedPick?'We like the core of this deal. Add '+tradePickLabel(suggestedPick)+' and the package works under current rules.':fair.reasons.join(' ')};
}
function addTradeSweetener(){const m=tradeCenterModel(),pick=m.fair.suggestedPick;if(!pick)return toast('No qualifying pick is available.');tcPick('outPicks',tradePickKey(pick));}
function tradeLegality(a,b,out,into,cash=0,outPicks=[],inPicks=[]){if(wnbaEnabled())return wnbaTradeLegality(a,b,out,into,cash,outPicks,inPicks);const errors=[];if(a.id===b.id||expansionPendingSeason(a)||expansionPendingSeason(b))errors.push('Choose two active teams.');if(tradeDeadlinePassed())errors.push('Trade deadline has passed.');if(!Number.isFinite(cash)||cash<0||cash>10||cash>financeFor(a).cash)errors.push('Invalid cash offer.');
 for(const [t,give,get,sendPicks,receivePicks] of [[a,out,into,outPicks,inPicks],[b,into,out,inPicks,outPicks]]){if(new Set(give.map(p=>p.id)).size!==give.length||give.some(p=>!t.roster.some(x=>x.id===p.id)))errors.push('A player is no longer on the sending roster.');for(const p of give){const restriction=tradeRestrictionText(p);if(restriction)errors.push(p.name+': '+restriction+'.');}const outgoing=give.reduce((s,p)=>s+p.salary,0),incoming=get.reduce((s,p)=>s+p.salary,0),pay=ownerPayroll(t)+financeDead(t),after=pay-outgoing+incoming,count=t.roster.length-give.length+get.length;if(count<rosterMinimum()||count>rosterMaximum())errors.push(t.city+' must retain '+rosterMinimum()+'–'+rosterMaximum()+' players.');if(after>financeRosterLimit(t)+1e-6)errors.push(t.city+' exceeds the roster spending limit.');if(leagueRules().salaryCapType!=='none'&&leagueRules().tradeSalaryMatch>0&&after>expansionCap(t)+1e-6&&incoming>outgoing*leagueRules().tradeSalaryMatch/100+.1+1e-6)errors.push(t.city+': incoming salary must fit cap room or '+leagueRules().tradeSalaryMatch+'% of outgoing salary + $0.1M.');
 const available=new Set(tradePicks(t).map(tradePickKey));if(new Set(sendPicks.map(tradePickKey)).size!==sendPicks.length||sendPicks.some(p=>!available.has(tradePickKey(p))))errors.push('A draft pick is unavailable.');
 const remaining=tradePicks(t).filter(p=>!sendPicks.some(x=>tradePickKey(x)===tradePickKey(p))).concat(receivePicks);for(let y=state.year+((state.draft?.picks.length||0)>0?1:0);y<state.year+leagueRules().tradePickSeasons-1;y++)if(!remaining.some(p=>p.round===1&&p.year===y)&&!remaining.some(p=>p.round===1&&p.year===y+1))errors.push(t.city+' must retain a first-round pick in at least one of each two consecutive years.');}
 return [...new Set(errors)]}
function transferTradePicks(a,b,outPicks,inPicks){state.tradePickOwners??=[];for(const [picks,owner] of [[outPicks,b.id],[inPicks,a.id]])for(const p of picks){const key=tradePickKey(p);state.tradePickOwners=state.tradePickOwners.filter(x=>tradePickKey(x)!==key);state.tradePickOwners.push({...p,owner})}}
function tcPick(side,key){const d=currentTradeDraft();d[side]??=[];d[side]=d[side].includes(key)?d[side].filter(x=>x!==key):[...d[side],key];render()}
function selectedTradePicks(side,t){return tradePicks(t).filter(p=>(currentTradeDraft()[side]||[]).includes(tradePickKey(p)))}
function tradePickPanel(t,side){return `<details class="panel note"><summary>${side==='outPicks'?'Send':'Receive'} draft picks</summary>${tradePicks(t).map(p=>`<label style="display:block"><input type="checkbox" ${(currentTradeDraft()[side]||[]).includes(tradePickKey(p))?'checked':''} onchange="tcPick('${side}','${tradePickKey(p)}')"> ${p.year} · Round ${p.round} · ${escapeHTML(state.teams[p.origin].abbr)}</label>`).join('')}</details>`}
const baseTradeOrder=draftOrder;draftOrder=function(d){return baseTradeOrder(d).map((origin,i)=>tradePickOwner({year:d.year,origin,round:Math.floor(i/state.teams.length)+1}))};
const tradePlayBefore=play;play=function(a,b,stage='Regular season'){const result=tradePlayBefore(a,b,stage);for(const id of [a,b])for(const p of state.teams[id].roster)if(p.tradeWait>0)p.tradeWait--;return result};
function readTradePicks(raw,bad,count){if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>10000)bad('invalid traded picks');const seen=new Set();return raw.map(p=>{const key=tradePickKey(p);if(!Number.isInteger(p.year)||p.year<1900||p.year>10009||!Number.isInteger(p.round)||p.round<1||p.round>5||![p.origin,p.owner].every(x=>Number.isInteger(x)&&x>=0&&x<count)||seen.has(key))bad('invalid pick ownership');seen.add(key);return {year:p.year,origin:p.origin,owner:p.owner,round:p.round}})}
function tradePickLabel(p){return p.year+' R'+p.round+' ('+state.teams[p.origin].abbr+')'}
/* Legacy callers also enter the same validated offer flow. */
trade=function(){return finalizeTradeCenter()};
generateGMProposal=function(){if(state.day<1||state.day%7!==0||tradeDeadlinePassed()||!ownerCanManage())return;const box=inboxStore(),key=state.year+':'+state.day;if(box.lastProposal===key)return;box.lastProposal=key;for(const club of state.teams.filter(t=>t.id!==controlledTeamId()).filter(t=>!expansionPendingSeason(t)))for(const incoming of club.roster)for(const outgoing of team().roster){if(tradeLegality(team(),club,[outgoing],[incoming]).length)continue;const ai=tradeSideAssessment(club,[incoming],[outgoing]);if(!ai.accepted)continue;const user=tradeSideAssessment(team(),[outgoing],[incoming]);if(user.received<user.sent*.9)continue;addGMMessage('Trade proposal',gmDisplayName(club)+', '+club.city+' GM','Trade proposal from '+club.city,`Our direction is ${ai.timeline}. We offer ${incoming.name} for ${outgoing.name}. This offer passes current salary, roster and eligibility checks. Review before accepting.`,{club:club.id,out:outgoing.id,into:incoming.id});return}};
// CPU trades. Packages (1-for-1, 2-for-1, 1-for-2, plus pick sweeteners) must pass tradeLegality and
// both clubs' tradeSideAssessment. Contender–rebuilder pairs are tried first; activity rises before the deadline.
const AI_TRADE_COOLDOWN_DAYS=21,AI_TRADE_DEADLINE_COOLDOWN_DAYS=7;
function aiTradeDeadlineWindow(){const left=seasonMilestones().deadline-state.day;return left>=0&&left<=21}
// Cooldown is derived from saved trade locks: received players carry tradeLockedUntil = trade day + TRADE_LOCK_DAYS.
function aiTradeCoolingDown(t){const days=aiTradeDeadlineWindow()?AI_TRADE_DEADLINE_COOLDOWN_DAYS:AI_TRADE_COOLDOWN_DAYS;return t.roster.some(p=>p.tradeLockedUntil!==undefined&&p.tradeLockedUntil-TRADE_LOCK_DAYS>medicalStamp()-days)}
function aiTradePairs(clubs,limit){const kind=new Map(clubs.map(t=>[t.id,tradeTimeline(t)])),rank=(a,b)=>{const k=[kind.get(a.id),kind.get(b.id)].sort().join('|');return k==='Contender|Rebuilding'?0:k.includes('Contender')||k.includes('Rebuilding')?1:2};
 const pairs=[];for(let i=0;i<clubs.length;i++)for(let j=i+1;j<clubs.length;j++)pairs.push({a:clubs[i],b:clubs[j],tier:rank(clubs[i],clubs[j]),r:Math.random()});
 return pairs.sort((x,y)=>x.tier-y.tier||x.r-y.r).slice(0,limit).map(({a,b})=>Math.random()<.5?[a,b]:[b,a])}
function aiTradeCandidates(from,to,count){return from.roster.filter(p=>!tradeRestrictionText(p)).map(p=>({p,gain:tradePlayerValue(p,to)-tradePlayerValue(p,from)+dissatisfactionTradePriority(p)*.5})).sort((x,y)=>y.gain-x.gain||x.p.id-y.p.id).slice(0,count).map(x=>x.p)}
function aiTradeEvaluate(a,b,out,into,outPicks=[],inPicks=[]){const sa=tradeSideAssessment(a,out,into,outPicks,inPicks,0,{human:false});if(!sa.accepted)return null;const sb=tradeSideAssessment(b,into,out,inPicks,outPicks,0,{human:false});if(!sb.accepted)return {short:sb};if(tradeLegality(a,b,out,into,0,outPicks,inPicks).length)return null;return {out,into,outPicks,inPicks,surplus:Math.min(sa.received/Math.max(.01,sa.sent),sb.received/Math.max(.01,sb.sent))}}
function aiTradeBest(a,b){
 const gives=aiTradeCandidates(a,b,6),gets=aiTradeCandidates(b,a,5),packages=[],value=new Map();
 // Cheap pre-filter with per-club values computed once; full assessments and legality run only on plausible packages.
 for(const p of [...gives,...gets])value.set(p.id,[tradePlayerValue(p,a),tradePlayerValue(p,b)]);
 const plausible=(out,into)=>{const sum=(list,i)=>list.reduce((n,p)=>n+value.get(p.id)[i],0),aGets=sum(into,0),aGives=sum(out,0),bGets=sum(out,1),bGives=sum(into,1);return aGets>=aGives*.9&&bGets>=bGives*.6};
 for(const q of gets){for(const p of gives)packages.push([[p],[q]]);for(let i=0;i<gives.length;i++)for(let j=i+1;j<gives.length;j++)packages.push([[gives[i],gives[j]],[q]])}
 for(const p of gives)for(let i=0;i<gets.length;i++)for(let j=i+1;j<gets.length;j++)packages.push([[p],[gets[i],gets[j]]]);
 const ranked=tradePicks(a).sort((x,y)=>tradePickValue(x,b)-tradePickValue(y,b)),sweeteners=[...new Set([...ranked.slice(0,3),ranked.find(p=>p.round===1)].filter(Boolean))];let best=null;
 for(const [out,into] of packages){if(!plausible(out,into))continue;let r=aiTradeEvaluate(a,b,out,into);
  // A package close to fair for the other club may be completed with the cheapest qualifying pick.
  if(r&&!r.out&&r.short&&r.short.received>=r.short.sent*.7)for(const pick of sweeteners){r=aiTradeEvaluate(a,b,out,into,[pick]);if(r?.out)break}
  if(r?.out&&(!best||r.surplus>best.surplus))best=r}
 return best}
function aiTradeExecute(a,b,d){if(typeof contractTrack==='function')contractTrack();
 a.roster=a.roster.filter(p=>!d.out.includes(p)).concat(d.into);b.roster=b.roster.filter(p=>!d.into.includes(p)).concat(d.out);
 for(const x of [...d.out,...d.into]){resetPlayerSituation(x);x.moraleAdjustment=-6;lockTradedPlayer(x)}
 transferTradePicks(a,b,d.outPicks,d.inPicks);for(const t of [a,b]){if(t.rotationPlan)t.rotationPlan=rotationFromClub(t);updateCapSpace(t)}
 if(typeof contractTrack==='function')contractTrack();
 say('Trade completed: '+gmLead(a)+' acquires '+[...d.into.map(p=>p.name),...d.inPicks.map(tradePickLabel)].join(', ')+' from '+b.city+' (GM '+gmDisplayName(b)+') in exchange for '+[...d.out.map(p=>p.name),...d.outPicks.map(tradePickLabel)].join(', ')+'.')}
function runAITradeRound(){const key=state.year+':'+state.day,deadline=aiTradeDeadlineWindow();if(state.day<1||tradeDeadlinePassed()||state.tradeAILast===key||state.day%(deadline?3:7)!==0)return;state.tradeAILast=key;
 const clubs=state.teams.filter(t=>t.id!==controlledTeamId()&&!expansionPendingSeason(t)&&!aiTradeCoolingDown(t)),cap=deadline?3:state.day<30?1:2,traded=new Set();let made=0;
 for(const [a,b] of aiTradePairs(clubs,deadline?24:14)){if(made>=cap)break;if(traded.has(a.id)||traded.has(b.id))continue;const d=aiTradeBest(a,b);if(!d)continue;aiTradeExecute(a,b,d);traded.add(a.id);traded.add(b.id);made++}}
const tradeOwnerDayBefore=ownerDay;ownerDay=function(...args){const r=tradeOwnerDayBefore(...args);runAITradeRound();return r};
