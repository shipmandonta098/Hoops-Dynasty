const assert=require('assert/strict');
module.exports=(name,s)=>{if(name.split('?')[0]!=='attributes.js')return s;const rep=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b)};
rep('function possessionCore(side){','let p10;function possessionCore(side){');
rep('function possession(side){','function possession(side){p10={side,before:[...scores],transitionStart:transitionTeam===side,transitionUsed:false,shotTransition:false};');
rep('summaryFast=transitionAdvantage;','p10.transitionUsed ||= transitionAdvantage;summaryFast=transitionAdvantage;');
rep('transitionTeam=null;const shotContext=', 'p10.shotTransition ||= transition;transitionTeam=null;const shotContext=');
rep('machine.finish();','globalThis.p10poss?.push({...p10,after:[...scores],period:simulationClock(elapsedSeconds).period,trace:[...machine.trace]});machine.finish();');return s;};
