const fs=require('fs'),path=require('path');
module.exports=(name,source)=>{
 const n=name.split('?')[0];
 return ['attributes.js','home-court.js'].includes(n)?fs.readFileSync(path.join(__dirname,'phase4','phase3-'+n),'utf8'):source;
};
