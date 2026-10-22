from pathlib import Path
B=Path('dev/phase8/baseline-dist');C=Path('dev/phase8/candidate-dist')
def edit(s,a,b):
 assert s.count(a)==1,(a,s.count(a));return s.replace(a,b)
s=(B/'tendencies.js').read_text()
s='''/* Match-local coaching preferences; no rating or accuracy changes.
 * Lead-size × elapsed-regulation-time intensity, capped at one.
 * Numeric policy strengths are simulation assumptions, not measured CBA rules. */
function scoreStatePolicy(margin,minute){
 const intensity=Math.min(1,Math.abs(margin)/20)*Math.max(0,Math.min(1,minute/gameMinutes()));
 const leading=margin>0,trailing=margin<0;
 return {intensity,pace:leading?1-.12*intensity:trailing?1+.08*intensity:1,
  three:trailing?1+.65*intensity:1,safe:leading?intensity:0,
  pressure:leading?1-.08*intensity:trailing?1+.04*intensity:1,
  gamble:leading?1-.30*intensity:trailing?1+.40*intensity:1};
}
'''+s
s=edit(s,"action='shoot',assisted=false}={}){","action='shoot',assisted=false,scoreState=null}={}){")
s=edit(s,"if(system==='Pace & Space')", "if(scoreState)zones.three*=scoreState.three;\n if(system==='Pace & Space')")
s=edit(s,"let w=eligible(s)?tendency(p,s.key):0;", "let w=eligible(s)?tendency(p,s.key):0;if(scoreState?.safe&&['fadeaway','postFade','turnaround','pullup','pullupThree','runningThree','alleyOop'].includes(s.key))w*=1-.45*scoreState.safe;")
s=edit(s,"tendency(lane,'passLane')*.35", "tendency(lane,'passLane')*.35*(context.defensiveState?.gamble??1)")
(C/'tendencies.js').write_text(s)
s=(B/'attributes.js').read_text()
s=edit(s,"function possessionCore(side){const transitionAdvantage", "function possessionCore(side){const attackState=scoreStatePolicy(scores[side]-scores[1-side],gameRotations[side].minute),defendState=scoreStatePolicy(scores[1-side]-scores[side],gameRotations[1-side].minute);const transitionAdvantage")
s=edit(s,"rotation,{transition:transitionAdvantage,clutch:","rotation,{defensiveState:defendState,transition:transitionAdvantage,clutch:")
s=edit(s,"tendency(d,'onBallSteal')*.32", "tendency(d,'onBallSteal')*.32*defendState.gamble")
s=edit(s,"!sag&&Math.random()<tendency(d,'contest');", "!sag&&Math.random()<Math.min(1,tendency(d,'contest')*defendState.pressure);")
s=edit(s,"const shotContext={transition,transitionAdvantage", "const shotContext={scoreState:attackState,transition,transitionAdvantage")
# Fixed-window engine: scale shared opportunities by BOTH offensive possession durations.
# Carry fractions across minutes; never give either side extra independent possessions.
s=edit(s,"function runMinute(minute,count){restQuarter", "let scoreStatePaceCarry=0;\n function runMinute(minute,count){const paceA=scoreStatePolicy(scores[0]-scores[1],minute).pace,paceB=scoreStatePolicy(scores[1]-scores[0],minute).pace;scoreStatePaceCarry+=count*(2/(1/paceA+1/paceB));const planned=Math.floor(scoreStatePaceCarry+1e-9);count=Math.max(1,planned);scoreStatePaceCarry-=count;restQuarter")
(C/'attributes.js').write_text(s)
