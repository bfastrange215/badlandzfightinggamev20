'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const roster=require('../public/roster.json');
const code=fs.readFileSync(path.join(__dirname,'../public/three-d.js'),'utf8');
function renderContext(){
 const gl=new Proxy({}, {get:(_,key)=>{
  if(key==='getShaderParameter'||key==='getProgramParameter')return ()=>true;
  if(['createShader','createProgram','createBuffer'].includes(key))return ()=>({});
  if(key==='getAttribLocation')return ()=>0;
  if(key==='getUniformLocation')return ()=>({});
  if(key==='getShaderInfoLog'||key==='getProgramInfoLog')return ()=>'';
  if(typeof key==='string'&&key.toUpperCase()===key)return 1;
  return ()=>{};
 }});
 const window={devicePixelRatio:1};const scope={window,Float32Array,Math,console};
 vm.createContext(scope);vm.runInContext(code,scope);
 const canvas={width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>gl};
 const renderer=new window.Badlandz3D(canvas);
 renderer.drawMesh=()=>{};renderer.p=()=>{};
 let segments=[];
 renderer.bone=(_root,a,b)=>{segments.push({a:[...a],b:[...b],len:Math.hypot(...a.map((v,i)=>v-b[i]))});};
 return {renderer,window,sample(char,move='idle',progress=0,time=1){segments=[];renderer.fighter({slot:0,x:480,height:0,facing:1,characterId:char.id,action:move,attackProgress:progress},char,time,0);return segments.slice();}};
}
test('V8 analytic IK keeps forearms, upper arms, shins and thighs constant length for all moves and fighters',()=>{
 const {sample}=renderContext();
 const poses=['idle','walk','jab','cross','hook','uppercut','front-kick','roundhouse','spin-kick','sweep','special','ability','ultra','air-jab','air-kick','dodge','crouch','block','hurt','ko'];
 for(const char of roster.filter(c=>!c.model3d))for(const pose of poses)for(const progress of [0,.12,.27,.39,.48,.61,.74,.87,1]){
  const parts=sample(char,pose,progress,2.1);
  assert.equal(parts.length,8,`${char.id} ${pose}: 4 arm + 4 leg segments`);
  for(let i=0;i<4;i++)assert(Math.abs(parts[i].len-[.6,.61][i%2])<1e-5,`${char.id} ${pose} ${progress}: arm ${i} not stretched: ${parts[i].len}`);
  for(let i=4;i<8;i++)assert(Math.abs(parts[i].len-.76)<1e-5,`${char.id} ${pose} ${progress}: leg ${i} not stretched: ${parts[i].len}`);
 }
});
test('V8 all fighters have nine distinct stances, distinct guards and unique foot placements',()=>{
 const {sample,window}=renderContext();
 const configs=window.BadlandzRig.stances;
 const proceduralRoster=roster.filter(c=>!c.model3d);
 const names=proceduralRoster.map(char=>configs[char.id]?.name);
 assert.equal(new Set(names).size,proceduralRoster.length);
 const guardFingerprints=[];
 const feetFingerprints=[];
 for(const char of proceduralRoster){
  const segments=sample(char);
  guardFingerprints.push(JSON.stringify(segments.slice(0,4).filter((_,i)=>i%2===1).map(b=>b.b.map(n=>Math.round(n*1000)))));
  feetFingerprints.push(JSON.stringify(segments.slice(4).filter((_,i)=>i%2===1).map(b=>b.b.map(n=>Math.round(n*1000)))));
  assert.equal(char.stanceName,configs[char.id].name);
 }
 assert.equal(new Set(guardFingerprints).size,proceduralRoster.length,'all guards have different wrist placements');
 assert.equal(new Set(feetFingerprints).size,proceduralRoster.length,'all stances have different ankle placements');
});
test('V8 IK never puts the end joint beyond maximum physical reach',()=>{
 const {window}=renderContext();
 const solve=window.BadlandzRig.solveTwoBone;
 for(const target of [[0,0,500],[200,-200,-300],[.15,.6,0],[0,0,0]]){
  const result=solve([0,0,0],target,.6,.61,[1,.2,.8]);
  assert(Math.hypot(...result.end)<=1.21000001);
  assert(Math.abs(result.upperLength-.6)<1e-6);
  assert(Math.abs(result.lowerLength-.61)<1e-6);
 }
});
