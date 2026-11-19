'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const roster=require('../public/roster.json');
function fakeGL(){
 const gl=new Proxy({}, {get:(target,key)=>{
  if(key==='getShaderParameter'||key==='getProgramParameter')return ()=>true;
  if(key==='createShader'||key==='createProgram'||key==='createBuffer')return ()=>({});
  if(key==='getAttribLocation')return ()=>0;
  if(key==='getUniformLocation')return ()=>({});
  if(key==='getShaderInfoLog'||key==='getProgramInfoLog')return ()=>'';
  if(typeof key==='string'&&key.toUpperCase()===key)return 1;
  return ()=>{};
 }});
 return gl;
}
test('3D renderer can render all eight stage implementations and all attack poses without exceptions',()=>{
 const win={devicePixelRatio:1};
 const scope={window:win,Float32Array,Math,console};
 vm.createContext(scope);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/three-d.js'),'utf8'),scope);
 const canvas={width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>fakeGL()};
 const renderer=new win.Badlandz3D(canvas);
 const stages=['north-block','rooftop','basketball-court','subway','garage','underpass','corner-store','warehouse'];
 const poses=['idle','walk','jab','cross','hook','uppercut','front-kick','roundhouse','spin-kick','sweep','special','ability','ultra','air-jab','air-kick','dodge','crouch','block','hurt','ko'];
 for(const stage of stages){
  assert.doesNotThrow(()=>renderer.render([
   {slot:0,x:430,height:0,facing:1,characterId:'piro',action:'jab',attackProgress:.42},
   {slot:1,x:550,height:0,facing:-1,characterId:'speedy',action:'roundhouse',attackProgress:.42}
  ],roster,1,{stage}),stage);
 }
 for(let i=0;i<roster.length;i++)for(const pose of poses){
  assert.doesNotThrow(()=>renderer.render([{slot:0,x:480,height:0,facing:1,characterId:roster[i].id,action:pose,attackProgress:.5}],roster,1,{stage:'north-block'}),roster[i].id+':'+pose);
 }
 assert.equal(renderer.stageBuilds,8,'eight static stages baked once to GPU geometry');
 renderer.render([{slot:0,x:480,height:0,facing:1,characterId:'piro',action:'jab',attackProgress:.4}],roster,1.1,{stage:'north-block'});
 assert.equal(renderer.stageBuilds,8,'same arena reused without rebuilding each frame');
});


test('V7 articulated trajectories send fists forward, hook across and uppercut upward',()=>{
 const win={devicePixelRatio:1},scope={window:win,Float32Array,Math,console};
 vm.createContext(scope);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/three-d.js'),'utf8'),scope);
 const canvas={width:960,height:540,clientWidth:960,clientHeight:540,id:'stage',style:{},getContext:()=>fakeGL()};
 const renderer=new win.Badlandz3D(canvas);renderer.drawMesh=()=>{};renderer.p=()=>{};
 let segments=[];
 renderer.bone=(_parent,a,b)=>{segments.push({a:[...a],b:[...b]});};
 const sample=(move,progress)=>{segments=[];renderer.fighter({slot:0,x:480,height:0,facing:1,characterId:'piro',action:move,attackProgress:progress},roster[0],1,0);return segments.map(v=>v);};
 const idle=sample('idle',0),jab=sample('jab',.48),cross=sample('cross',.48),hook=sample('hook',.59),upper=sample('uppercut',.56),kick=sample('front-kick',.49),round=sample('roundhouse',.53);
 assert(jab[3].b[2]>idle[3].b[2]+.5,'jab fist extends forward');
 assert(cross[1].b[2]>idle[1].b[2]+.6,'cross uses other fist and extends forward');
 assert(hook[3].b[0]<idle[3].b[0]-.1,'hook moves sideways across body');
 assert(upper[3].b[1]>idle[3].b[1]+.45,'uppercut rises up from guard');
 assert(kick[7].b[2]>idle[7].b[2]+.8,'front kick reaches forward');
 assert(round[5].b[2]>idle[5].b[2]+1,'roundhouse reaches forward with opposite leg');
});
