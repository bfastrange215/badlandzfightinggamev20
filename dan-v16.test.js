'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const roster=require('../public/roster.json');
const {ABILITIES,ULTRAS}=require('../server');
const model=path.resolve(__dirname,'../public/assets/models/dan-fighting.glb');
test('Dan is a tenth selectable 3D character with server-backed fighting ability',()=>{
 assert.equal(roster.length,12);
 const dan=roster.find(c=>c.id==='dan');
 assert(dan&&dan.model3d&&dan.name==='Dan');
 assert.equal(dan.category,'crew');
 assert.equal(dan.abilityName,ABILITIES.dan.name);
 assert.equal(dan.ultraName,ULTRAS.dan);
 assert(fs.readFileSync(path.resolve(__dirname,'../public/ui-v5.js'),'utf8').includes("'the-crackhead','dan','strange-3d'"));
});
test('Dan model is actual textured GLB 2.0 triangles with UV, not a painted game portrait',()=>{
 const buf=fs.readFileSync(model),d=new DataView(buf.buffer,buf.byteOffset,buf.length);
 assert.equal(buf.toString('ascii',0,4),'glTF');assert.equal(d.getUint32(4,true),2);
 const len=d.getUint32(12,true),obj=JSON.parse(buf.toString('utf8',20,20+len));
 assert.equal(obj.meshes.length,1);assert(obj.accessors[0].count>30000);
 assert.equal(obj.meshes[0].primitives[0].mode??4,4);
 assert(obj.meshes[0].primitives[0].attributes.TEXCOORD_0!=null);
 assert(obj.images[0].mimeType==='image/jpeg');
 assert.equal(obj.skins?.length,1,'new Dan model has a real skeleton');
 assert.equal(obj.skins[0].joints.length,80);
 assert.equal(obj.animations?.length,14,'new Dan model has 14 embedded motion clips');
 assert.equal(d.getUint32(8,true),buf.length,'complete GLB');
});
test('Dan GLB loads into the real renderer data path and is drawn as indexed 3D geometry',async()=>{
 const vm=require('node:vm');
 let drawElements=0,shown=0;
 const gl=new Proxy({}, {get:(_target,key)=>{
  if(key==='getShaderParameter'||key==='getProgramParameter')return ()=>true;
  if(key==='getExtension')return ()=>({});
  if(['createShader','createProgram','createBuffer','createTexture'].includes(key))return ()=>({});
  if(key==='getAttribLocation')return ()=>0;
  if(key==='getUniformLocation')return ()=>({});
  if(key==='getShaderInfoLog'||key==='getProgramInfoLog')return ()=>'';
  if(key==='drawElements')return (_mode,count)=>{drawElements++;shown=count;};
  if(typeof key==='string'&&key.toUpperCase()===key)return 1;
  return ()=>{};
 }});
 const bytes=fs.readFileSync(model);
 const scope={
  window:{devicePixelRatio:1},console,Math,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,
  fetch:async()=>({ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}),
  createImageBitmap:async()=>({close(){}})
 };
 scope.window.BadlandzSkin=require('../public/skinned-glb.js');vm.createContext(scope);
 vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../public/three-d.js'),'utf8'),scope);
 const canvas={width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>gl};
 const renderer=new scope.window.Badlandz3D(canvas);
 assert(await renderer.loadDan());
 const char=roster.find(c=>c.id==='dan');
 assert(renderer.danAsset && renderer.danAsset.count>90000 && renderer.danAsset.rigged);
 for(const move of ['idle','walk','jab','cross','hook','uppercut','front-kick','roundhouse','block','ultra']){
  renderer.render([{slot:0,x:480,height:0,facing:1,characterId:'dan',action:move,attackProgress:.54}],roster,1,{stage:'north-block'});
 }
 assert.equal(drawElements,10,'Dan is rendered through indexed GLB triangles in every combat state');
 assert(shown>90000,'the new rigged full-body mesh is drawn rather than a painted head');
});
