'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const roster=require('../public/roster.json');
const source=fs.readFileSync(path.join(__dirname,'../public/three-d.js'),'utf8');
function makeRenderer(){
 const names=[];
 const gl=new Proxy({}, {get:(_,k)=>{
  if(k==='getShaderParameter'||k==='getProgramParameter')return ()=>true;
  if(['createShader','createProgram','createBuffer'].includes(k))return ()=>({});
  if(k==='getAttribLocation')return ()=>0;
  if(k==='getUniformLocation')return ()=>({});
  if(k==='getShaderInfoLog'||k==='getProgramInfoLog')return ()=>'';
  if(typeof k==='string'&&k.toUpperCase()===k)return 1;
  return ()=>{};
 }});
 const window={devicePixelRatio:1};const scope={window,Float32Array,Math,console};
 vm.createContext(scope);vm.runInContext(source,scope);
 const renderer=new window.Badlandz3D({id:'stage',width:960,height:540,clientWidth:960,clientHeight:540,style:{},getContext:()=>gl});
 const original=renderer.drawMesh.bind(renderer);
 renderer.drawMesh=(mesh,model,color)=>{names.push(mesh);original(mesh,model,color);};
 return {renderer,names,window};
}
test('V10 human meshes are present and replace primitive sphere heads, single-piece torsos and cylindrical limbs',()=>{
 const {renderer,names}=makeRenderer();
 for(const key of ['face-angular','face-broad','face-soft','face-lean','torso-athletic','torso-heavy','torso-female','torso-lean','limb','fist']){
  assert(renderer.mesh[key]?.count>100,key+' has usable triangles');
 }
 for(const char of roster.filter(c=>!c.model3d)){
  names.length=0;
  renderer.fighter({slot:0,x:480,height:0,facing:1,characterId:char.id,action:'idle',attackProgress:0},char,1.5,0);
  assert(names.includes('face-'+({piro:'angular',speedy:'lean','htb-druski':'broad','bfa-strange':'lean','gcg-doughboy':'broad',verge:'angular','the-crackhead':'lean','lucy-chucky':'soft','lexa-birdface':'soft'}[char.id])),char.id+' modeled head');
  assert(names.some(v=>v.startsWith('torso-')),char.id+' modeled torso');
  assert(names.filter(v=>v==='limb').length===8,char.id+' modeled limbs');
  assert(names.filter(v=>v==='fist').length===2,char.id+' two non-sphere gloves');
 }
});
test('V10 has all nine appearance configurations and female hair styles stay distinct',()=>{
 const {window}=makeRenderer();
 assert.equal(Object.keys(window.BadlandzRig.appearance).length,9);
 for(const fighter of roster.filter(c=>!c.model3d)){const a=window.BadlandzRig.appearance[fighter.id];assert(a.face&&a.torso&&a.jaw&&a.brow&&a.nose);}
 assert.equal(roster.find(f=>f.id==='lucy-chucky').hair,'pigtails');
 assert.equal(roster.find(f=>f.id==='lexa-birdface').hair,'ponytail');
});
