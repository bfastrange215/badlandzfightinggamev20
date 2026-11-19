'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const {EventEmitter}=require('node:events');
const roster=require('../public/roster.json');
const {createGameServer,ABILITIES,ULTRAS}=require('../server');
const root=path.join(__dirname,'../public');
const models=['htb-drewski.glb','dan-fighting.glb','strange-fighting.glb'];
const modelDir=path.join(root,'assets/models');
const drewski=roster.find(c=>c.id==='htb-druski');
test('V18 replaces old HTB Druski with HTB Drewski without adding a duplicate or disrupting powers',()=>{
 assert.equal(roster.length,12);assert.equal(roster.filter(c=>c.id==='htb-druski').length,1);
 assert(drewski);assert.equal(drewski.name,'HTB Drewski');
 assert.equal(drewski.model3d,'/assets/models/htb-drewski.glb');
 assert.equal(drewski.modelRigged,false);assert.equal(drewski.category,'legends');
 assert(!roster.some(c=>c.name==='HTB Druski'));
 assert.equal(drewski.abilityName,ABILITIES['htb-druski'].name);
 assert.equal(drewski.ultraName,ULTRAS['htb-druski']);
 assert(roster.some(c=>c.id==='dan'&&c.model3d));assert(roster.some(c=>c.id==='strange-3d'&&c.model3d));
 assert(fs.readFileSync(path.join(root,'ui-v5.js'),'utf8').includes("'htb-druski'"));
 assert(fs.statSync(path.join(root,'assets/htb-druski.webp')).size>15000);
});
test('Drewski GLB retains complete textured mesh, has no unsupported skeletal animation claim',()=>{
 const data=fs.readFileSync(path.join(modelDir,models[0]));
 assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);
 assert.equal(data.readUInt32LE(8),data.byteLength);
 const meta=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
 assert.equal(meta.meshes.length,1);
 assert.equal(meta.accessors[0].count,322124);
 assert.equal(meta.meshes[0].primitives[0].attributes.POSITION,0);
 assert(meta.meshes[0].primitives[0].attributes.TEXCOORD_0!=null);
 assert.equal(meta.images[0].mimeType,'image/jpeg');
 assert.equal(meta.skins?.length||0,0);assert.equal(meta.animations?.length||0,0);
 assert.equal(meta.accessors[3].count,1766616);
});
test('Drewski, Dan and Strange all load independently through WebGL and draw in the actual fight renderer',async()=>{
 const data={};for(const f of models){const b=fs.readFileSync(path.join(modelDir,f));data['/assets/models/'+f]=b;}
 const drawCounts=[];const gl=new Proxy({}, {get:(_t,k)=>{
  if(k==='getShaderParameter'||k==='getProgramParameter')return ()=>true;
  if(k==='getExtension')return ()=>({});
  if(['createShader','createProgram','createBuffer','createTexture'].includes(k))return ()=>({});
  if(k==='getAttribLocation')return ()=>0;if(k==='getUniformLocation')return ()=>({});
  if(k==='drawElements')return (_m,n)=>drawCounts.push(n);
  if(k==='getShaderInfoLog'||k==='getProgramInfoLog')return ()=>'';
  if(typeof k==='string'&&k.toUpperCase()===k)return 1;return ()=>{};
 }});
 const scope={window:{devicePixelRatio:1},console,Math,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,
  fetch:async(url)=>{const buf=data[url];return buf?{ok:true,arrayBuffer:async()=>buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length)}:{ok:false,status:404};},
  createImageBitmap:async()=>({close(){}})};
 scope.window.BadlandzSkin=require('../public/skinned-glb.js');vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(root,'three-d.js'),'utf8'),scope);
 const canvas={width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>gl};
 const renderer=new scope.window.Badlandz3D(canvas);
 const [newModel,dan,strange]=await Promise.all([renderer.loadDrewski(),renderer.loadDan(),renderer.loadStrange()]);
 assert(newModel&&dan&&strange);assert.equal(renderer.drewskiAsset,newModel);
 assert.notEqual(newModel,dan);assert.notEqual(newModel,strange);
 for(const action of ['idle','walk','jab','hook','uppercut','front-kick','roundhouse','block','ultra']){
  renderer.render([{slot:0,x:455,height:0,facing:1,characterId:'htb-druski',action,attackProgress:.52}],roster,1,{stage:'north-block'});
 }
 renderer.render([{slot:0,x:360,facing:1,height:0,characterId:'htb-druski',action:'jab',attackProgress:.4},
   {slot:1,x:570,facing:-1,height:0,characterId:'strange-3d',action:'block',attackProgress:0}],roster,1,{stage:'rooftop'});
 assert.equal(drawCounts.length,11);
 assert.equal(drawCounts.filter(n=>n===1766616).length,10);
 assert(drawCounts.includes(2191464),'Strange still draws with his GLB');
 assert(fs.readFileSync(path.join(root,'drewski-3d-preview.html'),'utf8').includes("characterId:'htb-druski'"));
});
class Client extends EventEmitter {
 constructor(port){super();this.nextId=0;this.callbacks=new Map();this.ws=new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
 this.ws.onmessage=e=>{const msg=String(e.data);if(msg[0]==='0'){this.ws.send('40');return;}if(msg==='2'){this.ws.send('3');return;}
  if(msg.startsWith('40')){super.emit('connect');return;}
  if(msg.startsWith('42')){const ix=msg.indexOf('[');if(ix>=0){const [event,payload]=JSON.parse(msg.slice(ix));super.emit(event,payload);}return;}
  if(msg.startsWith('43')){const ix=msg.indexOf('[');if(ix>=0){const id=Number(msg.slice(2,ix));const cb=this.callbacks.get(id);this.callbacks.delete(id);cb?.(JSON.parse(msg.slice(ix))[0]);}}};}
 send(event,payload,cb){let p='42';if(cb){const id=this.nextId++;this.callbacks.set(id,cb);p+=String(id);}this.ws.send(p+JSON.stringify([event,payload]));}
 disconnect(){this.ws.close();}
}
const event=(client,name)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timeout '+name)),3000);client.once(name,v=>{clearTimeout(timer);resolve(v);});});
const ack=(c,e,v)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Timeout '+e)),3000);c.send(e,v,result=>{clearTimeout(timer);resolve(result);});});
test('HTB Drewski replaces original fighter in an online fight and deals real synchronized damage',async()=>{
 const g=createGameServer(0);const port=await g.listen(),a=new Client(port),b=new Client(port);
 try{
  await Promise.all([event(a,'connect'),event(b,'connect')]);
  const cr=await ack(a,'create-room',{name:'Drewski',characterId:'htb-druski',stage:'north-block'});
  const started=event(a,'match-start');
  const joined=await ack(b,'join-room',{code:cr.code,name:'Piro',characterId:'piro',stage:'north-block'});
  const match=await started;
  assert.equal(joined.ok,true);assert.equal(match.players[0].characterId,'htb-druski');
  const room=g.rooms.get(cr.code);assert(room);room.fighters[0].x=420;room.fighters[0].facing=1;room.fighters[1].x=535;room.fighters[1].facing=-1;
  const impact=event(a,'hit');a.send('attack',{type:'punch'});const h=await impact;
  assert.equal(h.damage,5);assert.equal(room.fighters[1].hp,95);
  const hp=(await (await fetch(`http://127.0.0.1:${port}/health`)).json());assert.equal(hp.version,20);assert.equal(hp.fighters,12);
 }finally{a.disconnect();b.disconnect();await g.close();}
});
