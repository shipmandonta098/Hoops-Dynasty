// Passive audit counters: no random draws, state changes, or timing changes.
const assert=require('assert/strict');
module.exports=(name,s)=>{
 if(name.split('?')[0]!=='attributes.js')return s;
 const rep=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b)};
 rep('function possessionCore(side){','let p13Transition=false;function possessionCore(side){');
 rep('function possession(side){','function possession(side){p13Transition=false;const p13start=elapsedSeconds;');
 rep('summaryFast=transitionAdvantage;','p13Transition ||= transitionAdvantage;summaryFast=transitionAdvantage;');
 for(const made of ['true','false'])s=s.replaceAll(`trackShot(shot,${made});`,`if(globalThis.p13audit){p13audit.primaryFGA++;p13audit.fastbreakFGA+=Number(transitionAdvantage);}trackShot(shot,${made});`);
 rep('machine.finish();',`if(globalThis.p13audit){p13audit.possessions++;p13audit.transitionPossessions+=Number(p13Transition);if(p13start>=gameMinutes()*60-60&&p13start<gameMinutes()*60)p13audit.final60Starts++;}machine.finish();`);
 return s;
};
