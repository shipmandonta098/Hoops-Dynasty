const fs=require('fs'),path=require('path');module.exports=(name,src)=>{const p=path.join(__dirname,'candidate-dist',name.split('?')[0]);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):src};
