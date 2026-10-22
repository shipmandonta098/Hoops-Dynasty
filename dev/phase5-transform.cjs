// Exact, reviewable transformations of the frozen Phase 4 engine.
module.exports=function(name,s){
 const replace=(a,b)=>{if(!s.includes(a))throw Error('Phase 5 anchor missing: '+a);s=s.replace(a,b)};
 if(name==='possession-engine.js'){
  replace("this.shotClock=Math.max(0,this.shotClock-seconds);", "if(this.context.advance)this.context.advance(seconds,next);this.shotClock=Math.max(0,this.shotClock-seconds);");
  replace("finish(){if(this.phase!=='end')this.transition('end')}", "finish(){if(this.context.liveClock&&this.context.remaining()<=0){this.phase='end';this.trace.push('periodEnd');}else if(this.phase!=='end')this.transition('end')}");
 }
 if(name!=='attributes.js')return s;
 replace('let elapsedSeconds=0,clockWindow=null,atPeriodEnd=false;', 'let elapsedSeconds=0,clockWindow=null,atPeriodEnd=false,liveClockEnd=null;');
 // Logging must never decide how much game time elapses in clock-aware endings.
 replace('if(clockWindow){const stopped=', 'if(clockWindow&&liveClockEnd===null){const stopped=');
 replace('simulationClock(elapsedSeconds,atPeriodEnd||', 'simulationClock(elapsedSeconds,atPeriodEnd||liveClockEnd!==null&&elapsedSeconds>=liveClockEnd||');
 replace("const iso=decision.moraleIsolation?null:","const iso=decision.moraleIsolation||decision.lateShot?null:");
 replace('function finishRebound(side){const board=', 'function finishRebound(side){if(liveClockEnd!==null){if(elapsedSeconds>=liveClockEnd)return;advanceLiveClock(1,\'rebound\');}const board=');
 replace('const board=selectBasketballRebound(offense,defense,rotation,extraBoards<8,homeCourt)', "if(liveClockEnd!==null){if(elapsedSeconds>=liveClockEnd)return;advanceLiveClock(1,'rebound');}const board=selectBasketballRebound(offense,defense,rotation,extraBoards<8,homeCourt)");
 replace("machine=createPossessionMachine({minute:gameRotations[side].minute,margin:scores[side]-scores[1-side]});", "machine=createPossessionMachine({minute:gameRotations[side].minute,margin:scores[side]-scores[1-side],liveClock:liveClockEnd!==null,remaining:()=>liveClockEnd-elapsedSeconds,advance:liveClockEnd===null?null:advanceLiveClock});");
 replace('const moraleBeforeMargin=scores[side]-scores[1-side];possessionCore(side);', "const moraleBeforeMargin=scores[side]-scores[1-side];try{let foulResolved=false;if(liveClockEnd!==null){const left=liveClockEnd-elapsedSeconds,plan=lateGameTimingPlan(moraleBeforeMargin,left,machine.shotClock,plans[side].tempo,transitionTeam===side);if(Math.random()<lateGameFoulChance(moraleBeforeMargin,left,machine.shotClock,plans[1-side].tactics)){advanceLiveClock(Math.min(2,left),'decision');foulResolved=defensiveFoul(side,choose(clubs[side],'drb'),choose(clubs[1-side],'per'),'intentional personal');if(!foulResolved)machine.transition('decision');}else if(plan.hold){log(side,clubs[side].abbr+' protects the ball to run out the clock.');advanceLiveClock(left,'decision');}if(!foulResolved){advanceLiveClock(plan.setup,'decision');machine.shotClock=Math.max(0,machine.shotClock-plan.setup);}}if(!foulResolved)possessionCore(side);}catch(error){if(error.code!=='PERIOD_EXPIRED')throw error;currentOutcome??='other';machine.phase='end';machine.trace.push('periodExpired');}");
 replace("teamFouls.set(key,count);return gameInBonus(count);", "teamFouls.set(key,count);const remaining=gamePeriodRemaining(gameRotations[0].minute)*60;const lateKey=key+':lastTwo';if(remaining<=120)teamFouls.set(lateKey,(teamFouls.get(lateKey)||0)+1);const standard=leagueRules().bonusFouls===5&&state.year>=2023;return standard?(count>=(foulPeriod()>=leagueRules().gamePeriods?4:5)||(teamFouls.get(lateKey)||0)>=2):gameInBonus(count);");
 replace('return crossSideBonus?terminalNextSide:null;', 'return liveClockEnd!==null?terminalNextSide??1-side:crossSideBonus?terminalNextSide:null;');
 replace("if(gameBoundary(minute))dispatchSide=null;", "if(gameBoundary(minute)){dispatchSide=null;if(minute>=gameMinutes())openingTip=null;}");
 replace('function runMinute(minute,count){', `function advanceLiveClock(seconds,phase){
 if(liveClockEnd===null)return;
 const amount=seconds|| (phase==='shot'?1:0),remaining=liveClockEnd-elapsedSeconds;
 if(amount<=0)return;
 elapsedSeconds=Math.min(liveClockEnd,elapsedSeconds+amount);
 if(amount>remaining||phase!=='shot'&&elapsedSeconds>=liveClockEnd){const error=Error('Period expired during '+phase);error.code='PERIOD_EXPIRED';throw error;}
 }
 function runLatePeriod(start,end){
 liveClockEnd=end;elapsedSeconds=start;atPeriodEnd=false;clockWindow=null;
 let side=dispatchSide??firstSide;
 while(elapsedSeconds<end){
  const before=elapsedSeconds,minute=elapsedSeconds/60;
  for(let s=0;s<2;s++){const n=rotationEvents.length;refreshGameRotation(clubs[s],gameRotations[s],minute,rows,rotationEvents,scores[s]-scores[1-s]);rotationEvents.slice(n).forEach(t=>log(s,t));}
  side=possession(side)??1-side;
  const dt=(elapsedSeconds-before)/60;
  if(dt<=0)throw Error('Late possession made no clock progress');
  for(let s=0;s<2;s++){
   if(Math.abs(scores[0]-scores[1])<=5)for(const id of gameRotations[s].court){const row=rows.get(id);row.clutch??=Object.fromEntries(STATS_COUNTS.map(k=>[k,0]));row.clutch.mp+=dt;}
   accrueRotationMinutes(clubs[s],gameRotations[s],rows,dt);
  }
 }
 dispatchSide=side;liveClockEnd=null;atPeriodEnd=true;log(firstSide,'End of '+simulationClock(elapsedSeconds,true).period+'.',true);
 }
 function runMinute(minute,count){`);
 replace("for(let minute=0;minute<gameMinutes();minute++)runMinute(minute,Math.floor((minute+1)*possessions/48)-Math.floor(minute*possessions/48));", "for(let minute=0;minute<gameMinutes()-Math.min(2,gameMinutes());minute++)runMinute(minute,Math.floor((minute+1)*possessions/48)-Math.floor(minute*possessions/48));runLatePeriod((gameMinutes()-Math.min(2,gameMinutes()))*60,gameMinutes()*60);");
 replace("while(scores[0]===scores[1]&&overtime<10){for(let i=0;i<leagueRules().overtimeMinutes;i++)runMinute(gameMinutes()+overtime*leagueRules().overtimeMinutes+i,Math.max(1,Math.round(2*leagueRules().paceMultiplier)));overtime++}", "while(scores[0]===scores[1]){if(overtime>=100){const error=Error('Simulation did not resolve after 100 overtime periods; no winner awarded.');error.code='SIMULATION_NO_WINNER';throw error;}const start=gameMinutes()+overtime*leagueRules().overtimeMinutes;for(let i=0;i<leagueRules().overtimeMinutes-Math.min(2,leagueRules().overtimeMinutes);i++)runMinute(start+i,Math.max(1,Math.round(2*leagueRules().paceMultiplier)));runLatePeriod((start+leagueRules().overtimeMinutes-Math.min(2,leagueRules().overtimeMinutes))*60,(start+leagueRules().overtimeMinutes)*60);overtime++}");
 replace(" if(scores[0]===scores[1]){const side=Math.random()<.5?0:1,r=rows.get(choose(clubs[side],'ft').id);r.fta++;r.ftm++;r.pts++;addScore(side,1,{id:r.playerId},{technical:true});log(side,r.name+' converts the deciding free throw after extended overtime.');}", ' // Tied regulation and overtime periods continue through legal play.');
 return s;
};
