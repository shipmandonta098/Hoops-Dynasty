/* Owner offseason grade. Every team is snapshotted when the playoffs end (top-eight roster strength, payroll, owned
   picks, roster ages/potentials/contracts) and graded when free agency closes, before the next season starts.
   Categories: roster improvement, draft, free agency, trades, finances and fit with the owner's plan, weighted by owner
   type into a 0–100 score and a letter grade. The user's owner reacts (smaller patience swing than the season review);
   every grade is kept for the league table. Moves are read from the before/after difference, so every route counts
   (user and CPU trades, signings, re-signings, the draft). Grading never draws random numbers. */
const OFFSEASON_CATEGORIES=[['roster','Roster improvement'],['draft','Draft'],['freeAgency','Free agency'],['trades','Trades'],['finances','Finances'],['fit','Fit with owner plan']];
// Weights by owner type: Process-Trusters weight the draft and youth, the Tycoon immediate strength, the
// Penny-Pincher payroll, the Hometown Fan keeping the core.
const OFFSEASON_WEIGHTS={
 balanced:{roster:.25,draft:.15,freeAgency:.2,trades:.15,finances:.1,fit:.15},
 tycoon:{roster:.35,draft:.05,freeAgency:.2,trades:.15,finances:.05,fit:.2},
 penny:{roster:.2,draft:.15,freeAgency:.15,trades:.1,finances:.25,fit:.15},
 hometown:{roster:.25,draft:.1,freeAgency:.25,trades:.1,finances:.1,fit:.2},
 rebuilder:{roster:.1,draft:.25,freeAgency:.15,trades:.15,finances:.1,fit:.25}};
// A category with no activity (no picks, no signings, no trades) scores a neutral 75 and counts at this share of its
// weight, so standing pat is judged mostly on the roster you kept.
const OFFSEASON_INACTIVE_WEIGHT=.35,OFFSEASON_NEUTRAL=75,OFFSEASON_KEEP_SEASONS=10;
const OFFSEASON_LETTERS=[[97,'A+'],[93,'A'],[90,'A-'],[87,'B+'],[83,'B'],[80,'B-'],[77,'C+'],[73,'C'],[70,'C-'],[67,'D+'],[63,'D'],[60,'D-'],[0,'F']];
const OFFSEASON_PATIENCE={'A+':6,A:5,'A-':4,'B+':3,B:2,'B-':1,'C+':0,C:0,'C-':-1,'D+':-3,D:-4,'D-':-6,F:-8};
const OFFSEASON_OWNER_SHORT={balanced:'Balanced',tycoon:'Tycoon',penny:'Penny-Pincher',hometown:'Hometown',rebuilder:'Process'};
function offseasonLetter(score){return OFFSEASON_LETTERS.find(([min])=>score>=min)[1]}
function offseasonBand(letter){return letter[0]}
function offseasonStore(){return state.offseasonGrades??={version:1,hidden:false,snapshot:null,seasons:[]}}
function offseasonClamp(n,lo=0,hi=100){return Math.max(lo,Math.min(hi,n))}
// Same projection as the Opening Night "top-eight roster" figure: average OVR of the eight best players.
function offseasonStrength(roster){const top=roster.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8);return top.reduce((n,p)=>n+p.ovr,0)/Math.max(1,top.length)}
function offseasonTopAge(roster){const top=roster.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8);return top.reduce((n,p)=>n+p.age,0)/Math.max(1,top.length)}
function offseasonUpside(roster){return roster.filter(p=>p.age<=24).reduce((n,p)=>n+Math.max(0,p.pot-p.ovr),0)}
// Plan of the owner: contend (Tycoon), rebuild (Process-Truster) or balanced (everyone else).
function offseasonPlan(type){return type==='tycoon'?'contend':type==='rebuilder'?'rebuild':'balanced'}
// Player value on the trade scale (2^((OVR−60)/6), age falloff, upside), weighted by the owner's plan the same way
// trade mindsets weight it, without the team-specific need/contract terms.
function offseasonPlayerValue(p,plan){const upside=Math.max(0,p.pot-p.ovr)*Math.max(0,29-p.age)/90,slope=plan==='contend'?.025:plan==='rebuild'?.065:.045,mult=plan==='contend'?.3:plan==='rebuild'?1.5:.8;return 2**((p.ovr-60)/6)*Math.max(.3,1-Math.max(0,p.age-28)*slope)*(1+upside*mult)}
// Pick value: the trade baseline (slot curve, distance discount) with the plan's multiplier.
function offseasonPickValue(p,plan){const projected=tradePickProjection(p),fraction=(projected.slot-1)/Math.max(1,projected.count-1),base=p.round===1?4+36*(1-fraction)**2:(1+5*(1-fraction)**2)/(p.round-1);return base*.85**Math.max(0,p.year-state.year)*(plan==='rebuild'?1.3:plan==='contend'?.7:1)}
function offseasonPickUniverse(){const out=[],rules=leagueRules();for(let year=state.year;year<state.year+rules.tradePickSeasons;year++)for(const c of state.teams)for(let round=1;round<=(year===state.year?draftRoundCount():rules.draftRounds);round++)out.push({year,origin:c.id,round});return out}
// What this league actually pays for a player's OVR: average salary of players 23 and older (past rookie scale) within
// two OVR points, widened until at least five players are found.
function offseasonSalaryTable(){const rows=state.teams.flatMap(t=>t.roster).filter(p=>p.age>=23&&p.salary>0),table=new Map();
 for(let ovr=40;ovr<=99;ovr++){let near=[];for(let r=2;r<=12&&near.length<5;r+=2)near=rows.filter(p=>Math.abs(p.ovr-ovr)<=r);table.set(ovr,near.length?near.reduce((n,p)=>n+p.salary,0)/near.length:1)}return table}
function offseasonMarketSalary(p,table){return Math.max(.5,table.get(Math.max(40,Math.min(99,p.ovr)))||1)}
function offseasonTaxLine(){const r=leagueRules();return r.luxuryTaxEnabled?r.luxuryTaxThreshold:null}
function offseasonPlayerRow(p){return {id:p.id,name:String(p.name).slice(0,80),ovr:p.ovr,pot:p.pot,age:p.age,salary:Math.round(p.salary*1000)/1000,through:Number.isInteger(p.contractThrough)?p.contractThrough:state.year}}

// ---- Snapshot (playoffs end) ----
function offseasonSnapshot(){const store=offseasonStore();if(store.snapshot?.year===state.year)return store.snapshot;
 return store.snapshot={year:state.year,picks:offseasonPickUniverse().map(p=>[tradePickKey(p),tradePickOwner(p)]),
  teams:state.teams.filter(t=>!expansionPendingSeason(t)).map(t=>({id:t.id,strength:Math.round(offseasonStrength(t.roster)*100)/100,payroll:Math.round(ownerPayroll(t)*1000)/1000,roster:t.roster.map(offseasonPlayerRow)}))}}
// Snapshot only before the draft starts: a save opened later in the offseason has no fair baseline that year.
const offseasonFinalizeBefore=ownerFinalize;ownerFinalize=function(...args){const r=offseasonFinalizeBefore(...args);if(state.champion!==null&&!(state.draft?.year===state.year&&state.draft.picks.length)&&state.freeAgency?.year!==state.year)offseasonSnapshot();return r};

// ---- Grading (free agency closes) ----
function offseasonLocate(){const where=new Map();for(const t of state.teams)for(const p of t.roster)where.set(p.id,{team:t.id,p});for(const p of state.free)where.set(p.id,{team:-1,p});for(const r of state.draftRights||[])if(!where.has(r.player.id))where.set(r.player.id,{team:-2,p:r.player});return where}
function offseasonGradeTeam(club,snap,ctx){
 const owner=ownerFor(club),type=owner.type,plan=offseasonPlan(type),weights=OFFSEASON_WEIGHTS[type],base=snap.teams.find(s=>s.id===club.id);
 const {where,snapAt,draftPicks,board,strengthRank,pickOwners,salaries}=ctx,year=snap.year,moves=[],active={};
 const label=p=>p.name+' ('+p.ovr+' OVR)',weightOf=p=>Math.min(2.5,2**((p.ovr-70)/6));
 // Retired players (no longer in the league) leave the baseline: the GM did not choose that.
 const kept=base.roster.filter(r=>where.has(r.id)),baseRoster=kept.map(r=>({...r})),now=club.roster;
 const strength=offseasonStrength(now),baseStrength=offseasonStrength(baseRoster),delta=strength-baseStrength,pct=strengthRank.get(club.id);
 // Roster improvement: change in projected strength plus where the roster now stands (keeping a good roster is fine).
 const roster=offseasonClamp(77+delta*6+(pct-.5)*28);
 // Draft: each pick against where the player stood on the neutral pre-draft board.
 const mine=draftPicks.filter(p=>p.team===club.id);let draft=OFFSEASON_NEUTRAL;
 if(mine.length){active.draft=true;let sum=0,w=0;for(const pick of mine){const rank=board.get(pick.id),surplus=(pick.number-rank)/state.teams.length,wt=pick.round===1?1:.4;sum+=surplus*wt;w+=wt;moves.push({impact:surplus*14*wt,text:'Drafted '+pick.name+' at #'+pick.number+' (No. '+rank+' on the board)'})}draft=offseasonClamp(OFFSEASON_NEUTRAL+offseasonClamp(sum/w*45,-30,25))}
 // Free agency: value per dollar on signings, key players re-signed or lost.
 const nowIds=new Set(now.map(p=>p.id)),drafted=new Set(mine.map(p=>p.id));let fa=0;
 for(const p of now){if(drafted.has(p.id))continue;const was=snapAt.get(p.id);if(was?.team===club.id){const row=base.roster.find(r=>r.id===p.id);if(row&&row.through<=year&&(p.contractThrough??year)>year){const ratio=offseasonMarketSalary(p,salaries)/Math.max(.5,p.salary),impact=(2.5+offseasonClamp(ratio-1,-.6,.5)*5)*weightOf(p);fa+=impact;active.freeAgency=true;moves.push({impact,text:'Re-signed '+label(p)+' at $'+p.salary.toFixed(1)+'M'})}continue}
  if(was&&was.team>=0&&was.row.through>year)continue; // traded in
  const ratio=offseasonMarketSalary(p,salaries)/Math.max(.5,p.salary),impact=offseasonClamp(ratio-1,-.6,.6)*6*weightOf(p)+(p.ovr>=75?1:0);fa+=impact;active.freeAgency=true;moves.push({impact,text:'Signed '+label(p)+' at $'+p.salary.toFixed(1)+'M'+(ratio>=1.25?' (a bargain)':ratio<=.75?' (an overpay)':'')})}
 const topIds=new Set(baseRoster.slice().sort((a,b)=>offseasonPlayerValue(b,'balanced')-offseasonPlayerValue(a,'balanced')).slice(0,5).map(r=>r.id));
 for(const r of baseRoster){if(nowIds.has(r.id)||r.through>year)continue;const loc=where.get(r.id),p=loc.p,impact=-(topIds.has(r.id)?4:.5)*weightOf(p);fa+=impact;active.freeAgency=true;moves.push({impact,text:(loc.team>=0?'Lost '+label(p)+' to '+state.teams[loc.team].abbr:'Let '+label(p)+' walk')+' in free agency'})}
 const freeAgency=active.freeAgency?offseasonClamp(OFFSEASON_NEUTRAL+offseasonClamp(fa,-40,25)):OFFSEASON_NEUTRAL;
 // Trades: value in vs out per trading partner, players and picks, weighted by the owner's plan.
 const partners=new Map(),side=id=>{if(!partners.has(id))partners.set(id,{inP:[],outP:[],inK:[],outK:[]});return partners.get(id)};
 for(const p of now){const was=snapAt.get(p.id);if(was&&was.team>=0&&was.team!==club.id&&was.row.through>year&&!drafted.has(p.id))side(was.team).inP.push(p)}
 for(const r of baseRoster){if(nowIds.has(r.id)||r.through<=year)continue;const loc=where.get(r.id);if(loc.team>=0)side(loc.team).outP.push(loc.p)}
 for(const p of offseasonPickUniverse()){const key=tradePickKey(p),before=pickOwners.get(key),after=tradePickOwner(p);if(before===after||before===undefined)continue;if(after===club.id)side(before).inK.push(p);else if(before===club.id)side(after).outK.push(p)}
 let trade=0;for(const [other,s] of partners){if(!s.inP.length&&!s.outP.length&&!s.inK.length&&!s.outK.length)continue;active.trades=true;
  const valIn=s.inP.reduce((n,p)=>n+offseasonPlayerValue(p,plan),0)+s.inK.reduce((n,p)=>n+offseasonPickValue(p,plan),0),valOut=s.outP.reduce((n,p)=>n+offseasonPlayerValue(p,plan),0)+s.outK.reduce((n,p)=>n+offseasonPickValue(p,plan),0);
  const impact=(valIn-valOut)/Math.max(1,valIn,valOut)*14;trade+=impact;const names=(ps,ks)=>[...ps.map(p=>p.name),...ks.map(tradePickLabel)].join(', ')||'nothing';
  moves.push({impact,text:'Trade with '+state.teams[other].abbr+': got '+names(s.inP,s.inK)+' for '+names(s.outP,s.outK)})}
 const trades=active.trades?offseasonClamp(OFFSEASON_NEUTRAL+offseasonClamp(trade,-40,25)):OFFSEASON_NEUTRAL;
 // Finances: next season's payroll against the tax line, money tied up in players 31 and older.
 const payroll=faPayroll(club),cap=salaryCap(),tax=offseasonTaxLine(),over=tax?Math.max(0,payroll-tax):0,old=now.filter(p=>p.age>=31).reduce((n,p)=>n+p.salary*Math.max(0,(p.contractThrough??year)-(year+1)),0);
 let finances=80-Math.min(35,over/Math.max(1,tax||cap)*100*(type==='tycoon'?.4:type==='penny'?2:1.2))-Math.min(15,old/cap*25);
 if(type!=='tycoon'&&payroll<cap*.9)finances+=3;if(type==='penny')finances+=offseasonClamp((base.payroll-payroll)/cap*60,-15,10);finances=offseasonClamp(finances);
 // Fit with the owner's plan.
 const contendFit=offseasonClamp(75+delta*7+(pct-.5)*30),pickValue=owned=>offseasonPickUniverse().filter(p=>owned(p)===club.id).reduce((n,p)=>n+offseasonPickValue(p,'rebuild'),0);
 const rebuildFit=offseasonClamp(76+(offseasonTopAge(baseRoster)-offseasonTopAge(now))*3+(offseasonUpside(now)-offseasonUpside(baseRoster))*.25+(pickValue(tradePickOwner)-pickValue(p=>pickOwners.get(tradePickKey(p))))*.3);
 const coreKept=[...topIds].slice(0,3).filter(id=>nowIds.has(id)).length/Math.max(1,Math.min(3,topIds.size));
 const fit=type==='tycoon'?contendFit:type==='rebuilder'?rebuildFit:type==='penny'?offseasonClamp(75+(base.payroll-payroll)/cap*80-(over>0?20:0)):type==='hometown'?offseasonClamp(62+coreKept*24+delta*2):(contendFit+rebuildFit)/2;
 const categories={roster,draft,freeAgency,trades,finances,fit},isActive=k=>!['draft','freeAgency','trades'].includes(k)||active[k];
 let total=0,weight=0;for(const [k] of OFFSEASON_CATEGORIES){const w=weights[k]*(isActive(k)?1:OFFSEASON_INACTIVE_WEIGHT);total+=categories[k]*w;weight+=w}
 const score=Math.round(offseasonClamp(total/weight)),grade=offseasonLetter(score);
 for(const k of Object.keys(categories))categories[k]=Math.round(categories[k]);
 const notes=offseasonNotes(moves,{delta,pct,strength,club});
 return {id:club.id,score,grade,owner:type,categories,active:Object.keys(active).sort(),strength:Math.round(strength*10)/10,change:Math.round(delta*10)/10,notes};
}
function offseasonNotes(moves,{delta,pct}){const sorted=moves.slice().sort((a,b)=>b.impact-a.impact),notes=[],best=sorted[0],worst=sorted.at(-1);
 const showBest=best&&best.impact>.5;if(showBest)notes.push('Best move: '+best.text+'.');if(worst&&worst.impact<-.5&&!(showBest&&worst===best))notes.push('Worst move: '+worst.text+'.');
 const rank=pct>=.75?'one of the league’s strongest rosters':pct<=.25?'one of the league’s weakest rosters':'a mid-pack roster';
 notes.push(!moves.length?'Stood pat with '+rank+'.':'Top-eight strength '+(Math.abs(delta)<.15?'unchanged':(delta>0?'up ':'down ')+Math.abs(delta).toFixed(1))+' — '+rank+'.');
 return notes.slice(0,3).map(s=>s.slice(0,240))}
// Shared inputs for grading every team against one snapshot.
function offseasonContext(snap){const where=offseasonLocate(),snapAt=new Map();for(const t of snap.teams)for(const row of t.roster)snapAt.set(row.id,{team:t.id,row});
 const d=state.draft?.year===state.year?state.draft:null,draftPicks=d?.picks||[],pool=[...draftPicks.map(p=>({id:p.id,ovr:p.ovr,pot:p.pot})),...(d?.prospects||[]).map(p=>({id:p.id,ovr:p.ovr,pot:p.pot}))].sort((a,b)=>b.ovr*.55+b.pot*.45-(a.ovr*.55+a.pot*.45)||a.id-b.id),board=new Map(pool.map((p,i)=>[p.id,i+1]));
 const graded=state.teams.filter(t=>snap.teams.some(s=>s.id===t.id)),ordered=graded.slice().sort((a,b)=>offseasonStrength(a.roster)-offseasonStrength(b.roster)||a.id-b.id),strengthRank=new Map(ordered.map((t,i)=>[t.id,ordered.length>1?i/(ordered.length-1):.5]));
 return {graded,where,snapAt,draftPicks,board,strengthRank,pickOwners:new Map(snap.picks),salaries:offseasonSalaryTable()}}
function offseasonGradeAll(){const store=offseasonStore(),snap=store.snapshot,done=store.seasons.find(s=>s.year===state.year);if(done)return done;if(!snap||snap.year!==state.year)return null;
 const ctx=offseasonContext(snap),season={year:state.year,teams:ctx.graded.map(t=>offseasonGradeTeam(t,snap,ctx))};
 store.seasons=[...store.seasons.filter(s=>s.year!==state.year),season].sort((a,b)=>a.year-b.year).slice(-OFFSEASON_KEEP_SEASONS);store.snapshot=null;
 offseasonApply(season);return season}
// Owner quotes by grade band and owner type.
const OFFSEASON_QUOTES={
 A:{balanced:'That is exactly how a summer should go. Smart, measured, and better on paper.',tycoon:'Now THAT is a contender’s summer. Bring me the parade.',penny:'Better roster, sensible books. I could get used to this.',hometown:'The fans are going to love this group. You kept our people and made us better.',rebuilder:'This is the process working. The future just got brighter.'},
 B:{balanced:'A solid offseason. Not flashy, but we’re in a good spot.',tycoon:'Good work. I still want more, but this is a team that can win.',penny:'Reasonable moves at reasonable prices. Keep it that way.',hometown:'Good summer. The core is intact and the town is happy.',rebuilder:'Steady progress. Keep stacking young talent and picks.'},
 C:{balanced:'An average summer. I expected a little more from the front office.',tycoon:'We stood still while others got better. That isn’t how titles are won.',penny:'Nothing terrible, nothing impressive. Watch the spending.',hometown:'Some of these changes will be a hard sell to our season-ticket holders.',rebuilder:'I’m patient, but I need to see the young core and the pick cupboard grow.'},
 D:{balanced:'This summer set us back. We need to talk about direction.',tycoon:'This is not a championship roster. Fix it.',penny:'I don’t like where this payroll is heading.',hometown:'The fans are upset, and frankly so am I.',rebuilder:'That was short-term thinking. It cost us the future.'},
 F:{balanced:'That was a disaster of an offseason. My patience is wearing thin.',tycoon:'Unacceptable. We got worse when we needed to get better.',penny:'You set money on fire this summer. That ends now.',hometown:'You let the heart of this team walk. The city won’t forget it.',rebuilder:'You traded away our future. That is the one thing I asked you not to do.'}};
function offseasonQuote(letter,type){return (OFFSEASON_QUOTES[offseasonBand(letter)]||OFFSEASON_QUOTES.C)[type]||OFFSEASON_QUOTES.C.balanced}
// The user's owner reacts (patience, GM career history, news); every team's grade feeds the league table and news.
function offseasonApply(season){const store=offseasonStore(),you=controlledTeamId(),mine=season.teams.find(t=>t.id===you);
 if(mine){mine.quote=offseasonQuote(mine.grade,mine.owner);mine.patience=store.hidden?0:OFFSEASON_PATIENCE[mine.grade];
  if(!store.hidden){const owner=ownerFor(state.teams[you]);if(!owner.fired){owner.patience=Math.max(0,Math.min(100,owner.patience+mine.patience));if(owner.patience===0)owner.fired=true}
   const club=state.teams[you];addNewsItem({category:'Franchise',headline:'Ownership grades the '+club.city+' '+club.name+' offseason: '+mine.grade+' ('+mine.score+').',detail:mine.notes.join(' '),teams:[you]});}
  const tenure=typeof gmActiveTenure==='function'?gmActiveTenure():null;if(tenure&&tenure.teamId===you)gmSeasonRecord(tenure,season.year).offseasonGrade={score:mine.score,grade:mine.grade}}
 if(!store.hidden&&season.teams.length>1){const sorted=season.teams.slice().sort((a,b)=>b.score-a.score||a.id-b.id),top=sorted[0],low=sorted.at(-1);addNewsItem({category:'League',headline:'Offseason grades: '+state.teams[top.id].abbr+' earns top marks ('+top.grade+'); '+state.teams[low.id].abbr+' grades lowest ('+low.grade+').',detail:'See Offseason grades for every team.',teams:[top.id,low.id]})}}
// Grade when free agency closes; fall back to the season rollover for any other route.
const offseasonFinishBefore=finishFreeAgency;finishFreeAgency=async function(...args){const r=await offseasonFinishBefore(...args);if(state.freeAgency?.year===state.year&&state.freeAgency.phase==='complete'&&offseasonStore().snapshot?.year===state.year){offseasonGradeAll();if(!simulationHeadless()){await save();if(!offseasonStore().hidden&&controlledTeamId()>=0&&offseasonLatest()?.teams.some(t=>t.id===controlledTeamId()))go('Offseason grades')}}return r};
const offseasonNewSeasonBefore=newSeason;newSeason=function(...args){if(state.champion!==null&&draftComplete()&&state.freeAgency?.year===state.year&&state.freeAgency.phase==='complete'&&offseasonStore().snapshot?.year===state.year)offseasonGradeAll();return offseasonNewSeasonBefore(...args)};
function offseasonLatest(){return offseasonStore().seasons.at(-1)||null}

// ---- Screen: your review and the league table ----
let offseasonUI={year:null,sort:'score',dir:-1};
function offseasonSort(key){offseasonUI.dir=offseasonUI.sort===key?-offseasonUI.dir:(key==='team'?1:-1);offseasonUI.sort=key;render()}
function offseasonSeason(year){offseasonUI.year=Number(year);render()}
function offseasonToggleHidden(){if(!commissionerOn())return;const store=offseasonStore(),from=store.hidden;store.hidden=!from;commissionerLog({what:'Offseason grades',from:from?'Hidden':'Shown',to:store.hidden?'Hidden':'Shown'});save();render()}
function offseasonGradeBadge(letter){return `<span class="offseason-grade grade-${offseasonBand(letter).toLowerCase()}">${escapeHTML(letter)}</span>`}
function offseasonReviewCard(row,year){const club=state.teams[row.id],weights=OFFSEASON_WEIGHTS[row.owner];
 return `<section class="panel offseason-review"><div class="panelhead"><div><div class="eyebrow">OFFSEASON REVIEW · ${escapeHTML(seasonLabel(year))}</div><h2>${escapeHTML(club.city+' '+club.name)}</h2><p>${escapeHTML(OWNER_TYPES[row.owner].name)} · Patience ${row.patience>0?'+':''}${row.patience??0}</p></div><div class="offseason-score">${offseasonGradeBadge(row.grade)}<strong>${row.score}</strong><small>/ 100</small></div></div>
 ${row.quote?`<blockquote class="offseason-quote">“${escapeHTML(row.quote)}”</blockquote>`:''}<ul class="offseason-notes">${row.notes.map(n=>`<li>${escapeHTML(n)}</li>`).join('')}</ul>
 <div class="tablewrap"><table><thead><tr><th>Category</th><th>Score</th><th>Grade</th><th>Weight</th></tr></thead><tbody>${OFFSEASON_CATEGORIES.map(([k,name])=>{const idle=['draft','freeAgency','trades'].includes(k)&&!row.active.includes(k);return `<tr><td>${name}${idle?' <small class="muted">(no moves)</small>':''}</td><td>${row.categories[k]}</td><td>${offseasonGradeBadge(offseasonLetter(row.categories[k]))}</td><td>${Math.round(weights[k]*100*(idle?OFFSEASON_INACTIVE_WEIGHT:1))}%</td></tr>`}).join('')}</tbody></table></div></section>`}
// The shell adds the page banner (PAGE_HEADERS entry).
function offseasonGradesView(){const store=offseasonStore(),header='',tools=commissionerOn()?`<p class="note">${commissionerBadge()} Offseason grades are ${store.hidden?'hidden':'shown'}. <button type="button" onclick="offseasonToggleHidden()">${store.hidden?'Show':'Hide'} offseason grades</button></p>`:'';
 if(store.hidden)return header+tools+'<section class="panel"><p>Offseason grades are hidden by the commissioner.</p></section>';
 if(!store.seasons.length)return header+tools+`<section class="panel"><p>No offseason has been graded yet. Every team is snapshotted when the playoffs end and graded when free agency closes.</p></section>`;
 const season=store.seasons.find(s=>s.year===offseasonUI.year)||store.seasons.at(-1),you=controlledTeamId(),mine=season.teams.find(t=>t.id===you);
 const value=(row,k)=>k==='team'?state.teams[row.id].city+' '+state.teams[row.id].name:k==='owner'?OWNER_TYPES[row.owner].name:k==='score'?row.score:k==='change'?row.change:row.categories[k];
 const rows=season.teams.slice().sort((a,b)=>{const x=value(a,offseasonUI.sort),y=value(b,offseasonUI.sort);return (typeof x==='string'?x.localeCompare(y):x-y)*offseasonUI.dir||b.score-a.score||a.id-b.id});
 const head=(k,label)=>`<th aria-sort="${offseasonUI.sort===k?(offseasonUI.dir>0?'ascending':'descending'):'none'}"><button type="button" class="sortbutton" onclick="offseasonSort('${k}')">${label}${offseasonUI.sort===k?(offseasonUI.dir>0?' ▲':' ▼'):''}</button></th>`;
 const picker=store.seasons.length>1?`<label>Season <select onchange="offseasonSeason(this.value)">${store.seasons.slice().reverse().map(s=>`<option value="${s.year}" ${s.year===season.year?'selected':''}>${escapeHTML(seasonLabel(s.year))}</option>`).join('')}</select></label>`:'';
 return header+tools+(mine?offseasonReviewCard(mine,season.year):'')+`<section class="panel"><div class="panelhead"><h2>Offseason grades · ${escapeHTML(seasonLabel(season.year))}</h2>${picker}</div><div class="tablewrap"><table class="offseason-table"><thead><tr>${head('team','Team')}${head('score','Grade')}${head('change','Strength Δ')}${OFFSEASON_CATEGORIES.map(([k,name])=>head(k,name)).join('')}${head('owner','Owner')}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.id===you?'you':''}"><td>${escapeHTML(state.teams[r.id].city+' '+state.teams[r.id].name)}</td><td>${offseasonGradeBadge(r.grade)} ${r.score}</td><td>${r.change>0?'+':''}${r.change.toFixed(1)}</td>${OFFSEASON_CATEGORIES.map(([k])=>`<td>${r.categories[k]}</td>`).join('')}<td title="${escapeHTML(OWNER_TYPES[r.owner].name)}">${OFFSEASON_OWNER_SHORT[r.owner]}</td></tr>`).join('')}</tbody></table></div></section>`}
const offseasonBodyBefore=careerBodyContent;careerBodyContent=function(){if(view==='Offseason grades'&&(ownerCanManage()||controlledTeamId()<0))return offseasonGradesView();return offseasonBodyBefore()};
if(typeof COMMISSIONER_TOOL_SCREENS!=='undefined')COMMISSIONER_TOOL_SCREENS.push(['Offseason grades','Show or hide offseason grades']);

// ---- Save checker ----
function readOffseasonGrades(raw,bad,data){if(raw===undefined)return undefined;
 const int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,num=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi,str=(s,n)=>typeof s==='string'&&s.length<=n,team=id=>int(id,0,data.teams.length-1),letters=OFFSEASON_LETTERS.map(x=>x[1]);
 if(!raw||typeof raw!=='object'||raw.version!==1||typeof raw.hidden!=='boolean'||!Array.isArray(raw.seasons)||raw.seasons.length>OFFSEASON_KEEP_SEASONS)bad('invalid offseason grades.');
 let snapshot=null;if(raw.snapshot!==null){const s=raw.snapshot;if(!s||!int(s.year,1900,10000)||!Array.isArray(s.picks)||s.picks.length>20000||!Array.isArray(s.teams)||s.teams.length>data.teams.length)bad('invalid offseason snapshot.');
  const picks=s.picks.map(x=>{if(!Array.isArray(x)||x.length!==2||!str(x[0],40)||!/^\d+:\d+:\d+$/.test(x[0])||!team(x[1]))bad('invalid offseason snapshot pick.');return [x[0],x[1]]});
  const ids=new Set(),teams=s.teams.map(t=>{if(!t||!team(t.id)||ids.has(t.id)||!num(t.strength,0,100)||!num(t.payroll,0,100000)||!Array.isArray(t.roster)||t.roster.length>40)bad('invalid offseason snapshot team.');ids.add(t.id);
   return {id:t.id,strength:t.strength,payroll:t.payroll,roster:t.roster.map(r=>{if(!r||!int(r.id,0,100000000)||!str(r.name,80)||!int(r.ovr,1,99)||!int(r.pot,1,99)||!int(r.age,10,70)||!num(r.salary,0,10000)||!int(r.through,1900,10100))bad('invalid offseason snapshot player.');return {id:r.id,name:r.name,ovr:r.ovr,pot:r.pot,age:r.age,salary:r.salary,through:r.through}})}});
  snapshot={year:s.year,picks,teams}}
 const years=new Set(),seasons=raw.seasons.map(s=>{if(!s||!int(s.year,1900,10000)||years.has(s.year)||!Array.isArray(s.teams)||s.teams.length>data.teams.length)bad('invalid offseason season.');years.add(s.year);const ids=new Set();
  return {year:s.year,teams:s.teams.map(t=>{if(!t||!team(t.id)||ids.has(t.id)||!int(t.score,0,100)||t.grade!==offseasonLetter(t.score)||!Object.hasOwn(OWNER_TYPES,t.owner)||!t.categories||OFFSEASON_CATEGORIES.some(([k])=>!int(t.categories[k],0,100))||!Array.isArray(t.active)||t.active.some(k=>!['draft','freeAgency','trades'].includes(k))||!num(t.strength,0,100)||!num(t.change,-100,100)||!Array.isArray(t.notes)||t.notes.length>3||t.notes.some(n=>!str(n,240))||t.quote!==undefined&&!str(t.quote,300)||t.patience!==undefined&&!int(t.patience,-8,6))bad('invalid offseason grade.');ids.add(t.id);
   return {id:t.id,score:t.score,grade:t.grade,owner:t.owner,categories:Object.fromEntries(OFFSEASON_CATEGORIES.map(([k])=>[k,t.categories[k]])),active:[...t.active],strength:t.strength,change:t.change,notes:[...t.notes],...(t.quote!==undefined?{quote:t.quote}:{}),...(t.patience!==undefined?{patience:t.patience}:{})}})}});
 return {version:1,hidden:raw.hidden,snapshot,seasons:seasons.sort((a,b)=>a.year-b.year)}}
const offseasonValidateBefore=validateCareerData;validateCareerData=function(raw){const data=offseasonValidateBefore(raw),bad=m=>{throw Error('Invalid save: '+m)};
 if(raw?.offseasonGrades!==undefined)data.offseasonGrades=readOffseasonGrades(raw.offseasonGrades,bad,data);
 // GM career history: a season record may carry the offseason grade.
 for(const t of data.gmCareer?.tenures||[])for(const r of t.records||[])if(r.offseasonGrade!==undefined){const g=r.offseasonGrade;if(!g||!Number.isInteger(g.score)||g.score<0||g.score>100||g.grade!==offseasonLetter(g.score)||Object.keys(g).length!==2)bad('invalid GM offseason grade.')}
 return data};
