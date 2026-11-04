var F={games:0,issues:[],teamGames:0,outOfPos:0,used:[],starterMp:[],top3Mp:{},maxMp:0,minRot:99,maxRot:0};const P=['PG','SG','SF','PF','C'];
 var fplay=play;play=function(a,b,...r){const pre={};for(const id of [a,b]){const t=state.teams[id];const injured=new Set(t.roster.filter(p=>injuryDays(p)>0).map(p=>p.id));const top3=t.roster.filter(p=>!injured.has(p.id)).sort((x,y)=>y.ovr-x.ovr).slice(0,3).map(p=>p.id);pre[t.abbr]={t,injured,roster:new Set(t.roster.map(p=>p.id)),top3}}
  const g=fplay(a,b,...r);F.games++;const gm=gameMinutes();
  for(const [abbr,x] of Object.entries(pre)){F.teamGames++;const rows=g.box.filter(q=>q.team===abbr);const st=rows.filter(q=>q.gs);const ids=new Set(st.map(q=>q.playerId));
   if(st.length!==5||ids.size!==5)F.issues.push(`day ${g.day} ${abbr}: ${st.length} starters`);
   for(const q of st){if(x.injured.has(q.playerId))F.issues.push(`day ${g.day} ${abbr}: injured starter ${q.name}`);if(!x.roster.has(q.playerId))F.issues.push(`day ${g.day} ${abbr}: non-roster starter ${q.name}`)}
   const sum=rows.reduce((n,q)=>n+(q.mp||0),0),ot=Math.max(0,Math.round((sum/5-gm)/5)),expect=5*(gm+5*ot);if(Math.abs(sum-expect)>4)F.issues.push(`day ${g.day} ${abbr}: team minutes ${sum} vs ${expect}`);
   for(const q of rows){if((q.mp||0)>gm+5*ot)F.issues.push(`day ${g.day} ${abbr}: ${q.name} ${q.mp} min in a ${gm+5*ot}-min game`);if(ot===0)F.maxMp=Math.max(F.maxMp,q.mp||0)}
   const used=rows.filter(q=>q.mp>0).length;F.used.push(used);F.minRot=Math.min(F.minRot,used);F.maxRot=Math.max(F.maxRot,used);
   if(ot===0)for(const q of st)F.starterMp.push(q.mp);
   for(const id of x.top3){const q=rows.find(q=>q.playerId===id);if(q&&ot===0&&!q.ejected&&!(x.t.roster.find(p=>p.id===id)&&injuryDays(x.t.roster.find(p=>p.id===id))>0)){(F.top3Mp[abbr+':'+id]??=[]).push(q.mp)}}
   try{F.outOfPos+=lineupOutOfPosition(x.t,lineupAssignment(x.t)).length}catch(e){}}
  return g};
