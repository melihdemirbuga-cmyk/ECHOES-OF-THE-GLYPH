import {describe,it,expect} from 'vitest';
import {World} from '../src/world/World';
import {CollisionWorld} from '../src/world/CollisionWorld';
import {EnemyNavigator} from '../src/world/EnemyNavigator';
import {nearestWalkable} from '../src/world/Navigation';
import {meleePower,gather,newState,rest} from '../src/core/model';
import {decodeSave} from '../src/persistence/SaveManager';
import {BALANCE,ENEMIES,ZONES} from '../src/data/content';
describe('Kampfgruppen, sichere Gegner und begrenzte Regeneration',()=>{
  it('senkt Autoangriffe auf 62 Prozent und erhält gezielte Klingenfähigkeiten',()=>{const s=newState();expect(meleePower(s)).toBe(18);expect(meleePower(s,false,true)).toBeCloseTo(11.16);expect(meleePower(s,true)).toBeCloseTo(32.4);});
  it('enthält kleine Gruppen und keine heilenden Rastobjekte mehr',()=>{for(const zone of ZONES){expect(zone.objects.some(o=>o.kind==='checkpoint')).toBe(false);const normal=zone.enemies.filter(e=>!ENEMIES[e.kind].boss&&e.id!=='graveSpirit');const groups=new Map<string,number>();for(const e of normal)groups.set(e.id.split(':')[0],(groups.get(e.id.split(':')[0])??0)+1);for(const count of groups.values()){expect(count).toBeGreaterThanOrEqual(2);expect(count).toBeLessThanOrEqual(3);}}});
  it('erneuert Materialvorkommen nach 60, 90 und 120 aktiven Sekunden',()=>{const s=newState();for(const [type,time]of [['resin',60],['iron',90],['core',120]] as const){gather(s,type,type);expect(s.resources[type]).toBe(time);}expect(BALANCE.enemyRespawn).toBe(120);});
  it('erzeugt beim Wiedererwachen keine kostenlosen Heiltränke',()=>{const s=newState();s.hp=0;s.inventory.potion=0;rest(s);expect(s.hp).toBe(100);expect(s.inventory.potion).toBe(0);});
  it('säubert frühere Material-Taschenplätze und migriert die Leistengröße',()=>{const s=newState();s.inventory.iron=10;s.bag[1]='iron';s.bag[2]='essence';delete (s.settings as any).hudSize;const loaded=decodeSave(JSON.stringify(s))!;expect(loaded.bag[1]).toBeNull();expect(loaded.bag[2]).toBe('essence');expect(loaded.inventory.iron).toBe(10);expect(loaded.settings.hudSize).toBe('small');loaded.settings.hudSize='tiny';expect(decodeSave(JSON.stringify(loaded))!.settings.hudSize).toBe('tiny');});
  it('legt alle Gegner außerhalb echter Weltkollisionen an',()=>{for(let zone=0;zone<ZONES.length;zone++){const s=newState();s.zone=zone;const world=new World(s);for(const def of ZONES[zone].enemies){const radius=ENEMIES[def.kind].boss?.85:.58,p=nearestWalkable(world.collision,def,radius);expect(world.collision.blocked(p.x,p.z,radius),`${zone}: ${def.id}`).toBe(false);expect(Math.hypot(p.x-def.x,p.z-def.z)).toBeLessThan(8);}if(zone===2){const e=ZONES[zone].enemies.find(e=>e.id==='hollow2')!;expect(world.collision.blocked(e.x,e.z,.58)).toBe(false);}world.dispose();}});
  it('verfolgt ein Ziel um eine Mauer statt in ihr stehenzubleiben',()=>{const w=new CollisionWorld();w.add(3,0,2,8);const nav=new EnemyNavigator(w,.5),p={x:0,z:0},target={x:8,z:0};for(let n=0;n<900&&Math.hypot(p.x-target.x,p.z-target.z)>.25;n++){const v=nav.direction(p,target,.02);w.move(p,v.x*.06,v.z*.06,.5);expect(w.blocked(p.x,p.z,.49)).toBe(false);}expect(Math.hypot(p.x-target.x,p.z-target.z)).toBeLessThan(.25);});
});
