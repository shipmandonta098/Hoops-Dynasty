module.exports=(name,s)=>{
 if(name.split('?')[0]!=='attributes.js')return s;
 const replace=(a,b)=>{if(!s.includes(a))throw Error('Missing candidate anchor '+a);s=s.replace(a,b)};
 replace("y=k=>effectiveAttribute(d,k,defProgress,", "y=k=>effectiveAttribute(d,k,(100-gameRotations[1-side].stamina.get(d.id))/30,");
 replace("const seeksContact=Math.random()<tendency(p,'drawFoul'),foul=1.6*", "const modernFoulContext=state.year>=2023,shotContact=modernFoulContext?(kind==='three'?.12:(state.leagueGender==='female'?1.6:1.8)):1;const seeksContact=Math.random()<tendency(p,'drawFoul'),foul=shotContact*1.6*");
 replace('chance*.7)),shot,homeCourt,side)',"chance*(modernFoulContext?(state.leagueGender==='female'?.35:.45):.7))),shot,homeCourt,side)");
 return s;
};
