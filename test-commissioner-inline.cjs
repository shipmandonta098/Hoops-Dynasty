// Commissioner tools on game screens: shown only while commissioner mode is on (gold badge), each inline control runs
// the same commissioner logic as the old panel (compared on the same starting state), every action asks for
// confirmation, declining changes nothing, and every change is logged (what, when, before → after) and saved.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:81,strictDOM:false});l.setRandomSeed(81);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
// Browser stand-ins: confirm/prompt answers, FormData from a plain entries list, a profile dialog that records inserts.
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Inline';state=validateCareerData(buildSetupCareer(d));
 var answer=true,questions=[],promptValue=null;confirm=q=>{questions.push(q);return answer};prompt=()=>promptValue;FormData=function(form){return form.entries};
 var inserted=[],dialog={open:false,className:'',innerHTML:'',removeAttribute(){},setAttribute(){},showModal(){this.open=true},close(){this.open=false},querySelector:()=>({insertAdjacentHTML:(w,h)=>inserted.push(h),appendChild(){},append(){},prepend(){},querySelector(){return null},querySelectorAll(){return []},classList:{add(){},remove(){},toggle(){}},setAttribute(){},style:{}}),querySelectorAll(){return []}};
 const getEl=document.getElementById;document.getElementById=id=>id==='profile'?dialog:getEl(id);
 var last=null;const inlineAction=commissionerAction;commissionerAction=(...a)=>last=inlineAction(...a);
 // Runs the handler attribute of the control whose text (or aria-label) matches, as a click or a change to value.
 var fire=(html,label,value)=>{const sel=new RegExp('(?:'+label+')[^<]*<select[^>]*onchange="([^"]*)"').exec(html),btn=new RegExp('<button(?![^>]*disabled)[^>]*?onclick="([^"]*)"[^>]*>(?:(?!</button>)[\\s\\S])*?(?:'+label+')').exec(html),m=sel&&(!btn||sel.index<btn.index)?sel:btn;
  if(!m)throw Error('control not found: '+label);last=null;(new Function('return function(){'+m[1].replace(/&quot;/g,'"')+'}'))().call({value:value===undefined?'':String(value)});return last};
 var submit=(kind,entries,args)=>commissionerAction({preventDefault(){},target:{entries:Object.entries(entries)}},kind,args);
 var stateJSON=()=>JSON.stringify(state),restoreJSON=s=>{state=JSON.parse(s)};`);
const views=['roster()','teamManagementView()','scheduleView()','draftView()','awardRacesView()','leagueHistoryView()','trades()','gmInboxView()','playersDirectoryTable()'];
const badges=()=>views.map(v=>(run(v).match(/commissioner-badge/g)||[]).length);
(async()=>{
 // 1. Off: no tools anywhere (and no Edit player button in a profile).
 assert(badges().every(n=>n===0),'off: '+badges());
 l.run(`openPlayerProfile(state.teams[0].roster[0].id)`);assert.equal(run('inserted.length'),0);
 // 2. On (the toggle itself does not ask): every screen shows its tools.
 assert.equal(await l.run(`inlineAction(null,'toggle',{enabled:true})`),true);assert.deepEqual(run('questions'),[]);
 assert(badges().every(n=>n>0),'on: '+badges());
 const expect={'roster()':['Control this team','Always win: Off','AI roster moves: On'],'teamManagementView()':['Control this team'],'scheduleView()':['Regenerate schedule','Add game','Force winner','Edit matchup','Swap home court','Move to another day','Remove game'],
  'draftView()':['Set lottery winner'],'trades()':['Trade review: Off','Force current offer'],'gmInboxView()':['Trade review: Off'],'playersDirectoryTable()':['Edit player'],'settingsView()':['Turn off commissioner mode','Commissioner log']};
 for(const [v,labels] of Object.entries(expect)){const html=run(v);for(const x of labels)assert(html.includes(x),v+' shows '+x)}
 l.run(`inserted=[];openPlayerProfile(state.teams[0].roster[0].id)`);assert(run('inserted.join()').includes('Edit player'),'profile shows Edit player');
 // Helper: run an inline control and the old panel's logic from the same state; compare what changed.
 const same=async(label,inline,direct,pick)=>{const start=run('stateJSON()');l.run(`questions=[]`);const ok=await l.run(inline);assert.equal(ok,true,label+': inline action succeeded ('+run('commissionerUI.message')+')');assert.equal(run('questions.length'),1,label+' asked once');
  const viaInline=run(pick),entry=run('state.commissioner.log[0]'),after=run('stateJSON()');l.run(`restoreJSON(${JSON.stringify(start)})`);l.run(direct);const viaPanel=run(pick);assert.deepEqual(viaInline,viaPanel,label+' matches the panel logic');l.run(`restoreJSON(${JSON.stringify(after)})`);return entry};
 // 3. Schedule row: force winner, swap, move, remove; header: add game, regenerate.
 l.run(`commissionerUI.message='';var day=state.day+3,pair=state.schedule[day][0],sched=()=>scheduleView()`);
 const dayIdx=run('day'),pair=run('pair'),abbr=id=>run(`state.teams[${id}].abbr`);
 const rowHtml=()=>run(`commissionerGameTools(day,0)`);l.context.rowHtml=rowHtml;
 let e=await same('force winner',`fire(commissionerGameTools(day,0),'Force winner',${pair[1]})`,`commissionerScheduleEdit('force',{day,index:0,winner:'${pair[1]}'})`,'state.commissioner.forcedGames');
 assert.deepEqual([e.what,e.from,e.to],[`Day ${dayIdx+1} · ${abbr(pair[1])} @ ${abbr(pair[0])} result`,'Normal result',abbr(pair[1])+' win']);assert(/^\d{4}-\d{2}-\d{2}T/.test(e.at)&&e.day===run('state.day'));
 e=await same('swap',`fire(commissionerGameTools(day,0),'Swap home court')`,`commissionerScheduleEdit('swap',{day,index:0})`,'[state.schedule[day],state.commissioner.forcedGames]');assert.equal(e.what,`Day ${dayIdx+1} · home court`);
 const to=run(`state.schedule.findIndex((r,k)=>k>day+3&&!commissionerBreakDay(k)&&!r.some(p=>p.includes(state.schedule[day][0][0])||p.includes(state.schedule[day][0][1])))`);
 l.run(`promptValue='${to+1}'`);e=await same('move',`fire(commissionerGameTools(day,0),'Move to another day')`,`commissionerScheduleEdit('move',{day,index:0,to:${to}})`,`[state.schedule[day],state.schedule[${to}],state.commissioner.scheduleEdited]`);assert.deepEqual([e.from,e.to],['Day '+(dayIdx+1),'Day '+(to+1)]);
 e=await same('remove',`fire(commissionerGameTools(day,0),'Remove game')`,`commissionerScheduleEdit('remove',{day,index:0})`,'state.schedule[day]');assert.equal(e.to,'Removed');
 const free=run(`(()=>{const busy=new Set(state.schedule[day].flat());return state.teams.map(t=>t.id).filter(id=>!busy.has(id)).slice(0,2)})()`);
 if(free.length===2){e=await same('add game',`submit('schedule',{action:'add',day:String(day),home:'${free[0]}',away:'${free[1]}'})`,`commissionerScheduleEdit('add',{day:String(day),home:'${free[0]}',away:'${free[1]}'})`,'state.schedule[day]');assert.equal(e.what,`Day ${dayIdx+1} · game added`)}
 l.run(`var seeded=()=>{let s=7;return ()=>(s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296};var origRegen=commissionerRegenerateSchedule;commissionerRegenerateSchedule=()=>origRegen(seeded())`);
 e=await same('regenerate',`fire(commissionerScheduleTools(),'Regenerate schedule')`,`origRegen(seeded())`,'state.schedule');assert.equal(e.what,'Schedule');
 // 4. Team tools: control, always win, AI roster moves (Roster screen), trade review (Trades screen).
 l.run('rosterTeamId=4');
 e=await same('control',`fire(roster(),'Control this team')`,`commissioner().activeTeam=4`,'[state.commissioner.activeTeam,controlledTeamId()]');assert.deepEqual([e.what,e.from,e.to],['Controlled team','Your franchise',run('commissionerTeamName(4)')]);
 e=await same('always win',`fire(roster(),'Always win: Off')`,`commissioner().alwaysWin.push(4)`,'state.commissioner.alwaysWin');assert.deepEqual([e.from,e.to],['Off','On']);
 e=await same('managed',`fire(roster(),'AI roster moves: On')`,`commissioner().managedTeams.push(4)`,'[state.commissioner.managedTeams,cpuRosterClubs().some(t=>t.id===4)]');assert.deepEqual([e.from,e.to],['On','Off (managed)']);
 e=await same('return control',`fire(roster(),'Return to your franchise')`,`commissioner().activeTeam=null`,'controlledTeamId()');
 e=await same('trade review',`fire(trades(),'Trade review: Off')`,`commissioner().tradeReview=true`,'state.commissioner.tradeReview');
 // 5. Trades: approve and veto pending AI trades (same as commissionerReviewTrade); force your own offer.
 const queue=`(()=>{const a=state.teams[10],b=state.teams[11];aiTradeExecute(a,b,{out:[a.roster[3]],into:[b.roster[3]],outPicks:[],inPicks:[]});return commissioner().pendingTrades.at(-1).id})()`;
 const tid=run(queue);e=await same('approve',`fire(gmInboxView(),'Approve')`,`commissionerReviewTrade(${tid},true)`,'[state.teams[10].roster.map(p=>p.id),state.teams[11].roster.map(p=>p.id),state.commissioner.pendingTrades.length]');assert.deepEqual([e.from,e.to],['Pending','Trade approved']);
 const tid2=run(queue);e=await same('veto',`fire(trades(),'Veto')`,`commissionerReviewTrade(${tid2},false)`,'[state.teams[10].roster.map(p=>p.id),state.commissioner.pendingTrades.length]');assert.equal(e.to,'Trade vetoed');
 l.run(`commissioner().tradeReview=false;const td=currentTradeDraft();td.club=12;td.out=[team().roster.at(-1).id];td.into=[state.teams[12].roster[0].id];td.cash=0;td.outPicks=[];td.inPicks=[]`);
 const offer=run(`[team().roster.at(-1).id,state.teams[12].roster[0].id]`);
 l.run('questions=[]');assert.equal(await l.run(`fire(trades(),'Force current offer')`),true,run('commissionerUI.message'));
 assert(run(`team().roster.some(p=>p.id===${offer[1]})&&state.teams[12].roster.some(p=>p.id===${offer[0]})`),'forced trade completed');assert.equal(run('state.commissioner.log[0].to'),'Forced through');
 // 6. Draft: lottery winner (form) and draft order moves.
 e=await same('lottery',`submit('lottery',{lotteryWinner:'7'})`,`commissioner().lotteryWinner=7`,'state.commissioner.lotteryWinner');assert.deepEqual([e.what,e.from,e.to],['Lottery winner','Normal lottery',run('commissionerTeamName(7)')]);
 l.run(`state.draft={year:state.year,rounds:2,poolSize:90,order:state.teams.map(t=>t.id),picks:[],prospects:[]}`);assert(run('commissionerDraftTools()').includes('Move team in draft order'));
 e=await same('draft move',`fire(commissionerDraftTools(),'Make #1')`,`commissionerMoveDraftTeam(state.draft.order[1],0)`,'state.draft.order');assert.deepEqual([e.from,e.to],['Pick #2','Pick #1']);
 // 7. Awards (Award races / League history) and player edits (profile / Players list).
 l.run(`state.regularAwards=[{year:state.year,mvp:{id:1,name:'Old MVP',team:'X'},roy:null,dpoy:null,sixth:null,mip:null,coach:null}];state.leagueHistory=[{year:state.year,champion:null,runnerUp:null,finalsMvp:null,mvp:{id:1,name:'Old MVP',team:'X'},dpoy:null,roy:null,sixth:null,mip:null,coach:null}];`);
 const pid=run('state.teams[2].roster[0].id'),pname=run(`state.teams[2].roster[0].name`);
 e=await same('award',`fire(leagueHistoryView(),'Set winner · Most Valuable Player|Set winner · MVP',${pid})`,`commissionerSetAward(state.year,'mvp','${pid}')`,'[state.regularAwards[0].mvp,state.leagueHistory[0].mvp]');assert.deepEqual([e.from,e.to],['Old MVP',pname]);
 assert(run('awardRacesView()').includes('Set winner'));
 const form=run(`(()=>{const p=state.teams[2].roster[0];withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const bio=p.bio||generatePlayerBio(p,state.year,state.teams);const v={name:'Renamed Star',pos:p.pos,age:String(p.age),ovr:'91',pot:String(p.pot),heightInches:String(bio.heightInches),weightLbs:String(bio.weightLbs),birthdate:'1999-03-04',hometown:'Dayton, Ohio',college:bio.college};
  for(const k of ATTRIBUTE_KEYS)v['a_'+k]=String(p.attributes[k]);for(const k of TENDENCY_KEYS)v['t_'+k]=String(p.tendencies[k]);(p.personalityTraits||generateTraits(p)).forEach((t,i)=>v['trait'+i]=t);return v})()`);
 l.run(`commissionerOpenEditor(${pid})`);assert(run('dialog.innerHTML').includes('Save player')&&run('dialog.open'));
 e=await same('edit player',`submit('player',${JSON.stringify(form)},{id:${pid}})`,`commissionerEditPlayer(${pid},${JSON.stringify(form)})`,`(()=>{const p=state.teams[2].roster.find(p=>p.id===${pid});return [p.name,p.ovr,p.bio.birthdate,p.bio.hometown]})()`);
 assert.equal(e.what,'Player · Renamed Star');assert.match(e.from,new RegExp('Name '+pname.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'.*OVR'));assert.match(e.to,/Name Renamed Star, Age 27, OVR 91, Born 1999-03-04, Hometown Dayton, Ohio/);
 // 8. Declining the confirmation changes nothing and logs nothing.
 const before=run('stateJSON()'),logs=run('state.commissioner.log.length');l.run(`answer=false`);
 assert.equal(await l.run(`fire(roster(),'Always win')`),false);assert.equal(run('stateJSON()'),before);assert.equal(run('state.commissioner.log.length'),logs);l.run('answer=true');
 // 9. The log: newest first, shown on the Commissioner home, saved with the career, invalid entries rejected.
 assert(logs>=15,'log entries: '+logs);assert.equal(run('state.commissioner.log[0].what'),'Player · Renamed Star');
 const home=run('settingsView()');assert(home.includes('Commissioner log')&&home.includes('Renamed Star')&&!home.includes('po-tabs" aria-label="Commissioner tools'),'slim home with the log');
 l.run(`state.teams.forEach(t=>{t.w=0;t.l=0});state.history=[];delete state.draft`);
 assert.deepEqual(run('validateCareerData(JSON.parse(JSON.stringify(state))).commissioner.log'),run('state.commissioner.log'));
 assert.throws(()=>l.run(`validateCareerData({...JSON.parse(JSON.stringify(state)),commissioner:{...state.commissioner,log:[{at:5}]}})`),/commissioner log/);
 // 10. Off again: tools disappear; the log stays (and still shows on the home screen).
 await l.run(`inlineAction(null,'toggle',{enabled:false})`);assert(badges().every(n=>n===0),'off again: '+badges());assert(run('settingsView()').includes('Commissioner log'));
 console.log(`Commissioner inline tools: hidden when off, shown on 9 screens when on, ${logs} inline actions matched the panel logic with confirmation, declining changes nothing, log saved and shown.`);
})().catch(e=>{console.error(e);process.exit(1)});
