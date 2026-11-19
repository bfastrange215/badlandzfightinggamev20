'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {RiggedGLB,getAccessor,clipFor}=require('../public/skinned-glb.js');
const glbPath=path.join(__dirname,'../public/assets/models/dan-fighting.glb');
function open(){
 const buf=fs.readFileSync(glbPath),bytes=buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.length),dv=new DataView(bytes);
 assert.equal(buf.subarray(0,4).toString(),'glTF');
 const len=dv.getUint32(12,true),meta=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,len))),start=20+len+8;
 const p=meta.meshes[0].primitives[0],geometry={position:getAccessor(meta,bytes,start,p.attributes.POSITION),normal:getAccessor(meta,bytes,start,p.attributes.NORMAL)};
 return {buf,meta,p,geometry,rig:new RiggedGLB(meta,bytes,start,p,geometry)};
}
test('V20 replaced Dan model with uploaded 80-bone / 14-motion GLB, no extra fighter slot',()=>{
 const {meta,buf}=open();
 assert.equal(meta.skins.length,1);assert.equal(meta.skins[0].joints.length,80);
 assert.equal(meta.animations.length,14);assert.equal(buf.length,6037984);
 const roster=require('../public/roster.json');assert.equal(roster.length,12);
 const dan=roster.find(c=>c.id==='dan');assert(dan);assert.equal(dan.modelRigged,true);
 assert.equal(dan.model3d,'/assets/models/dan-fighting.glb');
 assert.equal(dan.name,'Dan');assert.equal(dan.abilityName,'IRON RUSH');
 assert.equal(roster.find(c=>c.id==='htb-druski').name,'HTB Drewski');
 for(const name of ['strange-3d','da-problem'])assert(roster.find(c=>c.id===name));
});
test('V20 joint skinning visibly moves Dan for walking, jab, punch and kick without the old vertex-warp shortcut',()=>{
 const {rig,geometry}=open();
 assert(rig.clips.has('walk'));assert(rig.clips.has('make a fist and throw a punch'));
 assert(rig.clips.has('front_kick_02'));assert(rig.clips.has('hit_to_head'));
 rig.pose('idle',0,0);const idle=rig.outputPositions.slice();
 const changes=(a,b)=>{let d=0;for(let i=0;i<a.length;i+=3)d+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return d/a.length;};
 rig.pose('walk',.7,.5);const walking=rig.outputPositions.slice();
 rig.pose('jab',.1,.5);const jab=rig.outputPositions.slice();
 rig.pose('front-kick',.1,.5);const kicking=rig.outputPositions.slice();
 assert(changes(idle,walking)>.005,'Walk visibly changes the skinned vertices');
 assert(changes(idle,jab)>.005,'Jab visibly moves the skinned vertices');
 assert(changes(idle,kicking)>.005,'Front kick visibly moves the skinned vertices');
 assert(changes(jab,kicking)>.005,'Punch and kick use distinct poses');
 assert(geometry.position.length===rig.outputPositions.length);
 assert(rig.outputPositions.every(Number.isFinite));
 assert(rig.outputNormals.every(Number.isFinite));
 assert.equal(clipFor('walk'),'walk');assert.equal(clipFor('roundhouse'),'mid kick');
});
test('V20 browser entrypoints load skeleton player before WebGL renderer and show rigged Dan',()=>{
 for(const f of ['index.html','dan-3d-preview.html']){
  const s=fs.readFileSync(path.join(__dirname,'../public',f),'utf8');
  assert(s.includes('/skinned-glb.js'));assert(s.indexOf('/skinned-glb.js')<s.indexOf('/three-d.js'));
 }
 const v=fs.readFileSync(path.join(__dirname,'../public/three-d.js'),'utf8');
 assert(v.includes('m.rig.pose(move,t,v)'));
 assert(v.includes('m.rigged?[0,0,0,0]'),'rigged Dan must bypass rubber-limb vertex shader');
});
