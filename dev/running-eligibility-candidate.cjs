// Experimental VM transform only. Not imported by the application or deployed.
const assert=require('node:assert/strict');
function candidate(name,source){
 const replacements={
  'attributes.js':["const shotContext={transition,","const shotContext={transition,transitionAdvantage,"],
  'tendencies.js':["if(context.transition)return [{name:'Running Layup'","if(context.transitionAdvantage)return [{name:'Running Layup'"]
 };
 if(!replacements[name])return source;
 const [from,to]=replacements[name];assert.equal(source.split(from).length-1,1,'unique candidate anchor '+name);
 return source.replace(from,to);
}
module.exports={candidate};
