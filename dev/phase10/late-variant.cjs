const assert=require('assert/strict');module.exports=(name,s)=>{name=name.split('?')[0];const mode=process.env.P10_LATE||'combined',on=x=>mode===x||mode==='combined',rep=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b)};
if(name==='late-game.js'&&on('foul'))rep('remaining>35','remaining>(offensiveLead>=4&&offensiveLead<=6?55:35)');
if(name==='attributes.js'){
 if(on('foul'))rep("foulResolved=defensiveFoul(side,choose(clubs[side],'drb'),choose(clubs[1-side],'per'),'intentional personal');if(!foulResolved)machine.transition('decision');",`foulResolved=defensiveFoul(side,choose(clubs[side],'drb'),choose(clubs[1-side],'per'),'intentional personal');
 while(!foulResolved&&liveClockEnd-elapsedSeconds>1&&Math.random()<lateGameFoulChance(moraleBeforeMargin,liveClockEnd-elapsedSeconds,machine.shotClock,plans[1-side].tactics)){machine.transition('decision');advanceLiveClock(Math.min(2,liveClockEnd-elapsedSeconds),'decision');foulResolved=defensiveFoul(side,choose(clubs[side],'drb'),choose(clubs[1-side],'per'),'intentional personal');}
 if(!foulResolved)machine.transition('decision');`);

 if(on('quick'))rep('const shotContext={scoreState:attackState,','const shotContext={scoreState:{...attackState,quickTwo:liveClockEnd!==null&&liveClockEnd-elapsedSeconds<=30&&scores[side]-scores[1-side]===-2},');
 if(on('timeout')){rep('function possessionCore(side){','let p10AdvanceTimeouts=[0,0];function possessionCore(side){');rep("if(Math.random()<lateGameFoulChance(moraleBeforeMargin,left,machine.shotClock,plans[1-side].tactics))",`const lastAction=featActions.at(-1),advanceEligible=(lastAction?.type==='score'&&lastAction.side!==side)||(lastAction?.type==='rebound'&&lastAction.side===side)||globalThis.p10AdvanceEligible===side;
 if(moraleBeforeMargin<0&&moraleBeforeMargin>=-6&&left<=60&&left>3&&timeouts[side]<4&&p10AdvanceTimeouts[side]<2&&advanceEligible){timeouts[side]++;p10AdvanceTimeouts[side]++;globalThis.p10timeoutCount=(globalThis.p10timeoutCount||0)+1;globalThis.p10AdvanceEligible=null;plan.setup=Math.min(plan.setup,1);log(side,clubs[side].abbr+' takes timeout and advances the inbound to the frontcourt.');homeCourtTimeout(homeCourt);altitudeTimeout(clubs,gameRotations);gameRotations.forEach(r=>r.deadBall=true);}
 if(Math.random()<lateGameFoulChance(moraleBeforeMargin,left,machine.shotClock,plans[1-side].tactics))`);}
}
if(name==='tendencies.js'&&on('quick'))rep('if(scoreState)zones.three*=scoreState.three;','if(scoreState)zones.three*=scoreState.three;if(scoreState?.quickTwo){zones.inside*=1.3;zones.three*=.7;}');return s;};
