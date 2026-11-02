// News storage per simulated season (30-team default league): bytes of every news item posted, by category, and of
// the story facts stored on games. Usage: node dev/news-size.cjs [repo dir=.] [seasons=1]
const dir=require('node:path').resolve(process.argv[2]||'.'),seasons=Number(process.argv[3]||1),{loadLeague}=require(dir+'/dev/load-league.cjs');
(async()=>{const l=loadLeague({seed:2026,strictDOM:false});l.setRandomSeed(2026);
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Size';state=validateCareerData(buildSetupCareer(d));var newsLog=[],storyBytes=0,games=0;
 const addBefore=addNewsItem;addNewsItem=function(item){addBefore(item);newsLog.push(JSON.stringify(newsStore().items[0]))};
 const playBefore=play;play=function(...a){const r=playBefore(...a);games++;if(r&&r.story)storyBytes+=JSON.stringify(r.story).length+9;return r};`);
l.context.options={seed:2026,log:false,yieldControl:()=>new Promise(r=>setImmediate(r))};
for(let s=1;s<=seasons;s++){const t=Date.now();l.run('newsLog=[];storyBytes=0;games=0');const rep=await l.run('simulateMultipleSeasonsHeadless(1,options)');
 const out=JSON.parse(l.run(`JSON.stringify((()=>{const by={};for(const j of newsLog){const n=JSON.parse(j),k=n.category;by[k]=by[k]||{n:0,kb:0};by[k].n++;by[k].kb+=j.length/1000}
  for(const k in by)by[k].kb=Math.round(by[k].kb);const all=newsLog.reduce((a,j)=>a+j.length,0),results=(by.Results?.kb||0)*1000;
  return {items:newsLog.length,allMB:+(all/1e6).toFixed(3),nonResultMB:+((all-results)/1e6).toFixed(3),storyMB:+(storyBytes/1e6).toFixed(3),games,by,stateNewsMB:+(JSON.stringify(state.newsFeed).length/1e6).toFixed(3),stateItems:state.newsFeed.items.length}})())`));
 console.log(JSON.stringify({season:s,status:rep.status,errors:rep.errors.map(e=>e.error).slice(0,3),sec:(Date.now()-t)/1000,...out}));}
})().catch(e=>{console.error(e);process.exit(1)});
