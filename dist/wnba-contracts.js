/* WNBA contracts v1. Registry and ledger are integer nominal USD. Legacy UI/storage
 * adapters alone use millions. Absent schema means legacy save, NEVER auto-migrate. */
const WNBA_CONTRACT_VERSION=1;
function wnbaDollars(m){if(!Number.isFinite(m))throw Error('Invalid salary amount');return Math.round(m*1000000)}
function wnbaMillions(d){if(!Number.isSafeInteger(d))throw Error('Salary must use whole dollars');return d/1000000}
function wnbaEnabled(s=state){return s?.wnbaFinance?.version===WNBA_CONTRACT_VERSION&&s.wnbaFinance.league==='wnba'}
function wnbaHistorical(s=state){return s?.leagueSettings?.historicalSource==='wnba'}
function wnbaRules(year=state.year,s=state){const selected=s?.wnbaFinance?.progression===false?s.wnbaFinance.baseYear:year;const row=WNBA_FINANCIAL_YEARS[selected]|| (selected>2026?WNBA_FINANCIAL_YEARS[2026]:null);if(!row)throw Error('WNBA financial rules unavailable for '+selected+'; NBA defaults are prohibited.');return row}
function wnbaTransactionYear(){return state.day>=state.schedule.length&&state.champion!==null?state.year+1:state.year}
function wnbaService(p,year=state.year){if(Number.isInteger(p.wnbaService?.seasons))return Math.max(0,p.wnbaService.seasons+Math.max(0,Math.min(year,(p.contractThrough??(p.wnbaService.asOf-1))+1)-p.wnbaService.asOf));return Math.max(0,Math.min(year-1997,year-(p.bio?.debutYear??year-Math.max(0,p.age-22))))}
function wnbaMinimum(p,year=state.year,s=state){const r=wnbaRules(year,s),service=wnbaService(p,year);return r.minimumTiers.filter(t=>t[0]<=service).at(-1)[1]}
function wnbaQualifying(p,t,year){const h=p.wnbaRights?.seasons||[];return [year-1,year-2].every(y=>h.some(v=>v.year===y&&v.teamKey===t.key))}
function wnbaMaximum(p,t,year=state.year,s=state,kind='veteran'){const r=wnbaRules(year,s);const eligible=r.specialMaximum&&wnbaQualifying(p,t,year)&&wnbaService(p,year)>=(year>=2021?5:6);return eligible?r.specialMaximum:r.ordinaryMaximum}
function wnbaDemandDollars(p,t,year=state.year,s=state){const lo=wnbaMinimum(p,year,s),hi=wnbaMaximum(p,t,year,s);const value=Math.max(0,Math.min(1,(p.ovr-55)/40));return Math.max(lo,Math.min(hi,Math.round(lo+(hi-lo)*value**1.7)))}
function wnbaTermLimit(p,t,year,s=state){const r=wnbaRules(year,s);return wnbaService(p,year)===0?Math.min(2,r.veteranMaxYears):wnbaQualifying(p,t,year)?r.ownTeamMaxYears:r.veteranMaxYears}
function wnbaRookieSchedule(year,round,pick,s=state){const r=wnbaRules(year,s),rookie=r.rookie;let salaries;
 if(rookie?.rows){const row=rookie.rows.find(v=>v.round===round&&pick>=v.pickWithinRoundMin&&(v.pickWithinRoundMax===null||pick<=v.pickWithinRoundMax));salaries=row?.annualFullSeasonUSD;}
 else if(rookie?.bands)salaries=rookie.bands[round===1?(pick<=4?'round1_picks1_4':pick<=8?'round1_picks5_8':'round1_remaining'):round===2?'round2':round===0?'undrafted':'round3'];
 if(salaries)return {salaries:[...salaries],evidence:year===r.year?'verified':s?.wnbaFinance?.progression===false?'frozen_scale':'future_fallback_estimate',option:salaries.length===4,source:r.cba};
 // Deliberately no invented early scale: documented first-year fragments, otherwise
 // a labeled one-year estimate within documented ordinary bounds.
 const min=r.minimumTiers[0][1],top=r.year===1997&&round===1&&pick<=3?37500:r.year===1999&&round===1?(pick<=4?50000:pick<=8?44000:37500):Math.round(min+(r.ordinaryMaximum-min)*.2*Math.max(0,1-(pick-1)/12));
 return {salaries:[Math.max(min,Math.min(r.ordinaryMaximum,top))],evidence:'simulation_estimate',option:false,source:r.cba};
}
function wnbaMakeContract(p,t,{year=state.year,salary,years=1,kind='veteran',round=1,pick=1,evidence='simulation_estimate',guaranteed=false}={},s=state){
 const r=wnbaRules(year,s);let amounts=Array.from({length:years},()=>salary??wnbaDemandDollars(p,t,year,s)),option=false,source=r.cba;
 if(kind==='rookie'){const scale=wnbaRookieSchedule(year,round,pick,s);amounts=scale.salaries;option=scale.option;evidence=scale.evidence;source=scale.source;}
 return {version:1,league:'wnba',signedYear:s.year,signedStamp:s===state?medicalStamp():Math.floor(Date.UTC(s.year,4,1)/86400000),startYear:year,ruleYear:r.year,kind,evidence,source,annual:amounts.map((base,i)=>({year:year+i,base,guaranteed:guaranteed||kind==='rookie'&&r.year>=2026&&round===1&&pick<=Math.min(4,s.teams?.length||4)&&i===0?base:0,option:option&&i===3?'pending':null})),minimumLinked:kind!=='rookie'&&amounts[0]===wnbaMinimum(p,year,s),lotteryPick:kind==='rookie'&&round===1&&pick<=Math.min(4,s.teams?.length||4),round:kind==='rookie'?round:null,pick:kind==='rookie'?pick:null};
}
function wnbaContractEnd(c){return c.annual.filter(a=>a.option!=='pending'&&a.option!=='declined').at(-1)?.year??c.startYear-1}
function wnbaAssign(p,c,year=state.year){p.wnbaContract=c;p.salary=wnbaMillions(c.annual.find(a=>a.year===year)?.base??c.annual[0].base);p.contractThrough=wnbaContractEnd(c)}
function wnbaAnnual(p,year){const c=p.wnbaContract;if(c)return c.annual.find(a=>a.year===year&&a.option!=='declined'&&a.option!=='pending');if((p.contractThrough??year)<year)return null;return {year,base:wnbaDollars(p.salary),guaranteed:wnbaDollars(p.salary)}}
function wnbaCapCharge(p,a,year,s=state){const r=wnbaRules(year,s);if(r.year===2026&&p.wnbaContract?.minimumLinked&&wnbaService(p,year)>=4)return 277500;const c=p.wnbaContract,mandatory=c&&(c.minimumLinked||[2020,2026].includes(r.year)&&c.signedYear<year&&(c.kind!=='rookie'||year>=(c.extensionStart||Infinity)));return (mandatory?Math.max(a.base,wnbaMinimum(p,year,s)):a.base)+(a.bonus||0)}
function wnbaLedger(t,year=state.year,s=state,roster=t.roster){let active=0,guaranteed=0;for(const p of roster){const a=wnbaAnnual(p,year);if(a){active+=wnbaCapCharge(p,a,year,s);guaranteed+=a.guaranteed||0;}}
 const dead=(s.wnbaFinance?.dead||[]).filter(d=>d.team===t.id&&d.year===year).reduce((v,d)=>v+d.amount,0)+(s.finances?.[t.id]?.dead||[]).filter(d=>d.through>=year).reduce((v,d)=>v+wnbaDollars(d.salary),0);
 const r=wnbaRules(year,s);return {year,active,guaranteed,dead,total:active+dead,cap:r.cap,room:r.cap-active-dead,floor:r.teamMinimum};
}
function wnbaValidateContract(p,t,c,s=state){if(c?.version!==1||c.league!=='wnba'||!Array.isArray(c.annual)||!c.annual.length||c.annual.length>4)return 'Invalid WNBA contract schedule.';
 const r=wnbaRules(c.startYear,s),first=c.annual[0].base;
 if(c.kind!=='rookie'&&c.annual.some(a=>a.guaranteed>0)&&t.roster.filter(q=>q.id!==p.id&&q.wnbaContract?.kind!=='rookie'&&q.wnbaContract?.annual.some(a=>a.guaranteed>0)).length>=r.protectedLimit)return 'This team has reached its protected-contract limit.';
 if(c.kind!=='rookie'&&c.annual.length>wnbaTermLimit(p,t,c.startYear,s))return 'This player is not eligible for that contract length.';
 const scale=c.kind==='rookie'?wnbaRookieSchedule(c.startYear,c.round,c.pick,s):null;
 for(let i=0;i<c.annual.length;i++){const a=c.annual[i];if(a.year!==c.startYear+i||!Number.isSafeInteger(a.base)||!Number.isSafeInteger(a.guaranteed)||a.guaranteed<0||a.guaranteed>a.base)return 'Invalid annual salary or guarantee.';
 if(scale){if(a.base!==scale.salaries[i])return 'Rookie salary must match the entry-cohort scale.';}
 else {if(a.base<wnbaMinimum(p,a.year,s)&&!(c.minimumLinked||[2020,2026].includes(a.year)&&c.signedYear<a.year)||a.base>wnbaMaximum(p,t,a.year,s))return 'Salary must be between '+wnbaFormat(wnbaMinimum(p,a.year,s))+' and '+wnbaFormat(wnbaMaximum(p,t,a.year,s))+' for this player.';if(i&&Math.abs(a.base-c.annual[i-1].base)>Math.floor(first*r.annualChange))return 'Annual salary change exceeds the applicable CBA limit.';}}
 return '';
}
function wnbaValidateTransaction(t,{add=[],remove=[],year=state.year,contracts=[],reserve=false}={},s=state){for(const {p,c} of contracts){const e=wnbaValidateContract(p,t,c,s);if(e)return e;}
 const roster=t.roster.filter(p=>!remove.includes(p.id)).concat(add),r=wnbaRules(year,s);const grants=(s.wnbaFinance?.hardships||[]).filter(g=>g.team===t.id&&g.year===year);const allowance=grants.reduce((n,g)=>n+(g.active&&roster.some(p=>p.id===g.playerId&&p.wnbaContract?.hardship)?g.amount:g.earned||0),0);if(roster.length>r.rosterMax+grants.filter(g=>g.active).length)return 'Transaction rejected: WNBA roster maximum is '+r.rosterMax+'.';
 const l=wnbaLedger(t,year,s,roster),reserved=reserve?Math.max(0,r.rosterMin-roster.length)*r.minimumTiers.at(-1)[1]:0;
 if(l.total+reserved>l.cap+allowance)return 'Transaction rejected: This transaction would exceed your team’s '+wnbaFormat(l.cap)+' '+(r.capEvidence==='simulation_estimate'?'estimated team budget':'salary cap')+' by '+wnbaFormat(l.total+reserved-l.cap-allowance)+(reserved?' including required roster reserves.':'.');
 return '';
}
function wnbaFormat(d){return '$'+Math.round(d).toLocaleString('en-US')}
function wnbaSettings(r){return {salaryCapType:'hard',minContract:r.minimumTiers[0][1]/1e6,maxContract:r.ordinaryMaximum/1e6,minimumPayroll:(r.teamMinimum||0)/1e6,minContractYears:1,maxContractYears:r.veteranMaxYears,rookieScaleEnabled:true,rookieTopMode:'fixed',rookieTopSalary:wnbaRookieSchedule(r.year,1,1,{year:r.year}).salaries[0]/1e6,rookieSalary:1,rookieYears:r.year>=2008?3:1,rookieRoundYears:r.year>=2008?'3,3,3':'1,1,1,1',rosterMin:r.rosterMin,rosterMax:r.rosterMax,luxuryTaxEnabled:false,tradeSalaryMatch:0,capInflation:0,inflationMin:0,inflationMax:0,inflationStdDev:0};}
function wnbaApplySettings(s,year=s.year){const r=wnbaRules(year,s);Object.assign(s.leagueSettings,wnbaSettings(r));s.salaryCap=r.cap/1e6;s.wnbaFinance.financialYear=r.year;}
function wnbaInitialize(s){s.wnbaFinance={version:1,league:'wnba',baseYear:s.year,financialYear:s.year,progression:true,dead:[],adjustments:[],repairVersion:0};wnbaApplySettings(s);const r=wnbaRules(s.year,s);
 for(const t of s.teams){const mins=t.roster.map(p=>wnbaMinimum(p,s.year,s)),desired=t.roster.map(p=>wnbaDemandDollars(p,t,s.year,s));const low=mins.reduce((a,b)=>a+b,0),want=desired.reduce((a,b)=>a+b,0);if(low>r.cap)throw Error('WNBA roster minimum salaries exceed the available team budget.');const factor=Math.min(1,(r.cap-low)/Math.max(1,want-low));
 for(let i=0;i<t.roster.length;i++){const p=t.roster[i];p.wnbaService={seasons:wnbaService(p,s.year),asOf:s.year,evidence:'simulation_estimate'};p.wnbaRights={seasons:[]};const amount=mins[i]+Math.floor((desired[i]-mins[i])*factor);wnbaAssign(p,wnbaMakeContract(p,t,{year:s.year,salary:amount,years:1},s),s.year);}
 const error=wnbaValidateTransaction(t,{year:s.year},s);if(error)throw Error(error);}
 for(const p of s.free){p.wnbaService={seasons:wnbaService(p,s.year),asOf:s.year,evidence:'simulation_estimate'};p.salary=wnbaMillions(wnbaDemandDollars(p,s.teams[0],s.year,s));delete p.wnbaContract;delete p.contractThrough;}
 return s;
}
function wnbaTransitionError(s=state,year=s.year+1){if(s.wnbaFinance.progression&&year===2026&&s.teams.some(t=>t.roster.some(p=>p.wnbaContract?.kind==='rookie'&&p.wnbaContract.startYear<2026&&p.wnbaContract.annual.some(a=>a.year>=2026&&a.year<(p.wnbaContract.extensionStart||Infinity)&&a.option!=='declined'))))return '2026 rookie transition requires a verified cohort conversion that is not yet available. Signed contracts are preserved. Freeze the financial environment in WNBA settings to continue using the existing scale.';return '';}
function wnbaAdvance(s=state){wnbaApplySettings(s);for(const t of s.teams)for(const p of t.roster){const c=p.wnbaContract;if(!c)continue;for(const a of c.annual){if(a.option==='pending'&&s.year>c.startYear+2)a.option='declined';if(a.year<s.year||a.option==='declined')continue;const mandatory=c.minimumLinked||s.wnbaFinance.progression&&[2020,2026].includes(s.year)&&c.signedYear<s.year&&(c.kind!=='rookie'||a.year>=(c.extensionStart||Infinity));const min=wnbaMinimum(p,a.year,s);if(mandatory&&a.base<min){s.wnbaFinance.adjustments.push({id:p.id,year:a.year,from:a.base,to:min,reason:'CBA minimum salary adjustment'});a.guaranteed=a.base?Math.round(a.guaranteed/a.base*min):0;a.base=min;}}
 const annual=wnbaAnnual(p,s.year);if(annual)p.salary=wnbaMillions(annual.base);p.contractThrough=wnbaContractEnd(c);p.wnbaRights??={seasons:[]};if(!p.wnbaRights.seasons.some(v=>v.year===s.year-1))p.wnbaRights.seasons.push({year:s.year-1,teamKey:t.key});p.wnbaRights.seasons=p.wnbaRights.seasons.slice(-3);}
 for(const t of s.teams)if(t.id!==controlledTeamId()||simulationAutopilot())for(const p of t.roster){const c=p.wnbaContract,a=c?.annual.find(a=>a.option==='pending');if(a&&s.year===c.startYear+2){a.option='exercised';if(wnbaValidateTransaction(t,{year:a.year,reserve:true},s))a.option='declined';else {a.guaranteed=a.base;if(c.ruleYear>=2026)c.annual[2].guaranteed=c.annual[2].base;}p.contractThrough=wnbaContractEnd(c);}}
 s.wnbaFinance.conflicts=s.teams.map(t=>({team:t.id,excess:Math.max(0,wnbaLedger(t,s.year,s).total-wnbaRules(s.year,s).cap)})).filter(c=>c.excess);}
