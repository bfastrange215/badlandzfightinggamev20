'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const roster=require('../public/roster.json');const {ABILITIES,ULTRAS}=require('../server');
const models=['dan-fighting.glb','strange-fighting.glb'];
const modelDir=path.join(__dirname,'../public/assets/models');
test('Strange is the eleventh selectable fighter, with his own powers, not a replacement for BFA Strange',()=>{
 assert.equal(roster.length,12);
 const strange=roster.find(c=>c.id==='strange-3d');
 assert(strange&&strange.model3d&&strange.name==='Strange');
 assert.equal(strange.category,'crew');
 assert.equal(strange.abilityName,ABILITIES['strange-3d'].name);
 assert.equal(strange.ultraName,ULTRAS['strange-3d']);
 assert(roster.some(c=>c.id==='bfa-strange'&&c.name==='BFA Strange'));
 assert(roster.some(c=>c.id==='dan'&&c.model3d));
 assert(fs.readFileSync(path.join(__dirname,'../public/ui-v5.js'),'utf8').includes("'dan','strange-3d'"));
});
test('The supplied Strange is included as real textured GLB geometry without an embedded skeleton',()=>{
 const f=fs.readFileSync(path.join(modelDir,models[1]));
 assert.equal(f.toString('ascii',0,4),'glTF');assert.equal(f.readUInt32LE(4),2);
 assert.equal(f.readUInt32LE(8),f.length);
 const meta=JSON.parse(f.toString('utf8',20,20+f.readUInt32LE(12)));
 assert.equal(meta.accessors[0].count,390136);
 assert(meta.meshes[0].primitives[0].attributes.TEXCOORD_0!=null);
 assert(meta.images[0].mimeType==='image/jpeg');
 assert.equal(meta.skins?.length||0,0);assert.equal(meta.animations?.length||0,0);
});
test('Dan and Strange load as two independent GPU assets and draw together in one online fight',async()=>{
 const data={}; for(const f of models){const p=fs.readFileSync(path.join(modelDir,f));data['/assets/models/'+f]=p;}
 let draws=0;let counts=[];const gl=new Proxy({}, {get:(_t,k)=>{
  if(k==='getShaderParameter'||k==='getProgramParameter')return ()=>true;
  if(k==='getExtension')return ()=>({});
  if(['createShader','createProgram','createBuffer','createTexture'].includes(k))return ()=>({});
  if(k==='getAttribLocation')return ()=>0;if(k==='getUniformLocation')return ()=>({});
  if(k==='drawElements')return (_m,n)=>{draws++;counts.push(n);};
  if(k==='getShaderInfoLog'||k==='getProgramInfoLog')return ()=>'none';
  if(typeof k==='string'&&k.toUpperCase()===k)return 1;return ()=>{};
 }});
 const scope={window:{devicePixelRatio:1},console,Math,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,
  fetch:async(url)=>{const buf=data[url];return buf?{ok:true,arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length)}:{ok:false,status:404};},
  createImageBitmap:async()=>({close(){}})};
 scope.window.BadlandzSkin=require('../public/skinned-glb.js');vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/three-d.js'),'utf8'),scope);
 const canvas={width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>gl};
 const renderer=new scope.window.Badlandz3D(canvas);
 const [dan,strange]=await Promise.all([renderer.loadDan(),renderer.loadStrange()]);
 assert(dan&&strange&&dan!==strange);
 assert(renderer.danAsset&&renderer.strangeAsset&&renderer.danAsset!==renderer.strangeAsset);
 assert.equal(renderer.importedAssets['dan'],dan);assert.equal(renderer.importedAssets['strange-3d'],strange);
 renderer.render([
  {slot:0,x:360,height:0,facing:1,characterId:'dan',action:'jab',attackProgress:.5},
  {slot:1,x:610,height:0,facing:-1,characterId:'strange-3d',action:'front-kick',attackProgress:.5}
 ],roster,1,{stage:'north-block'});
 assert.equal(draws,2);assert(counts.includes(93219),'Dan uses the new indexed rigged GLB');assert(counts.some(x=>x>2000000),'Strange mesh remains intact');
});
