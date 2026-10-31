/* Contract dossier v1. USD records observe the existing transaction engine; they
 * never replace WNBA annual schedules or silently reconstruct missing history. */
const CONTRACT_BOOK_VERSION=1;
function contractUSD(v){return Number.isFinite(v)?Math.round(v*1e6):0;}
function contractCash(v){return v===null||v===undefined?'Unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(v);}
function contractSeason(y){return seasonLabel(y);}
function contractRows(p,club,year=state.year){
 if(!club)return [];
 if(wnbaEnabled()&&p.wnbaContract)return p.wnbaContract.annual.map(a=>({...a,cap:wnbaCapCharge(p,a,a.year),optionType:a.option?'team':null}));
 // Legacy NBA salaries are explicitly flat in the engine. Only remaining years
 // can be recovered; neither original term nor original signing date is inferred.
 const end=Number.isInteger(p.contractThrough)?p.contractThrough:year;
 const recorded=state.contractBook?.people[p.id]?.records.find(r=>r.status==='active');
 if(recorded?.annual.length&&Math.max(...recorded.annual.map(a=>a.year))===end&&recorded.annual.filter(a=>a.year>=year).every(a=>a.base===contractUSD(p.salary)))return copy(recorded.annual);
 return Array.from({length:Math.max(0,end-year+1)},(_,i)=>({year:year+i,base:contractUSD(p.salary),cap:contractUSD(p.salary),guaranteed:null,option:null}));
}
function contractBook(s=state){return s.contractBook??={version:1,startedYear:s.year,startedDay:s.day,people:{}};}
function contractSignature(rows){return JSON.stringify(rows.map(a=>[a.year,a.base,a.guaranteed,a.option,a.bonus||0]));}
function contractTrack(s=state){
 if(!s?.teams)return;
 const book=contractBook(s),seen=new Set();
 for(const t of s.teams)for(const p of t.roster){
  const key=String(p.id),rows=contractRows(p,t),c=p.wnbaContract;
  seen.add(key);
  const person=book.people[key]??={id:p.id,name:p.name,pos:p.pos,age:p.age,ovr:p.ovr,pot:p.pot,records:[],earnings:[],lastYear:s.year,lastDay:s.day,team:t.key||String(t.id)};
  person.name=p.name;person.age=p.age;person.ovr=p.ovr;person.pot=p.pot;
  let record=person.records.find(r=>r.status==='active');
  if(!record){
   const known=person.status==='free';
   record={id:key+':'+person.records.length,observedYear:s.year,observedDay:s.day,signedYear:c?.signedYear??(known?s.year:null),signingTeam:known?t.city+' '+t.name:null,signingTeamKey:known?(t.key||String(t.id)):null,startYear:c?.startYear??(known?rows[0]?.year:null),originalYears:c?(c.extensionStart?c.extensionStart-c.startYear:c.annual.length):(known?rows.length:null),kind:c?.kind??'standard',evidence:c?.evidence??(known?'recorded simulation signing':'legacy flat salary; original terms unavailable'),annual:copy(rows),status:'active',events:[]};
   if(known&&!c)record.annual=record.annual.map(a=>({...a,guaranteed:a.base}));
   person.records.push(record);
  }else{
   const oldFuture=record.annual.filter(a=>a.year>=s.year);
   if(contractSignature(oldFuture)!==contractSignature(rows.filter(a=>a.year>=s.year))){
    const oldEnd=Math.max(...record.annual.map(a=>a.year));
    record.events.push({type:Math.max(...rows.map(a=>a.year))>oldEnd?'extension':'amendment / option / rule adjustment',year:s.year,day:s.day,previousAnnual:copy(record.annual)});
    record.annual=[...record.annual.filter(a=>a.year<s.year),...copy(rows.filter(a=>a.year>=s.year))];
   }
   if(person.team!==(t.key||String(t.id)))record.events.push({type:'trade / team transfer',year:s.year,day:s.day,from:person.team,to:t.key||String(t.id)});
  }
  person.team=t.key||String(t.id);person.teamName=t.city+' '+t.name;person.status='rostered';
 }
 for(const p of s.free||[]){const key=String(p.id);seen.add(key);const person=book.people[key]??={id:p.id,name:p.name,pos:p.pos,age:p.age,ovr:p.ovr,pot:p.pot,records:[],earnings:[],lastYear:s.year,lastDay:s.day};const r=person.records.find(r=>r.status==='active');if(r){r.status=Math.max(...r.annual.filter(a=>a.option!=='declined'&&a.option!=='pending').map(a=>a.year))<=s.year&&s.day>=s.schedule.length?'expired / free agency':'released';r.events.push({type:r.status,year:s.year,day:s.day});}person.status='free';}
 for(const [key,p] of Object.entries(book.people))if(!seen.has(key)&&p.status!=='inactive'){p.status='inactive';const r=p.records.find(r=>r.status==='active');if(r){r.status='inactive / retired';r.events.push({type:'left active player pool',year:s.year,day:s.day});}}
 return book;
}
function contractAccrue(){
 const book=contractTrack();
 for(const t of state.teams)for(const p of t.roster){const person=book.people[p.id],y=state.year,end=Math.min(state.day,state.schedule.length),start=person.lastYear===y?Math.min(person.lastDay,end):0;
  if(end>start){const a=contractRows(p,t).find(a=>a.year===y&&a.option!=='pending'&&a.option!=='declined');if(a){let row=person.earnings.find(e=>e.year===y&&e.team===(t.key||String(t.id)));if(!row){row={year:y,team:t.key||String(t.id),amount:0};person.earnings.push(row);}row.amount+=a.base*(end-start)/Math.max(1,state.schedule.length);}}
  person.lastYear=y;person.lastDay=end;
 }
}
function contractEnvironment(p,t,year=state.year){
 if(wnbaEnabled()){const r=wnbaRules(year);return {league:'WNBA',year:r.year,min:wnbaMinimum(p,year),max:wnbaMaximum(p,t,year),cap:r.cap,maxYears:wnbaTermLimit(p,t,year),note:r.gaps.join(' '),sources:r.sources.map(k=>WNBA_FINANCIAL_SOURCES[k]),hard:true};}
 const r=leagueRules();return {league:'NBA / custom',year:r.historicalYear||state.year,min:contractUSD(r.minContract),max:contractUSD(r.maxContract),cap:contractUSD(salaryCap()),maxYears:r.maxContractYears,hard:r.salaryCapType==='hard',note:'Uses the active league settings. NBA service-tier maxima, aprons, designated-player eligibility and detailed historical CBA exceptions are not fully modeled. Historical presets remain frozen until manually changed; no modern classification is inferred.',sources:[{url:'https://nbpa.com/cba',location:'NBA collective bargaining agreements · rule reference, not a claim of complete implementation'}]};
}
function contractMarket(p,t=team(),year=state.year){
 const logs=(state.history||[]).filter(g=>g.stage==='Regular season').flatMap(g=>(g.box||[]).filter(b=>b.playerId===p.id&&b.mp>0));
 if(logs.length){const totals={};for(const k of ['pts','reb','ast','stl','blk','tov','fga','fgm','tpm','mp'])totals[k]=logs.reduce((n,b)=>n+(Number(b[k])||0),0);p={...p,...totals,gp:logs.length,min:totals.mp};}
 const env=contractEnvironment(p,t,year),games=Math.max(0,p.gp||0),minutes=Number(p.min??p.minutes??0),mpg=games?minutes/games:0;
 const perGame=k=>games?(Number(p[k])||0)/games:0;
 const production=perGame('pts')*.55+perGame('reb')*.65+perGame('ast')*.9+perGame('stl')*1.8+perGame('blk')*1.4-perGame('tov')*.8;
 const fga=Number(p.fga)||0,eff=fga?Math.max(-.12,Math.min(.12,((Number(p.fgm)||0)+.5*(Number(p.tpm)||0))/fga-.5)):0;
 const reliability=Math.min(1,games/25),rating=Math.max(0,Math.min(1,((p.ovr||55)-55)/40));
 const productionScore=Math.max(0,Math.min(1,production/27+eff));
 const ageFactor=p.age<27?1+Math.min(.12,Math.max(0,(p.pot-p.ovr)/120)):p.age>32?Math.max(.75,1-(p.age-32)*.025):1;
 const injuryFactor=1-Math.min(.18,Math.max(0,injuryDays(p))/180);
 const roster=state.teams.flatMap(c=>c.roster),same=roster.filter(q=>q.id!==p.id&&q.pos===p.pos&&Math.abs(q.ovr-p.ovr)<=4&&Math.abs(q.age-p.age)<=4);
 const demand=1+Math.max(-.04,Math.min(.06,(1-roster.filter(q=>q.pos===p.pos).length/Math.max(1,roster.length/5))*.1));
 let quality=(rating*(1-.35*reliability)+productionScore*.35*reliability)*ageFactor*injuryFactor*demand;
 if(mpg>0&&mpg<10)quality*=.95;
 // NBA technical ceilings in pre-maximum eras are not market salaries.
 const marketTop=wnbaEnabled()?env.max:Math.max(env.min,Math.min(env.max,env.cap*.35));
 let value=env.min+(marketTop-env.min)*Math.pow(Math.max(0,Math.min(1,quality)),wnbaEnabled()?1.7:3.5);
 const comps=same.map(q=>contractUSD(q.salary)).filter(v=>v>=env.min&&v<=env.max).sort((a,b)=>a-b);
 if(comps.length>=3)value=.85*value+.15*comps[Math.floor(comps.length/2)];
 value=Math.round(Math.max(env.min,Math.min(env.max,value)));
 const salary=contractUSD(p.salary),diff=value-salary,percent=salary?diff/salary*100:null;
 return {value,salary,diff,percent,comparables:comps.length,classification:percent===null?'Unpriced':percent>=35?'Bargain':percent>=12?'Good Value':percent>=-12?'Fair Value':percent>=-35?'Overpaid':'Severely Overpaid'};
}
function contractProjection(t,year){
 if(wnbaEnabled()){const l=wnbaLedger(t,year),r=wnbaRules(year);return {...l,label:state.wnbaFinance.progression===false?'Frozen financial environment':year>2026?'Estimated: 2026 fallback':r.capEvidence==='simulation_estimate'?'Estimated simulation budget':'Registry cap'};}
 const r=leagueRules(),cap=contractUSD(salaryCap()*Math.pow(1+r.capInflation/100,year-state.year));
 const active=t.roster.reduce((n,p)=>n+((p.contractThrough??state.year)>=year?contractUSD(p.salary):0),0),dead=(state.finances?.[t.id]?.dead||[]).filter(d=>d.through>=year).reduce((n,d)=>n+contractUSD(d.salary),0);
 return {total:active+dead,active,dead,cap,room:cap-active-dead,guaranteed:null,label:year===state.year?'Active league cap':'Estimate: configured average inflation'};
}
function contractExtension(ctx){
 const {p,club,own}=ctx;
 if(!club)return {reason:'No active team contract.'};
 if(!own)return {reason:'Only the controlling team may negotiate this contract.'};
 const status=negotiationStatus(p);if(status.refuses)return {reason:status.reason||'Player is declining extension discussions.',interest:'Low'};
 if(wnbaEnabled()){const error=wnbaExtensionError(p,1);if(error)return {reason:error,interest:status.score>=70?'High':'Moderate'};}
 const years=wnbaEnabled()?[1,2,3].filter(n=>!wnbaExtensionError(p,n)):contractTerms().filter(n=>state.year+n>Math.max(state.year,p.contractThrough||state.year));
 if(!years.length)return {reason:'Restricted by league term limits.'};
 const quote=extensionQuote(p),env=contractEnvironment(p,club),interest=status.score>=70?'High':status.score>=45?'Moderate':'Low';
 return {reason:'',years,quote:contractUSD(quote),interest,max:env.max,affordable:wnbaEnabled()?wnbaLedger(club,(p.contractThrough??state.year)+1).room>=contractUSD(quote):ownerPayroll(club)-p.salary+quote<=financeRosterLimit(club)};
}
function contractTable(headers,rows,label){return '<div class="contract-scroll" tabindex="0" role="region" aria-label="'+escapeHTML(label)+'"><table><thead><tr>'+headers.map(h=>'<th scope="col">'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';}
function contractMetric(label,value){return '<div><dt>'+label+'</dt><dd>'+value+'</dd></div>';}
function contractChart(rows){if(rows.length<2)return '';const max=Math.max(1,...rows.map(a=>a.base));return '<div class="contract-bars" role="img" aria-label="Annual base salary progression">'+rows.map(a=>'<div title="'+a.year+': '+contractCash(a.base)+'"><span>'+a.year+'</span><i style="width:'+Math.max(1,a.base/max*100)+'%"></i><b>'+contractCash(a.base)+'</b></div>').join('')+'</div>';}
function contractWaiver(p,t){if(wnbaEnabled()){const elapsed=Math.min(1,state.day/Math.max(1,state.schedule.length)),rows=contractRows(p,t).filter(a=>a.year>=state.year&&a.option!=='pending'&&a.option!=='declined'),dead=rows.map(a=>({year:a.year,amount:Math.max(a.guaranteed||0,a.year===state.year?Math.ceil(a.base*elapsed):0,a.year===state.year&&elapsed>=.5?a.base:0)}));return {dead:dead.reduce((n,a)=>n+a.amount,0),saving:(wnbaAnnual(p,state.year)?wnbaCapCharge(p,wnbaAnnual(p,state.year),state.year):0)-(dead.find(a=>a.year===state.year)?.amount||0)};}return {dead:contractUSD(p.salary)*Math.max(1,(p.contractThrough??state.year)-state.year+1),saving:0};}
function contractHistoryMarkup(p){const person=state.contractBook?.people[p.id];if(!person)return '<p>No financial history recorded.</p>';const earned=person.earnings.reduce((n,e)=>n+e.amount,0);return '<p><strong>Recorded earnings: '+contractCash(Math.round(earned))+'</strong></p><p class="muted">Tracking began '+state.contractBook.startedYear+', day '+state.contractBook.startedDay+'. Earlier earnings are unavailable. Active salary accrues by regular-season calendar day; bonuses, off-roster settlements and unmodeled payouts are excluded.</p>'+contractTable(['Signed','Signing team','Type / status','Recorded years','Scheduled value'],person.records.map(r=>'<tr><td>'+(r.signedYear??'Unavailable')+'</td><td>'+escapeHTML(r.signingTeam||'Unavailable')+'</td><td>'+escapeHTML(r.kind+' · '+r.status)+'</td><td>'+r.annual.length+'</td><td>'+contractCash(r.annual.filter(a=>a.option!=='declined').reduce((n,a)=>n+a.base,0))+'</td></tr>'),'Contract history')+person.records.map(r=>'<details><summary>'+escapeHTML(r.kind)+' · '+escapeHTML(r.evidence)+'</summary>'+contractTable(['Season','Base','Guarantee','Option'],r.annual.map(a=>'<tr><td>'+a.year+'</td><td>'+contractCash(a.base)+'</td><td>'+contractCash(a.guaranteed)+'</td><td>'+escapeHTML(a.option||'—')+'</td></tr>'),'Recorded agreement schedule')+'<p>'+r.events.map(e=>escapeHTML(e.year+' · '+e.type+(e.from?' · '+e.from+' → '+e.to:''))).join('<br>')+'</p></details>').join('');}
playerContract=function(ctx){
 if(wnbaHistorical()&&!wnbaEnabled())return playerCard('LEGACY WNBA CONTRACT', '<p>Stored annual salary: '+contractCash(contractUSD(ctx.p.salary))+'. This save has not enabled the versioned WNBA rules. Detailed valuation and eligibility are unavailable until its financial environment is reviewed; existing contracts have not been rewritten.</p><button onclick="showWNBARepair()">Preview WNBA financial repair</button>');
 const {p,club,own}=ctx,rows=contractRows(p,club),active=rows.filter(a=>a.year>=state.year&&a.option!=='declined'),current=rows.find(a=>a.year===state.year&&a.option!=='pending'&&a.option!=='declined'),c=p.wnbaContract,env=contractEnvironment(p,club||team()),ext=contractExtension(ctx),market=contractMarket(p,club||team()),record=state.contractBook?.people[p.id]?.records.find(r=>r.status==='active');
 const paidThisSeason=a=>a.year===state.year?Math.floor(a.base*Math.min(1,state.day/Math.max(1,state.schedule.length))):0;
 const guaranteedScheduled=active.length&&active.every(a=>a.guaranteed!==null)?active.reduce((n,a)=>n+a.guaranteed,0):null;
 const guarantees=guaranteedScheduled===null?null:active.reduce((n,a)=>n+Math.max(0,a.guaranteed-paidThisSeason(a)),0),total=rows.reduce((n,a)=>n+(a.option==='declined'?0:a.base+(a.bonus||0)),0);
 const badges=[club&&(p.contractThrough??state.year)===state.year?'EXPIRING':'',(c?.kind==='rookie'||record?.kind==='rookie')?'ROOKIE DEAL':'',active.some(a=>a.option==='pending')?'TEAM OPTION':'',active.length&&guaranteedScheduled===active.reduce((n,a)=>n+a.base,0)?'FULLY GUARANTEED':''].filter(Boolean);
 const overview='<div class="contract-badges">'+badges.map(b=>'<span class="tag">'+b+'</span>').join('')+'</div><dl class="contract-grid">'+[
 ['Current annual salary',club?contractCash(current?.base??contractUSD(p.salary)):'Unsigned'],['Total '+(record?.startYear!==null&&record?'contract':'recorded schedule')+' value',club?contractCash(total):'—'],['Original contract length',c?(c.extensionStart?c.extensionStart-c.startYear:c.annual.length)+' years':record?.originalYears?record.originalYears+' years':'Unavailable'],['Remaining years',active.filter(a=>a.option!=='pending').length],['Start season',c?.startYear??record?.startYear??'Unavailable'],['Expiration season',club?p.contractThrough??state.year:'Unsigned'],['Guaranteed money remaining',contractCash(guarantees)],['Current cap hit',contractCash(current?.cap??0)],['Classification',escapeHTML(c?.kind||(record?.kind==='rookie'?'Rookie contract':current?.base===env.min?'Minimum salary contract':'Standard · detailed type unavailable'))],['Free agency status',club?'Signed; rights evaluated in offseason':'Available']].map(([k,v])=>contractMetric(k,v)).join('')+'</dl>';
 const breakdown=rows.length?contractTable(['Season','Base salary','Cap hit','Guaranteed','Bonus','Status'],rows.map(a=>'<tr class="'+(a.year===state.year?'contract-current':'')+'"><td>'+contractSeason(a.year)+'</td><td>'+contractCash(a.base)+'</td><td>'+contractCash(a.cap)+'</td><td>'+contractCash(a.guaranteed)+'</td><td>'+(a.bonus===undefined?'Not recorded':contractCash(a.bonus))+'</td><td>'+(a.option?'Team option · '+a.option:a.year<state.year?'Completed':a.year===state.year?'Current':'Committed')+'</td></tr>'),'Annual contract salaries')+contractChart(rows)+'<p>Potential scheduled value: '+contractCash(total)+'. '+(!c?'The existing engine explicitly carries flat salaries. Only stored remaining years are shown; original signing details are not reconstructed.':'Annual salary schedule is the authoritative WNBA contract record.')+'</p>':'<p>No current salary commitment. Estimated asking salary '+contractCash(contractUSD(freeAgentQuote(p)))+'.</p>';
 const eligibility='<p><strong>'+(ext.reason?'Unavailable':'Eligible for extension')+'</strong></p>'+(ext.reason?'<p>'+escapeHTML(ext.reason)+'</p>':'<dl class="contract-grid">'+[['Asking salary',contractCash(ext.quote)],['Maximum offer ceiling',contractCash(ext.max)],['Allowed term choices',ext.years.join(', ')+' years'],['Earliest permitted negotiation','Current simulation window'],['Preferred duration (estimate)',Math.min(Math.max(...ext.years),p.age>=33?1:p.age<26?3:2)+' years'],['Interest in re-signing',ext.interest],['Team affordability',ext.affordable?'Room under modeled spending limit':'Additional cap space required']].map(([k,v])=>contractMetric(k,v)).join('')+'</dl>')+(own?'<button class="primary" onclick="extendPlayerContract('+p.id+')" '+(ext.reason?'disabled':'')+'>Negotiate Extension</button>':'')+'<p class="muted">Eligibility and final approval use the existing negotiation engine. '+(wnbaEnabled()?'New years begin after the signed term; rookie option and anniversary windows apply.':'The existing NBA renewal takes effect immediately; detailed historical CBA extension windows are not fully modeled.')+'</p>';
 const assessment='<p title="Simulation estimate, not a guaranteed offer."><strong>'+market.classification+'</strong> · Estimated annual market value '+contractCash(market.value)+'</p><dl class="contract-grid">'+[['Current salary',contractCash(market.salary)],['Market minus salary',contractCash(market.diff)],['Difference',market.percent===null?'—':market.percent.toFixed(1)+'%']].map(([k,v])=>contractMetric(k,v)).join('')+'</dl>'+contractChart([{year:'Salary',base:market.salary},{year:'Market estimate',base:market.value}])+'<p class="muted">Estimate combines rating, potential, age, recorded production/efficiency, minutes, current injury, positional supply and '+market.comparables+' comparable contracts. Unrecorded injury history is not inferred. It is bounded by this player’s league salary limits.</p>';
 let finances='<p>Unsigned: no current team cap obligation.</p>';
 if(club){const l=contractProjection(club,state.year),waiver=contractWaiver(p,club),capHit=current?.cap??0;finances='<h4>'+escapeHTML(club.city+' '+club.name)+(own?' · Your team':'')+'</h4><dl class="contract-grid">'+[['Team payroll',contractCash(l.total)],['Salary cap',leagueRules().salaryCapType==='none'?'No cap':contractCash(l.cap)],['Available cap space',!wnbaEnabled()&&leagueRules().salaryCapType==='none'?'Unlimited':contractCash(l.room)],['Player cap hit',contractCash(capHit)],['Share of payroll',l.total?(100*capHit/l.total).toFixed(1)+'%':'—'],['Dead money',contractCash(l.dead)],['Luxury tax position',wnbaEnabled()?'Not applicable':leagueRules().luxuryTaxEnabled?contractCash(contractUSD(leagueRules().luxuryTaxThreshold)-l.total)+' below / (above) tax line':'Not applicable']].map(([k,v])=>contractMetric(k,v)).join('')+'</dl>'+contractTable(['Season','Committed salary','Projected cap','Cap space','Basis'],[0,1,2].map(i=>{const y=state.year+i,l=contractProjection(club,y);return '<tr><td>'+contractSeason(y)+'</td><td>'+contractCash(l.total)+'</td><td>'+contractCash(l.cap)+'</td><td>'+contractCash(l.room)+'</td><td>'+l.label+'</td></tr>';}),'Three season cap projection')+'<p class="muted">Pending/declined options are excluded from committed payroll. Projections exclude unsigned players and future draft picks; reserved roster minimums are checked at signing.</p><p>Projected waiver obligation: '+contractCash(waiver.dead)+' · current cap savings: '+contractCash(waiver.saving)+'. '+(wnbaEnabled()?'Injured-player releases remain blocked pending protection review.':'The current NBA engine retains the entire waived salary as dead cap; undocumented legacy guarantees are not presented as verified terms.')+'</p><p>Trade impact depends on outgoing and incoming salaries. '+(wnbaEnabled()?'Both teams must pass the WNBA hard cap; cash and retained salary are unavailable.':'Trade salary matching: '+leagueRules().tradeSalaryMatch+'% in the active settings; final approval also checks team spending limits. Detailed apron restrictions are not modeled.')+'</p>';}
 const options=rows.filter(a=>a.option);const terms='<p>Guaranteed remaining: '+contractCash(guarantees)+'. '+(guarantees!==null?'Non-guaranteed remaining: '+contractCash(active.reduce((n,a)=>n+Math.max(0,a.base-Math.max(a.guaranteed,paidThisSeason(a))),0))+'.':'Legacy guarantee clauses are unavailable.')+'</p>'+options.map(a=>'<p>'+a.year+' team option · '+contractCash(a.base)+' · '+a.option+' · Team decision. Conservative preseason deadline: '+(c.startYear+2)+', day 0.</p>'+(own&&a.option==='pending'?'<button onclick="wnbaRookieOption('+p.id+',true)" '+(state.year===c.startYear+2&&state.day===0?'':'disabled')+'>Exercise team option</button> <button onclick="wnbaRookieOption('+p.id+',false)" '+(state.year===c.startYear+2&&state.day===0?'':'disabled')+'>Decline team option</button>':'')).join('')+'<p>Only recorded provisions are shown. No-trade clauses, player options, trade kickers, signing bonuses and performance incentives are not inferred from salary or player rating.</p><details><summary>Contract Rules · '+env.league+' '+env.year+'</summary><p>'+escapeHTML(env.note)+'</p><p>Salary demands reflect morale and personality. Dissatisfied players may refuse or request premiums. Renewals cannot shorten a signed agreement. Expiring deals enter offseason free agency after the draft. Waived obligations remain on the cap under the active accounting rules.</p>'+env.sources.map(s=>'<p><a target="_blank" rel="noopener noreferrer" href="'+escapeHTML(s.url)+'">'+escapeHTML(s.location)+'</a></p>').join('')+'</details>';
 return '<div class="contract-dossier">'+[['Contract Overview',overview],['Contract Breakdown',breakdown],['Extension Eligibility',eligibility],['Contract Value Assessment',assessment],['Team Salary Cap Impact',finances],['Contract Terms & Options',terms],['Contract History',contractHistoryMarkup(p)]].map(([title,body])=>playerCard(title,body)).join('')+'</div>';
};
// Persist before the existing atomic save snapshot. No parallel financial authority.
// The restore copy shares records of players who left the league (contractTrack never changes them again).
const dossierSaveBefore=save;save=function(){const target=state,book=state.contractBook,previous=book?{...book,people:Object.fromEntries(Object.entries(book.people).map(([k,v])=>[k,v.status==='inactive'?v:copy(v)]))}:null;contractTrack();const restore=()=>{if(state===target){if(previous)state.contractBook=previous;else delete state.contractBook;}};try{return Promise.resolve(dossierSaveBefore()).then(ok=>{if(ok===false)restore();return ok;},error=>{restore();throw error;});}catch(error){restore();throw error;}};
const dossierOwnerDayBefore=ownerDay;ownerDay=function(...args){contractAccrue();return dossierOwnerDayBefore(...args);};
const dossierBuildBefore=buildSetupCareer;buildSetupCareer=function(...args){const result=dossierBuildBefore(...args),previous=state;try{state=result;contractTrack();for(const t of state.teams)for(const p of t.roster){const r=state.contractBook.people[p.id].records[0];r.signedYear=state.year;r.startYear=p.wnbaContract?.startYear??state.year;r.signingTeam=t.city+' '+t.name;r.signingTeamKey=t.key;r.originalYears=r.annual.length;r.evidence=p.wnbaContract?.evidence??'generated simulation agreement';if(!wnbaEnabled())r.annual=r.annual.map(a=>({...a,guaranteed:a.base}));}}finally{state=previous;}return result;};
const dossierValidateBefore=validateCareerData;validateCareerData=function(raw){const out=dossierValidateBefore(raw);if(raw.contractBook!==undefined){const b=raw.contractBook;if(!b||b.version!==1||!Number.isInteger(b.startedYear)||!Number.isInteger(b.startedDay)||!b.people||Array.isArray(b.people))throw Error('Invalid contract history.');for(const [id,p] of Object.entries(b.people)){if(String(p.id)!==id||!Array.isArray(p.records)||!Array.isArray(p.earnings))throw Error('Invalid player contract history.');for(const r of p.records){if(!Array.isArray(r.annual)||!Array.isArray(r.events)||r.annual.some(a=>!Number.isInteger(a.year)||!Number.isSafeInteger(a.base)||a.base<0||a.guaranteed!==null&&(!Number.isSafeInteger(a.guaranteed)||a.guaranteed<0||a.guaranteed>a.base)))throw Error('Invalid recorded contract schedule.');}if(p.earnings.some(e=>!Number.isInteger(e.year)||!Number.isFinite(e.amount)||e.amount<0))throw Error('Invalid recorded earnings.');}out.contractBook=copy(b);}return out;};
// Initialize a baseline before transactions so changes are attributed accurately.
for(const name of ['releasePlayer','confirmContractExtension','submitInSeasonOffer','faSign','beginFreeAgency','draftPickInternal','finalizeTradeCenter','wnbaRookieOption','newSeason']){
 const before=globalThis[name];if(typeof before==='function')globalThis[name]=function(...args){contractTrack();return before(...args);};
}
const dossierOpenBefore=openPlayerProfile;openPlayerProfile=function(id){contractTrack();return dossierOpenBefore(id);};
function showRecordedContractHistory(id){const p=state.contractBook?.people[id];if(!p)return;titleModal(escapeHTML(p.name)+' · Financial history',contractHistoryMarkup(p));}

const dossierOpenCareerBefore=openSavedCareer;openSavedCareer=async function(...args){const result=await dossierOpenCareerBefore(...args);contractTrack();return result;};
// Preserve actual start year for newly observed offseason signings. No extra RNG.
const dossierFASignBefore=faSign;faSign=function(p,o){contractTrack();const ok=dossierFASignBefore(p,o);if(ok){contractTrack();const r=state.contractBook.people[p.id].records.find(r=>r.status==='active');if(r&&!wnbaEnabled()){r.annual=r.annual.filter(a=>a.year>=state.year+1);r.startYear=state.year+1;r.originalYears=o.years;r.signedYear=state.year;r.signingTeam=state.teams[o.team].city+' '+state.teams[o.team].name;r.signingTeamKey=state.teams[o.team].key;}}return ok;};
const dossierHallBefore=hallOfFameView;hallOfFameView=function(){return dossierHallBefore()+playerCard('RECORDED CONTRACT HISTORIES',Object.values(state.contractBook?.people||{}).filter(p=>p.status==='inactive').map(p=>'<p><button class="namebutton" onclick="showRecordedContractHistory('+p.id+')">'+escapeHTML(p.name)+'</button> · '+p.records.length+' recorded agreement(s)</p>').join('')||'<p>No inactive player financial records yet.</p>');};
// One valuation feeds the dossier and real human/AI salary demands.
const dossierWNBAOriginalDemand=wnbaDemandDollars;wnbaDemandDollars=function(p,t,year=state.year,s=state){if(s!==state)return dossierWNBAOriginalDemand(p,t,year,s);return contractMarket(p,t,year).value;};
const dossierQuoteBefore=freeAgentQuote;freeAgentQuote=function(p,t=team()){if(wnbaHistorical()&&!wnbaEnabled())return dossierQuoteBefore(p,t);const y=wnbaEnabled()?wnbaTransactionYear():state.year,env=contractEnvironment(p,t,y),market=contractMarket(p,t,y).value;const mood=negotiationStatus(p),premium=mood.refuses?0.3:mood.score>=85&&!hasTrait(p,'mercenary')?-0.05:mood.premium;return Math.max(env.min,Math.min(env.max,Math.round(market*(1+(premium||0))*(hasTrait(p,'loyal')&&p.previousTeamKey===t.key?0.95:1))))/1e6;};
const dossierDemandBefore=faDemand;faDemand=function(p){return freeAgentQuote(p);};

const dossierExtensionQuoteBefore=extensionQuote;extensionQuote=function(p){if(wnbaEnabled())return dossierExtensionQuoteBefore(p);const env=contractEnvironment(p,team());return roundContractAmount(Math.max(env.min,Math.min(env.max,contractMarket(p,team()).value*(1+negotiationStatus(p).premium)))/1e6);};

const dossierRepairBefore=showWNBARepair;showWNBARepair=function(...args){contractTrack();return dossierRepairBefore(...args);};

const dossierDraftBefore=draftPickInternal;draftPickInternal=function(id){contractTrack();const result=dossierDraftBefore(id);if(result&&!wnbaEnabled()){contractTrack();const t=state.teams.find(t=>t.roster.some(p=>p.id===id)),r=state.contractBook.people[id]?.records.find(r=>r.status==='active');if(t&&r){r.signedYear=state.year;r.startYear=state.year+1;r.signingTeam=t.city+' '+t.name;r.signingTeamKey=t.key;r.kind='rookie';r.evidence='recorded simulation draft signing';r.annual=r.annual.filter(a=>a.year>=state.year+1).map(a=>({...a,guaranteed:a.base}));r.originalYears=r.annual.length;}}return result;};
