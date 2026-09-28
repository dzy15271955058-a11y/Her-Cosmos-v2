'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {entries,relationships,type Entry} from '@/lib/atlas-data';
import CanvasFallback from '@/components/canvas-fallback';
import {placeGraphLabels} from '@/components/graph-labels';

export function MiniModel({entry}:{entry:Entry}){
 const paths:{d:string;color:string;width:number;fill?:string}[]=[];
 const project=(x:number,y:number,z:number)=>[100+(x*.89+z*.36)*38,86+(y*.83-z*.31)*38];
 for(let j=0;j<8;j++){
  const pts:number[][]=[];
  for(let i=0;i<=100;i++){
   const t=i/100*Math.PI*2,k=(j-3.5)/4;let x=0,y=0,z=0;
   if(entry.model==='sky'||entry.model==='moon'){const a=Math.cos(k*1.3);x=1.65*a*Math.cos(t);y=1.65*Math.sin(k*1.3);z=1.65*a*Math.sin(t);}
   else if(['water','tide','earth','mountain'].includes(entry.model)){const r=entry.model==='mountain'?1.8-j*.18:.5+j*.16;x=r*Math.cos(t);z=r*Math.sin(t);y=entry.model==='earth'?k*.8:entry.model==='mountain'?k*1.4:Math.sin(t*3+j*.4)*.14+k*.2;}
   else if(entry.model==='portal'||entry.model==='balance'){const r=1.1+k*.3;x=(r+.35*Math.cos(t*3))*Math.cos(t);y=(r+.35*Math.cos(t*3))*Math.sin(t);z=.48*Math.sin(t*3)+k*.4;}
   else {x=Math.cos(t+k)*(.7+Math.cos(t*2)*.25);y=Math.sin(t)*1.7;z=Math.sin(t+k)*(.9+k*.3);x+=k*.65;}
   pts.push(project(x,y,z));
  }
  paths.push({d:pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')+' Z',color:entry.colors[j%5],width:j%3===0?2.5:1.3,fill:j%2===0?entry.colors[j%5]+'1c':'none'});
 }
 return <svg viewBox="0 0 200 172" aria-hidden="true" className="mini-model"><ellipse cx="100" cy="148" rx="49" ry="6" fill={entry.colors[0]} opacity=".08"/>{paths.map((p,i)=><path key={i} d={p.d} fill={p.fill} stroke={p.color} strokeWidth={p.width} strokeLinejoin="round"/>)}</svg>;
}

type Props={entry:Entry;playing:boolean;amount:number;pulse:number;reset:number;graph?:boolean;onSelect?:(id:string)=>void};
type Dynamic={mesh:THREE.Object3D;base:THREE.Vector3;index:number;kind:string};
export default function ModelStage({entry,playing,amount,pulse,reset,graph=false,onSelect}:Props){
 const host=useRef<HTMLDivElement>(null);const labels=useRef<HTMLDivElement>(null);const state=useRef({playing,amount,pulse,reset,entry,onSelect});
 state.current={playing,amount,pulse,reset,entry,onSelect};
 const [error,setError]=useState(false);const [ready,setReady]=useState(false);
 useEffect(()=>{
  const container=host.current;if(!container)return;
  setError(false);setReady(false);
  let renderer:THREE.WebGLRenderer;try{const surface=document.createElement('canvas');const context=surface.getContext('webgl2',{alpha:true,antialias:true});if(!context){setError(true);return;}renderer=new THREE.WebGLRenderer({canvas:surface,context,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{setError(true);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label',graph?'可旋转的知识关系网络':`${entry.name}动态三维意象`);renderer.domElement.setAttribute('role','img');
  const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(36,1,.1,60);camera.position.set(0,1.3,8.6);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.enablePan=false;controls.minDistance=4.4;controls.maxDistance=13;controls.autoRotateSpeed=.65;
  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd9ffff,0x9898bb,2.5));const key=new THREE.DirectionalLight(0xffffff,5);key.position.set(3,5,4);scene.add(key);const rose=new THREE.PointLight(0xffadcf,25,20);rose.position.set(-3,1,2);scene.add(rose);const blue=new THREE.PointLight(0x70ffdc,20,20);blue.position.set(3,-1,2);scene.add(blue);
  const root=new THREE.Group();scene.add(root);root.rotation.z=-.08;
  const dynamics:Dynamic[]=[];const materials:THREE.Material[]=[];
  const mat=(color:string,glass=true)=>{const m=new THREE.MeshPhysicalMaterial({color,metalness:glass?.12:.6,roughness:glass?.2:.25,transmission:glass?.45:0,thickness:.7,ior:1.45,iridescence:glass?.8:.3,iridescenceIOR:1.35,clearcoat:1,clearcoatRoughness:.13,side:THREE.DoubleSide});materials.push(m);return m;};
  const jewelMats=entry.colors.map(c=>mat(c));const gold=mat('#d9b452',false);
  function tube(points:THREE.Vector3[],color:THREE.Material,r=.012,closed=false){const curve=new THREE.CatmullRomCurve3(points,closed);const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(32,points.length*2),r,5,closed),color);return mesh;}
  function surface(fn:(u:number,v:number)=>THREE.Vector3,segU=55,segV=20){const pos:number[]=[];const indices:number[]=[];for(let j=0;j<=segV;j++)for(let i=0;i<=segU;i++){const p=fn(i/segU,j/segV);pos.push(p.x,p.y,p.z);}for(let j=0;j<segV;j++)for(let i=0;i<segU;i++){const a=j*(segU+1)+i;indices.push(a,a+1,a+segU+1,a+1,a+segU+2,a+segU+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;}
  const addDynamic=(mesh:THREE.Object3D,index:number,kind:string)=>{root.add(mesh);dynamics.push({mesh,base:mesh.position.clone(),index,kind});};
  function ring(radius:number,m:THREE.Material,thickness=.018){return new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,8,100),m);}
  const nodes:THREE.Mesh[]=[];const graphEdges:THREE.Line[]=[];
  if(graph){
   const positions=entries.map((e,i)=>{const group=e.category==='神话人物'?0:e.category==='易象'?1:2;const a=i*Math.PI*2/entries.length;return new THREE.Vector3(Math.cos(a)*2.3,Math.sin(a)*1.65,Math.sin(a*2)*.7+(group-1)*.25);});
   relationships.forEach(rel=>{const a=positions[entries.findIndex(e=>e.id===rel.a)],b=positions[entries.findIndex(e=>e.id===rel.b)];const geometry=new THREE.BufferGeometry().setFromPoints([a,b]);const m=new THREE.LineDashedMaterial({color:rel.type==='文本关联'?0x319b96:0xd992ae,transparent:true,opacity:.45,dashSize:.08,gapSize:rel.type==='文本关联'?0:.06});const line=new THREE.Line(geometry,m);line.computeLineDistances();line.userData={a:rel.a,b:rel.b};graphEdges.push(line);root.add(line);materials.push(m);});
   entries.forEach((e,i)=>{const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.16,1),mat(e.colors[0],false));mesh.position.copy(positions[i]);mesh.userData.id=e.id;root.add(mesh);nodes.push(mesh);const orbit=ring(.235,mat(e.colors[1],false),.008);orbit.position.copy(positions[i]);orbit.rotation.x=.7;root.add(orbit);});
   controls.autoRotateSpeed=.3;
  } else if(entry.model==='sky'){
   for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;const fn=(u:number,v:number)=>{const phi=a+(u-.5)*Math.PI*2/5*.94,theta=.18+v*(Math.PI-.36);return new THREE.Vector3(Math.sin(theta)*Math.cos(phi)*1.64,Math.cos(theta)*1.64,Math.sin(theta)*Math.sin(phi)*1.64);};
    const group=new THREE.Group();group.add(new THREE.Mesh(surface(fn),jewelMats[i]));for(const edge of [0,1])group.add(tube(Array.from({length:45},(_,j)=>fn(edge,j/44)),gold,.009));addDynamic(group,i,'panel');
   }
   const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,1),mat('#fff1ba',false));addDynamic(core,0,'core');
   for(let i=0;i<2;i++){const r=ring(2.18+i*.14,gold,.009);r.rotation.x=1+i*.6;r.rotation.y=.3+i*.8;root.add(r);}
  }else if(entry.model==='moon'){
   const moon=new THREE.Mesh(new THREE.SphereGeometry(1.37,64,48),new THREE.MeshPhysicalMaterial({color:0xe6e3ff,roughness:.36,metalness:.3,clearcoat:1}));root.add(moon);materials.push(moon.material);for(let i=0;i<4;i++){const r=ring(1.65+i*.16,jewelMats[i],.025);r.rotation.set(.6+i*.3,.3+i*.2,i*.4);addDynamic(r,i,'orbit');}
   const satellite=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),gold);addDynamic(satellite,0,'satellite');
  }else if(['water','tide','earth','mountain'].includes(entry.model)){
   for(let j=0;j<7;j++){
    const kind=entry.model;const rad=kind==='mountain'?1.8-j*.2:.58+j*.21;
    const fn=(u:number,v:number)=>{const a=u*Math.PI*2,r=rad+(v-.5)*(kind==='earth'?.48:.21);return new THREE.Vector3(Math.cos(a)*r,Math.sin(a*3+j*.7)*.1,Math.sin(a)*r);};
    const mesh=new THREE.Mesh(surface(fn,70,8),jewelMats[j%5]);mesh.position.y=kind==='earth'?(j-3)*.17:kind==='mountain'?(j-3)*.37:0;mesh.rotation.x=.12;addDynamic(mesh,j,kind);
    if(kind==='mountain'){const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.2),gold);gem.position.y=1.6;root.add(gem);}
   }
   root.rotation.x=.28;
  }else if(entry.model==='portal'||entry.model==='balance'){
   const count=entry.model==='balance'?2:5;for(let i=0;i<count;i++){
    const geo=entry.model==='balance'?new THREE.TorusGeometry(1.27,.16,20,100):new THREE.TorusKnotGeometry(1.05,.13,150,12,2,3);
    const mesh=new THREE.Mesh(geo,jewelMats[i]);mesh.rotation.set(i*.43,i*.58,i*.19);mesh.scale.setScalar(entry.model==='balance'?1:.72+i*.13);addDynamic(mesh,i,entry.model);
   }
  }else{
   const count=entry.model==='flame'?6:5;for(let j=0;j<count;j++){
    const angle=j*Math.PI*2/count;
    const fn=(u:number,v:number)=>{const h=(u-.5)*3.5;const a=angle+u*Math.PI*1.5;const r=(.7+Math.sin(u*Math.PI)*.5)+(v-.5)*.46;return new THREE.Vector3(Math.cos(a)*r,h,Math.sin(a)*r);};
    const group=new THREE.Group();group.add(new THREE.Mesh(surface(fn,70,12),jewelMats[j%5]));group.add(tube(Array.from({length:50},(_,k)=>fn(k/49,0)),gold,.008));addDynamic(group,j,entry.model);
   }
   if(entry.model==='flame'){const core=new THREE.Mesh(new THREE.OctahedronGeometry(.4,1),mat('#ffd27e',false));addDynamic(core,0,'core');}
  }
  if(!graph){const ringBase=ring(2.5,gold,.006);ringBase.rotation.x=Math.PI/2;ringBase.position.y=-1.9;root.add(ringBase);}
  const resize=()=>{const rect=container.getBoundingClientRect();renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/Math.max(rect.height,1);camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let stopped=false,frame=0,lastReset=reset,lastPulse=pulse,impulse=0,t=0,prev=performance.now(),visible=true,displayedAmount=amount/100;
  const intersection=new IntersectionObserver(e=>{visible=e[0]?.isIntersecting??true;});intersection.observe(container);
  const pointer=new THREE.Vector2();const raycaster=new THREE.Raycaster();let start={x:0,y:0};
  const down=(e:PointerEvent)=>{start={x:e.clientX,y:e.clientY};};const up=(e:PointerEvent)=>{if(Math.hypot(start.x-e.clientX,start.y-e.clientY)>7)return;if(graph){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(nodes)[0];if(hit)state.current.onSelect?.(hit.object.userData.id);}else impulse=1;};
  renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);const onLoss=(e:Event)=>{e.preventDefault();setError(true);};renderer.domElement.addEventListener('webglcontextlost',onLoss);
  const animate=()=>{if(stopped)return;frame=requestAnimationFrame(animate);const now=performance.now(),dt=Math.min((now-prev)/1000,.05);prev=now;if(!visible||document.hidden)return;const s=state.current;displayedAmount+=(s.amount/100-displayedAmount)*(1-Math.exp(-dt*7));const p=displayedAmount;if(s.playing)t+=dt;controls.autoRotate=s.playing;
   if(s.reset!==lastReset){camera.position.set(0,1.3,8.6);controls.target.set(0,0,0);lastReset=s.reset;}
   if(s.pulse!==lastPulse){impulse=1;lastPulse=s.pulse;}impulse=Math.max(0,impulse-dt*.65);
   dynamics.forEach(({mesh,index:i,kind})=>{
    if(kind==='panel'){const a=i*Math.PI*2/5;const dist=(1-p)*.78;mesh.position.set(Math.cos(a)*dist,Math.sin(t*.7+i)*.025,Math.sin(a)*dist);mesh.rotation.y=(1-p)*.13*Math.sin(i);}
    else if(kind==='core'){mesh.rotation.set(t*.25,t*.45,0);mesh.scale.setScalar(1+impulse*.2+Math.sin(t)*.04);}
    else if(kind==='earth'){mesh.position.y=(i-3)*(.12+p*.25);mesh.rotation.y=Math.sin(t*.2+i)*.06;}
    else if(kind==='mountain'){mesh.position.y=(i-3)*(.2+p*.28);mesh.rotation.y=t*.04*(i%2?1:-1);}
    else if(kind==='water'||kind==='tide'){mesh.position.y=Math.sin(t*1.3-i*.7)*(p*.23)+impulse*.3*Math.sin(i-impulse*5);mesh.scale.setScalar(1+impulse*.1*(i+1)/7);}
    else if(kind==='satellite'){mesh.position.set(Math.cos(t*.4+p*Math.PI*2)*2,Math.sin(t*.4+p*Math.PI*2)*.8,Math.sin(t*.4+p*Math.PI*2)*1.8);}
    else if(kind==='orbit'){mesh.rotation.z=i*.4+t*.025;mesh.rotation.y=.3+i*.2+p*.4;}
    else if(kind==='portal'){mesh.scale.setScalar(.55+i*.13+p*.4);mesh.rotation.z=i*.19+t*.07;}
    else if(kind==='balance'){mesh.position.x=(i?1:-1)*p*.65;mesh.rotation.y=(i?1:-1)*(.5+p*.9);mesh.rotation.z=t*.12*(i?1:-1);}
    else {mesh.rotation.y=Math.sin(t*.4+i*.7)*.06+(p-.5)*(i-2)*.28;mesh.scale.x=.72+p*.55;mesh.scale.z=.72+p*.55;mesh.position.y=Math.sin(t*.6+i)*.035;}
   });
   if(entry.model==='moon'){key.position.set(Math.cos(p*Math.PI*2)*5,2,Math.sin(p*Math.PI*2)*5);key.intensity=7;}
   graphEdges.forEach(edge=>{const linked=edge.userData.a===s.entry.id||edge.userData.b===s.entry.id;const m=edge.material as THREE.LineDashedMaterial;m.opacity=linked?.9:.13;});
   const labelPoints:{id:string;x:number;y:number}[]=[];
   nodes.forEach(mesh=>{const active=mesh.userData.id===s.entry.id;const connected=relationships.some(r=>(r.a===s.entry.id&&r.b===mesh.userData.id)||(r.b===s.entry.id&&r.a===mesh.userData.id));mesh.scale.setScalar(active?1.5:connected?1.15:.85);const world=new THREE.Vector3();mesh.getWorldPosition(world);world.project(camera);const label=labels.current?.querySelector<HTMLElement>(`[data-id="${mesh.userData.id}"]`);if(label){labelPoints.push({id:mesh.userData.id,x:(world.x*.5+.5)*container.clientWidth,y:(-world.y*.5+.5)*container.clientHeight-23});label.style.zIndex=String(Math.round((1-world.z)*1000));}});
   placeGraphLabels(labels.current,labelPoints,container.clientWidth,container.clientHeight);
   controls.update();renderer.render(scene,camera);
  };animate();setReady(true);
  return()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',onLoss);scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){o.geometry.dispose();const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose());}});env.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[graph? 'network':entry.id]);
 return <div className="model-stage-wrap"><div className="model-canvas" ref={host}/>{graph&&!error&&<div ref={labels} className="network-labels">{entries.map(e=><button key={e.id} data-id={e.id} onClick={()=>onSelect?.(e.id)} aria-pressed={entry.id===e.id} className={entry.id===e.id?'active':''}>{e.name}</button>)}</div>}{error?<CanvasFallback entry={entry} playing={playing} amount={amount} pulse={pulse} reset={reset} graph={graph} onSelect={onSelect}/>:!ready&&<div className="model-fallback"><MiniModel entry={entry}/><p>正在展开空间…</p></div>}</div>;
}
