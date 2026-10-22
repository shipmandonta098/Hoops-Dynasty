/* Audit-only initial fictional roster allocation. No ratings, IDs, positions or
 * league-wide talent are changed. Stable same-position swaps widen team quality.
 * Never invoked when loading a save or selecting a verified historical roster. */
function widenInitialRosterQuality(teams){
 const quality=t=>{const r=[...t.roster].sort((a,b)=>b.ovr-a.ovr);return r.slice(0,5).reduce((s,p)=>s+p.ovr,0)/5*.8+r.slice(5).reduce((s,p)=>s+p.ovr,0)/Math.max(1,r.length-5)*.2};
 const variance=()=>{const q=teams.map(quality),m=q.reduce((a,b)=>a+b,0)/q.length;return q.reduce((s,x)=>s+(x-m)**2,0)/q.length};
 const initial=variance(),target=initial*1.15**2;let swaps=0;
 while(variance()<target&&swaps<teams.length*2){let best=null,delta=Infinity;const old=variance(),mean=teams.reduce((s,t)=>s+quality(t),0)/teams.length;
  for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
   const a=teams[i],b=teams[j],qa=quality(a),qb=quality(b);if(qa===qb)continue;
   for(let x=0;x<a.roster.length;x++)for(let y=0;y<b.roster.length;y++){
    const p=a.roster[x],q=b.roster[y];if(p.pos!==q.pos||(qa-qb)*(q.ovr-p.ovr)<=0)continue;
    a.roster[x]=q;b.roster[y]=p;const na=quality(a),nb=quality(b),change=(na**2+nb**2-qa**2-qb**2)/teams.length-(mean+(na+nb-qa-qb)/teams.length)**2+mean**2;a.roster[x]=p;b.roster[y]=q;
    if(change>0&&change<delta){delta=change;best=[a,b,x,y];}
   }
  }
  if(!best)break;const[a,b,x,y]=best;[a.roster[x],b.roster[y]]=[b.roster[y],a.roster[x]];swaps++;if(variance()<=old)throw Error('Roster spread failed to increase');
 }
 teams.forEach(t=>t.roster.sort((a,b)=>b.ovr-a.ovr));globalThis.p10Roster={initialSD:Math.sqrt(initial),finalSD:Math.sqrt(variance()),swaps};
}
