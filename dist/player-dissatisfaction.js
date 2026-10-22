/* Career-local behavioral decisions. Financial/movement legality remains in its existing engines. */
const DISSATISFACTION_RULES=Object.freeze({reviewGames:8,minLowGames:12,publicLowGames:24,recoveryGames:6,cooldownDays:90,arrivalGames:8,requestBase:.008,requestCap:.06});
function dissatisfactionStamp(){return medicalStamp();}
function dissatisfactionTeam(t){return t?String(t.key??t.id):null;}
function dissatisfactionRecord(p,t){
 if(p.dissatisfaction)return p.dissatisfaction;
 const stamp=dissatisfactionStamp();
 const d=p.dissatisfaction={version:1,teamKey:dissatisfactionTeam(t),games:0,lowGames:0,totalLowGames:0,recovery:0,lastReview:0,lastGame:null,lowSince:null,lastScore:null,delta:0,causes:[],response:'professional',intent:'open',cooldownUntil:stamp,arrivalUntil:0,randomState:(Math.imul(p.id+1,2654435761)^state.year)>>>0,nextRequest:1,active:null,history:[],attempts:[],promise:null,contractThrough:p.contractThrough??null};
 if(p.tradeDemand)d.active={id:d.nextRequest++,visibility:'public',stamp,year:state.year,day:state.day,reason:'Existing saved trade request; original date unavailable',lowGames:0,lowDays:0,denied:false,legacy:true};
 return d;
}
function dissatisfactionRandom(d){d.randomState=(Math.imul(d.randomState,1664525)+1013904223)>>>0;return d.randomState/4294967296;}
function dissatisfactionHistory(d,type,detail={}){d.history.push({type,stamp:dissatisfactionStamp(),year:state.year,day:state.day,...detail});d.history=d.history.slice(-40);}
function dissatisfactionNotify(p,t,text,publicEvent=false){if(publicEvent)say(text);else if(t?.id===controlledTeamId())addGMMessage('Morale','Player relations',p.name,text);}
function dissatisfactionYears(p){return Math.max(1,(p.contractThrough??state.year)-state.year+1);}
function dissatisfactionCauses(p,t,d){
 const expected=expectedPlayerRole(p)[1]*gameMinutes()/48,actual=performanceMood(p)?.recent?.length?performanceMood(p).recent.reduce((n,r)=>n+r.mp,0)/performanceMood(p).recent.length:playerMinutes(p,t),causes=[];
 if(!injuryDays(p)&&actual<expected*.7)causes.push('role');
 if(t.w+t.l>=10&&t.w/(t.w+t.l)<.4&&personality(p).ambition>=55)causes.push('team direction');
 if(d.promise&&d.promise.teamKey===d.teamKey&&d.games>=8&&!injuryDays(p)&&actual<d.promise.minutes*.7)causes.push('unmet playing-time commitment');
 if(t.id===controlledTeamId()&&(state.decisions?.agentTrust??50)<25)causes.push('management trust');
 if(moraleDetails(p,t).reasons.some(s=>s.includes('underpaid')))causes.push('compensation');
 return causes;
}
function dissatisfactionProbabilities(p,t,d,score){
 const r=DISSATISFACTION_RULES,traits=personality(p),severity=Math.max(.2,Math.min(1.5,(45-score)/30)),duration=Math.min(2,.6+d.lowGames/32),loyalty=1-traits.loyalty/150,professional=hasTrait(p,'professional')?.45:1,years=dissatisfactionYears(p),circumstances=Math.min(2.4,.65+d.causes.length*.4),star=p.ovr>=85?1.4:1;
 const impatience=hasTrait(p,'diva')?1.35:hasTrait(p,'fiery')?1.1:1,career=p.age>=27&&p.age<=34&&traits.ambition>=65?1.15:1,scale=state.dissatisfactionSettings?.requestScale??1;
 const request=d.lowGames<r.minLowGames||!d.causes.length||d.games<d.arrivalUntil||dissatisfactionStamp()<d.cooldownUntil?0:Math.min(r.requestCap,r.requestBase*severity*duration*loyalty*professional*circumstances*star*impatience*career*(years===1?.22:years>=3?1.5:1)*scale/(1+d.history.filter(e=>e.type==='request').length*.15));
 const intent=d.lowGames<r.minLowGames?0:Math.min(.3,.10*severity*(years===1?1.7:.7)*(1-traits.loyalty/160)*(hasTrait(p,'mercenary')&&d.causes.includes('compensation')?1.3:1));
 return {request,intent,public:hasTrait(p,'professional')?.03:hasTrait(p,'loyal')?.06:hasTrait(p,'diva')?.20:.12};
}
function dissatisfactionRequest(p,t,d,visibility){
 if(d.active)return;
 const stamp=dissatisfactionStamp(),reason=d.causes.join(', ')||'sustained dissatisfaction';
 d.active={id:d.nextRequest++,visibility,stamp,year:state.year,day:state.day,reason,lowGames:d.lowGames,lowDays:Math.max(0,stamp-(d.lowSince??stamp)),denied:false,legacy:false};p.tradeDemand=true;
 dissatisfactionHistory(d,'request',{...d.active});
 dissatisfactionNotify(p,t,visibility==='public'?p.name+' formally requests a trade from '+t.city+'.':p.name+' has privately asked management to explore a change of scenery. Reason: '+reason+'. No public announcement has been made.',visibility==='public');
}
function dissatisfactionResolve(p,t,reason){const d=p.dissatisfaction;if(!d)return;if(d.active){const a=d.active;dissatisfactionHistory(d,'resolved',{id:a.id,visibility:a.visibility,reason});if(reason==='improved circumstances')dissatisfactionNotify(p,t,p.name+' withdraws the trade request after circumstances improve.',a.visibility==='public');}d.active=null;p.tradeDemand=false;d.cooldownUntil=dissatisfactionStamp()+DISSATISFACTION_RULES.cooldownDays;}
function dissatisfactionAfterGame(p,t,score){
 const d=dissatisfactionRecord(p,t),stamp=dissatisfactionStamp(),g=state.history[0],key=state.year+':'+(g?.day??state.day)+':'+(g?.stage??'game')+':'+t.id+':'+(t.w+t.l);
 if(d.lastGame===key)return;d.lastGame=key;
 if(d.teamKey!==dissatisfactionTeam(t)){dissatisfactionResolve(p,t,'team change');d.teamKey=dissatisfactionTeam(t);d.lowGames=0;d.lowSince=null;d.intent='open';d.response='professional';d.promise=null;d.arrivalUntil=d.games+DISSATISFACTION_RULES.arrivalGames;}
 d.games++;d.delta=d.lastScore===null?0:score-d.lastScore;d.lastScore=score;d.causes=dissatisfactionCauses(p,t,d);
 if(score<40){d.lowGames++;d.totalLowGames++;d.lowSince??=stamp;d.recovery=0;}else {d.lowGames=0;if(score>=60)d.recovery++;else d.recovery=0;}
 p.lowMoraleGames=d.lowGames;
 if(d.recovery>=DISSATISFACTION_RULES.recoveryGames){if(d.active)dissatisfactionResolve(p,t,'improved circumstances');if(d.intent!=='open')dissatisfactionHistory(d,'intent',{intent:'open',reason:'sustained recovery'});d.intent='open';d.response='professional';d.lowSince=null;}
 if(d.games-d.lastReview<DISSATISFACTION_RULES.reviewGames)return;d.lastReview=d.games;
 if(score>=40)return;
 const chance=dissatisfactionProbabilities(p,t,d,score),random=()=>dissatisfactionRandom(d);
 if(!d.active&&random()<chance.request){const visibility=d.lowGames>=DISSATISFACTION_RULES.publicLowGames&&d.causes.length>=2&&random()<chance.public?'public':'private';dissatisfactionRequest(p,t,d,visibility);}
 else if(d.active?.visibility==='private'&&d.lowGames>=32&&d.causes.length>=2&&stamp-d.active.stamp>=30&&random()<chance.request*.12){d.active.visibility='public';dissatisfactionHistory(d,'publicized',{id:d.active.id});dissatisfactionNotify(p,t,p.name+' makes the previously private trade request public in '+t.city+'.',true);}
 if(d.intent==='open'&&random()<chance.intent){d.intent=dissatisfactionYears(p)===1?'explore':'decline_extension';dissatisfactionHistory(d,'intent',{intent:d.intent});dissatisfactionNotify(p,t,p.name+(d.intent==='explore'?' intends to finish the contract and assess permitted options afterward.':' is not ready to discuss an extension. The current contract remains in force.'));}
 if(d.response==='professional'&&d.lowGames>=8&&d.causes.includes('role')&&random()<.12){d.response='frustrated';dissatisfactionHistory(d,'frustration',{reason:'role'});dissatisfactionNotify(p,t,p.name+' has raised concerns about playing time.'+(d.active?' No new trade request was made.':' This is not a trade request.'));}
 if(t.id!==controlledTeamId()||simulationAutopilot()){const response=d.active?(p.ovr>=85&&tradeTimeline(t)==='Contender'?'retain':'explore_trade'):d.intent==='explore'?'prepare_for_expiration':'wait';if(d.attempts.at(-1)?.kind!==response){d.attempts.push({kind:response,stamp,year:state.year,day:state.day});d.attempts=d.attempts.slice(-20);}}
}
function dissatisfactionTradePriority(p){return p.dissatisfaction?.active?(p.ovr>=85?1:3):p.dissatisfaction?.intent==='explore'?1:0;}
function dissatisfactionOutlook(p){const intent=p.dissatisfaction?.intent||'open';if(intent==='decline_extension')return 'Unwilling to extend';if(intent==='open')return 'Open to discussions';if(wnbaEnabled()&&wnbaRules().year<1999||state.leagueSettings?.historicalSource==='nba'&&state.year<1988)return 'Considering permitted post-contract options';if(faEntry(p.id)?.rfa||p.wnbaRights?.qualifyingOfferYear===state.year+1)return 'Considering offers · subject to retained rights';return 'Considering free agency · eligibility rules apply';}
// One willingness answer is used by existing extension dialogs and contract dossier.
negotiationStatus=function(p){const ctx=playerContext(p.id),score=moraleDetails(p,ctx?.club).score,d=p.dissatisfaction,refuses=!!ctx?.club&&d?.teamKey===dissatisfactionTeam(ctx.club)&&['explore','decline_extension'].includes(d.intent),trust=ctx?.own?(state.decisions?.agentTrust??50):50;return {score,refuses,reason:refuses?'Player prefers to finish the current contract and is declining extension discussions.':'',premium:Math.max(hasTrait(p,'mercenary')?.20:-.05,(score>=85?-.03:score<40?.15:score<60?.08:.03)+(50-trust)*.001-(hasTrait(p,'loyal')?.05:0)-(ctx?.club?coachDiscount(ctx.club):0))};};
const dissatisfactionInterestBefore=faInterest;
faInterest=function(p,t,o){const out=dissatisfactionInterestBefore(p,t,o),e=faEntry(p.id),d=p.dissatisfaction;if(e?.former!==t.id||!d||d.teamKey!==dissatisfactionTeam(t))return out;
 if(d.intent!=='open'){const concession=o.salary>=e.demand*1.25&&o.minutes<=out.realistic&&o.minutes>=(d.promise?.minutes??expectedPlayerRole(p)[1]*gameMinutes()/48);out.score=concession?out.score:Math.min(59,out.score-20);out.feedback=concession?'Improved financial security and a credible role may change the player’s mind':'Prefers to explore other permitted offers; current former-team offer declined';}return out;};
const dissatisfactionInSeasonBefore=inSeasonOfferError;
inSeasonOfferError=function(p,salary,years){const error=dissatisfactionInSeasonBefore(p,salary,years);if(error)return error;const d=p?.dissatisfaction;if(d&&d.teamKey===dissatisfactionTeam(team())&&d.intent!=='open'&&salary<freeAgentQuote(p)*1.25)return p.name+' prefers to explore other teams. A materially improved offer may change that decision.';return '';};
function dissatisfactionSigned(p,t,minutes=null){const d=p.dissatisfaction;if(!d)return;dissatisfactionResolve(p,t,'new agreement');dissatisfactionHistory(d,'agreement',{teamKey:dissatisfactionTeam(t)});d.teamKey=dissatisfactionTeam(t);d.intent='open';d.response='professional';d.lowGames=0;d.lowSince=null;d.recovery=0;d.arrivalUntil=d.games+8;d.contractThrough=p.contractThrough??null;if(minutes!==null)d.promise={minutes,teamKey:d.teamKey};}
const dissatisfactionSignBefore=faSign;
faSign=function(p,o){const ok=dissatisfactionSignBefore(p,o);if(ok){dissatisfactionRecord(p,state.teams[o.team]);dissatisfactionSigned(p,state.teams[o.team],o.minutes);}return ok;};
const dissatisfactionResetBefore=resetPlayerSituation;
resetPlayerSituation=function(p){const d=p.dissatisfaction,club=playerContext(p.id)?.club;if(d){dissatisfactionResolve(p,club,'team change');d.teamKey=dissatisfactionTeam(club);d.intent='open';d.lowGames=0;d.lowSince=null;d.promise=null;d.arrivalUntil=d.games+8;d.contractThrough=p.contractThrough??null;}return dissatisfactionResetBefore(p);};
// Resolve an accepted extension before the same save commits it, never change its money/term.
const dissatisfactionSaveBefore=save;
save=async function(...args){const changed=[];for(const t of state.teams)for(const p of t.roster){const d=p.dissatisfaction;if(d&&d.teamKey===dissatisfactionTeam(t)&&d.contractThrough!==null&&p.contractThrough>d.contractThrough){changed.push({p,d:copy(d),tradeDemand:p.tradeDemand});dissatisfactionSigned(p,t);}}
 const rollback=()=>changed.forEach(({p,d,tradeDemand})=>{p.dissatisfaction=d;p.tradeDemand=tradeDemand;});try{const result=await dissatisfactionSaveBefore(...args);if(result===false)rollback();return result;}catch(error){rollback();throw error;}};
const dissatisfactionDirectSignBefore=sign;
sign=function(id){const p=state.free.find(p=>p.id===id),d=p?.dissatisfaction;if(!faActive()&&d&&d.teamKey===dissatisfactionTeam(team())&&d.intent!=='open')return negotiateFreeAgent(id);return dissatisfactionDirectSignBefore(id);};
async function dissatisfactionDeny(id){const c=playerContext(id);if(!c?.own||!c.p.dissatisfaction?.active||!ownerCanManage())return;const before=copy(state),d=c.p.dissatisfaction;d.active.denied=true;d.attempts.push({kind:'request_declined',stamp:dissatisfactionStamp(),year:state.year,day:state.day});d.attempts=d.attempts.slice(-20);if(await save()===false){state=before;return;}profile(id);}
function dissatisfactionProfile(ctx){const d=ctx.p.dissatisfaction,legacy=!!ctx.p.tradeDemand&&!d,visible=ctx.own||d?.active?.visibility==='public',request=legacy?'Existing public request':visible&&d?.active?d.active.visibility==='private'?'Private request':'Public request':'None publicly known';return playerCard('SATISFACTION & CONTRACT INTENT',`<p>Morale: <strong>${moraleDetails(ctx.p,ctx.club).score}/100</strong> · ${d?.response==='frustrated'?'Role concerns expressed':'Continuing professional duties'}</p><p>Contract outlook: ${ctx.own?dissatisfactionOutlook(ctx.p):'Private discussions'}</p><p>Trade request: ${!d?.active&&!legacy&&ctx.own?'None':request}${visible&&d?.active?.denied?' · Management declined':''}</p>${ctx.own&&d?'<p>'+d.lowGames+' consecutive games below 40 · '+d.totalLowGames+' recorded low-morale games.</p>':''}${ctx.own&&d?.active?'<p>'+escapeHTML(d.active.reason)+'</p><button onclick="dissatisfactionDeny('+ctx.p.id+')" '+(d.active.denied?'disabled':'')+'>Decline request; retain player</button>':''}<p class="muted">Intentions do not cancel contracts, guarantee a move or bypass league eligibility rules.</p>`);}
const dissatisfactionProfileBefore=moraleProfile;
moraleProfile=function(ctx){return dissatisfactionProfileBefore(ctx)+dissatisfactionProfile(ctx);};
function readDissatisfaction(raw){if(raw===undefined)return undefined;const int=(x,min=0,max=1e9)=>Number.isInteger(x)&&x>=min&&x<=max,str=(x,n=200)=>typeof x==='string'&&x.length<=n;
 if(!raw||raw.version!==1||raw.teamKey!==null&&!str(raw.teamKey)||!['professional','frustrated'].includes(raw.response)||!['open','explore','decline_extension'].includes(raw.intent)||!int(raw.randomState,0,4294967295)||!int(raw.nextRequest,1)||!['games','lowGames','totalLowGames','recovery','lastReview','arrivalUntil'].every(k=>int(raw[k]))||!int(raw.cooldownUntil,-1e8,1e8)||raw.lowSince!==null&&!int(raw.lowSince,-1e8,1e8)||raw.lastScore!==null&&!int(raw.lastScore,0,100)||!Number.isFinite(raw.delta)||Math.abs(raw.delta)>100||raw.lastGame!==null&&!str(raw.lastGame)||!Array.isArray(raw.causes)||raw.causes.length>10||raw.causes.some(x=>!str(x))||raw.contractThrough!==null&&!int(raw.contractThrough,1900,10000))throw Error('Invalid dissatisfaction state.');
 for(const [key,max] of [['history',40],['attempts',20]])if(!Array.isArray(raw[key])||raw[key].length>max||raw[key].some(e=>!e||!str(e.type??e.kind,40)||!int(e.stamp,-1e8,1e8)||!int(e.year,1900,10000)||!int(e.day,0,366)||JSON.stringify(e).length>1500))throw Error('Invalid dissatisfaction history.');
 const a=raw.active;if(a!==null&&(!a||!int(a.id,1)||a.id>=raw.nextRequest||!['private','public'].includes(a.visibility)||!int(a.stamp,-1e8,1e8)||!int(a.year,1900,10000)||!int(a.day,0,366)||!str(a.reason,500)||!int(a.lowGames)||!int(a.lowDays)||typeof a.denied!=='boolean'||typeof a.legacy!=='boolean'))throw Error('Invalid trade request.');
 if(raw.promise!==null&&(!raw.promise||!Number.isFinite(raw.promise.minutes)||raw.promise.minutes<0||raw.promise.minutes>60||!str(raw.promise.teamKey)))throw Error('Invalid role commitment.');return copy(raw);
}
const dissatisfactionValidateBefore=validateCareerData;
validateCareerData=function(raw){const s=dissatisfactionValidateBefore(raw),original=new Map(familyPlayers(raw).map(p=>[p.id,p]));for(const p of familyPlayers(s)){const d=readDissatisfaction(original.get(p.id)?.dissatisfaction);if(d){p.dissatisfaction=d;p.tradeDemand=!!d.active;}}
 if(raw.dissatisfactionSettings!==undefined){const x=raw.dissatisfactionSettings;if(!x||![.5,1,1.5].includes(x.requestScale))throw Error('Invalid dissatisfaction settings.');s.dissatisfactionSettings={requestScale:x.requestScale};}return s;};
