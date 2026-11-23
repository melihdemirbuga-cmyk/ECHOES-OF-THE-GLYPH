import {describe,it,expect} from 'vitest';
import {CollisionWorld} from '../src/world/CollisionWorld';
import {findPath,walkableLine} from '../src/world/Navigation';
import {addItem,assignBag,newState,sell} from '../src/core/model';
import {decodeSave} from '../src/persistence/SaveManager';
describe('Rechtsklick-Wegsuche',()=>{
  it('läuft auf direktem Weg über freies Gelände',()=>{const world=new CollisionWorld(),start={x:0,z:0},target={x:8,z:6};expect(findPath(world,start,target)).toEqual([target]);});
  it('umgeht eine solide Wand ohne Eckenschnitte',()=>{const world=new CollisionWorld();world.add(3,0,2,8);const start={x:0,z:0},path=findPath(world,start,{x:8,z:0});expect(path.length).toBeGreaterThan(1);let previous=start;for(const point of path){expect(walkableLine(world,previous,point)).toBe(true);expect(world.blocked(point.x,point.z,.38)).toBe(false);previous=point;}expect(previous).toEqual({x:8,z:0});});
  it('endet bei einem Klick ins Gebäude am nächsten begehbaren Punkt',()=>{const world=new CollisionWorld();world.add(0,0,8,8);const start={x:10,z:0},path=findPath(world,start,{x:0,z:0});expect(path.length).toBeGreaterThan(0);expect(world.blocked(path.at(-1)!.x,path.at(-1)!.z,.4)).toBe(false);});
  it('findet auch unmittelbar an einer Wand einen Weg',()=>{const world=new CollisionWorld();world.add(2,0,2,8);const start={x:.61,z:.2},path=findPath(world,start,{x:6,z:6});expect(path.length).toBeGreaterThan(0);let previous=start;for(const point of path){expect(walkableLine(world,previous,point)).toBe(true);previous=point;}});
  it('lehnt ein vollständig abgeschlossenes Ziel ab',()=>{const world=new CollisionWorld();world.add(0,3,7,1);world.add(0,-3,7,1);world.add(3,0,1,7);world.add(-3,0,1,7);expect(findPath(world,{x:8,z:0},{x:0,z:0})).toEqual([]);});
});
describe('Sechs Taschenfelder und Spielstand-Migration',()=>{
  it('beginnt mit Heiltränken in Feld 1',()=>{expect(newState().bag).toEqual(['potion',null,null,null,null,null]);});
  it('legt eine Referenz an und dupliziert oder verbraucht keine Gegenstände',()=>{const s=newState();addItem(s,'essence',3);expect(assignBag(s,1,'essence')).toBe(true);expect(s.inventory.essence).toBe(3);expect(s.bag[1]).toBe('essence');assignBag(s,4,'essence');expect(s.bag[1]).toBeNull();expect(s.bag[4]).toBe('essence');});
  it('erlaubt Ausrüstung und sperrt Materialien und Questbilder ohne Bestandsverlust',()=>{const s=newState();addItem(s,'iron',5);addItem(s,'ash');expect(assignBag(s,1,'item1')).toBe(true);expect(assignBag(s,2,'iron')).toBe(false);expect(assignBag(s,3,'ash')).toBe(false);expect(s.inventory.iron).toBe(5);expect(s.inventory.ash).toBe(1);expect(s.bag[2]).toBeNull();expect(assignBag(s,6,'potion')).toBe(false);expect(assignBag(s,2,'missing')).toBe(false);});
  it('entfernt beim Verkauf von Ausrüstung nur die ungültige Taschenreferenz',()=>{const s=newState();addItem(s,'chapelBlade');const uid=s.equipment.at(-1)!.uid;assignBag(s,2,uid);expect(sell(s,uid)).toBe(true);expect(s.bag[2]).toBeNull();expect(s.bag[0]).toBe('potion');});
  it('migriert frühere Spielstände und erhält die neue Belegung nach Laden',()=>{const s=newState();const legacy=JSON.parse(JSON.stringify(s));delete legacy.bag;expect(decodeSave(JSON.stringify(legacy))!.bag[0]).toBe('potion');assignBag(s,3,'item1');expect(decodeSave(JSON.stringify(s))!.bag).toEqual(s.bag);});
});
