import * as THREE from 'three';
export type ActorMotion='idle'|'walk'|'run'|'attack'|'cast'|'dodge'|'hurt'|'dead'|'interact'|'victory';
const mat=(color:number,emissive=0)=>new THREE.MeshStandardMaterial({color,roughness:.85,metalness:.1,emissive,emissiveIntensity:.65});
function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export class Actor {
  root=new THREE.Group();body=new THREE.Group();left=new THREE.Group();right=new THREE.Group();halo:THREE.Mesh;robe:THREE.Mesh;blade:THREE.Mesh;eyes:THREE.Mesh;ornaments=new THREE.Group();
  motion:ActorMotion='idle';facing=0;phase=0;
  constructor(color=0xd7d6db,halo=true,kind='nema'){
    this.root.userData.cartographyHidden=true;
    this.root.add(this.body);const cloth=mat(color,kind==='nema'?0x30353a:0),dark=mat(0x353443),silver=mat(0xb2b6bc),glow=mat(0xe2a765,0xe2a765);
    this.robe=mesh(new THREE.CylinderGeometry(.22,.62,1.65,12,1,true),cloth,this.body,0,.85);
    mesh(new THREE.CylinderGeometry(.27,.43,.85,8),cloth,this.body,0,1.75);
    mesh(new THREE.SphereGeometry(.27,10,8),dark,this.body,0,2.38);
    this.eyes=mesh(new THREE.BoxGeometry(.33,.06,.08),glow,this.body,0,2.4,.24);
    this.halo=mesh(new THREE.TorusGeometry(.74,.075,6,40),silver,this.body,0,2.92);this.halo.rotation.x=Math.PI/2;this.halo.visible=halo;
    if(halo){mesh(new THREE.TorusGeometry(.55,.025,4,32),glow,this.body,0,2.91).rotation.x=Math.PI/2;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;mesh(new THREE.BoxGeometry(.035,.16,.035),silver,this.body,Math.cos(a)*.72,2.92,Math.sin(a)*.72);}}
    this.left.position.set(-.38,2,0);this.right.position.set(.38,2,0);this.body.add(this.left,this.right);
    for(const arm of [this.left,this.right]){mesh(new THREE.CylinderGeometry(.09,.06,.65,6),cloth,arm,0,-.3);mesh(new THREE.CylinderGeometry(.06,.045,.6,6),silver,arm,0,-.87,.05);mesh(new THREE.SphereGeometry(.085,6,5),silver,arm,0,-1.17,.05);}
    this.blade=mesh(new THREE.BoxGeometry(.07,1.65,.045),glow,this.right,.05,-1.3,.58);this.blade.rotation.x=-1.25;
    mesh(new THREE.BoxGeometry(.38,.06,.08),silver,this.right,.05,-1.03,.1);
    for(let i=0;i<7;i++){const shard=mesh(new THREE.OctahedronGeometry(.045,0),i%2?glow:silver,this.ornaments);shard.position.set(Math.sin(i)*.9,.5+i*.3,Math.cos(i)*.9);}
    this.body.add(this.ornaments);
    // Metal seams, hanging cloth panels and a readable bright silhouette.
    const trim=mat(0xc3b7a0,kind==='nema'?0x1f2526:0),lining=mat(0x494b60);
    mesh(new THREE.TorusGeometry(.34,.035,5,20),trim,this.body,0,1.55).rotation.x=Math.PI/2;
    mesh(new THREE.OctahedronGeometry(.095),glow,this.body,0,1.87,.33);
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const panel=mesh(new THREE.BoxGeometry(.17,.32,.035),i%3===0?trim:cloth,this.body,Math.sin(a)*.53,.25+Math.sin(i*2)*.04,Math.cos(a)*.53);panel.rotation.y=a;panel.rotation.z=Math.sin(a)*.07;}
    for(const side of [-1,1]){mesh(new THREE.SphereGeometry(.19,10,6),silver,this.body,side*.36,2.02,0).scale.set(1,.48,1);mesh(new THREE.BoxGeometry(.16,.26,.32),lining,this.body,side*.18,.05,.1);}
    mesh(new THREE.BoxGeometry(.14,.025,.32),silver,this.body,0,2.45,.11);
    if(kind==='orin'){this.body.scale.set(1.4,1.25,1.4);this.halo.visible=false;this.blade.geometry.dispose();this.blade.geometry=new THREE.BoxGeometry(.4,.45,.5);}
    if(kind==='miro'){this.root.scale.setScalar(.52);this.blade.visible=false;this.robe.material=mat(0xa9c9c3,0x659991);}
    if(kind==='crow'){this.root.scale.set(.7,.5,.9);this.halo.visible=false;this.blade.visible=false;mesh(new THREE.BoxGeometry(2.5,.1,.6),dark,this.body,0,1.8);}
    if(kind==='guard'){this.body.scale.set(1.35,1.2,1.35);this.halo.visible=false;mesh(new THREE.BoxGeometry(.9,.8,.3),dark,this.body,0,1.8,.25);}
  }
  update(dt:number,time:number,motion:ActorMotion=this.motion,intensity=1){
    this.motion=motion;this.phase+=dt;const walk=motion==='walk'||motion==='run';const speed=motion==='run'?11:7;const cycle=Math.sin(time*speed);
    this.root.rotation.y=THREE.MathUtils.lerp(this.root.rotation.y,this.root.rotation.y+Math.atan2(Math.sin(this.facing-this.root.rotation.y),Math.cos(this.facing-this.root.rotation.y)),Math.min(1,dt*16));
    this.body.position.y=Math.sin(time*2)*.045+(walk?Math.abs(cycle)*.06:0);
    this.body.rotation.x=walk?.06:0;this.body.rotation.z=walk?cycle*.025:0;
    this.left.rotation.x=walk?cycle*.35:Math.sin(time*1.6)*.06;this.right.rotation.x=walk?-cycle*.3:0;this.right.rotation.z=-.12;this.left.rotation.z=.12;
    this.robe.rotation.x=walk?cycle*.075:.015*Math.sin(time);this.halo.position.y=2.92+Math.sin(time*1.9)*.07;this.halo.rotation.z=time*.08;this.ornaments.rotation.y=time*.3;
    if(motion==='attack'){this.right.rotation.x=-1.5+Math.sin(intensity*Math.PI)*2.4;this.right.rotation.z=-.8+intensity*1.5;this.body.rotation.y=-.5+intensity;}
    else this.body.rotation.y=THREE.MathUtils.lerp(this.body.rotation.y,0,dt*12);
    if(motion==='cast'||motion==='victory'){this.left.rotation.z=1.1;this.right.rotation.z=-1.1;this.left.rotation.x=-1;this.right.rotation.x=-1;}
    if(motion==='interact')this.left.rotation.x=-1.2;
    if(motion==='dodge'){this.body.rotation.x=.7;this.body.position.y=-.25;}
    if(motion==='hurt'){this.body.rotation.z=.15*Math.sin(time*50);this.body.rotation.x=-.25;}
    if(motion==='dead'){this.body.rotation.x=Math.PI*.42;this.body.position.y=-.8;}
  }
  setEquipment(armor:string,upgrade:number){
    (this.robe.material as THREE.MeshStandardMaterial).color.setHex(armor==='vestment'?0xb4b5ce:armor==='mail'?0x6d7e86:0xd7d6db);
    (this.blade.material as THREE.MeshStandardMaterial).emissiveIntensity=.65+upgrade*.18;
  }
}
