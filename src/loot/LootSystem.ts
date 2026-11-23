import type { EnemyKind } from '../data/content';
interface Drop {id:string;amount:number;}
interface WeightedDrop {id:string|null;weight:number;min:number;max:number;}
const COMMON:WeightedDrop[]=[{id:null,weight:35,min:0,max:0},{id:'iron',weight:30,min:1,max:2},{id:'potion',weight:20,min:1,max:1},{id:'essence',weight:10,min:1,max:1},{id:'resin',weight:5,min:1,max:2}];
const FOREST:WeightedDrop[]=[{id:null,weight:25,min:0,max:0},{id:'resin',weight:40,min:1,max:2},{id:'iron',weight:15,min:1,max:2},{id:'potion',weight:15,min:1,max:1},{id:'essence',weight:5,min:1,max:1}];
export function weightedDrop(table:WeightedDrop[],random:()=>number):Drop|null {
  const sum=table.reduce((n,e)=>n+e.weight,0);let roll=random()*sum;
  for(const e of table){roll-=e.weight;if(roll<0)return e.id?{id:e.id,amount:e.min+Math.min(e.max-e.min,Math.floor(random()*(e.max-e.min+1)))}:null;}return null;
}
export function enemyLoot(kind:EnemyKind,zone:number,killSerial:number):Drop[]{
  let seed=(killSerial*2654435761+zone*7919+kind.length*997)>>>0;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const boss=['keeper','root','archivist','bell','eraser'].includes(kind),result:Drop[]=[];
  if(kind==='guard'||boss)result.push({id:'core',amount:boss?2:1});
  if(boss&&zone>=2)result.push({id:'crystal',amount:1});
  const extra=weightedDrop(zone===1?FOREST:COMMON,random);if(extra)result.push(extra);
  return result;
}
