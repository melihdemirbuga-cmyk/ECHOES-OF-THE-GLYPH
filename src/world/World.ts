import * as THREE from 'three';
import { ZONES, type InteractDef } from '../data/content';
import type { SaveState } from '../core/model';
import { Actor } from '../characters/Actor';
import { CollisionWorld } from './CollisionWorld';

const palette={stone:0x454354,trim:0x77717b,roof:0x232737,iron:0x55576c,gold:0xe2a765,teal:0xa9c9c3,grass:0x334547};
function rng(seed:number){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function elevation(zone:number,x:number,z:number){
  if(zone!==3)return 0;
  return z>12?0:z>4?Math.floor((12-z)/.8)*.12:z>-4?1.2:z>-12?1.2+Math.floor((-4-z)/.8)*.12:2.4;
}
export interface WorldObject {def:InteractDef;group:THREE.Group;marker:THREE.Mesh;actor?:Actor;hint?:THREE.Group;}
export class World {
  scene=new THREE.Scene();collision=new CollisionWorld();objects:WorldObject[]=[];npcs:Actor[]=[];
  private occluders:THREE.Mesh[]=[];private visibilityRay=new THREE.Raycaster();private rayDirection=new THREE.Vector3();
  private mats=new Map<string,THREE.MeshStandardMaterial>();private glows:THREE.Mesh[]=[];private leaves:THREE.Group[]=[];private motes:THREE.Points;
  private random:()=>number; zone:number;
  constructor(public state:SaveState){
    this.zone=state.zone;this.random=rng(7342+this.zone*7919);
    if(this.zone===3)this.collision.maxX=16.5;
    if(this.zone===4)this.collision.circleRadius=23;
    this.scene.background=new THREE.Color(0x080912);this.scene.fog=new THREE.FogExp2(this.zone===4?0x131020:0x101522,this.zone===2?.018:.014);
    const ambient=new THREE.HemisphereLight(0xb6c9db,0x343044,3.1);this.scene.add(ambient);
    const moon=new THREE.DirectionalLight(0xc8d4e4,3.4);moon.position.set(-15,30,12);moon.castShadow=true;
    moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:85});moon.shadow.bias=-.001;moon.shadow.normalBias=.05;this.scene.add(moon);
    this.ground();
    if(this.zone===0){this.chapel();if(!state.flags.gate)this.collision.add(7,-15,6,.3);}if(this.zone===1)this.forest();if(this.zone===2)this.crypt();if(this.zone===3)this.tower();if(this.zone===4)this.voidWorld();
    this.boundary();
    for(const def of ZONES[this.zone].objects)this.createObject(def);
    const count=180,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=(this.random()-.5)*54;positions[i*3+1]=this.random()*8;positions[i*3+2]=(this.random()-.5)*54;}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
    this.motes=new THREE.Points(geo,new THREE.PointsMaterial({color:0xa9c9c3,size:.055,transparent:true,opacity:.6,depthWrite:false}));this.scene.add(this.motes);
  }
  material(color:number,emissive=0,roughness=.9){const key=`${color}:${emissive}:${roughness}`;if(!this.mats.has(key))this.mats.set(key,new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:emissive?1.6:0,roughness,metalness:roughness<.5?.6:0}));return this.mats.get(key)!;}
  mesh(g:THREE.BufferGeometry,color:number,x:number,y:number,z:number,parent:THREE.Object3D=this.scene,emissive=0){const o=new THREE.Mesh(g,this.material(color,emissive));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  box(w:number,h:number,d:number,c:number,x:number,y:number,z:number,parent:THREE.Object3D=this.scene){return this.mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z,parent);}
  cylinder(rt:number,rb:number,h:number,c:number,x:number,y:number,z:number,parent:THREE.Object3D=this.scene,n=8){return this.mesh(new THREE.CylinderGeometry(rt,rb,h,n),c,x,y,z,parent);}
  point(c:number,intensity:number,x:number,y:number,z:number,range=12){const l=new THREE.PointLight(c,intensity,range,1.6);l.position.set(x,y,z);this.scene.add(l);return l;}
  private ground(){
    if(this.zone===4)return;
    const g=new THREE.PlaneGeometry(66,66,66,66);g.rotateX(-Math.PI/2);const pos=g.attributes.position;const colors=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,-.15+(this.random()-.5)*.12);const base=new THREE.Color(this.zone===1?0x283e3b:this.zone===2?0x343344:this.zone===4?0x222031:0x30343b);base.multiplyScalar(.65+this.random()*.8);base.toArray(colors,i*3);}
    g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals();const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});const ground=new THREE.Mesh(g,m);ground.receiveShadow=true;this.scene.add(ground);
    if(this.zone===0||this.zone===1){
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([-.12,0,0,0,.45,0,.1,0,0,0,0,-.1,0,.32,0,0,0,.12],3));geo.computeVertexNormals();
      const grass=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:this.zone===1?0x45635a:0x465357,side:THREE.DoubleSide,roughness:1}),5500);const dummy=new THREE.Object3D();
      for(let i=0;i<5500;i++){const x=(this.random()-.5)*59,z=(this.random()-.5)*59;dummy.position.set(x,-.05,z);dummy.rotation.y=this.random()*6.28;dummy.scale.setScalar(.5+this.random()*1.2);if((Math.abs(x-3)<2.4&&z>0)||(this.zone===0&&x>-10&&x<0&&z>-14&&z<3))dummy.scale.setScalar(0);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}this.scene.add(grass);
    }
    for(let i=0;i<64;i++){const z=24-i*.8;const x=this.zone===0?3+Math.sin(z*.08)*2:Math.sin(z*.12)*1.8;const y=elevation(this.zone,x,z);const stone=this.box(3.2+this.random()*.5,.12,.72,0x53525e,x,y-.02,z);stone.rotation.y=(this.random()-.5)*.12;}
  }
  private arch(w:number,h:number){const s=new THREE.Shape();s.moveTo(-w/2,0);s.lineTo(-w/2,h*.62);s.quadraticCurveTo(-w/2,h*.84,0,h);s.quadraticCurveTo(w/2,h*.84,w/2,h*.62);s.lineTo(w/2,0);s.closePath();return s;}
  private window(x:number,y:number,z:number,rot:number,w=1.05,h=3){
    const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rot;this.scene.add(group);
    this.mesh(new THREE.ExtrudeGeometry(this.arch(w+.32,h+.25),{depth:.18,bevelEnabled:false}),palette.trim,0,-.12,-.12,group);
    this.mesh(new THREE.ShapeGeometry(this.arch(w,h)),palette.gold,0,0,.08,group,0x9d5523);
    this.box(.07,h*.72,.08,palette.iron,0,h*.36,.15,group);this.box(w,.07,.08,palette.iron,0,h*.42,.15,group);
    for(const sign of [-1,1]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(sign*w*.46,h*.62,.16),new THREE.Vector3(sign*w*.23,h*.8,.16),new THREE.Vector3(0,h*.95,.16)]);this.mesh(new THREE.TubeGeometry(curve,8,.035,4,false),palette.iron,0,0,0,group);}
  }
  private chapel(){
    const cx=-5.5,cz=-6,buildingStart=this.scene.children.length;
    this.box(9.8,.5,17.2,0x454455,cx,.08,cz);
    this.occluder(this.box(9,5.7,16,palette.stone,cx,2.95,cz));this.collision.add(cx,cz,9.4,16.4);
    for(const x of [-10.25,-.75]){this.box(.4,.28,16.5,palette.trim,x,5.65,cz);for(let i=0;i<5;i++){const z=-12.5+i*3.2;this.box(.7,4.6,.55,0x555362,x,2.35,z);this.box(.95,.2,.85,0x77717b,x,4.75,z);}}
    const roofShape=new THREE.Shape();roofShape.moveTo(-5,0);roofShape.lineTo(0,4.6);roofShape.lineTo(5,0);roofShape.lineTo(-5,0);
    this.occluder(this.mesh(new THREE.ExtrudeGeometry(roofShape,{depth:17,bevelEnabled:false}),palette.roof,cx,5.8,-14.5));
    const tiles=new THREE.InstancedMesh(new THREE.BoxGeometry(.68,.075,.8),this.material(0x454355),600);const dummy=new THREE.Object3D();let n=0;
    for(const sign of [-1,1])for(let r=0;r<12;r++)for(let c=0;c<24;c++){if(n>=600)continue;const t=(r+.5)/12;dummy.position.set(cx+sign*t*5,10.4-t*4.6,-14.2+c*.72);dummy.rotation.z=-sign*Math.atan(4.6/5);dummy.updateMatrix();tiles.setMatrixAt(n++,dummy.matrix);}tiles.count=n;tiles.castShadow=true;this.scene.add(tiles);
    for(let i=0;i<4;i++){const z=-11.5+i*3.7;this.window(-.94,1.4,z,Math.PI/2);this.window(-10.06,1.4,z,-Math.PI/2);}
    this.window(-8,1.2,2.04,0,.9,3.2);this.window(-3,1.2,2.04,0,.9,3.2);
    this.mesh(new THREE.ExtrudeGeometry(this.arch(2.5,4.4),{depth:.25,bevelEnabled:false}),palette.trim,-5.5,.25,2.1);
    this.mesh(new THREE.ShapeGeometry(this.arch(2.05,4.05)),0x211b23,-5.5,.3,2.38);
    for(let i=0;i<9;i++)this.box(.035,3.1,.05,0x5e4c46,-6.45+i*.24,1.9,2.41);
    this.box(2,.08,.08,palette.gold,-5.5,1.8,2.45);
    for(let i=0;i<4;i++)this.box(4.2-i*.25,.16,1.2,0x6b6268,-5.5,.05+i*.13,4-i*.55);
    // A separate, volumetric belfry breaks the roofline.
    this.box(3.5,10.8,3.8,0x454552,-5.5,5.5,-10.5);this.box(4,.35,4.2,palette.trim,-5.5,10.7,-10.5);
    this.window(-5.5,7.5,-8.56,0,1.3,2.5);
    this.mesh(new THREE.ConeGeometry(3.1,5.6,4),0x2c3042,-5.5,13.6,-10.5).rotation.y=Math.PI/4;
    this.box(.16,1.8,.16,palette.trim,-5.5,17,-10.5);this.box(.9,.12,.12,palette.trim,-5.5,17.35,-10.5);
    this.point(palette.gold,28,1.2,3,-4,17);this.point(palette.gold,17,-5,2.4,4,12);
    const masonry=new THREE.InstancedMesh(new THREE.BoxGeometry(.65,.2,.08),this.material(0x66606b),500);let k=0;
    for(let row=0;row<22;row++)for(let col=0;col<22;col++){if(k>=500)break;dummy.position.set(-.93,.5+row*.24,-13.6+col*.72+(row%2)*.3);dummy.rotation.y=Math.PI/2;dummy.scale.setScalar(.65+this.random()*.35);dummy.updateMatrix();masonry.setMatrixAt(k++,dummy.matrix);}masonry.count=k;this.scene.add(masonry);
    for(const object of this.scene.children.slice(buildingStart))if(object instanceof THREE.Mesh)this.occluder(object,'chapel');
    this.tree(-16,-12,1.6);this.tree(18,17,1.1);this.tree(-21,2,.9);
    for(let i=0;i<19;i++){const x=-4-(i%5)*3.1,z=6+Math.floor(i/5)*2.7;if(Math.hypot(x+8,z-15)<2)continue;this.grave(x,z,.7+this.random()*.4);}
    this.fence(-19,17,16,'x');this.fence(4,17,14,'x');this.fence(-21,7,20,'z');
    for(const [x,z]of [[-19,17],[-2,17],[5,17],[18,17],[7,-13]])this.lantern(x,z);
    // Orin's forge, anvil, fuel and a small timber roof.
    this.box(5,.2,4.3,0x45414d,12,.08,10);for(const x of [9.8,14.2])for(const z of [8.2,11.8])this.box(.18,3,.18,0x66514a,x,1.5,z);
    const forgeRoof=this.box(5.5,.18,4.8,0x34313b,12,3.1,10);forgeRoof.rotation.z=.06;this.occluder(forgeRoof);
    this.box(1.2,.8,1,0x62616c,11,.65,9);this.box(1.7,.22,.7,0x96909b,11,1.17,9);
    this.cylinder(.65,.8,.65,0x332d39,14,.4,8.3);this.mesh(new THREE.IcosahedronGeometry(.45),0xff8c42,14,.9,8.3,this.scene,0xff6a20);this.point(0xff8c42,25,14,1.5,8.3,10);
    for(const x of [3.8,10.2]){this.box(.8,4,.8,0x5b5868,x,2,-15);this.mesh(new THREE.ConeGeometry(.7,1,4),palette.trim,x,4.4,-15);}
  }
  private grave(x:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=(this.random()-.5)*.35;g.scale.setScalar(scale);this.scene.add(g);this.box(1.05,.15,.75,0x55515c,0,.05,0,g);this.box(.68,1.1,.25,0x77717b,0,.62,0,g);this.cylinder(.34,.34,.24,0x77717b,0,1.15,0,g,12).rotation.x=Math.PI/2;this.box(.045,.42,.035,0xb5aaa7,0,.82,.14,g);this.box(.3,.045,.035,0xb5aaa7,0,.88,.14,g);}
  private tree(x:number,z:number,s=1,ghost=false){
    const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);this.scene.add(g);
    this.cylinder(.22,.65,5.4,0x51464d,0,2.6,0,g,7).rotation.z=.1;
    for(let i=0;i<7;i++){const a=i*2.4,branch=this.cylinder(.06,.25,3,0x51464d,Math.cos(a),4+i*.18,Math.sin(a),g,5);branch.rotation.z=Math.cos(a)*.7;branch.rotation.x=Math.sin(a)*.7;}
    const crown=new THREE.Group();crown.userData.cartographyHidden=true;g.add(crown);this.leaves.push(crown);
    for(let i=0;i<18;i++){const a=i*2.4;const leaf=this.mesh(new THREE.IcosahedronGeometry(.8+this.random()*.7,1),ghost?0x43665b:0x374b43,Math.cos(a)*1.9,5.1+this.random()*2,Math.sin(a)*1.7,crown);leaf.scale.y=.8;this.occluder(leaf);}
    for(let i=0;i<4;i++){const root=this.cylinder(.08,.23,2.4,0x51464d,Math.sin(i*1.57),.25,Math.cos(i*1.57),g,5);root.rotation.z=Math.cos(i*1.57)*1.25;root.rotation.x=Math.sin(i*1.57)*1.25;}
    this.collision.add(x,z,.9*s,.9*s);
  }
  private forest(){
    for(let i=0;i<50;i++){const x=(this.random()-.5)*49,z=(this.random()-.5)*51;if(Math.abs(x)<4||ZONES[1].objects.some(o=>Math.hypot(o.x-x,o.z-z)<2.8))continue;this.tree(x,z,.8+this.random()*.65,true);}
    for(let i=0;i<40;i++){const x=(this.random()-.5)*45,z=(this.random()-.5)*50;if(Math.abs(x)<3)continue;this.cylinder(.04,.06,.3,0x708a86,x,.12,z);this.mesh(new THREE.SphereGeometry(.22,6,4,0,Math.PI*2,0,Math.PI/2),0xa9c9c3,x,.34,z,this.scene,0x4c8078);}
    for(const [x,z]of [[-9,5],[8,0],[-6,-9]])this.point(0xa9c9c3,14,x,2,z,12);
    this.ruin(15,-10);this.ruin(-16,-16);
  }
  private ruin(x:number,z:number){for(let i=0;i<5;i++){this.box(1,1.5+this.random()*3,1.1,0x575568,x+i*1.1,1,z);this.collision.add(x+i*1.1,z,1,1);}this.box(5.6,.4,1.2,0x6a6474,x+2,3.1,z).rotation.z=.08;}
  private crypt(){
    this.box(40,.15,52,0x41404e,0,-.02,0);
    for(let z=-24;z<25;z+=3)for(let x=-18;x<19;x+=3){this.box(2.88,.06,2.88,(x+z)%2?0x494654:0x3b3948,x,.08,z);}
    for(const x of [-20,20]){this.box(1,5,53,0x3c394b,x,2.5,0);this.collision.add(x,0,1,53);}
    for(const z of [-14,-3,8])for(const x of [-15,15]){this.box(7,3.2,1.2,0x4c4659,x,1.6,z);this.collision.add(x,z,7,1.2);}
    for(const z of [-20,-8,3,14])for(const x of [-7,7]){this.cylinder(.42,.58,5.7,0x615b6c,x,2.8,z);this.box(1.3,.3,1.3,0x8c8291,x,5.8,z);this.collision.add(x,z,1,1);}
    for(let i=0;i<12;i++){const x=i%2?-17:17,z=19-Math.floor(i/2)*7;this.box(1.6,.8,2.3,0x67616f,x,.4,z);this.box(1.8,.2,2.5,0x8a7d86,x,.9,z);this.collision.add(x,z,1.8,2.5);}
    for(const z of [-18,-5,8,18]){this.point(0xa9c9c3,18,0,3,z,12);this.mesh(new THREE.OctahedronGeometry(.25),0xa9c9c3,0,3,z,this.scene,0x7ca9a2);}
  }
  private tower(){
    for(let i=0;i<64;i++){const z=25.2-i*.8,y=elevation(3,0,z);this.box(33,.4,.81,0x494454,0,y-.15,z);}
    for(const x of [-17,17])for(let z=-24;z<25;z+=6){const y=elevation(3,x,z);this.box(1,7,1,0x514b5e,x,y+3.4,z);this.box(1.5,.3,1.5,0x81788b,x,y+7,z);this.collision.add(x,z,1.2,1.2);}
    for(const x of [-18,18])this.box(.5,11,51,0x2b2b3c,x,3,0);
    const bell=new THREE.Group();bell.position.set(0,10,-18);this.scene.add(bell);
    this.cylinder(1.1,2.7,3.8,0x998275,0,0,0,bell,18);this.mesh(new THREE.TorusGeometry(2.6,.17,6,32),0xb3997b,0,-1.9,0,bell).rotation.x=Math.PI/2;
    this.cylinder(.12,.2,4,0xc1a788,0,-1.3,0,bell);this.mesh(new THREE.SphereGeometry(.4,10,8),0xc1a788,0,-3.4,0,bell);
    for(const x of [-5,5])this.box(.7,14,.7,0x71616a,x,8,-18);this.box(11,.7,.7,0x71616a,0,14,-18);
    for(const z of [15,1,-12]){this.point(0xe2a765,25,0,5,z,15);this.lantern(15,z);this.lantern(-15,z);}
  }
  private voidWorld(){
    const floor=this.cylinder(23,23.5,.8,0x343044,0,-.6,0,this.scene,12);floor.receiveShadow=true;
    this.box(6,.5,8,0x3c354d,0,-.25,22);
    for(let i=0;i<65;i++){const a=this.random()*Math.PI*2,r=23+this.random()*13;const o=this.box(1+this.random()*4,.4+this.random()*2,1+this.random()*4,0x4a405e,Math.sin(a)*r,-4+this.random()*12,Math.cos(a)*r);o.rotation.set(this.random()*.7,this.random()*6,this.random()*.4);}
    for(const x of [-13,13])for(const z of [-15,0,15]){this.cylinder(.55,.85,7,0x655771,x,3.4,z);this.mesh(new THREE.OctahedronGeometry(.6),0xd7d6db,x,7.5,z,this.scene,0x68577b);this.collision.add(x,z,1.1,1.1);}
    this.point(0xbc9bc9,45,0,7,-8,35);
    for(let i=0;i<3;i++){const ring=this.mesh(new THREE.TorusGeometry(5+i*.65,.06,5,80),i===1?0xe2a765:0x8b7c9c,0,.04,-10);ring.rotation.x=Math.PI/2;}
  }
  private fence(x:number,z:number,length:number,axis:'x'|'z'){
    for(let i=0;i<=length;i++){const a=axis==='x'?x+i:x,b=axis==='z'?z+i:z;this.cylinder(.035,.045,1.6,palette.iron,a,.85,b);this.mesh(new THREE.ConeGeometry(.09,.25,4),0x898197,a,1.75,b);}
    for(const y of [.45,1.25]){this.box(axis==='x'?length:.06,.06,axis==='z'?length:.06,palette.iron,x+(axis==='x'?length/2:0),y,z+(axis==='z'?length/2:0));}
    this.collision.add(x+(axis==='x'?length/2:0),z+(axis==='z'?length/2:0),axis==='x'?length:.12,axis==='z'?length:.12);
  }
  private lantern(x:number,z:number){const y=elevation(this.zone,x,z);this.cylinder(.055,.1,2.3,palette.iron,x,y+1.15,z);this.box(.4,.5,.4,0xe2a765,x,y+2.4,z);this.mesh(new THREE.ConeGeometry(.4,.3,4),palette.iron,x,y+2.8,z).rotation.y=Math.PI/4;}
  private boundary(){for(let i=0;i<50;i++){const side=i%4;const x=side<2?(side===0?-27:27):(this.random()-.5)*54;const z=side>1?(side===2?-28:28):(this.random()-.5)*56;if(Math.abs(x)<3)continue;const rock=this.mesh(new THREE.DodecahedronGeometry(1+this.random()*2,0),0x494454,x,.3,z);rock.scale.set(1,.6+this.random(),1);}}
  private createObject(def:InteractDef){
    const g=new THREE.Group(),y=elevation(this.zone,def.x,def.z);g.position.set(def.x,y,def.z);this.scene.add(g);
    const marker=this.mesh(new THREE.TorusGeometry(.65,.025,4,32),0xa9c9c3,0,.08,0,g,0x547e76);marker.rotation.x=Math.PI/2;
    let actor:Actor|undefined;
    if(def.kind==='npc'){
      actor=new Actor(def.data==='orin'?0x676271:def.data==='miro'?0xa9c9c3:0xa6b9b4,def.data==='edda',def.data);g.add(actor.root);this.npcs.push(actor);
      if(def.data==='edda')this.mesh(new THREE.OctahedronGeometry(.18),0xa9c9c3,-.8,1.6,.1,g,0x81aaa1);
    } else if(def.kind==='chest'){
      this.box(1.5,.7,.9,0x685251,0,.4,0,g);this.box(1.6,.18,1,0x9e8272,0,.85,0,g);for(const x of [-.5,.5])this.box(.1,.8,1.02,0xb09b7d,x,.45,0,g);this.box(.2,.25,.05,0xe2a765,0,.55,.48,g);
      this.mesh(new THREE.CylinderGeometry(.48,.48,1.5,14,1,false,0,Math.PI),0x6b4431,0,.78,0,g).rotation.z=Math.PI/2;
      for(const x of [-.68,.68])for(const z of [-.4,.4])this.mesh(new THREE.SphereGeometry(.045,6,4),0xd6b582,x,.63,z,g);
    } else if(def.kind==='checkpoint'){
      this.cylinder(.6,.9,.5,palette.stone,0,.25,0,g);this.mesh(new THREE.OctahedronGeometry(.48,0),palette.teal,0,1.4,0,g,0x6a9b92);this.glows.push(g.children[g.children.length-1] as THREE.Mesh);this.point(0xa9c9c3,18,def.x,y+1.5,def.z,9);
      for(let i=0;i<3;i++)this.mesh(new THREE.TorusGeometry(.6+i*.2,.018,4,40),palette.teal,0,.5+i*.22,0,g).rotation.x=Math.PI/2;
    } else if(def.kind==='resource'){
      for(let i=0;i<5;i++){const rock=this.mesh(new THREE.IcosahedronGeometry(.5,0),def.data==='resin'?0x64775c:0x5f5d72,Math.sin(i)*.5,.3+this.random()*.3,Math.cos(i)*.4,g);rock.scale.y=.7;}
      this.mesh(new THREE.OctahedronGeometry(.25),def.data==='core'?0xe2a765:0xa9c9c3,0,.65,0,g,def.data==='core'?0x8b4e28:0x446d65);
      if(def.data==='iron')for(let i=0;i<9;i++){const a=i*2.4;const vein=this.cylinder(.07,.11,.45+this.random()*.35,0xb7bcc7,Math.sin(a)*.47,.65+this.random()*.2,Math.cos(a)*.37,g,5);vein.rotation.set(Math.sin(a)*.5,0,Math.cos(a)*.5);}
    } else if(def.kind==='stele'||def.kind==='plate'||def.kind==='grave'||def.kind==='lore'){
      this.box(1.15,.2,.85,0x555265,0,.1,0,g);this.box(.8,1.5,.3,0x827789,0,.9,0,g);
      this.mesh(new THREE.TorusGeometry(.23,.035,4,def.kind==='stele'?3:4),palette.teal,0,1.15,.17,g,0x7ca59d);
    } else if(def.kind==='gate'){
      for(let i=0;i<9;i++)this.box(.07,3.8,.08,0x8ca29e,-2.5+i*.625,1.9,0,g);
      this.box(5,.1,.1,0xb5c5bd,0,2,0,g);marker.scale.setScalar(2.3);
    } else if(def.kind==='exit'||def.kind==='return'||def.kind==='ending'){
      this.mesh(new THREE.TorusGeometry(1.5,.14,6,48),0x6b657e,0,1.65,0,g);const ring=this.mesh(new THREE.TorusGeometry(1.3,.035,4,48),palette.teal,0,1.65,0,g,0x6e9c95);this.glows.push(ring);
    } else if(def.kind==='mechanism'){
      for(let i=0;i<3;i++)this.mesh(new THREE.TorusGeometry(.6,.14,6,12),0xb7a186,i*.7-.7,1+i*.3,0,g).rotation.y=.3;
      this.box(3,.6,1.5,palette.stone,0,.3,0,g);
    } else if(def.kind==='part'){
      const gear=this.mesh(new THREE.TorusGeometry(.45,.16,4,8),0xc2ac82,0,.9,0,g);this.glows.push(gear);
    } else {
      this.cylinder(.12,.2,.7,palette.stone,0,.35,0,g);
      const shard=this.mesh(new THREE.OctahedronGeometry(.3),def.kind==='ember'?0xff8c42:0xe2cba6,0,1.2,0,g,def.kind==='ember'?0xb75e28:0xb29d6c);this.glows.push(shard);
    }
    let hint:THREE.Group|undefined;
    if(def.hidden){hint=new THREE.Group();hint.position.set(def.x,y,def.z);this.scene.add(hint);for(let i=0;i<3;i++)this.mesh(new THREE.OctahedronGeometry(.055),0x789e97,Math.sin(i*2.1)*.3,.45+i*.22,Math.cos(i*2.1)*.3,hint,0x446b67);}
    this.objects.push({def,group:g,marker,actor,hint});
  }
  update(time:number,dt:number,s:SaveState){
    if(this.zone===0&&s.flags.gate)this.collision.boxes=this.collision.boxes.filter(b=>!(b.x===7&&b.z===-15&&b.w===6));
    for(const o of this.objects){const d=o.def;
      const collected=['ash','part','ember','song'].includes(d.kind)&&s.discovered.includes(d.id);
      const hidden=!!d.hidden&&!s.discovered.includes(`reveal:${d.id}`)&&!s.discovered.includes(d.id);
      o.group.visible=!collected&&!hidden;
      if(o.hint){o.hint.visible=hidden&&!collected;o.hint.rotation.y=time*.4;}
      if(d.kind==='gate')o.group.visible=!s.flags.gate;
      if(d.kind==='ending')o.group.visible=s.defeated.includes('boss4');
      if(d.kind==='chest'){o.group.rotation.z=s.opened.includes(d.id)?-.08:0;o.marker.visible=!s.opened.includes(d.id);}
      if(d.kind==='resource'){const ready=(s.resources[d.id]??0)<=s.activeTime;o.marker.visible=ready;o.group.scale.setScalar(ready?1:.65);}
      if(d.kind==='stele'||d.kind==='plate'){const key=d.kind==='stele'?'voices':'names';o.marker.visible=!!s.flags[key]||Number(d.data)<(s.puzzle[key]??0);}
      if(d.kind==='exit')o.marker.visible=s.defeated.includes(`boss${s.zone}`);
      if(o.actor){const near=Math.hypot(s.x-d.x,s.z-d.z)<4;o.actor.facing=near?Math.atan2(s.x-d.x,s.z-d.z):.3;o.actor.update(dt,time,d.data==='orin'&&!near?'attack':'idle',(Math.sin(time*2)+1)/2);}
      o.marker.rotation.z=time*.15;
    }
    for(const m of this.glows){m.rotation.y=time*.45;m.position.y+=Math.sin(time*2)*dt*.06;}
    if(!s.settings.reduced){this.motes.rotation.y=time*.008;this.motes.position.y=Math.sin(time*.2)*.4;this.leaves.forEach((g,i)=>{g.rotation.z=Math.sin(time*.65+i)*.012;});}
  }
  private occluder(mesh:THREE.Mesh,group?:string){if(group)mesh.userData.occlusionGroup=group;if(this.occluders.includes(mesh))return;mesh.material=(mesh.material as THREE.MeshStandardMaterial).clone();const material=mesh.material as THREE.MeshStandardMaterial;material.transparent=true;this.occluders.push(mesh);}
  updateVisibility(camera:THREE.Camera,player:THREE.Vector3,dt:number,characters:THREE.Vector3[]=[]){
    const fade=new Set<THREE.Object3D>(),fadeGroups=new Set<string>(),targets=[player.clone().add(new THREE.Vector3(0,1.6,0)),...characters,...this.objects.filter(o=>(o.group.visible||o.hint?.visible)&&Math.hypot(o.def.x-player.x,o.def.z-player.z)<10).map(o=>o.group.position.clone().add(new THREE.Vector3(0,1,0)))];
    this.scene.updateMatrixWorld(true);
    for(const target of targets){this.rayDirection.subVectors(target,camera.position);const length=this.rayDirection.length();this.visibilityRay.set(camera.position,this.rayDirection.normalize());this.visibilityRay.far=length-.3;for(const hit of this.visibilityRay.intersectObjects(this.occluders,false)){fade.add(hit.object);if(hit.object.userData.occlusionGroup)fadeGroups.add(hit.object.userData.occlusionGroup);}}
    for(const mesh of this.occluders){const m=mesh.material as THREE.MeshStandardMaterial;const opacity=fade.has(mesh)||fadeGroups.has(mesh.userData.occlusionGroup)?.12:1;m.opacity=THREE.MathUtils.lerp(m.opacity,opacity,Math.min(1,dt*12));m.depthWrite=m.opacity>.9;}
  }
  dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();this.scene.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Points){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}if(o instanceof THREE.DirectionalLight)o.shadow.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());this.scene.clear();}
}
