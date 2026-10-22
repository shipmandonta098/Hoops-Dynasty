// Replay the tested mechanics against preserved Phase 3 source.
const baseline=require('./phase4-baseline-source.cjs'),transform=require('./phase4-transform.cjs');
module.exports=(name,source)=>transform(name,baseline(name,source));
