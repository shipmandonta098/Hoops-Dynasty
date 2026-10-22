/* Dated exhibitions and protected calendar breaks. Regular-season games never receive exhibition stats. */
function allStarWindow(days,rules,gender='male'){
 const length=Math.min(days,Math.max(rules.allStarRestLength||7,rules.allStarEventDays||3)),duration=Math.min(length,rules.allStarEventDays||3),center=Math.round(days*(rules.allStarSchedule==='custom'?rules.allStarPercent:65)/100);
 const breakStart=Math.max(1,Math.min(days-length+1,center-Math.floor(length/2))),breakEnd=breakStart+length-1,start=breakStart+Math.floor((length-duration)/2);
 return {breakStart,breakEnd,start,end:start+duration-1,deadline:Math.max(1,breakStart-1)};
}
function applyAllStarCalendar(career,rules=career.leagueSettings){
 delete career.allStarCalendar;if(!rules.allStarEnabled)return;
 let window;
 if(career.scheduleFormat==='custom')window=allStarWindow(career.schedule.length,rules,career.leagueGender);
 else{
  const length=Math.max(rules.allStarRestLength||7,rules.allStarEventDays||3),original=career.schedule.length;
  // Extend the existing NBA gap in automatic mode; otherwise insert a protected break.
  const oldIndex=allStarBreakIndex(career.year),existing=career.scheduleFormat==='nba82'&&rules.allStarSchedule==='auto'&&career.schedule.slice(oldIndex,oldIndex+3).length===3&&career.schedule.slice(oldIndex,oldIndex+3).every(r=>!r.length);
  const index=existing?oldIndex:Math.max(1,Math.min(original-1,Math.round(original*(rules.allStarSchedule==='custom'?rules.allStarPercent:65)/100)));
  if(existing&&length<3)career.schedule.splice(index+length,3-length);
  const added=existing?Math.max(0,length-3):length;
  career.schedule.splice(index+(existing?3:0),0,...Array.from({length:added},()=>[]));
  const duration=rules.allStarEventDays,breakLength=length,start=index+1+Math.floor((breakLength-duration)/2);
  window={breakStart:index+1,breakEnd:index+breakLength,start,end:start+duration-1,deadline:Math.max(1,index)};
  Object.assign(rules,calendarSettingDefaults(career));
 }
 if(career.schedule.slice(window.breakStart-1,window.breakEnd).some(r=>r.length))throw Error('The All-Star break conflicts with scheduled games. Rebuild the preseason calendar.');
 career.allStarCalendar={year:career.year,...window};
}
const setupBeforeAllStarEvents=buildSetupCareer;buildSetupCareer=function(draft){const career=setupBeforeAllStarEvents(draft);applyAllStarCalendar(career);return career};
const regenerateBeforeAllStarEvents=regenerateSeasonCalendar;regenerateSeasonCalendar=function(){regenerateBeforeAllStarEvents();delete state.allStarEvents;applyAllStarCalendar(state,leagueRules())};
const milestonesBeforeAllStarEvents=seasonMilestones;seasonMilestones=function(){const c=state.allStarCalendar;if(c?.year===state.year)return {...c,protectedBreak:true};const old=milestonesBeforeAllStarEvents(),duration=Math.min(seasonLength(),leagueRules().allStarEventDays),start=Math.max(1,old.end-duration+1);return {...old,start,protectedBreak:false}};
function allStarEventPlan(){const r=leagueRules(),m=seasonMilestones();if(!r.allStarEnabled)return [];const middle=m.start+Math.floor((m.end-m.start)/2);return [...(r.risingStarsEnabled?[{key:'rising',title:'Rising Stars',day:m.start}]:[]),...(r.threeContestEnabled?[{key:'three',title:'Three-point contest',day:middle}]:[]),...(r.dunkEnabled?[{key:'dunk',title:'Dunk contest',day:middle}]:[]),{key:'skills',title:'Skills challenge',day:middle},{key:'game',title:'All-Star Game',day:m.end}]}
function allStarEventStore(){if(state.allStarEvents?.year===state.year)return state.allStarEvents;return state.allStarEvents={year:state.year,results:[]}}
function allStarContestPool(){return state.teams.flatMap(t=>t.roster.map(p=>({p,t}))).filter(x=>!x.p.medicalInfo||x.p.medicalInfo.until<=medicalStamp())}
function allStarContest(key){
 const random=scheduleRandom(state.year*1123+({three:91,dunk:192,skills:293}[key]||0)),pool=allStarContestPool(),r=leagueRules(),lines=[],label=x=>x.p.name+' ('+x.t.abbr+')';
 if(pool.length<2)return {summary:'Not enough available players to hold this event.',lines:[]};
 if(key==='skills'){const scores=pool.map(x=>({...x,score:Math.round((75-(x.p.attributes.pss+x.p.attributes.drb)*.14+random()*12)*10)/10})).sort((a,b)=>a.score-b.score).slice(0,8);return {summary:label(scores[0])+' wins in '+scores[0].score.toFixed(1)+' seconds.',lines:scores.map(x=>label(x)+' · '+x.score.toFixed(1)+' seconds')};}
 const entrants=pool.sort((a,b)=>key==='three'?b.p.attributes.tp-a.p.attributes.tp:((b.p.attributes.dnk??b.p.attributes.lay)*.6+b.p.attributes.jmp*.4)-((a.p.attributes.dnk??a.p.attributes.lay)*.6+a.p.attributes.jmp*.4)).slice(0,key==='three'?r.threeParticipants:r.dunkParticipants);
 const attempt=x=>{if(key==='three'){let total=0;for(let rack=0;rack<5;rack++)for(let ball=0;ball<5;ball++)if(random()<.2+x.p.attributes.tp*.006)total+=rack===4||ball===4?2:1;for(let i=0;i<2;i++)if(random()<.1+x.p.attributes.tp*.005)total+=3;return total;}let total=0;for(let dunk=0;dunk<2;dunk++){const rating=(x.p.attributes.dnk??x.p.attributes.lay)*.6+x.p.attributes.jmp*.4,made=random()<.45+rating*.005;let judges=0;for(let j=0;j<5;j++)judges+=made?Math.max(6,Math.min(10,Math.round(5+rating*.04+random()*2))):6;total+=judges;}return total;};
 const round=(players,name)=>{const scored=players.map(x=>({...x,score:attempt(x),tie:0}));lines.push(...scored.map(x=>name+' · '+label(x)+' · '+x.score+'/'+(key==='three'?40:100)));for(const score of new Set(scored.map(x=>x.score))){const tied=scored.filter(x=>x.score===score);if(tied.length<2)continue;for(const x of tied){x.tie=attempt(x);lines.push(name+' '+(key==='three'?'shoot-off':'dunk-off')+' · '+label(x)+' · '+x.tie);}tied.sort((a,b)=>b.tie-a.tie||a.p.id-b.p.id);if(tied.some((x,i)=>i&&x.tie===tied[i-1].tie))lines.push('Further tie: seeded draw sets the remaining order.');for(const x of tied)x.tie+=random()*.5;}return scored.sort((a,b)=>b.score-a.score||b.tie-a.tie);};
 const first=round(entrants,'Opening round'),finalists=first.slice(0,key==='three'?3:2);if(first.length>finalists.length&&first[finalists.length-1].score===first[finalists.length].score)lines.push('Advancement tie settled by the additional '+(key==='three'?'shoot-off':'dunk-off')+'.');
 const final=round(finalists,'Final');if(final.length>1&&final[0].score===final[1].score)lines.push('Tied final settled by the additional '+(key==='three'?'shoot-off':'dunk-off')+'.');
 return {summary:label(final[0])+' wins with '+final[0].score+'/'+(key==='three'?40:100)+' in the final.',lines};
}
function risingStarsEvent(){
 const players=allStarContestPool().filter(x=>{const debut=x.p.bio?.debutYear;return Number.isInteger(debut)&&state.year-debut>=0&&state.year-debut<=1}).sort((a,b)=>b.p.ovr-a.p.ovr||a.p.id-b.p.id),n=Math.min(12,Math.floor(players.length/2));
 if(n<2)return {summary:'Not enough available first- and second-year players for two teams.',lines:[]};
 const selected=players.slice(0,n*2).map(x=>({id:x.p.id,name:x.p.name,ovr:x.p.ovr})),teams=[{name:'Rising Stars Gold',ids:[]},{name:'Rising Stars Orange',ids:[]}];selected.forEach((p,i)=>teams[i%4===0||i%4===3?0:1].ids.push(p.id));
 // Odd roster sizes require a final balancing move.
 while(teams[0].ids.length>n)teams[1].ids.push(teams[0].ids.pop());while(teams[1].ids.length>n)teams[0].ids.push(teams[1].ids.pop());
 const game=simulateAllStarExhibition({selected,teams,game:null},{seed:451,elam:false}),mvp=selected.find(p=>p.id===game.mvp),lines=[];
 for(const t of teams){lines.push(t.name+' roster:');for(const id of t.ids){const x=players.find(x=>x.p.id===id);lines.push(x.p.name+' ('+x.t.abbr+') · '+(state.year-x.p.bio.debutYear===0?'Rookie':'Second year')+' · '+game.box.find(b=>b.id===id).pts+' PTS');}}
 lines.push('Rising Stars MVP: '+mvp.name+'.');return {playByPlay:game.events,summary:teams[0].name+' '+game.scores[0]+' — '+teams[1].name+' '+game.scores[1]+'. MVP: '+mvp.name+'.',lines};
}
function processAllStarEvents(){
 if(!leagueRules().allStarEnabled||allStarSimulationPaused())return;
 // Do not manufacture new events for an already completed legacy weekend.
 if(state.allStarReport?.length&&!state.allStarEvents)return;
 const store=allStarEventStore();for(const event of allStarEventPlan()){
  if(state.day<event.day||store.results.some(r=>r.key===event.key))continue;let result;
  if(event.key==='game'){const v=state.allStarVoting;if(v?.phase!=='final')continue;const game=simulateAllStarExhibition(v);result={playByPlay:game.events,summary:v.teams[0].name+' '+game.scores[0]+' — '+v.teams[1].name+' '+game.scores[1]+'. MVP: '+v.selected.find(p=>p.id===game.mvp).name+'.',lines:[...(game.target?['Untimed fourth quarter · Target '+game.target]:[]),...game.box.map(b=>v.selected.find(p=>p.id===b.id).name+' · '+b.pts+' PTS')]};}
  else result=event.key==='rising'?risingStarsEvent():allStarContest(event.key);
  const record={...event,...result};store.results.push(record);allStarNews(event.title+': '+result.summary,'Exhibition · '+scheduleDateLabel(event.day,true));
 }
}
allStarReport=function(){processAllStarEvents();const results=state.allStarEvents?.results||[];return [...results.map(e=>e.title+': '+e.summary),...results.flatMap(e=>e.lines)].slice(0,64)};
seasonMilestoneDay=function(){allStarTick();if(allStarSimulationPaused())return;const m=seasonMilestones();if(state.day===m.deadline)say('TRADE DEADLINE: Trading is closed until the championship is complete.');if(leagueRules().allStarEnabled&&state.day===m.start)allStarNews('All-Star events begin','Open Schedule → Voting & weekend for the event schedule and results.');processAllStarEvents();if(leagueRules().allStarEnabled&&state.day>=m.end&&!state.allStarReport?.length)state.allStarReport=allStarReport()};
function allStarEventsMarkup(){const m=seasonMilestones(),results=state.allStarEvents?.year===state.year?state.allStarEvents.results:[];return `<section class="panel note"><h3>All-Star events</h3><p>Simulate or watch an upcoming event to advance the league calendar to its date. Voting selections must be confirmed first. Completed events can be replayed without changing results.</p><p>${m.protectedBreak?'League break: '+scheduleDateLabel(m.breakStart,true)+' – '+scheduleDateLabel(m.breakEnd,true)+' · No regular-season games.':'This career retains its existing game dates. A protected break will be included when its next calendar is generated.'}</p>${allStarEventPlan().map(e=>{const result=results.find(x=>x.key===e.key);return `<div class="actions"><strong>${escapeHTML(e.title)}</strong>${allStarEventActions(e.key)}</div><details><summary>${escapeHTML(e.title)} · ${scheduleDateLabel(e.day,true)} · ${result?'Final':state.day>=e.day?'Awaiting selections':'Upcoming'}</summary>${result?'<p>'+escapeHTML(result.summary)+'</p>'+result.lines.map(s=>'<p>'+escapeHTML(s)+'</p>').join(''):'<p>Advance the calendar to this event to see its results.</p>'}</details>`}).join('')}</section>`}
const calendarBannerBeforeAllStarEvents=seasonCalendarBanner;seasonCalendarBanner=function(){return calendarBannerBeforeAllStarEvents().replace('League-wide break · No regular-season games','League break '+scheduleDateLabel(seasonMilestones().breakStart)+'–'+scheduleDateLabel(seasonMilestones().breakEnd)).replace('Ceremonial events · Existing game dates preserved','Events · Existing game dates preserved')};
function readAllStarCalendar(raw,career,bad){if(raw===undefined)return undefined;if(!raw||raw.year!==career.year||['breakStart','breakEnd','start','end','deadline'].some(k=>!Number.isInteger(raw[k])||raw[k]<1||raw[k]>career.schedule.length)||raw.breakStart>raw.start||raw.start>raw.end||raw.end>raw.breakEnd||raw.breakEnd-raw.breakStart>=14||raw.end-raw.start>=7||raw.deadline>raw.breakStart||career.schedule.slice(raw.breakStart-1,raw.breakEnd).some(r=>r.length))bad('invalid All-Star calendar');return Object.fromEntries(['year','breakStart','breakEnd','start','end','deadline'].map(k=>[k,raw[k]]))}
function readAllStarEvents(raw,career,bad){if(raw===undefined)return undefined;const keys=['rising','three','dunk','skills','game'],str=(s,n)=>typeof s==='string'&&s.length<=n;if(!raw||raw.year!==career.year||!Array.isArray(raw.results)||raw.results.length>5)bad('invalid All-Star events');const seen=new Set();return {year:raw.year,results:raw.results.map(e=>{if(!e||!keys.includes(e.key)||seen.has(e.key)||!Number.isInteger(e.day)||e.day<1||e.day>career.day||!str(e.title,60)||!str(e.summary,500)||!Array.isArray(e.lines)||e.lines.length>100||e.lines.some(s=>!str(s,500)))bad('invalid All-Star event result');if(e.playByPlay!==undefined&&(!Array.isArray(e.playByPlay)||e.playByPlay.length>1000||e.playByPlay.some(s=>!str(s,500))))bad('invalid All-Star playback');seen.add(e.key);return {...(e.playByPlay?{playByPlay:[...e.playByPlay]}:{}),key:e.key,day:e.day,title:e.title,summary:e.summary,lines:[...e.lines]}})}}
