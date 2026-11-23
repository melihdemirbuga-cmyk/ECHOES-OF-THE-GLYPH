import * as THREE from 'three';
interface Ring {mesh:THREE.Mesh;age:number;life:number;size:number;}
export class Effects {
  private rings:Ring[]=[];private particles:THREE.Points;private positions=new Float32Array(900);private colors=new Float32Array(900);private velocity=new Float32Array(900);private life=new Float32Array(300);private cursor=0;
  constructor(private scene:THREE.Scene){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(this.positions,3));geo.setAttribute('color',new THREE.BufferAttribute(this.colors,3));this.particles=new THREE.Points(geo,new THREE.PointsMaterial({vertexColors:true,size:.12,transparent:true,opacity:.9,depthWrite:false}));scene.add(this.particles);}
  burst(x:number,y:number,z:number,color:number,count=18){const c=new THREE.Color(color);for(let k=0;k<count;k++){const i=this.cursor++%300;this.life[i]=.4+Math.random()*.5;this.positions.set([x,y,z],i*3);c.toArray(this.colors,i*3);this.velocity.set([(Math.random()-.5)*5,1+Math.random()*3,(Math.random()-.5)*5],i*3);}}
  ring(x:number,y:number,z:number,color:number,size:number,life=.6,arc=Math.PI*2,facing=0){const mesh=new THREE.Mesh(new THREE.TorusGeometry(1,.025,4,64,arc),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.rotation.z=-facing-arc/2+Math.PI/2;mesh.position.set(x,y+.1,z);this.scene.add(mesh);this.rings.push({mesh,age:0,life,size});}
  update(dt:number){for(const r of this.rings){r.age+=dt;const t=r.age/r.life;r.mesh.scale.setScalar(Math.max(.01,r.size*Math.min(1,t*2)));(r.mesh.material as THREE.MeshBasicMaterial).opacity=1-t;if(t>=1){this.scene.remove(r.mesh);r.mesh.geometry.dispose();(r.mesh.material as THREE.Material).dispose();}}
    this.rings=this.rings.filter(r=>r.age<r.life);for(let i=0;i<300;i++){if(this.life[i]>0){this.life[i]-=dt;this.velocity[i*3+1]-=dt*4;for(let j=0;j<3;j++)this.positions[i*3+j]+=this.velocity[i*3+j]*dt;}else this.positions[i*3+1]=-50;}
    this.particles.geometry.attributes.position.needsUpdate=true;this.particles.geometry.attributes.color.needsUpdate=true;
  }
}
