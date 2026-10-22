// Reproducible candidate: always transform the preserved Phase 2 attributes,
// even after the tested candidate becomes the production engine.
const baseline=require('./phase3-baseline-source.cjs'),transform=require('./phase3-transform.cjs');
module.exports=(name,source)=>transform(name,baseline(name,source));
