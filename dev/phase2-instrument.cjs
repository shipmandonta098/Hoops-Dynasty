/* Read-only instrumentation: consumes no RNG and leaves legacy results unchanged. */
module.exports=function instrument(name,s){if(name.split('?')[0]!=='attributes.js')return s;
const replace=(a,b)=>{if(!s.includes(a))throw Error('Missing instrument anchor '+a);s=s.replace(a,b)};
replace("trackShot=(shot,made)=>{", "trackShot=(shot,made)=>{globalThis.phase2Current.shots.push({kind:shot.kind,made,path:globalThis.phase2Path});");
replace('function possessionCore(side){','function possessionCore(side){globalThis.phase2Path="primary";');
replace('rr.fga++;const denied=', 'globalThis.phase2Path="putback";rr.fga++;const denied=');
replace("machine.transition('shot');rr.fga++;if(value===3)", "machine.transition('shot');globalThis.phase2Path='kickout';rr.fga++;if(value===3)");
replace('rebounder=board.player;if(board.offensive)', 'rebounder=board.player;globalThis.phase2Current.rebounds.push({source:machine.phase,offensive:board.offensive});if(board.offensive)');
replace('row=rows.get(p.id);row.reb++;', 'row=rows.get(p.id);globalThis.phase2Current.rebounds.push({source:machine.phase,offensive:board.offensive});row.reb++;');
replace('function recordTurnover(side,type,p,defender=null,foulDrawnBy=null){',`function recordTurnover(side,type,p,defender=null,foulDrawnBy=null){globalThis.phase2Current.turnovers[type]=(globalThis.phase2Current.turnovers[type]||0)+1;`);
replace('function personal(side,p,label){',`function personal(side,p,label){globalThis.phase2Current.fouls[label]=(globalThis.phase2Current.fouls[label]||0)+1;`);
replace('function freeThrows(side,p,count,technical=false,retain=false){',`function freeThrows(side,p,count,technical=false,retain=false){globalThis.phase2Current.trips.push({side,count,technical,retain});`);
replace('function possession(side){',`function possession(side){globalThis.phase2Current={side,turnovers:{},fouls:{},trips:[],rebounds:[],shots:[],before:[...rows.values()].map(r=>({...r})),score:[...scores],start:clockWindow.start,end:clockWindow.end};`);
replace('machine.finish();',`globalThis.phase2Possessions.push({...globalThis.phase2Current,trace:[...machine.trace],terminal:machine.phase,next:terminalNextSide,boards:extraBoards,after:[...rows.values()].map(r=>({...r})),afterScore:[...scores]});machine.finish();`);
return s;
};
