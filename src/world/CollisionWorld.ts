export interface Box { x:number;z:number;w:number;d:number; }
export class CollisionWorld {
  boxes:Box[]=[];
  maxX=25.5;maxZ=26;circleRadius=0;
  add(x:number,z:number,w:number,d:number){this.boxes.push({x,z,w,d});}
  blocked(x:number,z:number,r=.4){return Math.abs(x)>this.maxX-r||Math.abs(z)>this.maxZ-r||(this.circleRadius>0&&Math.hypot(x,z)>this.circleRadius-r&&!(Math.abs(x)<3-r&&z>18&&z<this.maxZ-r))||this.boxes.some(b=>Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r);}
  move(position:{x:number;z:number},dx:number,dz:number,r=.4){
    const count=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.25));
    for(let i=0;i<count;i++){if(!this.blocked(position.x+dx/count,position.z,r))position.x+=dx/count;if(!this.blocked(position.x,position.z+dz/count,r))position.z+=dz/count;}
  }
  clearLine(ax:number,az:number,bx:number,bz:number){const d=Math.hypot(bx-ax,bz-az);for(let t=.2;t<d;t+=.35){if(this.blocked(ax+(bx-ax)*t/d,az+(bz-az)*t/d,.05))return false;}return true;}
}
