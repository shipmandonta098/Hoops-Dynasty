// Immutable audit-only Phase 2 snapshot. It is never loaded by the game.
const fs=require('fs'),path=require('path'),crypto=require('crypto');let baseline;
module.exports=(name,source)=>{
 if(name.split('?')[0]!=='attributes.js')return source;
 if(!baseline){baseline=fs.readFileSync(path.join(__dirname,'phase3/phase2-attributes.js'),'utf8');const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'phase3/baseline-hashes.json')))['dist/attributes.js'];if(crypto.createHash('sha256').update(baseline).digest('hex')!==expected)throw Error('Phase 2 audit snapshot changed');}
 return baseline;
};
