// Process-local preload for existing regression suites; never edits shipped files.
const fs=require('node:fs'),path=require('node:path'),{candidate}=require('./putback-block-candidate.cjs'),read=fs.readFileSync;
const original=require('node:child_process').execFileSync('git',['show','73183bb3b14d9b6852e563420a296de6da485057:dist/attributes.js'],{encoding:'utf8'});
const target=path.resolve(__dirname,'../dist/attributes.js');
fs.readFileSync=function(file,...args){const result=read.call(this,file,...args);if(typeof file==='string'&&path.resolve(file)===target){const output=candidate('attributes.js',original);return Buffer.isBuffer(result)?Buffer.from(output):output}return result};
