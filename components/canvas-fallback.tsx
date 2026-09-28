'use client';
import {useEffect,useRef} from 'react';
import {placeGraphLabels} from '@/components/graph-labels';
import {entries,relationships,type Entry} from '@/lib/atlas-data';

type Point=[number,number,number];
type Props={entry:Entry;playing:boolean;amount:number;pulse:number;reset:number;graph?:boolean;onSelect?:(id:string)=>void};
type Face={points:Point[];color:string;edge:boolean};
// CPU projection for devices without WebGL. The primary Three.js renderer is unchanged.
export default function CanvasFallback(props:Props){
 const canvas=useRef<HTMLCanvasElement>(null),labels=useRef<HTMLDivElement>(null),state=useRef(props);state.current=props;
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;
  let width=0,height=0,frame=0,stopped=false,visible=true,angle=-.4,tilt=-.22,zoom=1,t=0,prev=performance.now(),lastDraw=0,param=props.amount/100,lastReset=props.reset,lastPulse=props.pulse,impulse=0;
  let pointer:{x:number;y:number}|null=null;
  const resize=()=>{const rect=el.getBoundingClientRect();width=rect.width;height=rect.height;const dpr=Math.min(devicePixelRatio,1.6);el.width=Math.round(width*dpr);el.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(el);resize();const io=new IntersectionObserver(r=>{visible=r[0]?.isIntersecting??true});io.observe(el);
  const down=(e:PointerEvent)=>{pointer={x:e.clientX,y:e.clientY};el.setPointerCapture(e.pointerId)};
  const move=(e:PointerEvent)=>{if(!pointer)return;angle+=(e.clientX-pointer.x)*.008;tilt=Math.max(-1.3,Math.min(1.3,tilt+(e.clientY-pointer.y)*.007));pointer={x:e.clientX,y:e.clientY}};
  const up=()=>{pointer=null};const wheel=(e:WheelEvent)=>{e.preventDefault();zoom=Math.min(1.5,Math.max(.65,zoom*Math.exp(-e.deltaY*.001)))};
  const keys=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')angle-=.12;if(e.key==='ArrowRight')angle+=.12;if(e.key==='ArrowUp')tilt-=.1;if(e.key==='ArrowDown')tilt+=.1;if(e.key==='+')zoom=Math.min(1.5,zoom+.08);if(e.key==='-')zoom=Math.max(.65,zoom-.08)}};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('keydown',keys);
  const project=([x,y,z]:Point):Point=>{const a=x*Math.cos(angle)+z*Math.sin(angle),b=-x*Math.sin(angle)+z*Math.cos(angle),c=y*Math.cos(tilt)-b*Math.sin(tilt),d=y*Math.sin(tilt)+b*Math.cos(tilt),k=7/(7-d);const scale=Math.min(width/(props.graph?6.6:5.8),(height-145)/4.7)*zoom;return [width/2+a*k*scale,height*.54-c*k*scale,d]};
  function path(points:Point[]){ctx!.beginPath();points.forEach((p,i)=>i?ctx!.lineTo(p[0],p[1]):ctx!.moveTo(p[0],p[1]));}
  const rgb=(hex:string)=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  function draw(){if(stopped)return;frame=requestAnimationFrame(draw);const now=performance.now();if(now-lastDraw<32)return;lastDraw=now;const dt=Math.min((now-prev)/1000,.08);prev=now;if(!visible||document.hidden)return;
   const s=state.current,e=s.entry,palette=e.colors;if(s.playing&&!pointer){angle+=dt*.12;t+=dt;}param+=(s.amount/100-param)*(1-Math.exp(-dt*7));if(s.reset!==lastReset){angle=-.4;tilt=-.22;zoom=1;lastReset=s.reset}if(s.pulse!==lastPulse){impulse=1;lastPulse=s.pulse}impulse=Math.max(0,impulse-dt*.5);ctx!.clearRect(0,0,width,height);
   if(s.graph){
    const nodes=entries.map((e,i)=>{const a=i*Math.PI*2/entries.length;return project([Math.cos(a)*2.3,Math.sin(a)*1.65,Math.sin(a*2)*.7])});
    relationships.forEach(r=>{const active=r.a===s.entry.id||r.b===s.entry.id;const a=nodes[entries.findIndex(e=>e.id===r.a)],b=nodes[entries.findIndex(e=>e.id===r.b)];ctx!.globalAlpha=active?.9:.2;ctx!.strokeStyle=r.type==='文本关联'?'#219e99':'#d076a0';ctx!.lineWidth=active?1.8:.9;ctx!.setLineDash(r.type==='文本关联'?[]:[5,5]);path([a,b]);ctx!.stroke()});ctx!.setLineDash([]);ctx!.globalAlpha=1;
    nodes.forEach((p,i)=>{const active=entries[i].id===s.entry.id,rad=active?10:7;const grd=ctx!.createRadialGradient(p[0]-2,p[1]-3,1,p[0],p[1],rad);grd.addColorStop(0,'#ffffff');grd.addColorStop(.3,entries[i].colors[0]);grd.addColorStop(1,entries[i].colors[1]);ctx!.fillStyle=grd;ctx!.beginPath();ctx!.arc(p[0],p[1],rad,0,Math.PI*2);ctx!.fill();ctx!.strokeStyle=active?'#a78440':'#acd3c7';ctx!.lineWidth=1;ctx!.beginPath();ctx!.ellipse(p[0],p[1],rad+5,rad+2,-.4,0,Math.PI*2);ctx!.stroke();});placeGraphLabels(labels.current,nodes.map((p,i)=>({id:entries[i].id,x:p[0],y:p[1]-25})),width,height);return;
   }
   const faces:Face[]=[];const curves:{points:Point[];color:string;width:number}[]=[];
   const mesh=(fn:(u:number,v:number)=>Point,color:string,nu=40,nv=10)=>{for(let j=0;j<nv;j++)for(let i=0;i<nu;i++)faces.push({points:[fn(i/nu,j/nv),fn((i+1)/nu,j/nv),fn((i+1)/nu,(j+1)/nv),fn(i/nu,(j+1)/nv)].map(project),color,edge:false});for(const v of [0,1])curves.push({points:Array.from({length:81},(_,i)=>project(fn(i/80,v))),color:'#c9a552',width:.8});};
   const ring=(radius:number,rotation:number,color:string)=>{curves.push({points:Array.from({length:100},(_,i)=>{const a=i/99*Math.PI*2;return project([Math.cos(a)*radius,Math.sin(a)*Math.sin(rotation)*radius,Math.sin(a)*Math.cos(rotation)*radius])}),color,width:1});};
   if(e.model==='sky'){
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5,spread=(1-param)*.8;mesh((u,v)=>{const theta=.16+u*(Math.PI-.32),phi=a+(v-.5)*Math.PI*2/5*.94;return [Math.sin(theta)*Math.cos(phi)*1.6+Math.cos(a)*spread,Math.cos(theta)*1.6,Math.sin(theta)*Math.sin(phi)*1.6+Math.sin(a)*spread]},palette[j],35,12);}ring(2.26,.62,'#ceb777');ring(2.15,-.8,'#e5c886');
   }else if(e.model==='moon'){
    const point=project([0,0,0]),radius=Math.min(width/5.8,(height-145)/4.7)*zoom*1.35;const shift=Math.cos(param*Math.PI*2)*radius*.75;const grd=ctx!.createRadialGradient(point[0]+shift,point[1]-radius*.35,1,point[0],point[1],radius);grd.addColorStop(0,'#fff9ff');grd.addColorStop(.45,'#d7d3fa');grd.addColorStop(1,'#817cab');ctx!.fillStyle=grd;ctx!.beginPath();ctx!.arc(point[0],point[1],radius,0,Math.PI*2);ctx!.fill();for(let j=0;j<4;j++)ring(1.65+j*.16,.3+j*.55,palette[j]);
   }else if(['water','tide','earth','mountain'].includes(e.model)){
    for(let j=0;j<7;j++){const r=e.model==='mountain'?1.8-j*.2:.5+j*.22;mesh((u,v)=>{const a=u*Math.PI*2,rad=r+(v-.5)*(e.model==='earth'?.5:.23),y=e.model==='earth'?(j-3)*(.12+param*.25):e.model==='mountain'?(j-3)*(.22+param*.25):Math.sin(t*1.3-j*.7)*param*.23+impulse*.28*Math.sin(j-impulse*5);return [Math.cos(a)*rad,y+Math.sin(a*3+j)*.08,Math.sin(a)*rad]},palette[j%5],50,3)}
   }else if(['portal','balance'].includes(e.model)){
    const count=e.model==='balance'?2:4;for(let j=0;j<count;j++){const scale=e.model==='balance'?1:.72+j*.16,turn=e.model==='balance'?(j?1:-1)*(.5+param):j*.55;
     mesh((u,v)=>{const a=u*Math.PI*2,b=v*Math.PI*2;const r=1.1+(e.model==='portal'?.2*Math.cos(a*3):0),x=(r+.13*Math.cos(b))*Math.cos(a)*scale+(e.model==='balance'?(j?1:-1)*param*.65:0),y=(r+.13*Math.cos(b))*Math.sin(a)*scale,z=.13*Math.sin(b)+(e.model==='portal'?.23*Math.sin(a*3)*(param+.5):0);return [x*Math.cos(turn)+z*Math.sin(turn),y,-x*Math.sin(turn)+z*Math.cos(turn)]},palette[j],65,8)}
   }else{
    for(let j=0;j<5;j++){mesh((u,v)=>{const a=j*Math.PI*2/5+u*Math.PI*(1+param),r=(.7+Math.sin(u*Math.PI)*.5)+(v-.5)*.46;return [Math.cos(a)*r*(.72+param*.55),(u-.5)*3.5+Math.sin(t*.6+j)*.03,Math.sin(a)*r*(.72+param*.55)]},palette[j],50,8)}
   }
   faces.sort((a,b)=>a.points.reduce((s,p)=>s+p[2],0)-b.points.reduce((s,p)=>s+p[2],0));
   for(const f of faces){const z=f.points.reduce((s,p)=>s+p[2],0)/4,c=rgb(f.color),light=.12+Math.max(0,Math.min(.45,(z+2)*.08));const fill=c.map(v=>Math.round(v+(255-v)*light));path(f.points);ctx!.closePath();ctx!.fillStyle=`rgba(${fill.join(',')},.76)`;ctx!.fill();ctx!.strokeStyle=`rgba(${fill.join(',')},.38)`;ctx!.lineWidth=.5;ctx!.stroke();}
   for(const line of curves){path(line.points);ctx!.strokeStyle=line.color;ctx!.lineWidth=line.width;ctx!.globalAlpha=.65;ctx!.stroke()}ctx!.globalAlpha=1;
  }draw();
  return()=>{stopped=true;cancelAnimationFrame(frame);resizeObserver.disconnect();io.disconnect();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel);el.removeEventListener('keydown',keys)};
 },[props.graph?'network':props.entry.id]);
 return <div className="cpu-renderer"><canvas ref={canvas} tabIndex={0} aria-label={props.graph?'可旋转的知识关系网络':`${props.entry.name}动态三维意象`} role="img"/>{props.graph&&<div ref={labels} className="network-labels">{entries.map(e=><button key={e.id} data-id={e.id} onClick={()=>props.onSelect?.(e.id)} aria-pressed={props.entry.id===e.id} className={props.entry.id===e.id?'active':''}>{e.name}</button>)}</div>}<span className="renderer-note">轻量动态模式</span></div>;
}
