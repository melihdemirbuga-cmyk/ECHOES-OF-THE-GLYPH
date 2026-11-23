import type {CollisionWorld} from './CollisionWorld';
export interface Waypoint {x:number;z:number;}
const STEP=.5, SIZE=113, ORIGIN=28;
class Heap {
  entries:{id:number;score:number}[]=[];
  push(id:number,score:number){const a=this.entries;a.push({id,score});let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p].score<=score)break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
  pop(){const a=this.entries,first=a[0],last=a.pop()!;if(a.length){a[0]=last;let i=0;while(true){let n=i,l=i*2+1,r=l+1;if(l<a.length&&a[l].score<a[n].score)n=l;if(r<a.length&&a[r].score<a[n].score)n=r;if(n===i)break;[a[n],a[i]]=[a[i],a[n]];i=n;}}return first.id;}
}
export function walkableLine(world:CollisionWorld,a:Waypoint,b:Waypoint,r=.38){const d=Math.hypot(b.x-a.x,b.z-a.z),count=Math.max(1,Math.ceil(d/.2));for(let i=0;i<=count;i++)if(world.blocked(a.x+(b.x-a.x)*i/count,a.z+(b.z-a.z)*i/count,r))return false;return true;}
export function nearestWalkable(world:CollisionWorld,point:Waypoint,r=.5):Waypoint{
  if(!world.blocked(point.x,point.z,r))return {...point};
  for(let radius=.25;radius<=8;radius+=.25)for(let n=0;n<32;n++){const p={x:point.x+Math.sin(n*Math.PI/16)*radius,z:point.z+Math.cos(n*Math.PI/16)*radius};if(!world.blocked(p.x,p.z,r))return p;}
  throw new Error(`Kein freier Spawn bei ${point.x}, ${point.z}`);
}
export function findPath(world:CollisionWorld,start:Waypoint,target:Waypoint,r=.38):Waypoint[]{
  const clearance=Math.max(.46,r+.08),visible=(a:Waypoint,b:Waypoint)=>walkableLine(world,a,b,r);
  const snap=(p:Waypoint)=>({x:Math.round(Math.max(-25,Math.min(25,p.x))*2)/2,z:Math.round(Math.max(-25.5,Math.min(25.5,p.z))*2)/2});
  let a=snap(start),b=snap(target);
  if(world.blocked(a.x,a.z,clearance)){const starts:Waypoint[]=[];for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++){const p={x:a.x+x*STEP,z:a.z+z*STEP};if(!world.blocked(p.x,p.z,clearance)&&visible(start,p))starts.push(p);}starts.sort((p,q)=>Math.hypot(p.x-start.x,p.z-start.z)-Math.hypot(q.x-start.x,q.z-start.z));if(!starts.length)return [];a=starts[0];}
  if(world.blocked(b.x,b.z,clearance)){
    const candidates:Waypoint[]=[];for(let radius=.5;radius<=7;radius+=.5){for(let i=0;i<32;i++){const p=snap({x:target.x+Math.sin(i*Math.PI/16)*radius,z:target.z+Math.cos(i*Math.PI/16)*radius});if(!world.blocked(p.x,p.z,clearance))candidates.push(p);}if(candidates.length)break;}
    if(!candidates.length)return [];candidates.sort((p,q)=>Math.hypot(p.x-target.x,p.z-target.z)+Math.hypot(p.x-start.x,p.z-start.z)*.1-Math.hypot(q.x-target.x,q.z-target.z)-Math.hypot(q.x-start.x,q.z-start.z)*.1);b=candidates[0];
  }
  if(visible(start,b))return [b];
  const id=(p:Waypoint)=>Math.round((p.z+ORIGIN)/STEP)*SIZE+Math.round((p.x+ORIGIN)/STEP);
  const position=(n:number)=>({x:(n%SIZE)*STEP-ORIGIN,z:Math.floor(n/SIZE)*STEP-ORIGIN});
  const first=id(a),goal=id(b),length=SIZE*SIZE,previous=new Int32Array(length).fill(-1),cost=new Float32Array(length).fill(Infinity),closed=new Uint8Array(length),open=new Heap();
  cost[first]=0;open.push(first,0);let found=false;
  while(open.entries.length){const cur=open.pop();if(closed[cur])continue;closed[cur]=1;if(cur===goal){found=true;break;}const p=position(cur);
    for(const [dx,dz]of [[0,1],[1,0],[0,-1],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const next={x:p.x+dx*STEP,z:p.z+dz*STEP};if(world.blocked(next.x,next.z,clearance)||(dx&&dz&&(world.blocked(p.x+dx*STEP,p.z,clearance)||world.blocked(p.x,p.z+dz*STEP,clearance))))continue;
      const n=id(next);if(n<0||n>=length||closed[n])continue;const c=cost[cur]+(dx&&dz?Math.SQRT2:1);if(c<cost[n]){cost[n]=c;previous[n]=cur;open.push(n,c+Math.hypot(next.x-b.x,next.z-b.z)/STEP);}
    }
  }
  if(!found)return [];
  const raw:Waypoint[]=[];for(let n=goal;n!==first;n=previous[n]){if(n<0)return [];raw.push(position(n));}raw.reverse();
  const result:Waypoint[]=[];let anchor=start,index=0;
  while(index<raw.length){let far=index;while(far+1<raw.length&&visible(anchor,raw[far+1]))far++;result.push(raw[far]);anchor=raw[far];index=far+1;}
  return result;
}
