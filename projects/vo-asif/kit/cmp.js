const fs=require('fs');const re=/^beat\('([^']+)'/mg;
const old=[...fs.readFileSync('winter.html','utf8').matchAll(re)].map(m=>m[1]);
const nw=[];for(const f of ['wb1.js','wb2.js','wb3.js','wb4.js','wb5.js'])nw.push(...[...fs.readFileSync(f,'utf8').matchAll(re)].map(m=>m[1]));
console.log(old.length,nw.length);console.log('missing',old.filter(a=>!nw.includes(a)));console.log('extra',nw.filter(a=>!old.includes(a)));
