/* Philly Badlandz: self-contained WebGL 3D renderer (no CDNs or model downloads).
 * Fighters are actual articulated, shaded 3D meshes, not 2D sprites. */
(function(){'use strict';
const ID=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mul(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
function T(x=0,y=0,z=0){let a=ID();a[12]=x;a[13]=y;a[14]=z;return a;}
function S(x=1,y=x,z=x){let a=ID();a[0]=x;a[5]=y;a[10]=z;return a;}
function RX(v){let a=ID(),c=Math.cos(v),s=Math.sin(v);a[5]=c;a[6]=s;a[9]=-s;a[10]=c;return a;}
function RY(v){let a=ID(),c=Math.cos(v),s=Math.sin(v);a[0]=c;a[2]=-s;a[8]=s;a[10]=c;return a;}
function RZ(v){let a=ID(),c=Math.cos(v),s=Math.sin(v);a[0]=c;a[1]=s;a[4]=-s;a[5]=c;return a;}
function chain(...ms){return ms.reduce((a,b)=>mul(a,b),ID());}
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const v=Math.min(1,Math.max(0,(x-a)/Math.max(.0001,b-a)));return v*v*(3-2*v);};
const peak=(t,a,b,c,d)=>smooth(a,b,t)*(1-smooth(c,d,t));
const vecMix=(a,b,t)=>a.map((x,i)=>mix(x,b[i],t));
const add3=(a,b)=>a.map((v,i)=>v+b[i]);
const sub3=(a,b)=>a.map((v,i)=>v-b[i]);
const dot3=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
const len3=a=>Math.hypot(...a);
const unit3=(a,fallback=[0,1,0])=>{const d=len3(a);return d>1e-7?a.map(v=>v/d):[...fallback];};
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const times3=(a,n)=>a.map(v=>v*n);
// Fixed-length analytic two-bone inverse kinematics: no more rubber arms or legs.
// The pole vector chooses where an elbow or knee bends. The end effector is
// clamped into its physical reach, then the middle joint is solved exactly.
function solveTwoBone(anchor,target,upper,lower,pole){
 const vec=sub3(target,anchor),length=len3(vec),axis=unit3(vec,[0,0,1]);
 const reach=Math.min(upper+lower-0.0002,Math.max(Math.abs(upper-lower)+0.0002,length));
 const endpoint=add3(anchor,times3(axis,reach));
 const along=(upper*upper+reach*reach-lower*lower)/(2*reach);
 const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
 let sideways=sub3(pole,times3(axis,dot3(pole,axis)));
 if(len3(sideways)<.0001){const basis=Math.abs(axis[1])<.82?[0,1,0]:[0,0,1];sideways=cross3(axis,basis);}
 sideways=unit3(sideways,[1,0,0]);
 const joint=add3(add3(anchor,times3(axis,along)),times3(sideways,bend));
 return {start:[...anchor],joint,end:endpoint,limited:length>upper+lower-.0002,
  upperLength:len3(sub3(joint,anchor)),lowerLength:len3(sub3(endpoint,joint))};
}
// Every fighter has a unique default stance, not just a different idle speed.
// guard: fist positions in torso space (left/right), feet in hip space.
const FIGHTER_STANCES={
 'piro':{name:'Philly Shell',guard:[[ -.33,.38,.42],[.27,.63,.48]],feet:[[-.32,-.04], [.31,.32]],elbow:[.78,.12,.22],bounce:.012,lean:.03,blade:-.18,footTurn:[-.25,.25],tempo:1.8},
 'speedy':{name:'Bounce Kickboxer',guard:[[-.39,.50,.40],[.42,.45,.56]],feet:[[-.30,-.30],[.30,.50]],elbow:[.82,.17,.26],bounce:.070,lean:-.04,blade:.12,footTurn:[-.35,.45],tempo:3.3},
 'htb-druski':{name:'Heavy Peekaboo',guard:[[-.23,.68,.46],[.23,.66,.46]],feet:[[-.53,-.16],[.52,.18]],elbow:[.65,.14,.20],bounce:.006,lean:.09,blade:0,footTurn:[-.16,.16],tempo:1.2},
 'bfa-strange':{name:'Unorthodox Feint',guard:[[-.51,.15,.57],[.20,.74,.39]],feet:[[-.42,-.32],[.22,.43]],elbow:[.90,.12,.33],bounce:.034,lean:-.08,blade:.28,footTurn:[-.48,.32],tempo:2.7},
 'gcg-doughboy':{name:'Grappler Base',guard:[[-.54,.23,.47],[.54,.23,.47]],feet:[[-.63,-.17],[.61,.16]],elbow:[.89,.10,.26],bounce:.008,lean:.10,blade:0,footTurn:[-.28,.28],tempo:1.1},
 'verge':{name:'Enforcer Guard',guard:[[-.30,.48,.52],[.31,.48,.52]],feet:[[-.43,-.26],[.42,.24]],elbow:[.76,.10,.22],bounce:.017,lean:.02,blade:-.08,footTurn:[-.22,.22],tempo:2.0},
 'the-crackhead':{name:'Wild Sway',guard:[[-.49,.12,.60],[.28,.62,.50]],feet:[[-.42,-.35],[.47,.15]],elbow:[.91,.09,.30],bounce:.048,lean:.12,blade:-.28,footTurn:[-.46,.51],tempo:3.6},
 'lucy-chucky':{name:'Counter Guard',guard:[[-.16,.74,.55],[.16,.62,.59]],feet:[[-.30,-.27],[.34,.32]],elbow:[.68,.20,.30],bounce:.029,lean:-.05,blade:.22,footTurn:[-.25,.29],tempo:2.6},
 'lexa-birdface':{name:'Side-On Taekwondo',guard:[[-.40,.54,.36],[.30,.50,.60]],feet:[[-.23,-.49],[.28,.51]],elbow:[.78,.16,.22],bounce:.058,lean:-.09,blade:.38,footTurn:[-.58,.57],tempo:3.2}
};

const FIGHTER_APPEARANCE={
 'piro':{face:'angular',torso:'athletic',jaw:1.0,brow:1.0,nose:1.0,neck:1.0},
 'speedy':{face:'lean',torso:'lean',jaw:.86,brow:.85,nose:.85,neck:.90},
 'htb-druski':{face:'broad',torso:'heavy',jaw:1.10,brow:1.08,nose:1.08,neck:1.13},
 'bfa-strange':{face:'lean',torso:'lean',jaw:.87,brow:.95,nose:1.0,neck:.92},
 'gcg-doughboy':{face:'broad',torso:'heavy',jaw:1.10,brow:1.05,nose:1.03,neck:1.1},
 'verge':{face:'angular',torso:'athletic',jaw:1.0,brow:1.04,nose:1.04,neck:1.03},
 'the-crackhead':{face:'lean',torso:'lean',jaw:.82,brow:1.06,nose:.95,neck:.86},
 'lucy-chucky':{face:'soft',torso:'female',jaw:.80,brow:.77,nose:.78,neck:.86},
 'lexa-birdface':{face:'soft',torso:'female',jaw:.82,brow:.86,nose:.82,neck:.9}
};
function stanceIdleProfile(id,t,slot){
 const phase=t+slot*0.37;
 switch(id){
  case 'piro': return {torsoY:0, torsoYaw:Math.sin(phase*1.7)*0.035-0.06, torsoRoll:Math.sin(phase*1.7)*0.02, headSlip:Math.sin(phase*1.9)*0.03, leadLift:0.02, rearLift:0.0, footPulse:0.012, hipDrop:0.0};
  case 'speedy': return {torsoY:Math.abs(Math.sin(phase*3.3))*0.06, torsoYaw:Math.sin(phase*2.8)*0.05+0.05, torsoRoll:Math.sin(phase*3.6)*0.02, headSlip:Math.sin(phase*2.4)*0.015, leadLift:0.045, rearLift:0.028, footPulse:0.038, hipDrop:0.0};
  case 'htb-druski': return {torsoY:Math.sin(phase*1.2)*0.008, torsoYaw:Math.sin(phase*1.05)*0.015, torsoRoll:0, headSlip:Math.sin(phase*1.1)*0.008, leadLift:0.0, rearLift:0.0, footPulse:0.004, hipDrop:0.015};
  case 'bfa-strange': return {torsoY:Math.sin(phase*2.4)*0.028, torsoYaw:Math.sin(phase*2.1)*0.09+0.09, torsoRoll:Math.sin(phase*3.1)*0.04, headSlip:Math.sin(phase*1.6+1.2)*0.04, leadLift:0.015, rearLift:0.035, footPulse:0.018, hipDrop:-0.01};
  case 'gcg-doughboy': return {torsoY:Math.sin(phase*1.1)*0.007, torsoYaw:Math.sin(phase*1.0)*0.01, torsoRoll:0, headSlip:0.0, leadLift:0.0, rearLift:0.0, footPulse:0.002, hipDrop:0.025};
  case 'verge': return {torsoY:Math.sin(phase*1.7)*0.014, torsoYaw:Math.sin(phase*1.8)*0.028-0.03, torsoRoll:Math.sin(phase*1.8)*0.012, headSlip:Math.sin(phase*1.8)*0.018, leadLift:0.008, rearLift:0.0, footPulse:0.008, hipDrop:0.008};
  case 'the-crackhead': return {torsoY:Math.sin(phase*3.2)*0.032, torsoYaw:Math.sin(phase*3.0)*0.12-0.12, torsoRoll:Math.sin(phase*4.6)*0.065, headSlip:Math.sin(phase*2.9+1.5)*0.055, leadLift:0.02, rearLift:0.012, footPulse:0.02, hipDrop:-0.015};
  case 'lucy-chucky': return {torsoY:Math.sin(phase*2.2)*0.018, torsoYaw:Math.sin(phase*2.0)*0.03+0.08, torsoRoll:Math.sin(phase*2.2)*0.015, headSlip:Math.sin(phase*2.4)*0.02, leadLift:0.01, rearLift:0.022, footPulse:0.012, hipDrop:0.0};
  case 'lexa-birdface': return {torsoY:Math.abs(Math.sin(phase*3.0))*0.036, torsoYaw:Math.sin(phase*2.8)*0.04+0.18, torsoRoll:Math.sin(phase*2.5)*0.018, headSlip:Math.sin(phase*2.6)*0.016, leadLift:0.03, rearLift:0.04, footPulse:0.022, hipDrop:-0.005};
 }
 return {torsoY:0,torsoYaw:0,torsoRoll:0,headSlip:0,leadLift:0,rearLift:0,footPulse:0,hipDrop:0};
}

function perspective(fov,ratio,near,far){const f=1/Math.tan(fov/2),d=1/(near-far),o=new Float32Array(16);o[0]=f/ratio;o[5]=f;o[10]=(far+near)*d;o[11]=-1;o[14]=2*near*far*d;return o;}
function lookAt(eye,at,up=[0,1,0]){const norm=a=>{let v=Math.hypot(...a)||1;return a.map(x=>x/v)},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const z=norm(eye.map((x,i)=>x-at[i])),x=norm(cross(up,z)),y=cross(z,x),o=ID();
 o[0]=x[0];o[1]=y[0];o[2]=z[0];o[4]=x[1];o[5]=y[1];o[6]=z[1];o[8]=x[2];o[9]=y[2];o[10]=z[2];o[12]=-x.reduce((sum,v,i)=>sum+v*eye[i],0);o[13]=-y.reduce((sum,v,i)=>sum+v*eye[i],0);o[14]=-z.reduce((sum,v,i)=>sum+v*eye[i],0);return o;}
function hex(c){if(!c||typeof c!=='string')return [0.5,0.5,0.5];c=c.replace('#','');if(c.length===3)c=[...c].map(a=>a+a).join('');return [0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255);}
function boxMesh(){const p=[],n=[];const faces=[[[1,0,0],[[.5,-.5,-.5],[.5,-.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[-.5,.5,-.5],[-.5,.5,.5]]],[[0,1,0],[[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,-1,0],[[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]]],[[0,0,1],[[.5,-.5,.5],[-.5,-.5,.5],[-.5,.5,.5],[.5,.5,.5]]],[[0,0,-1],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5]]]];
 for(const [normal,vertices] of faces)for(const i of [0,1,2,0,2,3]){p.push(...vertices[i]);n.push(...normal);}return {p,n};}
function sphereMesh(rows=14,cols=20){const p=[],n=[];const point=(u,v)=>{let h=Math.PI*v,w=2*Math.PI*u;return [Math.sin(h)*Math.cos(w),Math.cos(h),Math.sin(h)*Math.sin(w)]};for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=point(x/cols,y/rows),b=point((x+1)/cols,y/rows),c=point((x+1)/cols,(y+1)/rows),d=point(x/cols,(y+1)/rows);for(const v of [a,c,b,a,d,c]){p.push(...v);n.push(...v);}}return {p,n};}
function cylinderMesh(segments=20){const p=[],n=[];for(let k=0;k<segments;k++){const a=k*Math.PI*2/segments,b=(k+1)*Math.PI*2/segments,co=Math.cos(a),si=Math.sin(a),co2=Math.cos(b),si2=Math.sin(b);let verts=[[co,-.5,si],[co2,-.5,si2],[co2,.5,si2],[co,.5,si]];for(const i of [0,2,1,0,3,2]){p.push(...verts[i]);const v=verts[i];n.push(v[0],0,v[2]);}
 for(const h of [.5,-.5]){const a0=[0,h,0],v1=[co,h,si],v2=[co2,h,si2];for(const v of (h>0?[a0,v2,v1]:[a0,v1,v2])){p.push(...v);n.push(0,h>0?1:-1,0);}}}return {p,n};}
// Organic surfaces replace the placeholder spheres and joint-to-joint cylinders.
// All meshes are local geometry; animation remains on the original fixed-length IK skeleton.
function ringBodyMesh(rings,sides=28){
 const p=[],n=[];
 const pt=(r,a)=>[Math.cos(a)*r.w,r.y,r.z+(Math.sin(a)*r.d)];
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
  const a=j*2*Math.PI/sides,b=(j+1)*2*Math.PI/sides;
  const v=[pt(rings[i],a),pt(rings[i],b),pt(rings[i+1],a),pt(rings[i+1],b)];
  for(const k of [0,2,1,1,2,3]){
   const A=v[0],B=v[2],C=v[1],e1=sub3(B,A),e2=sub3(C,A),norm=unit3(cross3(e1,e2));
   p.push(...v[k]);n.push(...norm);
  }
 }
 return {p,n};
}
function humanTorsoMesh(kind){
 let w=[.21,.33,.37,.36,.42,.49,.54,.45,.23];
 let d=[.15,.27,.30,.28,.33,.36,.34,.27,.16];
 if(kind==='heavy'){w=[.26,.42,.48,.49,.55,.65,.67,.53,.28];d=[.18,.32,.37,.38,.39,.42,.39,.30,.17];}
 if(kind==='female'){w=[.17,.29,.34,.30,.34,.44,.47,.38,.20];d=[.14,.24,.28,.27,.31,.36,.34,.27,.14];}
 if(kind==='lean'){w=[.18,.29,.34,.33,.38,.44,.48,.38,.19];d=[.13,.24,.27,.26,.29,.31,.29,.22,.13];}
 let ys=[-.30,-.23,-.05,.17,.35,.56,.75,.88,.95];
 return ringBodyMesh(ys.map((y,i)=>({y,w:w[i],d:d[i],z:(i>=4?.008:0)})));
}
function humanFaceMesh(kind){
 // Human contour: distinct chin, angular jaw, cheekbones, temples, skull cap.
 const broad=kind==='broad',soft=kind==='soft',lean=kind==='lean';
 const contour=[
  [-1,.045,.06],[-.91,.32,.28],[-.77,.56,.52],[-.55,.70,.66],
  [-.38,broad?.89:soft?.72:.78,.77],[-.15,broad?.99:lean?.83:.92,.86],
  [.08,broad?1.05:soft?.97:1,.99],[.35,1.04,1.02],[.60,1,.96],[.82,.78,.77],[.97,.30,.32],[1,.02,.025]
 ];
 return ringBodyMesh(contour.map(([y,w,d])=>({y,w,d,z:y<-.42?.045:0})),36);
}
function muscleMesh(){
 return ringBodyMesh([
 {y:-.5,w:.56,d:.59,z:0},{y:-.43,w:.80,d:.82,z:0},{y:-.29,w:1,d:1.02,z:0},
 {y:-.10,w:1.12,d:1.08,z:0},{y:.10,w:1.10,d:1.07,z:0},{y:.30,w:.95,d:.97,z:0},
 {y:.43,w:.77,d:.78,z:0},{y:.5,w:.55,d:.60,z:0}
 ],18);
}
function boxingFistMesh(){
 return ringBodyMesh([
  {y:-.45,w:.65,d:.60,z:0},{y:-.27,w:.98,d:1,z:0},
  {y:.10,w:1.04,d:1,z:0},{y:.35,w:.95,d:.94,z:0},{y:.49,w:.64,d:.72,z:0}
 ],18);
}
// V20: Dan's uploaded rigged GLB uses its 80-bone skeleton and real animation clips.
// Other imported (unrigged) GLBs retain the lightweight V19 fallback deformation.
const VS=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aVertexColor;attribute vec2 aUV;
uniform float uUseVertexColor;uniform mat4 uModel;uniform mat4 uVP;uniform vec4 uDanPose;
varying vec3 vNormal;varying vec3 vPos;varying vec3 vVertexColor;varying vec2 vUV;
void main(){
 vec3 p=aPosition;
 if(uDanPose.w>.5){
  float arm= smoothstep(.23,.49,abs(p.x))*smoothstep(-.22,.00,p.y)*(1.-smoothstep(.32,.51,p.y));
  float kickingLeg= smoothstep(.13,.27,p.x)*(1.-smoothstep(-.44,-.18,p.y));
  float walkingLeg= (1.-smoothstep(-.45,-.12,p.y))*smoothstep(.10,.26,abs(p.x));
  // The model faces +Z. Strike reach moves toward local +Z, which becomes
  // world +X/-X after facing rotation, not toward the screen camera.
  p.x+=arm*(-sign(p.x))*.10*uDanPose.x+kickingLeg*.12*uDanPose.y;
  p.y+=arm*max(0.,uDanPose.x)*.075+kickingLeg*.27*uDanPose.y;
  p.z+=arm*.39*uDanPose.x+kickingLeg*.48*uDanPose.y;
  p.z+=walkingLeg*sign(p.x)*uDanPose.z*.14;
 }
 vec4 wp=uModel*vec4(p,1.);vPos=wp.xyz;vNormal=normalize(mat3(uModel)*aNormal);
 vVertexColor=mix(vec3(1.),aVertexColor,uUseVertexColor);vUV=aUV;
 gl_Position=uVP*wp;
}`;
const FS=`precision mediump float;
uniform vec3 uColor;uniform float uTime;uniform sampler2D uAlbedo;uniform float uTextured;
varying vec3 vNormal;varying vec3 vPos;varying vec3 vVertexColor;varying vec2 vUV;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
void main(){
 vec3 n=normalize(vNormal);vec3 key=normalize(vec3(-.65,.85,.87));vec3 fill=normalize(vec3(.72,.35,-.51));
 float diffuse=max(0.,dot(n,key)),cold=max(0.,dot(n,fill));
 float rim=pow(1.-max(0.,dot(n,normalize(vec3(0.,.2,1.)))),2.8);
 vec3 light=vec3(.35,.345,.40)+vec3(.69,.55,.47)*diffuse+vec3(.20,.29,.46)*cold;
 float fine=hash(floor(vPos*57.)),rough=hash(floor(vPos*13.));
 float concrete=.89+fine*.12+rough*.07;
 // Procedural grained asphalt and isolated wet glints on the walkable ground.
 if(n.y>.78&&vPos.y<.18){
  concrete=.78+rough*.23+fine*.08;
  float wet=hash(floor(vec3(vPos.x*1.5,0.,vPos.z*2.0)));
  if(wet>.80)light+=vec3(.055,.07,.10)*pow(diffuse,1.4);
 }
 // Masonry joints break the flat plastic look of the stage buildings.
 if(abs(n.z)>.75&&vPos.z< -4.0&&vPos.y>.25){
  float row=floor(vPos.y*5.0),u=fract(vPos.x*3.0+mod(row,2.0)*.5);
  float joint=step(fract(vPos.y*5.0),.055)+step(u,.065);
  concrete*=1.-clamp(joint,0.,1.)*.18;
 }
 vec3 base=uColor*vVertexColor;
 if(uTextured>.5)base*=texture2D(uAlbedo,vUV).rgb;
 vec3 col=base*light*concrete+vec3(.09,.018,.042)*rim;
 float fog=clamp((-vPos.z-4.)/30.,0.,.54);
 col=mix(col,vec3(.086,.095,.15),fog);
 gl_FragColor=vec4(col,1.);
}`;
class Badlandz3D {
 constructor(canvas){
  this.canvas=canvas;
  const gl=canvas.getContext('webgl',{antialias:true,alpha:true,powerPreference:'high-performance'});
  if(!gl)throw new Error('WebGL unavailable. Turn on browser hardware acceleration.');
  this.gl=gl; this.isPreview=canvas.id==='preview'; this.stage='north-block';this.cameraCenter=0;this.cameraDistance=12;this.stageBatches=new Map();this.stageBuilds=0;this.stageCapturing=null;
  const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
  const prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);this.program=prog;
  this.pLoc=gl.getAttribLocation(prog,'aPosition');this.nLoc=gl.getAttribLocation(prog,'aNormal');this.colLoc=gl.getAttribLocation(prog,'aVertexColor');this.useColorLoc=gl.getUniformLocation(prog,'uUseVertexColor');this.mLoc=gl.getUniformLocation(prog,'uModel');this.vpLoc=gl.getUniformLocation(prog,'uVP');this.cLoc=gl.getUniformLocation(prog,'uColor');this.tLoc=gl.getUniformLocation(prog,'uTime');
  this.uvLoc=gl.getAttribLocation(prog,'aUV');this.texLoc=gl.getUniformLocation(prog,'uAlbedo');
  this.texturedLoc=gl.getUniformLocation(prog,'uTextured');this.danPoseLoc=gl.getUniformLocation(prog,'uDanPose');
  this.danAsset=null;this.danLoading=null;this.danError=null;this.danLoadAttempts=0;
  this.strangeAsset=null;this.strangeLoading=null;this.strangeError=null;
  this.drewskiAsset=null;this.drewskiLoading=null;this.drewskiError=null;
  this.problemAsset=null;this.problemLoading=null;this.problemError=null;
  this.importedAssets={};this.importedLoading={};this.importedErrors={};
  gl.uniform1i(this.texLoc,0);gl.uniform1f(this.texturedLoc,0);gl.uniform4fv(this.danPoseLoc,[0,0,0,0]);
  this.mesh={};for(const [name,geo] of Object.entries({box:boxMesh(),sphere:sphereMesh(12,17),cylinder:cylinderMesh(16),limb:muscleMesh(),fist:boxingFistMesh(),'torso-athletic':humanTorsoMesh('athletic'),'torso-heavy':humanTorsoMesh('heavy'),'torso-lean':humanTorsoMesh('lean'),'torso-female':humanTorsoMesh('female'),'face-angular':humanFaceMesh('angular'),'face-broad':humanFaceMesh('broad'),'face-soft':humanFaceMesh('soft'),'face-lean':humanFaceMesh('lean')})){
   const pos=gl.createBuffer(),normal=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.p),gl.STATIC_DRAW);
   gl.bindBuffer(gl.ARRAY_BUFFER,normal);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geo.n),gl.STATIC_DRAW);
   this.mesh[name]={pos,normal,count:geo.p.length/3,vertices:geo.p,normals:geo.n};
  }
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 }
 drawMesh(type,model,color){
  const gl=this.gl,m=this.mesh[type]||this.mesh.box;
  if(this.stageCapturing){
   const dst=this.stageCapturing,c=hex(color),verts=m.vertices,normals=m.normals;
   for(let k=0;k<verts.length;k+=3){
    const x=verts[k],y=verts[k+1],z=verts[k+2],nx=normals[k],ny=normals[k+1],nz=normals[k+2];
    dst.positions.push(model[0]*x+model[4]*y+model[8]*z+model[12],model[1]*x+model[5]*y+model[9]*z+model[13],model[2]*x+model[6]*y+model[10]*z+model[14]);
    dst.normals.push(model[0]*nx+model[4]*ny+model[8]*nz,model[1]*nx+model[5]*ny+model[9]*nz,model[2]*nx+model[6]*ny+model[10]*nz);
    dst.colors.push(...c);
   }
   return;
  }
  gl.uniform1f(this.useColorLoc,0);gl.uniform1f(this.texturedLoc,0);
  gl.uniform4fv(this.danPoseLoc,[0,0,0,0]);
  gl.disableVertexAttribArray(this.uvLoc);gl.vertexAttrib2f(this.uvLoc,0,0);
  gl.disableVertexAttribArray(this.colLoc);gl.vertexAttrib3f(this.colLoc,1,1,1);
  gl.bindBuffer(gl.ARRAY_BUFFER,m.pos);gl.enableVertexAttribArray(this.pLoc);gl.vertexAttribPointer(this.pLoc,3,gl.FLOAT,false,0,0);
  gl.bindBuffer(gl.ARRAY_BUFFER,m.normal);gl.enableVertexAttribArray(this.nLoc);gl.vertexAttribPointer(this.nLoc,3,gl.FLOAT,false,0,0);
  gl.uniformMatrix4fv(this.mLoc,false,model);gl.uniform3fv(this.cLoc,hex(color));gl.drawArrays(gl.TRIANGLES,0,m.count);
 }
 // Each static arena is baked into a single GPU draw call (not hundreds per frame).
 // Dynamic fighters remain articulated and animated on top of the cached level.
 stageBatch(stage){
  if(this.stageBatches.has(stage))return this.stageBatches.get(stage);
  const gl=this.gl;
  this.stageCapturing={positions:[],normals:[],colors:[]};
  this.scene(0,stage);
  const data=this.stageCapturing;this.stageCapturing=null;
  const gpu={count:data.positions.length/3};
  for(const [key,values] of [['positions',data.positions],['normals',data.normals],['colors',data.colors]]){
   gpu[key]=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,gpu[key]);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);
  }
  this.stageBatches.set(stage,gpu);this.stageBuilds++;
  return gpu;
 }
 renderStage(stage){
  const gl=this.gl,b=this.stageBatch(stage);gl.uniform1f(this.useColorLoc,1);gl.uniform1f(this.texturedLoc,0);
  gl.uniform4fv(this.danPoseLoc,[0,0,0,0]);
  gl.disableVertexAttribArray(this.uvLoc);gl.vertexAttrib2f(this.uvLoc,0,0);
  gl.uniformMatrix4fv(this.mLoc,false,ID());gl.uniform3fv(this.cLoc,[1,1,1]);
  for(const [loc,buffer] of [[this.pLoc,b.positions],[this.nLoc,b.normals],[this.colLoc,b.colors]]){
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,0,0);
  }
  gl.drawArrays(gl.TRIANGLES,0,b.count);
 }
 part(parent,type,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0){const model=chain(parent,T(x,y,z),RX(rx),RY(ry),RZ(rz),S(sx,sy,sz));this.drawMesh(type,model,color);return model;}
 p(type,x,y,z,sx,sy,sz,color,rx=0,ry=0,rz=0){return this.part(ID(),type,x,y,z,sx,sy,sz,color,rx,ry,rz);}
 // Draw articulated mesh from joint A to joint B. Cylinder local axis is Y.
 bone(parent,a,b,wide,color){
  const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],length=Math.max(.015,Math.hypot(dx,dy,dz));
  const tilt=Math.asin(Math.max(-1,Math.min(1,dz/length)));
  const yaw=Math.atan2(-dx,dy);
  const tr=chain(parent,T((a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5),RZ(yaw),RX(tilt),S(wide,length,wide));
  this.drawMesh('limb',tr,color);
 }

 platform(){
  this.p('box',0,-.42,-.25,30,.62,17,'#191d27');
  this.p('box',0,-.108,2.7,30,.035,7,'#272b34');
  for(let x=-14;x<15;x+=2.4){this.p('box',x,-.085,5.4,.75,.013,.064,'#9d9374');this.p('box',x,-.08,-.86,.035,.012,5,'#3b444a');}
  this.p('box',0,-.06,-2,30,.10,.12,'#69666b');
  this.p('box',0,-.06,6.3,30,.10,.12,'#70686b');
 }
 skyline(){
  for(let i=-16;i<=16;i++){
   const h=3+((i*i*17+73)%13)*.53;
   this.p('box',i*1.76,h/2-1.1,-19,1.7,h,2.4,i%4?'#1d2631':'#242333');
   if(i%3===0)this.p('box',i*1.76,h-.82,-17.75,.42,.3,.06,'#ddac5d');
   for(let j=0;j<Math.floor(h/1.1)-1;j++)if((j+i)%3===0)this.p('box',i*1.76,h-1.6-j*1.03,-17.73,.3,.21,.06,'#a69a75');
  }
 }
 northBlock(t){
  this.platform();this.skyline();
  // Taller, wider rowhomes so the block reads like a real North Philly street.
  for(let i=-8;i<=8;i++){
   const x=i*2.95,h=6.2+(Math.abs(i*5)%3)*.42,brick=(i%4===0)?'#6a4844':i%2?'#82554c':'#71585b';
   this.p('box',x,h/2+.55,-8.6,2.82,h,4.0,brick);
   this.p('box',x,h+0.42,-8.45,3.05,.22,4.25,'#252933');
   this.p('box',x,.98,-6.58,1.05,2.15,.09,'#24232c');
   this.p('box',x+.36,.86,-6.48,.08,.18,.09,'#c79e59');
   this.p('box',x,.32,-5.78,1.70,.18,1.25,'#7e7671');
   for(let step=0;step<4;step++)this.p('box',x,.11+step*.16,-5.25-step*.33,1.74,.15,.38,'#8a817a');
   this.p('box',x,1.95,-8.2,2.95,.12,.08,'#2f3037');
   this.p('box',x,3.32,-8.2,2.95,.12,.08,'#2f3037');
   this.p('box',x,4.70,-8.2,2.95,.12,.08,'#2f3037');
   for(let floor=0;floor<2;floor++)for(const side of [-1,1]){
    const wx=x+side*.76,wy=2.10+floor*1.42;
    this.p('box',wx,wy,-6.59,.72,.98,.10,'#212631');
    this.p('box',wx,wy,-6.50,.55,.77,.08,(floor+i)%4?'#697d89':'#d5b47a');
    this.p('box',wx,wy,-6.41,.06,.88,.10,'#cabfb5');
    this.p('box',wx,wy-.52,-6.35,.82,.10,.22,'#c5b7aa');
   }
   if(i%3===0){
    for(let floor=0;floor<3;floor++){
      this.p('box',x+1.0,1.72+floor*.92,-6.2,1.45,.065,.78,'#2b3135');
      this.p('box',x+1.0,2.15+floor*.92,-6.11,.085,.84,.09,'#52585c');
    }
   }
  }
  // Curbs, lane paint, manhole and sidewalk seams.
  for(let x=-14;x<15;x+=2.4){this.p('box',x,-.085,5.4,.75,.013,.064,'#9d9374');this.p('box',x,-.08,-.86,.035,.012,5,'#3b444a');}
  for(let x=-13;x<=13;x+=1.15)this.p('box',x,.69,-2.68,.055,1.56,.055,'#4a545a');
  for(const y of [.22,1.16,1.44])this.p('box',0,y,-2.68,29,.055,.06,'#48565c');
  for(let x=-13;x<=13;x+=3.6){this.p('box',x,-.07,3.95,1.55,.02,.24,'#62666b');}
  for(const x of [-10,10]){
   this.p('cylinder',x,2.55,-3.2,.07,5.2,.07,'#2f353b');this.p('box',x-.3,5.1,-3.2,.68,.09,.09,'#3b383a');
   this.p('sphere',x-.66,5.09,-3.2,.26,.16,.22,'#dfbb7d');
   this.p('cylinder',x,.58,1.42,.37,1.12,.35,'#32565c');this.p('cylinder',x,1.15,1.42,.41,.1,.4,'#1c272e');
  }
  this.p('box',0,4.98,-5.52,3.65,.77,.22,'#141922');
  this.p('box',0,4.98,-5.39,3.38,.58,.07,'#ae1e36');
  this.p('box',0,4.98,-5.33,3.05,.08,.08,'#f3b65d');
  for(let i=-2;i<=2;i++)this.p('box',i*.65,4.83,-5.28,.37,.05,.05,'#e8e0d6');
  for(let i=-10;i<=10;i+=2)this.p('box',i*1.15,-.06,2.9,.5,.012,.04,'#3a4045');
 }
 rooftop(t){
  this.p('box',0,-.36,0,33,.54,19,'#252a35');this.skyline();
  this.p('box',0,-.065,-6.2,33,.14,1.4,'#424652');
  for(let x=-13;x<=13;x+=1.2){this.p('box',x,.70,-5.48,.075,1.6,.075,'#69747b');}
  for(const y of [.28,.77,1.27])this.p('box',0,y,-5.48,32,.055,.06,'#72787e');
  for(const x of [-10,-6.5,7,11]){
   this.p('box',x,.5,-3,1.6,1.08,1.5,'#3a424b');this.p('box',x,.92,-2.21,1.73,.07,.09,'#69747d');
   this.p('cylinder',x+.5,1.4,-3,.13,1.2,.15,'#7d7e80');
  }
  this.p('cylinder',-12,4.85,-8,.96,2.8,.95,'#484854');
  this.p('cylinder',-12,2.5,-8,.06,2.3,.07,'#38373c');this.p('cylinder',-11.3,2.5,-8,.06,2.3,.07,'#38373c');
  this.p('box',0,-.075,2.3,27,.025,.05,'#886b61');
  for(let x=-12;x<13;x+=2.5)this.p('box',x,-.075,5.4,1.4,.014,.05,'#63616c');
  this.p('box',10,2.1,-5.7,3.1,1.4,.17,'#252832');
  this.p('box',10,2.1,-5.55,2.75,1.12,.07,'#a1263d');
  this.p('box',10,2.1,-5.47,2.25,.09,.06,'#e5ac5f');
 }
 court(t){
  this.p('box',0,-.42,0,33,.63,21,'#242936');this.skyline();
  this.p('box',0,-.08,-5,30,.08,.12,'#9a8276');
  for(let x=-14;x<=14;x+=.8)this.p('box',x,1.45,-5.05,.045,3.05,.045,'#69727a');
  for(const y of [.4,1.25,2.2,2.95])this.p('box',0,y,-5.05,30,.035,.035,'#68717b');
  // Court markings on a 3D painted surface.
  this.p('box',0,-.090,1.0,20.5,.018,7.2,'#345d60');
  this.p('box',0,-.078,1.0,20.5,.018,.065,'#dec5a2');
  for(const x of [-10.25,10.25])this.p('box',x,-.075,1.0,.065,.017,7.3,'#dec5a2');
  for(const z of [-2.5,4.5])this.p('box',0,-.075,z,20.5,.017,.06,'#dec5a2');
  for(const x of [-11,11]){
   this.p('cylinder',x,2.65,-3.12,.12,5.4,.12,'#777f81');
   this.p('box',x,4.94,-3.18,1.56,1.12,.10,'#c6c9c5');
   this.p('box',x,4.89,-3.08,.8,.63,.04,'#b94636');
   this.p('cylinder',x,4.42,-2.52,.35,.06,.35,'#b76744',Math.PI/2);
  }
  for(let x=-11;x<=11;x+=3)this.p('box',x,-.075,3.2,1.1,.013,.045,'#ced0c3');
 }
 showroom(t){
  this.p('box',0,-.55,-.7,15,.5,12,'#191b24');
  this.p('box',0,2.8,-6,15,6,.18,'#151822');
  for(let i=-4;i<=4;i++){this.p('box',i*1.75,2.6,-5.83,.055,5,.13,'#343944');}
  this.p('cylinder',0,-.195,0,2.18,.12,2.18,'#9d263a');
  this.p('cylinder',0,-.11,0,1.95,.11,1.95,'#252b34');
  this.p('cylinder',0,-.045,0,1.63,.045,1.63,'#54505a');
  for(let i=-3;i<=3;i++){this.p('box',i*1.68,5.06,-4.7,1.2,.09,.6,i%2?'#9f293a':'#50414c');}
 }
 subway(t){
  this.p('box',0,-.43,0,33,.66,19,'#38373b');this.p('box',0,3.9,-7.8,33,7,.65,'#525260');
  this.p('box',0,7.0,-1.3,33,.25,15,'#242731');
  for(let x=-14;x<15;x+=3.9){this.p('box',x,2.5,-5.2,.45,5,.48,'#a3a19a');this.p('box',x,4.65,-4.88,.95,.3,.1,'#f1b54b');}
  this.p('box',0,-.067,-1.1,30,.02,.16,'#efc34e');
  for(let x=-14;x<14;x+=1.3){this.p('box',x,-.11,2.4,.27,.02,2.7,'#8d8d87');this.p('box',x,-.12,3.0,.08,.04,4,'#5c6068');}
  this.p('box',0,1.95,-6.4,12,2.45,.34,'#414954');
  for(let i=-4;i<5;i++){this.p('box',i*1.13,2.1,-6.12,.82,.8,.07,'#7892a0');}
  for(let x of [-9,9]){this.p('box',x,4.9,-5.0,3.0,.7,.2,'#bd293c');this.p('box',x,4.9,-4.86,2.4,.11,.06,'#f4cc89');}
 }
 garage(t){
  this.p('box',0,-.42,0,33,.67,20,'#343941');this.p('box',0,4.2,-8,33,9,.4,'#242935');
  for(let x=-13;x<14;x+=5){this.p('box',x,3.1,-5.3,.35,6.3,.39,'#899099');this.p('box',x,5.85,-5.6,1.6,.18,.22,'#f9dba0');}
  for(let x of [-10,10]){this.p('box',x,1.2,-4.5,5.3,2.3,2.0,'#4a222c');this.p('box',x,2.3,-4.1,5.2,.15,2.2,'#afb4b6');}
  for(let x of [-8,8]){this.p('box',x,-.02,2.4,1.0,.025,6.4,'#e0bf5c');this.p('box',x,1.15,3.7,2.5,.28,1.1,'#252a30');this.p('box',x,1.55,3.25,1.7,.38,.8,'#a02a34');}
  for(let x=-13;x<13;x+=1.25)this.p('box',x,-.09,5.0,.48,.02,.045,'#a1a4a2');
 }
 underpass(t){
  this.platform();this.skyline();this.p('box',0,6.1,-8,36,.7,15,'#34373f');
  for(let x=-12;x<=12;x+=6){this.p('box',x,2.7,-5.5,1.2,5.7,1.2,'#656063');this.p('box',x,3.2,-4.82,.92,1.9,.04,'#8b4c49');}
  for(let x=-14;x<15;x+=2)this.p('box',x,-.075,3.7,.74,.012,.08,'#9b8544');
  for(const x of [-10,10]){this.p('cylinder',x,2.8,-2.9,.065,5.8,.07,'#5b6165');this.p('sphere',x,5.6,-2.9,.32,.17,.32,'#f4a766');}
  this.p('box',0,2.1,-6,7.5,1.7,.22,'#4d242f');this.p('box',0,2.1,-5.85,6.4,.14,.075,'#f1d7a4');
 }
 cornerStore(t){
  this.platform();this.p('box',0,3,-8.0,33,6,.5,'#53464c');this.p('box',0,5.9,-5.35,32,.3,4,'#8d2937');
  this.p('box',0,4.6,-5.1,11,1.5,.18,'#c6c9b7');this.p('box',0,4.6,-4.98,10,.85,.04,'#b32e3b');
  for(let x=-12;x<13;x+=4){this.p('box',x,2.3,-5.12,3.7,3.9,.14,'#2d333e');this.p('box',x,2.4,-4.95,3.0,2.6,.07,'#698188');this.p('box',x,2.35,-4.86,.10,3,.1,'#b9bbb3');}
  for(let x of [-11,11]){this.p('box',x,1.5,-2.8,1.5,2.8,1.8,'#3c3432');this.p('box',x,2.8,-1.86,1.4,.20,.08,'#a9823f');}
  for(let x=-12;x<13;x+=1.8){this.p('box',x,-.07,3,.8,.012,.045,'#b8ac8f');}
 }
 warehouse(t){
  this.p('box',0,-.45,0,33,.7,20,'#393f46');this.p('box',0,5.0,-8,35,10,.45,'#2a3038');
  for(let x=-14;x<15;x+=4){this.p('box',x,4.9,-6.8,.32,9.9,.5,'#626a70');this.p('box',x,8.5,-4.7,1.8,.15,.21,'#f0c687');}
  for(let x of [-12,-7,7,12]){this.p('box',x,1.6,-5.5,3.2,3.2,2.1,'#504035');this.p('box',x,3.22,-5.4,3.2,.12,2.2,'#b78b59');}
  for(let x=-14;x<=14;x+=7)this.p('box',x,-.07,2.2,1.2,.02,6,'#7e7770');
  this.p('box',0,2.9,-7.4,7,2.5,.3,'#464e5b');this.p('box',0,3.7,-7.13,5.5,.22,.06,'#a92837');
 }
 // Atmospheric practical set dressing: parked vehicles, drain grates, lamps,
 // faded paint, wall grime, warm pools of light and wet pavement highlights.
 car(x,z,paint='#383e49'){
  this.p('box',x,.53,z,2.35,.68,1.08,paint);
  this.p('box',x,.98,z-.08,1.32,.49,.92,'#242b36');
  this.p('box',x,1.04,z+.405,1.15,.29,.04,'#657d8b');
  for(const dx of [-.83,.83])for(const dz of [-.54,.54])
   this.p('cylinder',x+dx,.26,z+dz,.30,.13,.30,'#161920',Math.PI/2);
  for(const dx of [-.95,.95]){
   this.p('box',x+dx,.50,z+.545,.18,.14,.04,'#ead1aa');
   this.p('box',x+dx,.49,z-.545,.19,.10,.04,'#a92f3d');
  }
 }
 streetDressing(t,stage){
  const street=['north-block','underpass','corner-store'].includes(stage),outdoor=street||['rooftop','basketball-court'].includes(stage);
  // Road seams and small puddles blend with the textured ground.
  for(let i=0;i<29;i++){
   const x=-13.4+i*.97,z=2+(i%4)*.74;
   this.p('box',x,-.071,z,.36+.2*(i%3),.009,.016,'#252c36',0,(i%5)*.4);
   if(i%4===0)this.p('sphere',x,-.069,z-.1,.55,.006,.17,i%2?'#333e4a':'#4b4350');
  }
  if(street){
   for(const x of [-11.4,11.4])this.car(x,-2.25,x<0?'#273540':'#463b43');
   for(const x of [-8.8,8.8]){
    this.p('box',x,.20,4.0,1.7,.035,.22,'#79716b');
    this.p('box',x+.35,.20,3.9,.08,.015,.18,'#f1b871');
   }
   for(const x of [-12.6,12.5]){
    this.p('cylinder',x,2.35,-3.7,.08,4.9,.08,'#323b44');
    this.p('box',x+.33,4.8,-3.7,.85,.08,.12,'#454e56');
    this.p('sphere',x+.7,4.74,-3.7,.22,.12,.18,'#e7c991');
    this.p('cylinder',x+.42,.09,3.7,.23,.22,.23,'#42454b');
   }
  }
  if(stage==='rooftop'){
   this.p('box',-11.3,.04,2.5,2.6,.16,1.12,'#555e68');
   this.p('cylinder',-11.3,.36,2.5,.45,.65,.44,'#2a353e');
   for(let x=-12;x<=12;x+=2)this.p('box',x,-.09,3.5,.13,.013,.06,'#aca09b');
  }
  if(stage==='basketball-court'){
   this.p('box',-10,.28,4.0,2.2,.35,.5,'#826953');
   this.p('box',10,.28,4.0,2.2,.35,.5,'#826953');
   for(const x of [-10,10])this.p('box',x,.54,4.0,2.5,.07,.68,'#9b8e84');
  }
  if(stage==='garage'||stage==='warehouse'){
   for(const x of [-10.5,10.5])this.car(x,-3.8,x<0?'#712b3a':'#344856');
   for(let x=-12;x<=12;x+=3){
    this.p('box',x,-.078,4.6,1.2,.015,.065,'#a5a2a0');
    this.p('box',x,2.2,-7.5,.07,4.4,.08,'#66727b');
   }
  }
  if(stage==='subway'){
   for(let x=-12;x<=12;x+=1.7)this.p('box',x,-.075,1.15,.65,.025,.12,'#a4a09d');
   this.p('box',0,2.9,-6.1,5,.7,.14,'#962a38');
   this.p('box',0,2.9,-5.99,4.25,.1,.07,'#d4cba8');
  }
  if(outdoor)for(let x=-12;x<13;x+=3.2){
   this.p('sphere',x,-.061,4.45,.35,.007,.22,'#51545c');
   this.p('box',x,-.060,4.46,.70,.007,.012,'#939295');
  }
 }
 scene(t,stage){if(this.isPreview){this.showroom(t);return;}switch(stage){
  case 'rooftop':this.rooftop(t);break;case 'basketball-court':this.court(t);break;
  case 'subway':this.subway(t);break;case 'garage':this.garage(t);break;
  case 'underpass':this.underpass(t);break;case 'corner-store':this.cornerStore(t);break;
  case 'warehouse':this.warehouse(t);break;default:this.northBlock(t);
 }this.streetDressing(t,stage);
 }
 // Load the user-supplied GLB in the *existing* WebGL context so Dan uses
 // the same stage camera, depth buffer, matches and multiplayer snapshots.
 async loadImported(id,url){
  if(this.importedLoading[id])return this.importedLoading[id];
  if(typeof fetch!=='function'||typeof createImageBitmap!=='function')return null;
  if(id==='dan')this.danLoadAttempts++;
  const pending=(async()=>{
   const response=await fetch(url);
   if(!response.ok)throw Error('Imported 3D model missing (HTTP '+response.status+')');
   const bytes=await response.arrayBuffer(),dv=new DataView(bytes);
   if(dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2)throw Error('Imported model is not a GLB 2.0 model');
   const jsonLength=dv.getUint32(12,true),start=20,meta=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,start,jsonLength)));
   const binStart=start+jsonLength+8,primitive=meta.meshes[0].primitives[0];
   if(primitive.mode!==undefined&&primitive.mode!==4)throw Error('Imported GLB must contain triangle mesh');
   const gl=this.gl;
   const source=id=>{
    const a=meta.accessors[id],v=meta.bufferViews[a.bufferView];
    const offset=binStart+(v.byteOffset||0)+(a.byteOffset||0);
    const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
    if(!components||!Number.isFinite(offset)||offset<0)throw Error('Invalid imported model accessor');
    const length=a.count*components;
    if(a.componentType===5126)return new Float32Array(bytes.slice(offset,offset+length*4));
    if(a.componentType===5125)return new Uint32Array(bytes.slice(offset,offset+length*4));
    if(a.componentType===5123)return new Uint16Array(bytes.slice(offset,offset+length*2));
    throw Error('Unsupported model index/vertex data type '+a.componentType);
   };
   const geometry={};
   for(const [key,id] of [['position',primitive.attributes.POSITION],['normal',primitive.attributes.NORMAL],['uv',primitive.attributes.TEXCOORD_0],['indices',primitive.indices]]){
    if(id==null)throw Error('Imported model missing '+key);
    geometry[key]=source(id);
   }
   if(geometry.indices instanceof Uint32Array&&!gl.getExtension('OES_element_index_uint'))throw Error('Your browser cannot draw 32-bit GLB mesh indices');
   // The new Dan model has JOINTS_0/WEIGHTS_0 + real glTF animations.
   // Do not apply the V16 rubber-mesh shader to a skeletal fighter.
   const rigged=id==='dan'&&!!meta.skins?.length&&!!meta.animations?.length;
   if(id==='dan'&&!rigged)throw Error('Dan replacement must contain a skeleton and animation clips');
   if(rigged&&!window.BadlandzSkin?.RiggedGLB)throw Error('Skeletal animation module was not loaded before the renderer');
   const rig=rigged?new window.BadlandzSkin.RiggedGLB(meta,bytes,binStart,primitive,geometry):null;
   const images=meta.images[0],view=meta.bufferViews[images.bufferView];
   const imgOffset=binStart+(view.byteOffset||0);
   const jpg=new Blob([bytes.slice(imgOffset,imgOffset+view.byteLength)],{type:images.mimeType||'image/jpeg'});
   const bitmap=await createImageBitmap(jpg);
   const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
   gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
   gl.generateMipmap(gl.TEXTURE_2D);bitmap.close?.();
   const gpu={texture,rig,rigged:!!rig,count:geometry.indices.length,indexType:geometry.indices instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT};
   for(const [name,data] of Object.entries(geometry)){
    const initial=rig&&name==='position'?rig.outputPositions:rig&&name==='normal'?rig.outputNormals:data;
    gpu[name]=gl.createBuffer();gl.bindBuffer(name==='indices'?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER,gpu[name]);
    gl.bufferData(name==='indices'?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER,initial,rig&&(name==='position'||name==='normal')?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
   }
   this.importedAssets[id]=gpu;this.importedErrors[id]=null;
   if(id==='dan'){this.danAsset=gpu;this.danError=null;}
   if(id==='strange-3d'){this.strangeAsset=gpu;this.strangeError=null;}
   if(id==='htb-druski'){this.drewskiAsset=gpu;this.drewskiError=null;}
   if(id==='da-problem'){this.problemAsset=gpu;this.problemError=null;}
   if(this.isPreview){ const flag=id==='dan'?'BadlandzDanModelReady':id==='htb-druski'?'BadlandzDrewskiModelReady':id==='da-problem'?'BadlandzProblemModelReady':'BadlandzStrangeModelReady'; window[flag]=true; }
   return gpu;
  })().catch(err=>{
   this.importedErrors[id]=err;
   if(id==='dan'){this.danError=err;window.BadlandzDanModelError=err.message;}
   if(id==='strange-3d'){this.strangeError=err;window.BadlandzStrangeModelError=err.message;}
   if(id==='htb-druski'){this.drewskiError=err;window.BadlandzDrewskiModelError=err.message;}
   if(id==='da-problem'){this.problemError=err;window.BadlandzProblemModelError=err.message;}
   console.error('[Philly 3D] '+id+' model load error:',err);return null;
  });
  this.importedLoading[id]=pending;
  if(id==='dan')this.danLoading=pending;
  if(id==='strange-3d')this.strangeLoading=pending;
  if(id==='htb-druski')this.drewskiLoading=pending;
  if(id==='da-problem')this.problemLoading=pending;
  return pending;
 }
 async loadDan(){return this.loadImported('dan','/assets/models/dan-fighting.glb');}
 async loadStrange(){return this.loadImported('strange-3d','/assets/models/strange-fighting.glb');}
 async loadDrewski(){return this.loadImported('htb-druski','/assets/models/htb-drewski.glb');}
 async loadProblem(){return this.loadImported('da-problem','/assets/models/da-problem.glb');}
 drawImported(f,char,t,slot){
  const id=char.id;
  if(!this.importedAssets[id]){
   if(!this.importedLoading[id])this.loadImported(id,char.model3d);
   // Never pretend the old procedural fighter is Dan while the GLB loads.
   return;
  }
  const gl=this.gl,m=this.importedAssets[id];
  const move=f.action||'idle',v=Math.max(0,Math.min(1,f.attackProgress||0));
  const attack=peak(v,.08,.37,.69,.98),kick=/kick|sweep/.test(move),punch=/jab|cross|hook|uppercut/.test(move);
  const walk=move==='walk',hurt=move==='hurt',ko=move==='ko';
  const fac=f.previewRotation!==undefined?f.previewRotation:(f.facing>0?1:-1)*Math.PI/2;
  const spin=move==='spin-kick'?Math.PI*2*smooth(.1,.85,v):0;
  const breathing=Math.sin(t*2.7+slot)*.018;
  const shift=punch?.13*attack:kick?.13*attack:0;
  const crouch=(move==='crouch'||f.crouching)?.20:0;
  const x=(f.x-480)/48.5+(f.facing||1)*shift;
  const model=m.rigged
   ?chain(T(x,Math.max(0,f.height||0)*.53-crouch,0),RY(fac),S(char.build*2.70,char.build*3.15,char.build*2.70))
   :chain(T(x,Math.max(0,f.height||0)*.53-crouch+breathing,0),RY(fac+spin),RZ((hurt?.21:ko?.80:move==='hook'?.12*attack:move==='uppercut'?-.16*attack:0)),S(char.build*1.63),T(0,.952,0));
  if(m.rig){
   // Evaluate Dan's actual 80-bone skin against the original Tripo animation clips.
   // Run at 24 sampled poses/sec to balance CPU deformation and WebGL frame time;
   // the rest of the multiplayer renderer can continue at display refresh rate.
   const changed=m.rig.pose(move,t,v);
   if(changed){
    gl.bindBuffer(gl.ARRAY_BUFFER,m.position);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,m.rig.outputPositions);
    gl.bindBuffer(gl.ARRAY_BUFFER,m.normal);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,m.rig.outputNormals);
   }
  }
  gl.uniform1f(this.useColorLoc,0);gl.uniform1f(this.texturedLoc,1);
  gl.uniform4fv(this.danPoseLoc,m.rigged?[0,0,0,0]:[punch?attack:0,kick?attack:0,walk?Math.sin(t*11)*.90:0,1]);
  gl.disableVertexAttribArray(this.colLoc);gl.vertexAttrib3f(this.colLoc,1,1,1);
  for(const [loc,key,size] of [[this.pLoc,'position',3],[this.nLoc,'normal',3],[this.uvLoc,'uv',2]]){
   gl.bindBuffer(gl.ARRAY_BUFFER,m[key]);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.indices);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,m.texture);
  gl.uniform1i(this.texLoc,0);gl.uniformMatrix4fv(this.mLoc,false,model);
  gl.uniform3fv(this.cLoc,[1,1,1]);gl.drawElements(gl.TRIANGLES,m.count,m.indexType,0);
  gl.uniform1f(this.texturedLoc,0);gl.uniform4fv(this.danPoseLoc,[0,0,0,0]);
 }
  drawDan(f,char,t,slot){return this.drawImported(f,char,t,slot);}
  drawStrange(f,char,t,slot){return this.drawImported(f,char,t,slot);}
 fighter(f,char,t,slot){if(!f||!char)return;
  if(char.model3d){this.drawImported(f,char,t,slot);return;}
  const x=(f.x-480)/48.5,jump=Math.max(0,f.height)*.53;
  const speed=Math.abs(f.vx||0);
  const walk=f.action==='walk',block=f.action==='block',hurt=f.action==='hurt',ko=f.action==='ko',crouch=f.action==='crouch',dodge=f.action==='dodge',jumping=f.action==='jump';
  const move=f.action||'idle',special=move==='special',ability=move==='ability',ultra=move==='ultra';
  const aerial=move==='air-jab'||move==='air-kick', style=char.fightingStyle||'Street Fighter';
  const power=ultra||special||ability, stanceProfile=FIGHTER_STANCES[char.id]||FIGHTER_STANCES.piro, athletic=/Speed|Aerial|Counter|Trickster/.test(style);
  const heavy=/Heavy|Power|Enforcer/.test(style);
  const styleBounce=stanceProfile.bounce;
  const poseT=t*stanceProfile.tempo+slot*1.72;
  const idle=stanceIdleProfile(char.id,t,slot);
  const punch=['jab','cross','hook','uppercut','air-jab'].includes(move);
  const kick=['front-kick','roundhouse','spin-kick','sweep','air-kick'].includes(move);
  const attacking=punch||kick||special||ability||ultra;
  const v=Math.max(0,Math.min(1,f.attackProgress||0));
  const strike=peak(v,.09,.43,.64,.99),coil=peak(v,0,.15,.25,.43);
  const slash=peak(v,.17,.45,.69,.96);
  const isHook=move==='hook',isUpper=move==='uppercut';
  const pace=Math.sin(t*(athletic?15:heavy?8.5:12)+slot*.27),sway=walk?Math.abs(pace)*(.08+styleBounce):Math.sin(poseT)*styleBounce+idle.torsoY;
  const lean=hurt?-.25:ko?-.86:dodge?-.29:crouch?-.20:ultra?-.36*strike:punch?(isUpper?.21*strike:-.12*strike+.08*coil):kick?(.13+(move==='sweep'?-.53:0))*strike:power?-.17*strike:(heavy?.03:0);
  const direction=(f.previewRotation!==undefined)?f.previewRotation:(f.facing>0?1:-1)*Math.PI/2;
  const scale=char.build||1,bodyScale=char.gender==='female'?.95:1;
  const spinRotation=move==='spin-kick'?Math.PI*2*smooth(.08,.81,v):0;
  const duck=(crouch||f.crouching)?0.32:dodge?0.13:0;
  const root=chain(T(x,jump-duck*scale*bodyScale+idle.hipDrop,dodge?-.12:0),RY(direction+spinRotation),S(scale*bodyScale));
  const torsoTurn=(move==='cross'?-.42*strike+.19*coil:move==='hook'?.56*strike-.35*coil:move==='uppercut'?-.14*strike:move==='roundhouse'?.49*strike:move==='front-kick'?-.08*strike:0);
  const torso=chain(root,T(0,1.45+sway,0),RY(torsoTurn+stanceProfile.blade+idle.torsoYaw),RX(lean+stanceProfile.lean),RZ((ko?.45:dodge?-.34:move==='hook'?.18*strike:move==='roundhouse'?.1*strike:0)+idle.torsoRoll));
  const skin=char.skin,top=char.top,pants=char.pants,accent=char.accent;
  const appearance=FIGHTER_APPEARANCE[char.id]||FIGHTER_APPEARANCE.piro;
  const ink='#1b1720',light='#eee7db',metal='#e5b863';
  const aura=char.energyColor||'#fa485d';
  const part=(parent,type,xx,yy,zz,sx,sy,sz,color,rx=0,ry=0,rz=0)=>this.part(parent,type,xx,yy,zz,sx,sy,sz,f.flash?'#f0dfd9':color,rx,ry,rz);
  // Ground contact & shoe shadow.
  this.p('sphere',x,-.1,.16,.69*scale,.033,.36*scale,'#0c0f17');
  // Distinct grounded stance: planted power fighters, nimble light-foot fighters, tight boxers.
  const stance=heavy?.50:athletic?.34:.41;
  if(dodge){for(let j=1;j<=4;j++)this.p('sphere',x-(f.facing||1)*j*.32,.83,.1,scale*.24+j*.018,.65,.18,j%2?'#247eac':'#384c7d');}
  if(ultra){this.p('cylinder',x,.04,.03,1.1+strike*2.5,.05,1.1+strike*2.5,aura);}
  if(jumping||aerial){this.p('sphere',x,-.03,0,.75+Math.sin(t*12)*.1,.026,.36,'#86506b');}
  // Hips, belt, rib cage and shoulder mass, anatomically layered rather than isolated blocks.
  part(root,'sphere',0,1.17,0,.39,.27,.30,pants);
  part(root,'box',0,1.33,.01,.69,.09,.46,'#191a22');
  part(root,'box',0,1.33,.263,.13,.09,.045,accent);
  part(torso,'torso-'+appearance.torso,0,0,0,1,1,1,top);
  // Shoulder pads/seams, jacket volume and lapels vary by character.
  if(heavy){for(let side of [-1,1])part(torso,'sphere',side*.43,.66,-.035,.22,.21,.22,top);}
  if(athletic)part(torso,'box',0,.36,.325,.045,.55,.04,accent);
  part(torso,'sphere',0,.18,.273,.22,.23,.055,top);
  part(torso,'box',0,.46,.319,.045,.49,.022,'#1c202c');
  part(torso,'box',0,.88,.26,.24,.12,.09,accent);
  for(let side of [-1,1]){
   part(torso,'box',side*.48,.41,.24,.075,.76,.065,accent);
   part(torso,'sphere',side*.26,-.09,.25,.20,.09,.095,'#1b2026');
  }
  if(char.id==='speedy'){part(torso,'box',0,.56,.332,.45,.13,.06,'#e5e3e1');part(torso,'box',0,.28,.335,.21,.29,.05,'#e6e7e4');}
  if(char.id==='gcg-doughboy'){part(torso,'box',0,.42,.35,.30,.31,.06,'#dbc08d');}
  if(char.id==='verge'){for(let i=-1;i<=1;i++)part(torso,'box',i*.18,.42,.33,.12,.32,.05,'#262c22');}
  if(char.id==='the-crackhead'){part(torso,'box',-.27,.38,.35,.27,.22,.06,'#b5a590',0,0,-.28);part(torso,'box',.26,.07,.33,.15,.24,.06,'#433c36');}
  if(char.id==='lucy-chucky'){part(torso,'box',0,.30,.35,.32,.23,.05,'#e8a6a8');}
  if(char.id==='lexa-birdface'){part(torso,'box',0,.39,.36,.33,.12,.055,'#efced8');}
  if(char.id==='bfa-strange'){part(torso,'box',0,.50,.342,.20,.42,.045,'#d7c5ff');}
  if(char.id==='htb-druski'){for(const side of [-1,1])part(torso,'box',side*.44,.65,.12,.19,.2,.22,'#2d2733');}
  if(char.id==='piro'){part(torso,'box',0,.24,.353,.31,.055,.048,'#f4c17e');}
  if(char.id==='lucy-chucky'){for(const side of [-1,1])part(torso,'box',side*.49,.41,.21,.06,.60,.055,'#f26a7e');}
  // Hood and collar sits behind neck with raised shoulder material.
  part(torso,'sphere',0,.83,-.11,.30,.18,.28,'#232630');
  part(torso,'cylinder',0,.94,.02,.16*appearance.neck,.25,.16*appearance.neck,skin);
  if(['piro','htb-druski','gcg-doughboy'].includes(char.id))for(let i=0;i<9;i++){
   const a=Math.PI*.12+(i/8)*Math.PI*.76;
   part(torso,'sphere',Math.cos(a)*.36,.87-Math.sin(a)*.34,.325,.045,.045,.047,metal);
  }
  // V10 modeled human face. Real facial landmarks and a continuous face shell
  // replace the old ball head, oversized round eyes and pasted-on lower jaw.
  const head=chain(torso,T(0,1.33,.065),RY((Math.sin(t*1.3+slot)*.055)+(hurt?.12:0)+idle.headSlip),RX((dodge?-.13:move==='uppercut'?strike*.08:0)+(char.gender==='female'?-0.03:0)));
  part(head,'face-'+appearance.face,0,-.08,.035,.335,.395,.315,skin);
  const faceDark=char.gender==='female'?'#35242b':'#272026';
  const iris=char.gender==='female'?'#573f38':'#362b27';
  const lip=char.gender==='female'?'#965e59':'#77473e';
  for(let side of [-1,1]){
    // Ears, cheekbone relief and socket shadow.
    part(head,'sphere',side*.329,-.095,.028,.067,.108,.075,skin);
    part(head,'sphere',side*.325,-.101,.083,.022,.051,.030,'#80503f');
    part(head,'sphere',side*.185,-.146,.235,.103,.060,.035,skin);
    part(head,'sphere',side*.132,.004,.307,.080,.041,.027,faceDark);
    part(head,'sphere',side*.133,.006,.326,.065,.030,.019,'#e8dfd1');
    part(head,'sphere',side*.133,.004,.345,.026,.026,.011,iris);
    part(head,'sphere',side*.133,.006,.354,.012,.019,.006,'#0d1216');
    part(head,'sphere',side*.123,.018,.361,.007,.007,.006,'#fff7e7');
    // Stronger fighter brows and eyelids, with real brow slope.
    part(head,'box',side*.139,.075,.298,.142*appearance.brow,.028,.037,faceDark,0,0,side*.10);
    part(head,'box',side*.136,.042,.332,.115,.012,.022,skin,0,0,side*.07);
  }
  // Continuous, tapered nose bridge and natural nostril tips.
  part(head,'sphere',0,-.101,.325,.056*appearance.nose,.118,.068*appearance.nose,skin);
  part(head,'sphere',0,-.197,.378,.071*appearance.nose,.052,.092*appearance.nose,skin);
  for(const side of [-1,1])part(head,'sphere',side*.049,-.218,.389,.037,.021,.027,skin);
  for(const side of [-1,1])part(head,'sphere',side*.046,-.224,.412,.017,.007,.008,faceDark);
  // Lips integrated into the chin. Human proportions are profile-specific.
  part(head,'sphere',0,-.300,.309,.111*appearance.jaw,.020,.021,lip);
  part(head,'sphere',0,-.326,.308,.100*appearance.jaw,.016,.020,skin);
  part(head,'sphere',0,-.388,.185,.16*appearance.jaw,.070,.105,skin);
  if(char.hair==='beard'){
    part(head,'sphere',0,-.355,.125,.235,.11,.20,'#19191e');
    part(head,'box',0,-.263,.315,.193,.030,.034,'#17171c');
    for(const side of [-1,1])part(head,'sphere',side*.25,-.23,.17,.040,.13,.07,'#1d1a1f');
  }
  // Hair stays bound to the head bone and has a secondary sway, never stretched.
  const hair='#17151b',hairAlt=char.id==='the-crackhead'?'#3c2927':'#242027';
  if(char.hair==='fade'){
   part(head,'sphere',0,.231,-.035,.318,.122,.306,hair);
   part(head,'sphere',0,.181,.234,.29,.036,.083,'#242028');
   for(let side of [-1,1])part(head,'box',side*.287,.061,.0,.035,.16,.15,'#292229');
  }else if(char.hair==='cap'){
   part(head,'sphere',0,.251,-.034,.333,.16,.335,'#172d50');
   part(head,'box',0,.159,.329,.46,.052,.29,'#26518a');
   part(head,'box',0,.310,-.016,.23,.018,.17,'#eee4d3');
  }else if(char.hair==='braids'){
   part(head,'sphere',0,.241,-.080,.314,.143,.305,hair);
   for(let i=0;i<8;i++){
    const x=-.235+i*.067,phase=i*.7;
    part(head,'cylinder',x,.198,-.1,.038,.31,.041,hair,0,0,Math.sin(phase)*.13);
   }
   for(let side of [-1,1]){
    const swayHair=Math.sin(t*2.6+side)*.045;
    part(head,'cylinder',side*.268,-.13,-.12+swayHair,.060,.36,.061,hair,0,0,side*.07);
    part(head,'cylinder',side*.285,-.44,-.14+swayHair,.056,.32,.053,hair,0,0,side*.12);
   }
  }else if(char.hair==='curls'){
   part(head,'sphere',0,.300,-.06,.341,.19,.336,hair);
   for(let i=0;i<17;i++){const a=i*2.399;part(head,'sphere',Math.cos(a)*.245,.314+Math.sin(a)*.085,Math.sin(a)*.25,.089,.108,.095,i%3?hair:hairAlt);}
  }else if(char.hair==='messy'){
   for(let i=0;i<19;i++){const a=i*2.38;part(head,'sphere',Math.sin(a)*.25,.315+Math.cos(a)*.08,Math.cos(a)*.25,.085,.146,.095,i%3?hairAlt:hair,0,0,.4*Math.sin(a));}
  }else if(char.hair==='pigtails'){
   // Lucy/Chucky: deliberately SHORT, separate compact bunches.
   part(head,'sphere',0,.253,-.06,.324,.157,.315,hair);
   for(let side of [-1,1]){
    part(head,'sphere',side*.363,.172,-.084,.165,.169,.14,hair);
    part(head,'sphere',side*.397,.026,-.11,.114,.153,.115,hair);
    part(head,'sphere',side*.365,.165,.014,.044,.065,.04,'#b53444');
   }
  }else if(char.hair==='ponytail'){
   // Lexa/Birdface: longer, shoulder-level flowing strands, head-rooted.
   part(head,'sphere',0,.27,-.075,.339,.18,.333,hair);
   part(head,'sphere',0,.065,-.294,.186,.260,.14,hair);
   for(let i=0;i<9;i++){
    const spread=(i-4)*.052,motion=Math.sin(t*2.0+i*.59)*.038;
    part(head,'sphere',spread+motion,-.13,-.325,.076,.29,.082,i%3?hair:hairAlt);
    part(head,'sphere',spread+motion*1.4,-.39,-.345,.067,.23,.073,i%3?hair:hairAlt);
    if(i%2===0)part(head,'sphere',spread+motion*1.6,-.55,-.344,.063,.14,.07,hair);
   }
   for(const side of [-1,1]){
    part(head,'sphere',side*.282,-.08,.03,.075,.250,.065,hair);
    part(head,'sphere',side*.29,-.30,.015,.061,.19,.055,hair);
   }
  }else{
   part(head,'sphere',0,.24,-.06,.31,.15,.32,hair);
  }
  // V8 anatomical rig: every joint is solved against fixed bone lengths.
  // Torso rotation provides shoulder yaw/roll; wrists pivot separately at gloves.
  // All forward/lateral/rising punches are requested as hand targets, NOT limb lengths.
  const walkWave=Math.sin(t*(athletic?13.5:heavy?8:10.5)+slot*.34);
  const naturalSway=Math.sin(poseT)*stanceProfile.bounce;
  const upperArm=.60,lowerArm=.61;
  const thigh=.76,shin=.76;
  for(const side of [-1,1]){
   const index=side===-1?0:1;
   const isLead=side===1;
   const punching=(['jab','hook','uppercut','air-jab'].includes(move)&&isLead)||(move==='cross'&&!isLead);
   const shoulder=[side*.56+Math.sin(torsoTurn)*.038,.71+(punching?strike*.045:0),0];
   const guard=stanceProfile.guard[index];
   const swing=walk?walkWave*side*.24:naturalSway*(index?-.75:1.0);
   const idleLift=index===1?idle.leadLift:idle.rearLift;
   let hand=[guard[0],guard[1]+idleLift+swing*.23,guard[2]-swing*.46];
   let elbowHint=[side*stanceProfile.elbow[0],stanceProfile.elbow[1]+swing*.25,stanceProfile.elbow[2]];
   if(block){hand=[side*.20,.73,.64];elbowHint=[side*.46,.40,.25];}
   else if(crouch){hand=[side*.27,.52,.54];elbowHint=[side*.52,.26,.13];}
   else if(dodge){hand=[side*.19,.48,.40];elbowHint=[side*.65,.14,.0];}
   if(punching){
    let chamber=[side*.34,.34,.18],target=[side*.18,.42,1.44],elbowTarget=[side*.55,.22,.54];
    if(move==='cross'){
     chamber=[side*.50,.30,.08];target=[side*.03,.47,1.61];elbowTarget=[side*.40,.24,.65];
    }else if(move==='hook'){
     const arc=smooth(.25,.64,v);
     chamber=[side*.80,.46,.17];
     target=[mix(side*.80,-side*.36,arc),.52,mix(.67,1.13,Math.sin(Math.PI*arc*.70))];
     elbowTarget=[side*.92,.49,.47];
    }else if(move==='uppercut'){
     chamber=[side*.34,-.27,.38];
     target=[side*.15,mix(-.23,1.29,smooth(.25,.64,v)),mix(.46,1.0,smooth(.20,.57,v))];
     elbowTarget=[side*.65,mix(-.30,.40,smooth(.25,.63,v)),.22];
    }else if(move==='air-jab'){
     target=[side*.17,.21,1.55];elbowTarget=[side*.63,.10,.52];
    }
    hand=vecMix(hand,chamber,coil*.93);
    elbowHint=vecMix(elbowHint,[side*.77,-.03,.05],coil*.55);
    hand=vecMix(hand,target,strike);
    elbowHint=vecMix(elbowHint,elbowTarget,strike);
   }else if(power){
    hand=vecMix(hand,[side*.28,.69,1.22],strike*.93);
    elbowHint=vecMix(elbowHint,[side*.73,.25,.35],strike);
   }
   if(kick){hand[2]-=strike*.09;hand[1]+=strike*.10;}
   const arm=solveTwoBone(shoulder,hand,upperArm,lowerArm,sub3(elbowHint,shoulder));
   // Shoulder capsule / upper arm / elbow / forearm / rotating wrist / fist.
   part(torso,'sphere',...arm.start,.225,.215,.220,top);
   this.bone(torso,arm.start,arm.joint,.202,top);
   part(torso,'sphere',...arm.joint,.148,.145,.147,skin);
   this.bone(torso,arm.joint,arm.end,.154,skin);
   const wrist=add3(arm.end,times3(unit3(sub3(arm.end,arm.joint)),.032));
   part(torso,'sphere',...wrist,.125,.116,.124,skin);
   const wristAngle=punching?mix(-.20,.12,strike)*(side):block?-.12*side:.09*side;
   const wristFrame=chain(torso,T(...wrist),RZ(wristAngle),RX(punching?-.22*strike:.08));
   part(wristFrame,'fist',0,0,.055,.20,.19,.19,isLead?'#222630':'#181b24');
   part(wristFrame,'sphere',0,.04,.163,.178,.10,.078,accent);
   if(char.id==='speedy')part(torso,'sphere',...arm.joint,.202,.032,.202,'#e8e7df');
  }
  // Hip socket -> fixed femur -> knee hinge -> fixed tibia -> ankle hinge -> toe.
  // Feet are stance-specific and stay under the planted fighter during idle.
  for(const side of [-1,1]){
   const index=side===-1?0:1;
   const strikingLeg=kick&&(move==='roundhouse'||move==='spin-kick'||move==='air-kick'?side===-1:side===1);
   const sweeping=move==='sweep'&&strikingLeg;
   const baseFoot=stanceProfile.feet[index];
   const hip=[side*.31,1.13,0];
   const step=walk?walkWave*side*(athletic?.30:.23):naturalSway*side*.15;
   let ankleTarget=[baseFoot[0],.12+duck+Math.abs(Math.sin(poseT+(index*.6)))*idle.footPulse,baseFoot[1]+step];
   let kneePole=[side*.44,-.06,.50+step*.20];
   if(crouch){ankleTarget=[baseFoot[0]*1.24,.12+duck,baseFoot[1]+.23];kneePole=[side*.66,-.20,.71];}
   if(dodge){ankleTarget[2]-=.27;kneePole[2]-=.15;}
   if(jumping||aerial){ankleTarget[1]+=.22;kneePole[1]+=.16;}
   if(strikingLeg){
    const chamber=peak(v,.02,.19,.34,.48);
    let kneeHint=[side*.34,-.04,.91],foldedFoot=[side*.22,.65,.40];
    let extendedFoot=[side*.10,.90,1.53];
    if(move==='roundhouse'||move==='spin-kick'){
     kneeHint=[side*.78,-.10,.82];foldedFoot=[side*.55,.70,.29];
     extendedFoot=[-side*.13,1.04,1.58];
    }
    if(move==='air-kick'){
     kneeHint=[side*.49,.13,.88];foldedFoot=[side*.42,.85,.42];extendedFoot=[side*.11,1.12,1.61];
    }
    if(sweeping){
     kneeHint=[side*.72,-.22,.80];foldedFoot=[side*.65,.17,.45];
     extendedFoot=[-side*.23,.16,1.52];
    }
    ankleTarget=vecMix(ankleTarget,foldedFoot,chamber);
    ankleTarget=vecMix(ankleTarget,extendedFoot,slash);
    kneePole=vecMix(kneePole,kneeHint,Math.max(chamber,slash));
   }
   if((special||ultra)&&side===1){ankleTarget=vecMix(ankleTarget,[.16,1.02,1.58],strike);kneePole=vecMix(kneePole,[.35,.03,.86],strike);}
   const leg=solveTwoBone(hip,ankleTarget,thigh,shin,kneePole);
   part(root,'sphere',...leg.start,.220,.230,.218,pants);
   this.bone(root,leg.start,leg.joint,.222,pants);
   part(root,'sphere',...leg.joint,.188,.185,.187,pants);
   this.bone(root,leg.joint,leg.end,.176,pants);
   // Ankles are explicit articulated pivots; shoes rotate to follow strikes.
   part(root,'sphere',...leg.end,.146,.141,.143,'#252832');
   const footPitch=strikingLeg?(-.22*strike+.42*coil):walk?step*.18:0;
   const footYaw=stanceProfile.footTurn[index]+(strikingLeg?side*.22*slash:0);
   const footFrame=chain(root,T(...leg.end),RY(footYaw),RX(footPitch));
   part(footFrame,'sphere',0,-.018,.17,.215,.132,.355,char.accent==='#f0f0eb'?'#ececec':'#efece5');
   part(footFrame,'box',0,-.117,.185,.35,.06,.65,'#171a22');
   part(footFrame,'box',0,.0,.35,.21,.047,.16,accent);
  }
  if(attacking&&['spin-kick','roundhouse','air-kick'].includes(move)){for(let i=0;i<5;i++){const a=(i/5)*Math.PI*1.1;part(root,'sphere',Math.cos(a)*(.62+strike*.65),1.0+Math.sin(a)*.32,.3,.09,.045,.065,i%2?aura:'#ffe9ba');}}
  if(hurt){part(torso,'sphere',0,.64,.35,.32,.18,.12,'#a14345');for(let j=0;j<4;j++)part(torso,'sphere',Math.sin(t*13+j*1.3)*.44,.3+j*.19,.39,.06,.05,.04,'#ffb46d');}
  if(special||ability||ultra){
   for(let i=0;i<9;i++){const a=t*4+i*Math.PI/3;part(root,'sphere',Math.cos(a)*(.65+strike*.6),1.1+Math.sin(a*1.3)*.5,Math.sin(a)*.35,.08,.08,.08,ultra?(i%2?aura:'#fff2c5'):ability?(i%2?'#75d4ff':'#f5d764'):(i%2?'#b83950':'#eacb79'));}
  }
 }
 projectX(x){
  const w=this.canvas.width||960,h=this.canvas.height||540,ratio=w/h,dist=this.cameraDistance;
  // Approximate projection at the fighters' ground plane.
  return w/2 + ((x-480)/48.5-this.cameraCenter)*(h/(2*dist*Math.tan(38*Math.PI/360)));
 }
 render(fighters,roster,t,options={}){
  const gl=this.gl;const ratio=this.canvas.clientWidth/Math.max(1,this.canvas.clientHeight),dpr=Math.min(1.4,window.devicePixelRatio||1);
  const w=Math.max(1,Math.round(this.canvas.clientWidth*dpr)),h=Math.max(1,Math.round(this.canvas.clientHeight*dpr));
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
  this.stage=options.stage||this.stage;
  if(this.lastBackdrop!==this.stage){
   const asset={'north-block':'north-block','rooftop':'rooftop','basketball-court':'basketball-court',
    subway:'subway',garage:'garage',underpass:'underpass','corner-store':'corner-store',warehouse:'warehouse'}[this.stage]||'north-block';
   this.canvas.style.backgroundImage=`linear-gradient(180deg,rgba(9,12,24,.33),rgba(13,16,26,.67)),url('/assets/${asset}.webp')`;
   this.canvas.style.backgroundSize='cover';this.canvas.style.backgroundPosition='center 47%';
   this.lastBackdrop=this.stage;
  }
  if(this.isPreview){this.cameraCenter=0;this.cameraDistance=6.7;}
  else if(fighters?.length>=2){
   const a=(fighters[0].x-480)/48.5,b=(fighters[1].x-480)/48.5;
   this.cameraCenter+=(Math.max(-7,Math.min(7,(a+b)*.5))-this.cameraCenter)*.12;
   const target=Math.max(9.0,Math.min(18,9.4+Math.abs(a-b)*.42));
   this.cameraDistance+=(target-this.cameraDistance)*.10;
  }else{this.cameraCenter+=(0-this.cameraCenter)*.09;this.cameraDistance+=(12-this.cameraDistance)*.06;}
  const eye=this.isPreview?[0,2.72,6.7]:[this.cameraCenter,3.10,this.cameraDistance];
  const at=this.isPreview?[0,1.50,0]:[this.cameraCenter,1.42,0];
  const vp=mul(perspective(38*Math.PI/180,w/h,.1,100),lookAt(eye,at));
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
  gl.uniformMatrix4fv(this.vpLoc,false,vp);gl.uniform1f(this.tLoc,t||0);
  this.renderStage(this.isPreview?'preview':this.stage);
  for(const f of fighters||[])this.fighter(f,roster?.find(c=>c.id===f.characterId)||roster?.[0],t,f.slot||0);
 }
}
window.Badlandz3D=Badlandz3D;
window.BadlandzRig={solveTwoBone,stances:FIGHTER_STANCES,appearance:FIGHTER_APPEARANCE};
})();
