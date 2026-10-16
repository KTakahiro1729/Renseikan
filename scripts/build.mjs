import {mkdir,rm,copyFile,cp} from 'node:fs/promises';
import {GAME_DATA,validateData} from '../data-loader.js';
validateData(GAME_DATA);
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['index.html','gm.html','player.html','gm.js','player.js','core.js','data-loader.js','style.css','_headers','404.html'])await copyFile(file,'dist/'+file);
await cp('data','dist/data',{recursive:true});
console.log('Validated data and built dist/ for Cloudflare Pages.');
