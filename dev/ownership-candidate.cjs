const assert=require('node:assert/strict');
function candidate(name,source){
 if(name!=='attributes.js')return source;
 let s=source;
 const edit=(a,b)=>{assert.equal(s.split(a).length-1,1,a);s=s.replace(a,b)};
 edit('let transitionTeam=null;',`let transitionTeam=null;
 // Ball ownership is independent of transition eligibility. Only a cross-side
 // ordinary bonus-FT subtree overrides the next scheduled offensive slot.
 let terminalNextSide=null,crossSideBonus=false,dispatchSide=null;`);
 edit("markOutcome('turnover');machine.transition('turnover');","terminalNextSide=1-side;markOutcome('turnover');machine.transition('turnover');");
 edit('if(!made&&i===count&&!technical&&!retain)finishRebound(side);','if(made&&i===count&&!technical&&!retain)terminalNextSide=1-side;if(!made&&i===count&&!technical&&!retain)finishRebound(side);');
 assert.equal(s.split("machine.transition('made');").length-1,3);
 s=s.replaceAll("machine.transition('made');","terminalNextSide=1-side;machine.transition('made');");
 edit('if(bonus){freeThrows(1-guiltySide,recipient,2);return}if(guiltySide===side)return;', 'if(bonus){if(guiltySide===side)crossSideBonus=true;freeThrows(1-guiltySide,recipient,2);return}if(guiltySide===side){terminalNextSide=1-side;return;}');
 edit('if(!board.offensive)transitionTeam=1-side;', 'if(!board.offensive)terminalNextSide=1-side;if(!board.offensive)transitionTeam=1-side;');
 edit('}else transitionTeam=1-side;', '}else {terminalNextSide=1-side;transitionTeam=1-side;}');
 edit('function possession(side){homeCourtTick(homeCourt);','function possession(side){homeCourtTick(homeCourt);terminalNextSide=null;crossSideBonus=false;');
 edit("Defensive pressure increases for six possessions.')}}", "Defensive pressure increases for six possessions.')}return crossSideBonus?terminalNextSide:null;}");
 edit('if(gameBoundary(minute))transitionTeam=null;', 'if(gameBoundary(minute))transitionTeam=null;if(gameBoundary(minute))dispatchSide=null;');
 edit('for(const [turn,side] of [firstSide,1-firstSide].entries()){','for(let turn=0;turn<2;turn++){const side=dispatchSide??(turn===0?firstSide:1-firstSide);');
 edit('possession(side);elapsedSeconds=clockWindow.end;', 'dispatchSide=possession(side)??1-side;elapsedSeconds=clockWindow.end;');
 return s;
}
module.exports={candidate};
