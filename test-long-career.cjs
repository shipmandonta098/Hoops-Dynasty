// Long-career health (scaled down for CI): an 8-team, 28-game league simulated for several seasons. Checks that the
// save grows slowly, season time stays flat, players retire, the free-agent and draft-rights pools stay bounded, and
// ratings, age and payroll stay in range, with no errors. The full 30-team / 50-season report is dev/long-career.cjs.
// LONG_CAREER_SEASONS overrides the season count (default 6).
const assert=require('node:assert/strict'),{runLongCareer}=require('./dev/long-career.cjs');
(async()=>{
 const seasons=Number(process.env.LONG_CAREER_SEASONS||6),rows=await runLongCareer({seasons,teams:'tiny',seed:2026,log:false});
 const done=rows.slice(1),first=rows[0],last=rows.at(-1),teams=8;
 for(const r of done)assert.equal(r.status,'completed',`season ${r.season}: ${r.errors?.join(' | ')}`);
 assert.equal(done.length,seasons,'every season completed');
 // Save: regression guard at the measured rate (about 1.6 MB a season for 30 teams, scaled to this league). The goal is
 // under 1 MB per 30 teams; tighten this as archives get slimmer.
 const growth=(last.saveMB-done[0].saveMB)/Math.max(1,done.length-1),allowance=1.7*teams/30;
 assert(growth<allowance,`save grows ${growth.toFixed(3)} MB/season (allowance ${allowance.toFixed(3)})`);
 // Time: later seasons are no slower than early ones (generous margin for machine noise).
 const early=done.slice(1,3).reduce((n,r)=>n+r.simSeconds,0)/Math.min(2,done.length-1),late=done.slice(-2).reduce((n,r)=>n+r.simSeconds,0)/2;
 assert(late<early*1.5,`season time ${early.toFixed(1)}s → ${late.toFixed(1)}s`);
 // Population: retirements happen, pools stay bounded.
 assert(done.slice(1).every(r=>r.retiredLastSeason>0),'players retire every offseason: '+done.map(r=>r.retiredLastSeason).join(','));
 for(const r of done){assert(r.freeAgents<=teams*4,`season ${r.season}: ${r.freeAgents} free agents`);assert(r.draftRights<=teams*3,`season ${r.season}: ${r.draftRights} unsigned draft rights`)}
 // Ratings, age, payroll stay in range.
 for(const r of done){
  assert(Math.abs(r.avgOVR-first.avgOVR)<=2.5,`season ${r.season}: average OVR ${r.avgOVR} vs ${first.avgOVR}`);
  assert(r.ovr85/r.players<=first.ovr85/first.players+.08,`season ${r.season}: ${r.ovr85} players at 85+ of ${r.players}`);
  assert(r.avgAge>=25&&r.avgAge<=29.5,`season ${r.season}: average age ${r.avgAge}`);
  assert(r.avgPayroll>=r.cap*.7,`season ${r.season}: average payroll ${r.avgPayroll} under a ${r.cap} cap`);
 }
 console.log('Long career ('+seasons+' seasons, 8 teams): '+done.map(r=>`S${r.season} ${r.saveMB}MB ${r.simSeconds}s ret ${r.retiredLastSeason} FA ${r.freeAgents} rights ${r.draftRights} OVR ${r.avgOVR} 85+ ${r.ovr85} age ${r.avgAge} pay ${r.avgPayroll}`).join(' | '));
})().catch(e=>{console.error(e);process.exit(1)});
