// Disposable process-local candidate; production files remain untouched.
const fs=require('fs'),path=require('path'),{candidate}=require('./wrapper-clock-candidate.cjs'),read=fs.readFileSync;
const original=require('child_process').execFileSync('git',['show','96f5b681a7059b345c3aa0b6abf813156d272535:dist/tendencies.js'],{encoding:'utf8'}),target=path.resolve(__dirname,'../dist/tendencies.js');
fs.readFileSync=function(file,...args){const r=read.call(this,file,...args);if(typeof file==='string'&&path.resolve(file)===target){const s=candidate('tendencies.js',original);return Buffer.isBuffer(r)?Buffer.from(s):s}return r};
