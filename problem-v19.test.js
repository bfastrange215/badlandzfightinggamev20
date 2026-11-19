'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {EventEmitter}=require('node:events');
const root=path.resolve(__dirname,'../public');
const roster=require('../public/roster.json');
const {createGameServer,ABILITIES,ULTRAS}=require('../server');
const binary=path.join(root,'assets/models/da-problem.glb');
const p=roster.find(c=>c.id==='da-problem');
test('V19 Da Problem is the 12th selectable fighter, with his own power and full-game menus',()=>{
 assert.equal(roster.length,12);assert.equal(roster.filter(c=>c.id==='da-problem').length,1);
 assert(p&&p.name==='Da Problem');assert.equal(p.category,'crew');
 assert.equal(p.model3d,'/assets/models/da-problem.glb');assert.equal(p.modelRigged,false);
 assert.equal(p.abilityName,ABILITIES['da-problem'].name);assert.equal(p.ultraName,ULTRAS['da-problem']);
 assert(roster.some(c=>c.name==='HTB Drewski'&&c.model3d));
 assert(roster.some(c=>c.id==='dan'&&c.model3d));assert(roster.some(c=>c.id==='strange-3d'&&c.model3d));
 assert(roster.some(c=>c.id==='bfa-strange'));
 assert(fs.readFileSync(path.join(root,'ui-v5.js'),'utf8').includes("'the-crackhead','dan','strange-3d','da-problem'"));
 assert(fs.statSync(path.join(root,'assets/da-problem.webp')).size>15000);
 assert(fs.readFileSync(path.join(root,'da-problem-3d-preview.html'),'utf8').includes("characterId:'da-problem'"));
});
test('Da Problem model is actual full-quality indexed textured GLB geometry (not a 2D sprite)',()=>{
 const buffer=fs.readFileSync(binary);assert.equal(buffer.toString('ascii',0,4),'glTF');
 assert.equal(buffer.readUInt32LE(4),2);assert.equal(buffer.readUInt32LE(8),buffer.length);
 const meta=JSON.parse(buffer.toString('utf8',20,20+buffer.readUInt32LE(12)));
 assert.equal(meta.meshes.length,1);assert.equal(meta.meshes[0].primitives[0].mode,4);
 assert.equal(meta.accessors[0].count,578703);
 assert.equal(meta.accessors[3].count,3201942);
 assert(meta.meshes[0].primitives[0].attributes.TEXCOORD_0!=null);
 assert.equal(meta.images[0].mimeType,'image/jpeg');
 assert.equal(meta.animations?.length||0,0);assert.equal(meta.skins?.length||0,0);
});
test('Da Problem loads as its own WebGL model and draws in a fight next to Drewski, Dan, and Strange',async()=>{
 const names=['da-problem.glb','htb-drewski.glb','dan-fighting.glb','strange-fighting.glb'];
 const models={};for(const name of names){const b=fs.readFileSync(path.join(root,'assets/models',name));models['/assets/models/'+name]=b;}
 const counts=[];
 const gl=new Proxy({}, {get:(_t,k)=>{
  if(k==='getShaderParameter'||k==='getProgramParameter')return ()=>true;
  if(k==='getExtension')return ()=>({});
  if(['createShader','createProgram','createBuffer','createTexture'].includes(k))return ()=>({});
  if(k==='getAttribLocation')return ()=>0;if(k==='getUniformLocation')return ()=>({});
  if(k==='drawElements')return (_mode,n)=>counts.push(n);
  if(k==='getShaderInfoLog'||k==='getProgramInfoLog')return ()=>'';
  if(typeof k==='string'&&k.toUpperCase()===k)return 1;return ()=>{};
 }});
 const scope={window:{devicePixelRatio:1},console,Math,Float32Array,Uint8Array,Uint16Array,Uint32Array,DataView,TextDecoder,Blob,
  fetch:async(url)=>{const b=models[url];return b?{ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.length)}:{ok:false,status:404};},
  createImageBitmap:async()=>({close(){}})};
 scope.window.BadlandzSkin=require('../public/skinned-glb.js');vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(root,'three-d.js'),'utf8'),scope);
 const renderer=new scope.window.Badlandz3D({width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>gl});
 const loaded=await Promise.all([renderer.loadProblem(),renderer.loadDrewski(),renderer.loadDan(),renderer.loadStrange()]);
 assert(loaded.every(Boolean));assert.equal(new Set(loaded).size,4);
 assert.equal(renderer.problemAsset,loaded[0]);
 for(const action of ['idle','walk','jab','cross','hook','uppercut','front-kick','roundhouse','block','ultra']){
  renderer.render([{slot:0,x:480,height:0,facing:1,characterId:'da-problem',action,attackProgress:.5}],roster,1,{stage:'north-block'});
 }
 renderer.render([{slot:0,x:360,height:0,facing:1,characterId:'da-problem',action:'jab',attackProgress:.6},
   {slot:1,x:580,height:0,facing:-1,characterId:'htb-druski',action:'block',attackProgress:0}],roster,1,{stage:'north-block'});
 assert.equal(counts.length,12);assert.equal(counts.filter(n=>n===3201942).length,11);
 assert(counts.includes(1766616));
});
class Client extends EventEmitter{
 constructor(port){super();this.nextId=0;this.callbacks=new Map();this.ws=new WebSocket(`ws://127.0.0.1:${port}/socket.io/?EIO=4&transport=websocket`);
 this.ws.onmessage=e=>{const msg=String(e.data);if(msg[0]==='0'){this.ws.send('40');return;}if(msg==='2'){this.ws.send('3');return;}
  if(msg.startsWith('40')){super.emit('connect');return;}
  if(msg.startsWith('42')){const ix=msg.indexOf('[');if(ix>=0){const [ev,payload]=JSON.parse(msg.slice(ix));super.emit(ev,payload);}return;}
  if(msg.startsWith('43')){const ix=msg.indexOf('[');if(ix>=0){const id=Number(msg.slice(2,ix));const cb=this.callbacks.get(id);this.callbacks.delete(id);cb?.(JSON.parse(msg.slice(ix))[0]);}}};}
 send(event,payload,cb){let pre='42';if(cb){const id=this.nextId++;this.callbacks.set(id,cb);pre+=String(id);}this.ws.send(pre+JSON.stringify([event,payload]));}
 disconnect(){this.ws.close();}
}
const event=(c,name)=>new Promise((resolve,reject)=>{const tid=setTimeout(()=>reject(Error('Timeout '+name)),3000);c.once(name,v=>{clearTimeout(tid);resolve(v);});});
const ack=(c,e,v)=>new Promise((resolve,reject)=>{const tid=setTimeout(()=>reject(Error('Timeout '+e)),3000);c.send(e,v,r=>{clearTimeout(tid);resolve(r);});});
test('Da Problem joins multiplayer with stable server HP and deals damage to an opponent',async()=>{
 const game=createGameServer(0),port=await game.listen(),a=new Client(port),b=new Client(port);
 try{
  await Promise.all([event(a,'connect'),event(b,'connect')]);
  const create=await ack(a,'create-room',{name:'Problem',characterId:'da-problem',stage:'north-block'});
  const started=event(a,'match-start');const joined=await ack(b,'join-room',{code:create.code,name:'Dan',characterId:'dan'});const match=await started;
  assert.equal(joined.ok,true);assert.equal(match.players[0].characterId,'da-problem');
  const room=game.rooms.get(create.code);assert(room);
  room.fighters[0].x=420;room.fighters[0].facing=1;room.fighters[1].x=530;room.fighters[1].facing=-1;
  const impact=event(a,'hit');a.send('attack',{type:'punch'});const hit=await impact;
  assert.equal(hit.type,'jab');assert.equal(hit.damage,5);assert.equal(room.fighters[1].hp,95);
  const health=await (await fetch(`http://127.0.0.1:${port}/health`)).json();
  assert.equal(health.version,20);assert.equal(health.fighters,12);
 }finally{a.disconnect();b.disconnect();await game.close();}
});
