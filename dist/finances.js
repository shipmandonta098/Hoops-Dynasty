/* Local TV rights ($M / season) scale with metro population: piecewise linear in log(population) through
   the tier defaults (1.8M → 65, 4M → 80, 9M → 95), so saves using tier defaults keep the old flat values.
   Clamped to 50–110. A 30-team default league averages about 80.9 versus 82 under flat tier values. */
function mediaRightsValue(club){const people=validMetroPopulation(club?.population)?club.population:TIER_DEFAULT_POPULATION[club?.marketSize]||TIER_DEFAULT_POPULATION.Medium,x=Math.log(people/4e6),slope=x<0?15/Math.log(4/1.8):15/Math.log(9/4);return Math.round(Math.max(50,Math.min(110,80+slope*x))*10)/10}
/* All financial amounts are millions except retail prices. */
const FINANCE_BUDGETS=['scouting','coaching','health','facilities'];
function financeFor(club=team()){
 state.finances??={};
 let f=state.finances[club.id];
 if(!f){const p=ownerFor(club).plan;f=state.finances[club.id]={cash:50,level:0,budgets:{scouting:5,coaching:5,health:5,facilities:5},prices:{playoff:110,jersey:100,hat:30,food:12},media:mediaRightsValue(club),mediaThrough:state.year+2,sponsors:[null,null],dead:[],ledger:[],season:{year:state.year,lastDay:state.day,opening:50-p.revenue+p.costs,revenue:p.revenue,costs:p.costs,tax:0,settled:false,playoffGames:[],lines:{tickets:0,merch:0,food:0,media:0,sponsors:0,payroll:0,operations:0,arena:0,legacyRevenue:p.revenue,legacyCosts:p.costs}}}}
 if(f.season.year!==state.year){f.dead=f.dead.filter(d=>d.through>=state.year);f.sponsors=f.sponsors.map(s=>s&&s.through>=state.year?s:null);f.season={year:state.year,lastDay:0,opening:f.cash,revenue:0,costs:0,tax:0,settled:false,playoffGames:[],lines:{tickets:0,merch:0,food:0,media:0,sponsors:0,payroll:0,operations:0,arena:0,legacyRevenue:0,legacyCosts:0}}}
 return f;
}
function financeDead(club){return (state.finances?.[club.id]?.dead||[]).filter(d=>d.through>=state.year).reduce((n,d)=>n+d.salary,0)}
function financeRosterLimit(club=team(),year=expansionPendingSeason(club)?state.year+1:state.year){const type=leagueRules().salaryCapType;return type==='none'?Infinity:expansionCap(club,year)*(type==='hard'?1:1.3)}
function financeBudget(f,key){return leagueRules().budgetEnabled?(f?.budgets?.[key]??5):5}
function financeCapRoomLimit(club=team(),year=state.year){return leagueRules().salaryCapType==='none'?Infinity:expansionCap(club,year)}
function financeLimitLabel(club=team()){return Number.isFinite(financeRosterLimit(club))?money(financeRosterLimit(club)):'Unlimited'}
function financeRepeater(f){return f.ledger.filter(h=>h.year>=state.year-4&&h.year<state.year&&h.tax>0).length>=3}
function financeTax(pay,f){
 if(!leagueRules().luxuryTaxEnabled)return 0;
 let over=Math.max(0,pay-leagueRules().luxuryTaxThreshold),tax=0,band=0;
 while(over>0){const amount=Math.min(5,over);tax+=amount*(leagueRules().luxuryTaxRate+band*.5+(financeRepeater(f)?1:0));over-=amount;band++}
 return tax;
}
function financePost(f,key,amount,cost=false){if(!Number.isFinite(amount)||amount<0)return;f.season.lines[key]=(f.season.lines[key]||0)+amount;f.season[cost?'costs':'revenue']+=amount;f.cash+=cost?-amount:amount}
function financeSync(club){const f=financeFor(club),p=ownerFor(club).plan;p.revenue=f.season.revenue;p.costs=f.season.costs}
function financeProjection(club,playoffs=false,planOverride=null){
 const f=financeFor(club),p=planOverride||ownerFor(club).plan,base=financeProjectionBefore(club,p),price=playoffs?f.prices.playoff:p.ticketPrice;
 const recent=state.history.filter(g=>g.stage==='Regular season'&&(g.a===club.id||g.b===club.id)).slice(0,10),form=recent.length?recent.filter(g=>g.winner===club.id).length/recent.length-.5:0;
 const attendance=Math.max(.2,Math.min(1,base.attendance+form*.12+f.level*.012+(financeBudget(f,'facilities')-5)*.002+(playoffs?.12:0)-(price-p.ticketPrice)/(75*(1+f.level*.08))*.3));
 return {attendance,capacity:teamStadiumCapacity(club),price,merchPerHome:base.merchPerHome};
}
function financeHome(club,playoffs=false,awayId=null,gameDay=null,gameResult=null){
 const f=financeFor(club),p=ownerFor(club).plan,g=gameResult||state.history.find(g=>g.a===club.id&&g.b===awayId&&g.day===gameDay&&g.stage==='Regular season'),a=g?.gameAtmosphere;
 if(g?.attendanceRevenuePosted||!playoffs&&f.season.attendance?.some(r=>r.day===gameDay))return;
 const v=a?{capacity:a.capacity,attendance:a.fillRate,price:a.ticketPrice}:financeProjection(club,playoffs),fans=a?a.attendance:Math.round(v.capacity*v.attendance),star=Math.max(0,...club.roster.map(x=>x.ovr));
 const demand=(price,base)=>Math.exp(-Math.max(-.5,price/base-1)*1.5);
 const merch=fans*(.07*f.prices.jersey*demand(f.prices.jersey,100)+.1*f.prices.hat*demand(f.prices.hat,30))*(1+Math.max(0,star-80)*.015)/1e6;
 financePost(f,'tickets',fans*v.price/1e6);financePost(f,'merch',merch);financePost(f,'food',fans*.7*f.prices.food*demand(f.prices.food,12)/1e6);
 financePost(f,'operations',.15+merch*.35+fans*.7*4/1e6,true);
 if(!playoffs&&Number.isInteger(awayId)&&Number.isInteger(gameDay)){f.season.attendance??=[];if(!f.season.attendance.some(g=>g.day===gameDay))f.season.attendance.push({day:gameDay,away:awayId,fans:Math.round(fans),capacity:v.capacity,occupancy:v.attendance})}
 if(g)g.attendanceRevenuePosted=true;
 if(!playoffs){p.homeGames++;p.attendanceSum+=v.attendance;p.ticketSum+=v.price;p.merch+=merch}
}
function financeDay(club){
 const f=financeFor(club),p=ownerFor(club).plan;
 for(let day=f.season.lastDay+1;day<=state.day;day++){
  financePost(f,'media',f.media/seasonLength());financePost(f,'sponsors',f.sponsors.reduce((n,s)=>n+(s&&s.through>=state.year?s.annual:0),0)/seasonLength());
  financePost(f,'payroll',ownerPayroll(club)/seasonLength(),true);
  financePost(f,'operations',(20+(leagueRules().budgetEnabled?Object.entries(f.budgets).reduce((n,[key,v])=>n+(key==='coaching'?coachBudgetExpense(f,club):v),0):0))/seasonLength(),true);
  const pair=state.schedule[day-1]?.find(x=>x.includes(club.id));if(pair){p.games++;if(pair[0]===club.id)financeHome(club,false,pair[1],day)}
 }
 f.season.lastDay=state.day;p.lastDay=state.day;financeSync(club);
 if(state.day===seasonLength()&&!f.season.regularReviewed){
  f.season.regularReviewed=true;const owner=ownerFor(club);
  if(owner.type==='penny'&&leagueRules().luxuryTaxEnabled&&ownerPayroll(club)>leagueRules().luxuryTaxThreshold||owner.type==='tycoon'&&!ownerPlayoffClub(club)&&!p.adapted){owner.patience=0;owner.fired=true;if(club.id===controlledTeamId())say('OWNER REVIEW: Non-negotiable season target missed. Your employment has ended.')}
 }
}
function financeFinalize(){
 for(const club of state.teams){
  if(expansionPendingSeason(club))continue;
  const f=financeFor(club);if(f.season.settled)continue;
  for(const [index,g] of state.history.entries())if(g.stage!=='Regular season'&&g.a===club.id&&!f.season.playoffGames.includes(index)){financeHome(club,true,g.b,g.day,g);f.season.playoffGames.push(index)}
  financePost(f,'payroll',Math.max(0,leagueRules().minimumPayroll-ownerPayroll(club)),true);
  const tax=financeTax(ownerPayroll(club),f);f.season.tax=tax;financePost(f,'tax',tax,true);f.season.settled=true;financeSync(club);
  const profit=f.season.revenue-f.season.costs,owner=ownerFor(club);
  if(!owner.fired){owner.patience=Math.max(0,Math.min(100,owner.patience+(profit>=0?3:-Math.min(20,Math.ceil(-profit/5)))));if(!owner.patience)owner.fired=true}
  f.ledger.push({year:state.year,revenue:f.season.revenue,costs:f.season.costs,profit,cash:f.cash,tax,w:club.w,l:club.l,playoffs:ownerPlayoffClub(club),title:state.champion===club.id});
 }
}
async function financeSettings(event){
 event.preventDefault();if(!ownerCanManage())return;const f=financeFor(),old=JSON.stringify(f),p=ownerFor(team()).plan,oldTicket=p.ticketPrice,e=event.target.elements;
 const ticket=Number(e.ticket.value);if(!Number.isFinite(ticket)||ticket<37.5||ticket>150)return toast('Regular tickets must be $37.50–$150.');
 for(const k of leagueRules().budgetEnabled?FINANCE_BUDGETS:[]){const v=Number(e[k].value);if(!Number.isFinite(v)||v<1||v>20)return toast('Budgets must be $1M–$20M.');}
 const bounds={playoff:[40,300],jersey:[40,200],hat:[10,80],food:[4,40]};
 for(const [k,[min,max]] of Object.entries(bounds)){const v=Number(e[k].value);if(!Number.isFinite(v)||v<min||v>max)return toast('Check the retail price limits.')}
 p.ticketPrice=ticket;if(leagueRules().budgetEnabled)for(const k of FINANCE_BUDGETS)f.budgets[k]=Number(e[k].value);for(const k of Object.keys(bounds))f.prices[k]=Number(e[k].value);
 if(!await save()){state.finances[controlledTeamId()]=JSON.parse(old);p.ticketPrice=oldTicket;return toast('Could not save financial settings.')}
 if(ticket!==oldTicket){addDecision({type:'TicketChange',description:'Changed regular-season ticket price from $'+oldTicket+' to $'+ticket,reasoning:'Updated the franchise revenue plan.',immediateOutcome:{fanReaction:ticket>oldTicket?-1:1,ownerReaction:0,chemistryChange:0,capChange:'+0.0M'}});await save()}render();toast('Financial settings saved. New rates apply from today.');
}
async function financeUpgrade(){
 if(!ownerCanManage())return;const f=financeFor(),cost=15+f.level*10;if(f.level>=5||f.cash<cost||teamStadiumCapacity(team())>99000)return toast('Insufficient cash, maximum arena level, or capacity limit reached.');
 const old=JSON.stringify(f),oldCapacity=team().stadiumCapacity,capacity=teamStadiumCapacity(team());financePost(f,'arena',cost,true);f.level++;team().stadiumCapacity=capacity+1000;financeSync(team());
 if(!await save()){state.finances[controlledTeamId()]=JSON.parse(old);if(oldCapacity===undefined)delete team().stadiumCapacity;else team().stadiumCapacity=oldCapacity;financeSync(team());return toast('Upgrade could not be saved.')}render();
}
function financeSponsorOffer(){const t=team(),hype=Math.max(0,...t.roster.map(p=>p.ovr)),pct=t.w/(t.w+t.l||1);return pct>=.65&&t.w+t.l>=10||hype>=90?{tier:'Premium',annual:18}:pct>=.5&&t.w+t.l>=5||hype>=85?{tier:'Regional',annual:10}:{tier:'Local',annual:5}}
async function financeSponsor(slot){
 if(!ownerCanManage()||![0,1].includes(slot))return;const f=financeFor();if(f.sponsors[slot])return;
 const old=JSON.stringify(f);f.sponsors[slot]={...financeSponsorOffer(),through:state.year};
 if(!await save()){state.finances[controlledTeamId()]=JSON.parse(old);return toast('Sponsor could not be saved.')}render();
}
async function financeMedia(){
 if(!ownerCanManage())return;const f=financeFor();if(state.year<=f.mediaThrough)return toast('The current media contract is still active.');
 const old=JSON.stringify(f),past=f.ledger.at(-1);f.media=mediaRightsValue(team())*(past?.title?1.25:past?.playoffs?1.12:1);f.mediaThrough=state.year+2;
 if(!await save()){state.finances[controlledTeamId()]=JSON.parse(old);return toast('Contract could not be saved.')}render();
}
const financeProjectionBefore=ownerBusinessProjection;
ownerBusinessProjection=function(club,plan){if(!state.finances?.[club.id])return financeProjectionBefore(club,plan);const v=financeProjection(club,false,plan);return {attendance:v.attendance,merchPerHome:v.merchPerHome}};
const financeOwnerPayrollBefore=ownerPayroll;
ownerPayroll=function(club){return financeOwnerPayrollBefore(club)+financeDead(club)};
const financeSkillBefore=coachingSkill;
coachingSkill=function(club,key){const f=state.finances?.[club.id],budget={scouting:'scouting',teaching:'coaching',veterans:'coaching',conditioning:'health'}[key];return Math.max(1,Math.min(99,financeSkillBefore(club,key)+(f&&budget?(financeBudget(f,budget)-5)*1.5:0)))};
const financeInjuryBefore=durabilityInjuryDetails;
durabilityInjuryDetails=function(p,conditioning,roll=Math.random(),context=null){const club=state.teams.find(t=>t.roster.includes(p)),budget=financeBudget(state.finances?.[club?.id],'health'),result=financeInjuryBefore(p,conditioning,Math.min(.999,roll+Math.max(0,budget-5)*.002),context);result.days=Math.max(1,Math.round(result.days*(1-(budget-5)*.015)));return result};
const financeQuoteBefore=freeAgentQuote;
freeAgentQuote=function(p,club=team()){return Math.round(financeQuoteBefore(p,club)*(1-(state.finances?.[club.id]?.level||0)*.008)*10)/10};
const financeDevelopBefore=developAttributes;
developAttributes=function(p,delta){const club=state.teams.find(t=>t.roster.includes(p)),f=state.finances?.[club?.id],before=p.attributes?{...p.attributes}:null;financeDevelopBefore(p,delta);if(before&&financeBudget(f,'health')>=12&&p.age>30)for(const k of ['spd','stre','jmp','endu'])if(p.attributes[k]<before[k])p.attributes[k]=Math.min(before[k],p.attributes[k]+1)};
function financeScoutedPotential(p){
 const range=Math.max(1,Math.round((99-coachingSkill(team(),'scouting'))/4));
 const error=((p.id*37+13)>>>0)%(range*2+1)-range;
 return {estimate:Math.max(1,Math.min(99,p.pot+error)),range};
}
function financeProspects(){
 const list=state.free.filter(p=>p.age<=23).slice(0,5);
 return '<section class="panel"><div class="panelhead"><h2>Recruit scouting outlook</h2></div><div class="note">'+(list.length?list.map(p=>{const s=financeScoutedPotential(p);return '<p>'+escapeHTML(p.name)+' · Age '+p.age+' · Estimated POT '+s.estimate+' ± '+s.range+'</p>'}).join(''):'No young free-agent recruits available.')+'<small>Scouting funding narrows potential estimates for available recruits. A draft prospect pipeline has not been added yet.</small></div></section>';
}
function financesView(){
 const t=team(),f=financeFor(),o=ownerFor(t),p=o.plan,pay=ownerPayroll(t),tax=financeTax(pay,f),profit=f.season.revenue-f.season.costs,v=financeProjection(t),offer=financeSponsorOffer(),arenaCost=15+f.level*10;
 const metric=(label,value,detail='')=>'<article class="finance-metric"><small>'+label+'</small><strong>'+value+'</strong><span>'+detail+'</span></article>';
 const input=(key,label,value,min,max,step=1)=>'<label>'+label+'<input name="'+key+'" type="number" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" required></label>';
 return '<div class="finance-page"><section class="finance-summary">'+metric('CAP PAYROLL',money(pay),'Roster '+money(financeOwnerPayrollBefore(t))+' · Dead cap '+money(financeDead(t)))+metric('CAP SPACE',leagueRules().salaryCapType==='none'?'Unlimited':money(salaryCap()-pay),'Cap '+money(salaryCap())+' · Tax line '+money(leagueRules().luxuryTaxThreshold))+metric('SEASON PROFIT / LOSS',money(profit),'Revenue '+money(f.season.revenue)+' · Costs '+money(f.season.costs))+metric('CASH RESERVES',money(f.cash),'Available for arena investment and tax payments')+metric('MARKET',escapeHTML(t.marketSize||'Medium'),'Arena '+v.capacity.toLocaleString()+' seats')+metric('PROJECTED LUXURY TAX',money(tax),financeRepeater(f)?'REPEATER · 3 of previous 4 seasons taxed':'Standard tax rates')+'</section>'+
 '<section class="panel"><div class="panelhead"><h2>Ownership & job security</h2><strong>'+o.patience+'%</strong></div><div class="note"><h3>'+escapeHTML(OWNER_TYPES[o.type].name)+'</h3><p>'+escapeHTML(OWNER_TYPES[o.type].description)+'</p><progress max="100" value="'+o.patience+'"></progress><p>'+(o.type==='penny'?'Non-negotiable: finish the regular season under the tax line.':o.type==='tycoon'?'Non-negotiable: qualify for the playoffs. Major-injury expectation adjustments still apply.':'Results, season profits and ownership goals determine job security.')+' A 0% rating ends your employment.</p></div></section>'+
 '<form onsubmit="financeSettings(event)" class="finance-settings"><section class="panel"><div class="panelhead"><h2>Revenue management</h2><span>Projected attendance '+Math.round(v.attendance*100)+'%</span></div><div class="finance-inputs"><label>Regular-season ticket · $<output>'+p.ticketPrice+'</output><input name="ticket" type="range" min="37.5" max="150" step=".5" value="'+p.ticketPrice+'" oninput="this.previousElementSibling.value=this.value"></label><label>Playoff ticket · $<output>'+f.prices.playoff+'</output><input name="playoff" type="range" min="40" max="300" value="'+f.prices.playoff+'" oninput="this.previousElementSibling.value=this.value"></label>'+input('jersey','Jersey price ($)',f.prices.jersey,40,200)+input('hat','Hat price ($)',f.prices.hat,10,80)+input('food','Average food price ($)',f.prices.food,4,40)+'</div><p class="note">Attendance responds to market, price, star power, recent form and arena quality. Higher retail prices reduce purchase demand.</p></section>'+
 '<section class="panel"><div class="panelhead"><h2>Basketball operations</h2><span>Annual budgets · $M</span></div><div class="finance-inputs">'+(leagueRules().budgetEnabled?FINANCE_BUDGETS.map(k=>input(k,k[0].toUpperCase()+k.slice(1),f.budgets[k],1,20,.5)).join(''):'<p>Budgets disabled in League Settings. Funding effects and charges are paused.</p>')+'</div><p class="note">Scouting narrows rating uncertainty. Coaching improves youth development and veteran retention of skills. Health reduces injury severity and recovery time. Facilities funding improves attendance. Budgets accrue daily; $5M per category is the baseline.</p></section><button class="primary" type="submit">Save financial settings</button></form>'+
 '<div class="finance-columns"><section class="panel"><div class="panelhead"><h2>Media & sponsorships</h2></div><div class="note"><h3>Local TV · '+money(f.media)+' / season</h3><p>Contract through '+f.mediaThrough+'. Renewal increases after a playoff appearance or championship.</p><button onclick="financeMedia()" '+(state.year<=f.mediaThrough?'disabled':'')+'>Renegotiate media rights</button>'+f.sponsors.map((s,i)=>'<article class="finance-deal"><strong>Sponsor slot '+(i+1)+'</strong><p>'+(s?escapeHTML(s.tier)+' · '+money(s.annual)+' / season · through '+s.through:'Available: '+offer.tier+' · '+money(offer.annual)+' / season')+'</p><button onclick="financeSponsor('+i+')" '+(s?'disabled':'')+'>'+(s?'Contract active':'Sign sponsor')+'</button></article>').join('')+'<small>Premium offers unlock with a 90+ star or a .650 record after 10 games. Income accrues over remaining calendar days.</small></div></section>'+
 '<section class="panel"><div class="panelhead"><h2>Arena & facilities</h2><span>Level '+f.level+' / 5</span></div><div class="note"><h3>'+v.capacity.toLocaleString()+' seats</h3><p>Each upgrade adds 1,000 seats, improves attendance and reduces free-agent asking prices by 0.8%. Includes suites and stadium technology.</p><button class="primary" onclick="financeUpgrade()" '+(f.level>=5||f.cash<arenaCost||teamStadiumCapacity(t)>99000?'disabled':'')+'>Upgrade · '+money(arenaCost)+'</button><p>Paid immediately from cash reserves.</p><h3>Luxury tax rules</h3><p>Tax '+(leagueRules().luxuryTaxEnabled?'starts at '+money(leagueRules().luxuryTaxThreshold):'is disabled')+'. Each $5M band starts at '+leagueRules().luxuryTaxRate+'×, then increases by 0.5× per band. Repeater status adds 1× per band after tax payments in three of the previous four seasons. Roster limit: '+financeLimitLabel()+'. Tax is charged once at the final season review. Minimum payroll: '+money(leagueRules().minimumPayroll)+'; any shortfall is charged as payroll.</p><small>Hoops Dynasty financial rules; this is a simplified league model, not the complete NBA CBA.</small></div></section></div>'+
 financeProspects()+'<section class="panel"><div class="panelhead"><h2>Dead cap · guaranteed contracts</h2></div><div class="scroll"><table><thead><tr><th>Player</th><th>Annual charge</th><th>Through</th></tr></thead><tbody>'+f.dead.filter(d=>d.through>=state.year).map(d=>'<tr><td>'+escapeHTML(d.name)+'</td><td>'+money(d.salary)+'</td><td>'+d.through+'</td></tr>').join('')+'</tbody></table></div>'+(!f.dead.some(d=>d.through>=state.year)?'<p class="note">No guaranteed salary owed to waived players.</p>':'')+'</section>'+
 '<section class="panel"><div class="panelhead"><h2>Season ledger</h2></div><div class="scroll"><table><thead><tr><th>Season</th><th>Revenue</th><th>Costs</th><th>Profit / Loss</th><th>Tax paid</th><th>Cash</th></tr></thead><tbody>'+[{year:state.year,revenue:f.season.revenue,costs:f.season.costs,profit,tax:f.season.tax,cash:f.cash},...f.ledger.filter(h=>h.year!==state.year).slice().reverse()].map(h=>'<tr><td>'+seasonLabel(h.year)+'</td>'+['revenue','costs','profit','tax','cash'].map(k=>'<td>'+money(h[k])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><details class="note"><summary>Current season breakdown</summary><dl class="finance-breakdown">'+Object.entries(f.season.lines).map(([k,n])=>'<div><dt>'+escapeHTML(k)+'</dt><dd>'+money(n)+'</dd></div>').join('')+'</dl></details></section></div>';
}
function readFinances(raw,bad,count){
 if(raw===undefined)return undefined;if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length>count)bad('invalid finances.');
 const num=(v,min=-1e9,max=1e9)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max,year=v=>Number.isInteger(v)&&v>=1900&&v<=10000;
 const out={};for(const [id,f] of Object.entries(raw)){
  if(!/^\d+$/.test(id)||Number(id)>=count||!f||!num(f.cash)||!Number.isInteger(f.level)||f.level<0||f.level>5||!f.budgets||FINANCE_BUDGETS.some(k=>!num(f.budgets[k],1,20))||!f.prices||!num(f.prices.playoff,40,300)||!num(f.prices.jersey,40,200)||!num(f.prices.hat,10,80)||!num(f.prices.food,4,40)||!num(f.media,0,1000)||!year(f.mediaThrough))bad('invalid finance settings.');
  if(!Array.isArray(f.dead)||f.dead.length>10000||f.dead.some(d=>!d||typeof d.name!=='string'||d.name.length>80||!Number.isInteger(d.id)||!num(d.salary,0,1000)||!year(d.through)))bad('invalid dead cap.');
  if(!Array.isArray(f.sponsors)||f.sponsors.length!==2||f.sponsors.some(s=>s!==null&&(!s||!['Local','Regional','Premium'].includes(s.tier)||!num(s.annual,0,100)||!year(s.through))))bad('invalid sponsors.');
  const s=f.season;if(!s||!year(s.year)||!Number.isInteger(s.lastDay)||s.lastDay<0||s.lastDay>366||!num(s.opening)||['revenue','costs','tax'].some(k=>!num(s[k],0))||typeof s.settled!=='boolean'||s.regularReviewed!==undefined&&typeof s.regularReviewed!=='boolean'||!Array.isArray(s.playoffGames)||s.playoffGames.length>100||s.playoffGames.some(n=>!Number.isInteger(n)||n<0)||!s.lines||Object.values(s.lines).some(n=>!num(n,0)))bad('invalid season ledger.');
  if(!Array.isArray(f.ledger)||f.ledger.length>8101||new Set(f.ledger.map(h=>h.year)).size!==f.ledger.length||f.ledger.some(h=>!h||!year(h.year)||['revenue','costs','tax'].some(k=>!num(h[k],0))||!num(h.profit)||!num(h.cash)||!Number.isInteger(h.w)||!Number.isInteger(h.l)||h.w<0||h.l<0||typeof h.playoffs!=='boolean'||typeof h.title!=='boolean'))bad('invalid financial history.');
  if(s.attendance!==undefined&&(!Array.isArray(s.attendance)||s.attendance.length>366||new Set(s.attendance.map(g=>g?.day)).size!==s.attendance.length||s.attendance.some(g=>!g||!Number.isInteger(g.day)||g.day<1||g.day>366||!Number.isInteger(g.away)||g.away<0||g.away>=count||g.away===Number(id)||!Number.isInteger(g.fans)||!num(g.fans,0,100000)||!num(g.capacity,1,100000)||g.fans>g.capacity||!num(g.occupancy,0,1))))bad('invalid attendance records.');
  out[id]=JSON.parse(JSON.stringify(f));
 }return out;
}
