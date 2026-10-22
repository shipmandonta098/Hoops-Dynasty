module.exports=(n,s)=>{
 n=n.split('?')[0];const replace=(a,b)=>{if(!s.includes(a))throw Error('Missing Phase4 anchor '+a);s=s.replace(a,b)};
 if(n==='attributes.js')replace('contest=miscommunication?false:', 'contest=miscommunication||decision.openLook?false:');
 if(n==='home-court.js')replace('scale=neutral||split?0:leagueRules().homeAdvantage/.8,','scale=neutral||split?0:leagueRules().homeAdvantage/.8*(state.year>=2023?.6:1),');
 return s;
};
