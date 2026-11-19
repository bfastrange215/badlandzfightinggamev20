/* Philly Badlandz V20: self-contained glTF 2.0 skeletal animation sampler.
   Dan's uploaded Tripo GLB contains a real skin and 14 clips. The skin is evaluated
   in mesh-local coordinates and streamed to V19's existing WebGL geometry buffers.
   No model redraws, portrait cutouts, CDNs, or extra third-party dependencies. */
(function(root){ 'use strict';
const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const constructors={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const widths={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function mult(a,b,out=new Float32Array(16)){
 for(let c=0;c<4;c++)for(let r=0;r<4;r++){
  out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
 }return out;
}
function compose(t,q,s){
 const [x,y,z,w]=q,xx=x+x,yy=y+y,zz=z+z;
 const wx=w*xx,wy=w*yy,wz=w*zz,xxx=x*xx,xy=x*yy,xz=x*zz,yyy=y*yy,yz=y*zz,zzz=z*zz;
 const a=I();a[0]=(1-yyy-zzz)*s[0];a[1]=(xy+wz)*s[0];a[2]=(xz-wy)*s[0];
 a[4]=(xy-wz)*s[1];a[5]=(1-xxx-zzz)*s[1];a[6]=(yz+wx)*s[1];
 a[8]=(xz+wy)*s[2];a[9]=(yz-wx)*s[2];a[10]=(1-xxx-yyy)*s[2];
 a[12]=t[0];a[13]=t[1];a[14]=t[2];return a;
}
function invert(a){
 // General affine inverse (no perspective).
 const A=a[0],B=a[4],C=a[8],D=a[1],E=a[5],F=a[9],G=a[2],H=a[6],J=a[10];
 const c00=E*J-F*H,c01=C*H-B*J,c02=B*F-C*E;
 const c10=F*G-D*J,c11=A*J-C*G,c12=C*D-A*F;
 const c20=D*H-E*G,c21=B*G-A*H,c22=A*E-B*D;
 const det=A*c00+B*c10+C*c20;
 if(Math.abs(det)<1e-12)return I();
 const o=I(),k=1/det;
 o[0]=c00*k;o[4]=c01*k;o[8]=c02*k;
 o[1]=c10*k;o[5]=c11*k;o[9]=c12*k;
 o[2]=c20*k;o[6]=c21*k;o[10]=c22*k;
 o[12]=-(o[0]*a[12]+o[4]*a[13]+o[8]*a[14]);
 o[13]=-(o[1]*a[12]+o[5]*a[13]+o[9]*a[14]);
 o[14]=-(o[2]*a[12]+o[6]*a[13]+o[10]*a[14]);return o;
}
function quaternionLerp(a,b,u){
 let dot=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];const sign=dot<0?-1:1;
 const v=[a[0]*(1-u)+b[0]*u*sign,a[1]*(1-u)+b[1]*u*sign,a[2]*(1-u)+b[2]*u*sign,a[3]*(1-u)+b[3]*u*sign];
 const n=Math.hypot(...v)||1;return v.map(x=>x/n);
}
function getAccessor(meta,bytes,binStart,index){
 const a=meta.accessors[index],v=meta.bufferViews[a.bufferView];
 if(!a||!v||a.sparse)throw Error('Unsupported or missing skinned glTF accessor');
 const C=constructors[a.componentType],size=widths[a.componentType],n=components[a.type];
 if(!C||!n)throw Error('Unsupported glTF component type: '+a.componentType);
 const offset=binStart+(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||n*size;
 const len=a.count*n;
 if(stride===n*size&&offset%size===0){return new C(bytes.slice(offset,offset+len*size));}
 const data=new C(len),dv=new DataView(bytes),reader={1:'getUint8',2:'getUint16',4:'getUint32'};
 for(let i=0;i<a.count;i++)for(let c=0;c<n;c++){
  const p=offset+i*stride+c*size;
  data[i*n+c]=a.componentType===5126?dv.getFloat32(p,true):dv[reader[size]](p,true);
 }return data;
}
function clipFor(move){
 if(move==='walk')return 'walk';if(move==='run')return 'run';
 if(move==='jab'||move==='air-jab')return 'make a fist and throw a punch';
 if(move==='cross'||move==='hook'||move==='uppercut')return 'make a fist and punch';
 if(move==='front-kick'||move==='sweep')return 'front_kick_02';
 if(move==='roundhouse')return 'mid kick';
 if(move==='spin-kick')return 'high kick';
 if(move==='air-kick')return 'flying kick';
 if(move==='jump')return 'jump high';
 if(move==='hurt')return 'hit_to_body_02';
 if(move==='ko')return 'hit_to_head';
 if(move==='dodge'||move==='evade')return 'single jump back in boxing pose';
 if(move==='special'||move==='ability')return 'forward dash in boxing pose';
 if(move==='ultra')return 'a mix of street fighter style fighting and mortal kombat style';
 return 'a mix of street fighter style fighting and mortal kombat style';
}
class RiggedGLB {
 constructor(meta,bytes,binStart,primitive,geometry){
  if(!meta.skins?.length||!meta.animations?.length)throw Error('GLB contains no rigged animations');
  this.meta=meta;this.bytes=bytes;this.binStart=binStart;
  const read=i=>getAccessor(meta,bytes,binStart,i);
  this.positions=geometry.position;this.normals=geometry.normal;
  this.jointIndices=read(primitive.attributes.JOINTS_0);
  this.weights=read(primitive.attributes.WEIGHTS_0);
  if(this.jointIndices.length!==this.positions.length/3*4||this.weights.length!==this.jointIndices.length)throw Error('Invalid skin attributes');
  this.skin=meta.skins[meta.nodes.find(n=>n.skin!==undefined)?.skin??0];
  this.joints=this.skin.joints;this.nodes=meta.nodes;
  this.inverseBind=read(this.skin.inverseBindMatrices);
  if(this.inverseBind.length!==this.joints.length*16)throw Error('Wrong number of inverse bind matrices');
  this.meshNode=meta.nodes.findIndex(n=>n.mesh!==undefined&&n.skin!==undefined);
  this.parents=Array(this.nodes.length).fill(-1);
  this.nodes.forEach((n,p)=>{for(const c of n.children||[])this.parents[c]=p;});
  this.defaults=this.nodes.map(n=>({t:n.translation||[0,0,0],r:n.rotation||[0,0,0,1],s:n.scale||[1,1,1]}));
  this.locals=this.defaults.map(n=>({t:n.t,r:n.r,s:n.s}));
  this.globals=this.nodes.map(()=>I());
  this.bones=new Float32Array(this.joints.length*16);
  this.clips=new Map();
  this.totalSamples=0;
  for(const clip of meta.animations){
   const channels=[];let min=Infinity,max=0;
   for(const channel of clip.channels){
    const samp=clip.samplers[channel.sampler],times=read(samp.input),values=read(samp.output);
    min=Math.min(min,times[0]);max=Math.max(max,times[times.length-1]);
    channels.push({node:channel.target.node,path:channel.target.path,times,values,interp:samp.interpolation||'LINEAR',size:channel.target.path==='rotation'?4:3});
   }
   const name=(clip.name||'').trim().replace(/\.001$/,'').toLowerCase();
   this.clips.set(name,{name,channels,start:min,end:max,duration:max-min});
   this.totalSamples+=channels.length;
  }
  this.outputPositions=new Float32Array(this.positions.length);
  this.outputNormals=new Float32Array(this.normals.length);
  this.lastKey=null;
  this.pose('idle',0,0);
 }
 pose(move,time,progress){
  const name=clipFor(move),clip=this.clips.get(name) || this.clips.values().next().value;
  let sec;
  if(move==='idle'||move==='block'||move==='crouch'||move==='waiting')sec=clip.start+clip.duration*.02;
  else if(move==='walk'||move==='run')sec=clip.start+(time*(move==='run'?1.5:1.0))%Math.max(.01,clip.duration);
  else if(['jab','cross','hook','uppercut','front-kick','roundhouse','spin-kick','sweep','air-jab','air-kick','special','ability','ultra'].includes(move))sec=clip.start+clip.duration*Math.min(1,Math.max(0,progress));
  else sec=clip.start+(time*.8)%Math.max(.01,clip.duration);
  const frame=Math.round(sec*24),key=name+'|'+frame;
  if(key===this.lastKey)return false;
  this.lastKey=key;
  for(let i=0;i<this.locals.length;i++){const d=this.defaults[i];this.locals[i]={t:d.t,r:d.r,s:d.s};}
  for(const c of clip.channels){
   if(c.path!=='translation'&&c.path!=='rotation'&&c.path!=='scale')continue;
   const times=c.times,len=times.length;
   let low=0,hi=len-1;
   while(low<hi){const mid=(low+hi+1)>>1;if(times[mid]<=sec)low=mid;else hi=mid-1;}
   const j=Math.min(len-1,low+1),u=(j===low||c.interp==='STEP')?0:Math.max(0,Math.min(1,(sec-times[low])/(times[j]-times[low]||1)));
   const n=c.size,va=Array.from(c.values.subarray(low*n,low*n+n)),vb=Array.from(c.values.subarray(j*n,j*n+n));
   const v=c.path==='rotation'?quaternionLerp(va,vb,u):va.map((x,i)=>x+(vb[i]-x)*u);
   if(c.path==='translation')this.locals[c.node].t=v;
   else if(c.path==='rotation')this.locals[c.node].r=v;
   else this.locals[c.node].s=v;
  }
  // Root-motion is controlled by the authoritative multiplayer positions.
  // Keep root at its rest location so each kick doesn't teleport the fighter.
  const rootNode=this.joints[0];
  if(this.locals[rootNode])this.locals[rootNode].t=this.defaults[rootNode].t;
  for(let i=0;i<this.nodes.length;i++)this.worldMatrix(i);
  const invMesh=invert(this.globals[this.meshNode]);
  for(let k=0;k<this.joints.length;k++){
   const global=this.globals[this.joints[k]];
   const ib=this.inverseBind.subarray(k*16,k*16+16);
   const m=mult(invMesh,mult(global,ib));this.bones.set(m,k*16);
  }
  this.skinVertices();return true;
 }
 worldMatrix(index){
  const node=this.locals[index];
  if(!node)return I();
  // Parents need not be ordered by index; visit recursively and memoize.
  if(this._cacheEpoch===this._epoch&&this._seen?.has(index))return this.globals[index];
  if(!this._seen){this._seen=new Set();}
  const local=compose(node.t,node.r,node.s),parent=this.parents[index];
  if(parent!==-1){if(!this._seen.has(parent))this.worldMatrix(parent);mult(this.globals[parent],local,this.globals[index]);}
  else this.globals[index].set(local);
  this._seen.add(index);return this.globals[index];
 }
 skinVertices(){
  const pos=this.positions,norm=this.normals,ji=this.jointIndices,wt=this.weights,b=this.bones;
  const op=this.outputPositions,on=this.outputNormals;
  for(let i=0,j=0;i<pos.length;i+=3,j+=4){
   const x=pos[i],y=pos[i+1],z=pos[i+2],nx=norm[i],ny=norm[i+1],nz=norm[i+2];
   let px=0,py=0,pz=0,xx=0,yy=0,zz=0,sum=0;
   for(let k=0;k<4;k++){
    const w=wt[j+k];if(w<=.00001)continue;
    const off=ji[j+k]*16;
    px+=(b[off]*x+b[off+4]*y+b[off+8]*z+b[off+12])*w;
    py+=(b[off+1]*x+b[off+5]*y+b[off+9]*z+b[off+13])*w;
    pz+=(b[off+2]*x+b[off+6]*y+b[off+10]*z+b[off+14])*w;
    xx+=(b[off]*nx+b[off+4]*ny+b[off+8]*nz)*w;
    yy+=(b[off+1]*nx+b[off+5]*ny+b[off+9]*nz)*w;
    zz+=(b[off+2]*nx+b[off+6]*ny+b[off+10]*nz)*w;
    sum+=w;
   }
   const is=sum?1/sum:1;op[i]=px*is;op[i+1]=py*is;op[i+2]=pz*is;
   const l=Math.hypot(xx,yy,zz)||1;on[i]=xx/l;on[i+1]=yy/l;on[i+2]=zz/l;
  }
 }
}
// World matrices are recomputed for each pose; don't leak the previous cache.
const basePose=RiggedGLB.prototype.pose;
RiggedGLB.prototype.pose=function(move,time,progress){this._seen=new Set();return basePose.call(this,move,time,progress);};
const api={RiggedGLB,clipFor,compose,mult,invert,getAccessor};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.BadlandzSkin=api;
})(typeof window!=='undefined'?window:globalThis);
