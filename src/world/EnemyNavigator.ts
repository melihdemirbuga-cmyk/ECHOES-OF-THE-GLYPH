import type {CollisionWorld} from './CollisionWorld';
import {findPath,nearestWalkable,walkableLine,type Waypoint} from './Navigation';

/** Cached navigation shared by chase, retreat and returning to the group's home. */
export class EnemyNavigator {
  private path:Waypoint[]=[];private remaining=0;private goal:Waypoint={x:Infinity,z:Infinity};
  constructor(private world:CollisionWorld,private radius=.5){}
  reset(){this.path=[];this.remaining=0;this.goal={x:Infinity,z:Infinity};}
  direction(position:Waypoint,target:Waypoint,dt:number):Waypoint{
    this.remaining-=dt;
    if(this.world.blocked(position.x,position.z,this.radius)){const safe=nearestWalkable(this.world,position,this.radius+.03);position.x=safe.x;position.z=safe.z;this.reset();}
    if(walkableLine(this.world,position,target,this.radius)){this.path=[];return this.toward(position,target);}
    if(this.remaining<=0||Math.hypot(target.x-this.goal.x,target.z-this.goal.z)>2){this.path=findPath(this.world,position,target,this.radius);this.goal={...target};this.remaining=.65;}
    while(this.path.length&&Math.hypot(this.path[0].x-position.x,this.path[0].z-position.z)<.18)this.path.shift();
    return this.path.length?this.toward(position,this.path[0]):{x:0,z:0};
  }
  private toward(a:Waypoint,b:Waypoint){const x=b.x-a.x,z=b.z-a.z,n=Math.hypot(x,z);return n>.1?{x:x/n,z:z/n}:{x:0,z:0};}
}
