/* 2D compatibility view for browsers where WebGL is disabled. Normal gameplay is 3D. */
(function(){'use strict';
class FallbackFighterRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('Neither WebGL nor Canvas 2D is available.');}
 render(fighters,roster,t,options={}){const g=this.ctx,W=960,H=540,stage=options.stage||'north-block';g.save();g.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);g.clearRect(0,0,W,H);
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#111b2b');sky.addColorStop(.75,'#35303b');sky.addColorStop(1,'#171820');g.fillStyle=sky;g.fillRect(0,0,W,H);
 for(let i=0;i<12;i++){const x=i*90-25,h=135+((i*29)%80);g.fillStyle=i%2?'#493940':'#594044';g.fillRect(x,420-h,84,h);g.fillStyle='#252433';g.fillRect(x-4,420-h,91,12);for(let j=0;j<3;j++){g.fillStyle=(i+j)%3?'#384250':'#af7956';g.fillRect(x+14+j*20,442-h,12,26);}}
 if(stage==='rooftop'){
 g.fillStyle='#111723';g.fillRect(0,0,W,350);
 for(let i=0;i<19;i++){let x=i*56-20,h=95+((i*53)%175);g.fillStyle=i%2?'#293344':'#32303d';g.fillRect(x,430-h,51,h);}
 g.fillStyle='#525862';g.fillRect(0,424,W,24);
 g.fillStyle='#8c9092';for(let x=0;x<W;x+=28)g.fillRect(x,332,3,110);
 }else if(stage==='basketball-court'){
 g.fillStyle='#253542';g.fillRect(0,0,W,344);
 for(let x=0;x<W;x+=26){g.fillStyle='#727c83';g.fillRect(x,315,2,120);}
 g.fillStyle='#aab4b9';for(const y of [320,360,398])g.fillRect(0,y,W,2);
 g.fillStyle='#2c616a';g.fillRect(0,437,W,103);
 g.strokeStyle='#d4c09b';g.lineWidth=3;g.strokeRect(60,437,840,100);
 }
 g.fillStyle=stage==='basketball-court'?'#315f63':stage==='rooftop'?'#2d343c':'#1b1d23';g.fillRect(0,434,W,106);g.fillStyle='#9f8b7e';g.fillRect(0,431,W,3);g.fillStyle='#42414c';for(let i=0;i<W;i+=140)g.fillRect(i+20,505,67,3);
 for(const f of fighters||[]){const c=(roster||[]).find(v=>v.id===f.characterId)||roster?.[0];if(!c)continue;
 const x= f.x, y=426-(f.height||0)*22,flip=f.facing||1,scale=(c.build||1)*1.3;
 g.save();g.translate(x,y);g.scale(scale*flip,scale);g.fillStyle='#0007';g.beginPath();g.ellipse(0,4,34,8,0,0,6.283);g.fill();
 const kick=(['front-kick','roundhouse','spin-kick','sweep','special'].includes(f.action))?Math.sin((f.attackProgress||.5)*Math.PI):0,punch=(['jab','cross','hook','uppercut','special','ability'].includes(f.action))?Math.sin((f.attackProgress||.5)*Math.PI):0,block=f.action==='block';
 const blockColor=f.flash?'#efddd1':c.top;
 const part=(x,y,w,h,col,r=0)=>{g.save();g.translate(x,y);g.rotate(r);g.fillStyle=col;g.beginPath();g.roundRect(-w/2,-h/2,w,h,Math.min(9,w/3));g.fill();g.restore();};
 part(-13,-24,18,50,c.pants);part(13+kick*27,-24-kick*26,18+kick*20,50-kick*10,c.pants,kick*.85);part(-13,-2,25,11,'#101015');part(15+kick*52,-3-kick*27,30,12,'#101015');
 part(0,-73,53,56,blockColor);part(-28,-76,14,40,c.skin,block?-.7:0);part(28+punch*17,-76-punch*10,14+punch*25,40,c.skin,block?.7:punch*-1.1);
 part(0,-118,38,44,c.skin);part(0,-137,38,13,'#171518');if(c.hair==='pigtails'){part(-25,-130,14,32,'#13141c');part(25,-130,14,32,'#13141c');}
 part(10,-117,5,3,'#17131a');part(9,-107,12,3,'#57373c');if(f.flash){g.strokeStyle='#fff';g.lineWidth=3;g.strokeRect(-37,-148,75,152);}g.restore();}
 g.textAlign='center';g.font='bold 12px Arial';g.fillStyle='#ded7db';g.fillText('2D COMPATIBILITY MODE • ENABLE WEBGL FOR FULL 3D',W/2,H-12);g.restore();
 }
}
window.FallbackFighterRenderer=FallbackFighterRenderer;
})();
