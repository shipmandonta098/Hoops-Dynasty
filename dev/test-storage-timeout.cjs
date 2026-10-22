const assert=require('node:assert/strict');const {loadLeague}=require('./load-league.cjs');
(async()=>{const x=loadLeague({strictDOM:false});let request;
x.context.stalledFactory={open(){request={};return request}};
await assert.rejects(x.run('openNormalizedCareerDatabase({factory:stalledFactory,timeoutMs:10})'),/did not respond/);let closed=false;request.result={close(){closed=true}};request.onsuccess();assert.ok(closed);
let aborted=false;const db={close(){},transaction(){return {abort(){aborted=true},objectStore(){return {getAll(){return {}}}}}}};
x.context.stalledTransactionFactory={open(){const r={};setTimeout(()=>{r.result=db;r.onsuccess()},0);return r}};
const repo=await x.run('openNormalizedCareerDatabase({factory:stalledTransactionFactory,timeoutMs:10})');await assert.rejects(repo.list(),/timed out/);assert.ok(aborted);
console.log('PASS stalled open rejects; late connection closes; stalled transaction aborts and releases caller even without browser abort event');
})();
