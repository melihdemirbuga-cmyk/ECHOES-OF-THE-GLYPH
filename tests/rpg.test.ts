import {describe,it,expect,beforeEach} from 'vitest';
import {addItem,addXp,allocate,bossReady,buy,consume,craft,damage,equip,equipped,gather,newState,objective,openChest,puzzleStep,repair,rest,reward,secretReady,sell,stats,upgrade,xpRequired,type SaveState} from '../src/core/model';
import {decodeSave} from '../src/persistence/SaveManager';
import {Campaign,type Dialogue} from '../src/narrative/Campaign';
import {ITEMS,RECIPES,ZONES} from '../src/data/content';
import {CollisionWorld} from '../src/world/CollisionWorld';
import {World} from '../src/world/World';
import {enemyLoot,weightedDrop} from '../src/loot/LootSystem';
let s:SaveState;beforeEach(()=>{s=newState();});
describe('Kampf und Progression',()=>{
  it('wendet die gleiche Rüstungsformel mit einer Untergrenze an',()=>{expect(damage(30,0)).toBe(30);expect(damage(30,50)).toBe(15);expect(damage(0,10)).toBe(1);expect(damage(30,-50)).toBe(30);});
  it('beginnt mit den vorgegebenen Ressourcen und echten Startwerten',()=>{expect(s.hp).toBe(100);expect(s.energy).toBe(60);expect(s.gold).toBe(0);expect(stats(s).attack).toBe(18);});
  it('löst auch mehrere Levelaufstiege aus und erhält den XP-Rest',()=>{const amount=xpRequired(1)+xpRequired(2)+7;expect(addXp(s,amount)).toBe(2);expect(s.level).toBe(3);expect(s.xp).toBe(7);expect(s.points).toBe(2);expect(s.hp).toBe(124);expect(stats(s).attack).toBe(21);});
  it('begrenzt das Level und akzeptiert keine negative XP',()=>{addXp(s,-100);expect(s.xp).toBe(0);addXp(s,1e8);expect(s.level).toBe(20);expect(s.xp).toBe(0);});
  it('vergibt Attribute nur bei vorhandenen Punkten und ändert die Spielwerte',()=>{expect(allocate(s,'strength')).toBe(false);s.points=2;const before=stats(s);allocate(s,'strength');allocate(s,'vitality');expect(stats(s).attack).toBe(before.attack+3);expect(stats(s).maxHp).toBe(before.maxHp+10);expect(s.points).toBe(0);});
  it('verbraucht Heiltränke nur bei wirklicher Anwendung',()=>{expect(consume(s,'potion')).toBe(false);s.hp=40;expect(consume(s,'potion')).toBe(true);expect(s.hp).toBe(75);expect(s.inventory.potion).toBe(2);s.hp=0;expect(consume(s,'potion')).toBe(false);});
  it('stellt Energie wieder her und begrenzt die Wirkung',()=>{addItem(s,'essence');s.energy=45;expect(consume(s,'essence')).toBe(true);expect(s.energy).toBe(60);expect(s.inventory.essence).toBe(0);});
});
describe('Inventar, Loot, Wirtschaft und Schmiede',()=>{
  it('verbessert den tatsächlichen Schaden durch eine ausgerüstete Truhenwaffe',()=>{const before=stats(s).attack;openChest(s,'chest0','chapelBlade');const i=s.equipment.at(-1)!;expect(equip(s,i.uid)).toBe(true);expect(stats(s).attack).toBe(before+6);});
  it('vergibt Truheninhalte genau einmal und erhält den Zustand nach dem Laden',()=>{expect(openChest(s,'chest0','chapelBlade')).toBe(true);const count=s.equipment.length,gold=s.gold;expect(openChest(s,'chest0','chapelBlade')).toBe(false);expect(s.equipment.length).toBe(count);expect(s.gold).toBe(gold);const loaded=decodeSave(JSON.stringify(s))!;expect(openChest(loaded,'chest0','chapelBlade')).toBe(false);});
  it('erzeugt eindeutige, persistente Ausrüstungsinstanzen',()=>{addItem(s,'mail',3);expect(new Set(s.equipment.map(i=>i.uid)).size).toBe(s.equipment.length);const loaded=decodeSave(JSON.stringify(s));expect(loaded?.equipment).toEqual(s.equipment);addItem(loaded!,'mail');expect(new Set(loaded!.equipment.map(i=>i.uid)).size).toBe(loaded!.equipment.length);});
  it('reduziert erlittenen Schaden durch ausgerüstete Rüstung',()=>{const before=damage(40,stats(s).defense);addItem(s,'mail');equip(s,s.equipment.at(-1)!.uid);expect(damage(40,stats(s).defense)).toBeLessThan(before);});
  it('verbraucht Gold und Eisen bei Upgrades, erhöht echte Werte und verhindert Überziehung',()=>{s.gold=40;addItem(s,'iron',2);const before=stats(s).attack;expect(upgrade(s,'item1')).toBe(true);expect(s.gold).toBe(0);expect(s.inventory.iron).toBe(0);expect(s.inventory.core).toBeUndefined();expect(stats(s).attack).toBe(before+4);expect(upgrade(s,'item1')).toBe(false);expect(equipped(s,'weapon')?.upgrade).toBe(1);expect(decodeSave(JSON.stringify(s))).not.toBeNull();});
  it('begrenzt Verbesserungen auf +5',()=>{s.gold=10000;addItem(s,'iron',100);addItem(s,'core',50);addItem(s,'crystal',10);for(let i=0;i<5;i++)expect(upgrade(s,'item1')).toBe(true);const gold=s.gold;expect(upgrade(s,'item1')).toBe(false);expect(s.gold).toBe(gold);});
  it('führt die kostenlose Quest-Reparatur genau einmal aus',()=>{s.flags.forgeQuest=true;s.defeated.push('guard0');addItem(s,'iron',5);addItem(s,'keeperCore');expect(repair(s)).toBe(true);expect(equipped(s,'weapon')?.id).toBe('lastLine');expect(s.inventory.iron).toBe(0);expect(s.inventory.keeperCore).toBe(0);expect(repair(s)).toBe(false);});
  it('verhindert einen Reparatur-Softlock durch verkaufte oder für Upgrades benutzte Glut',()=>{s.flags.forgeQuest=true;s.defeated.push('guard0');addItem(s,'iron',5);addItem(s,'keeperCore');expect(sell(s,'keeperCore')).toBe(false);s.inventory.core=0;expect(repair(s)).toBe(true);});
  it('gibt fehlende Reparaturkosten nicht teilweise aus',()=>{s.flags.forgeQuest=true;addItem(s,'iron',5);expect(repair(s)).toBe(false);expect(s.inventory.iron).toBe(5);});
  it('schützt Questgegenstände und angelegte Ausrüstung vor dem Verkauf',()=>{addItem(s,'ash');expect(sell(s,'ash')).toBe(false);expect(sell(s,'item1')).toBe(false);expect(s.inventory.ash).toBe(1);});
  it('erlaubt keinen gewinnbringenden Kauf-/Verkaufskreislauf',()=>{s.gold=100;expect(buy(s,'potion')).toBe(true);expect(sell(s,'potion')).toBe(true);expect(s.gold).toBeLessThan(100);});
  it('hält Händlerbestand und negative Käufe in Grenzen',()=>{s.gold=10000;for(let i=0;i<8;i++)expect(buy(s,'iron')).toBe(true);expect(buy(s,'iron')).toBe(false);expect(buy(s,'ash')).toBe(false);});
  it('stellt Gegenstände mit tatsächlichem Ressourcenverbrauch her',()=>{s.gold=20;addItem(s,'resin');expect(craft(s,'potion')).toBe(true);expect(s.inventory.potion).toBe(4);expect(s.inventory.resin).toBe(0);expect(s.gold).toBe(12);expect(craft(s,'potion')).toBe(false);});
  it('nutzt nur gültige Itemdefinitionen in Truhen und Rezepten',()=>{for(const z of ZONES)for(const o of z.objects)if(o.kind==='chest')expect(ITEMS[o.data!]).toBeDefined();for(const r of RECIPES){expect(ITEMS[r.output]).toBeDefined();for(const id of Object.keys(r.needs))expect(ITEMS[id]).toBeDefined();}});
  it('gibt garantierte Questkerne unabhängig von gewichteter Zusatzbeute aus',()=>{for(let i=1;i<100;i++){expect(enemyLoot('guard',0,i)).toContainEqual({id:'core',amount:1});for(const drop of enemyLoot('hollow',0,i)){expect(ITEMS[drop.id]).toBeDefined();expect(drop.amount).toBeGreaterThan(0);}}});
  it('respektiert Gewichte und liefert bei gleichem Zustand dieselbe Beute',()=>{expect(weightedDrop([{id:'iron',weight:1,min:2,max:2},{id:'resin',weight:3,min:1,max:1}],()=>0)).toEqual({id:'iron',amount:2});expect(weightedDrop([{id:'iron',weight:1,min:2,max:2},{id:'resin',weight:3,min:1,max:1}],()=>.9)).toEqual({id:'resin',amount:1});expect(enemyLoot('hollow',0,9)).toEqual(enemyLoot('hollow',0,9));});
});
describe('Farming, Rätsel und Wiedererwachen',()=>{
  it('erfordert eine aktive Sammlung nach der Respawnzeit',()=>{expect(gather(s,'node','iron')).toBe(true);expect(s.inventory.iron).toBe(5);expect(gather(s,'node','iron')).toBe(false);s.activeTime=89;expect(gather(s,'node','iron')).toBe(false);s.activeTime=90;expect(s.inventory.iron).toBe(5);expect(gather(s,'node','iron')).toBe(true);expect(s.inventory.iron).toBe(10);});
  it('setzt falsche Reihenfolgen zurück und belohnt ein Rätsel einmalig',()=>{expect(puzzleStep(s,'voices',1)).toBe('wrong');expect(puzzleStep(s,'voices',0)).toBe('next');expect(puzzleStep(s,'voices',2)).toBe('wrong');for(let i=0;i<3;i++)puzzleStep(s,'voices',i);const gold=s.gold;expect(s.flags.voices).toBe(true);expect(puzzleStep(s,'voices',0)).toBe('done');expect(s.gold).toBe(gold);});
  it('erhält Questfortschritt, Gold, Items und XP beim Wiederbeleben',()=>{s.hp=0;s.gold=45;s.xp=27;s.flags.intro=true;rest(s);expect(s.hp).toBe(100);expect(s.gold).toBe(45);expect(s.xp).toBe(27);expect(s.flags.intro).toBe(true);expect(s.inventory.potion).toBe(3);});
  it('begrenzt sämtliche Questbelohnungen auf eine Vergabe',()=>{expect(reward(s,'test',10,20,{iron:2})).toBe(true);expect(reward(s,'test',10,20,{iron:2})).toBe(false);expect(s.gold).toBe(10);expect(s.xp).toBe(20);expect(s.inventory.iron).toBe(2);});
});
describe('Persistenz',()=>{
  it('erhält vollständigen Fortschritt und Ausrüstungsdaten',()=>{s.flags.echo=true;s.puzzle.voices=2;s.defeated.push('boss0');s.discovered.push('lore0');s.resources.node=180;s.settings.mode='hybrid';expect(decodeSave(JSON.stringify(s))).toEqual(s);});
  it.each([null,'','{bad','{}','{"version":42}'])('behandelt beschädigte Daten sicher: %s',raw=>{expect(decodeSave(raw)).toBeNull();});
  it('erkennt falsche Item-IDs und doppelte Instanzen',()=>{s.equipment[0].id='missing';expect(decodeSave(JSON.stringify(s))).toBeNull();s=newState();s.equipment[1].uid='item1';expect(decodeSave(JSON.stringify(s))).toBeNull();});
  it('weist beschädigte Story-, Ressourcen- und Endzustände zurück',()=>{for(const [key,value]of [['flags',null],['resources',{node:-100}],['ending','other'],['stock',{iron:999}]])expect(decodeSave(JSON.stringify({...s,[key as string]:value}))).toBeNull();});
  it('setzt Positionen außerhalb der Welt auf einen sicheren Spawn',()=>{s.x=1000;expect(decodeSave(JSON.stringify(s))?.x).toBe(3);});
});
describe('Kampagne und Endbedingungen',()=>{
  let c:Campaign;let dialogue:Dialogue|undefined;let menus:string[];
  beforeEach(()=>{menus=[];c=new Campaign(s,{say:d=>{dialogue=d;},toast:()=>{},menu:n=>{menus.push(n);},travel:n=>{s.zone=n;},save:()=>{},ending:()=>{}});});
  const interact=(id:string)=>{c.interact(ZONES.flatMap(z=>z.objects).find(o=>o.id===id)!);};
  it('führt die erste Quest mit Truhe, Kampf, Echo und Reparatur bis zum offenen Tor',()=>{interact('edda');expect(s.flags.intro).toBe(true);for(const id of ['ash1','ash2','ash3','chest0'])interact(id);interact('edda');expect(s.flags.echo).not.toBe(true);s.defeated.push('hollow0');interact('edda');expect(s.flags.echo).toBe(true);const gold=s.gold;interact('edda');expect(s.gold).toBe(gold);interact('orin');addItem(s,'iron',5);addItem(s,'keeperCore');s.defeated.push('guard0');expect(repair(s)).toBe(true);c.reveal(7,-13,7);expect(bossReady(s)).toBe(true);expect(objective(s).target).toBe('boss0');s.defeated.push('boss0');interact('exit0');expect(s.zone).toBe(1);});
  it('sperrt jeden Gebietsausgang bis zum tatsächlichen Boss-Sieg',()=>{for(let zone=0;zone<4;zone++){s.zone=zone;interact(`exit${zone}`);expect(s.zone).toBe(zone);s.defeated.push(`boss${zone}`);interact(`exit${zone}`);expect(s.zone).toBe(zone+1);}});
  it('enthüllt versteckte Objekte nur in Echo-Reichweite',()=>{s.zone=1;c.reveal(-11,5,3);expect(s.discovered).toContain('reveal:rootStele');expect(s.discovered).not.toContain('reveal:starStele');});
  it('ermöglicht beide Glockenentscheidungen ohne Quest-Sackgasse',()=>{s.zone=3;for(const id of ['part0','part1','part2'])s.discovered.push(id);interact('mechanism');expect(dialogue?.choices?.[0].disabled).toBe(true);dialogue!.choices![1].action();expect(s.flags.bellRepaired).toBe(true);expect(s.flags.sparedOrin).toBe(false);});
  it('verbraucht alternative Reparaturmaterialien und erhält Orins Erinnerung',()=>{s.zone=3;s.discovered.push('part0','part1','part2');addItem(s,'iron',8);addItem(s,'core',2);interact('mechanism');dialogue!.choices![0].action();expect(s.inventory.iron).toBe(0);expect(s.inventory.core).toBe(0);expect(s.flags.sparedOrin).toBe(true);});
  it('schaltet den dritten Ausgang ausschließlich nach überprüfbaren Bedingungen frei',()=>{expect(secretReady(s)).toBe(false);Object.assign(s.flags,{graveDone:true,emberDone:true,songDone:true,sparedOrin:true});s.discovered.push('lore0','lore1');expect(secretReady(s)).toBe(false);s.discovered.push('lore2');expect(secretReady(s)).toBe(true);s.zone=4;s.defeated.push('boss4');interact('ending');expect(dialogue!.choices).toHaveLength(3);dialogue!.choices![2].action();expect(s.ending).toBe('rewrite');});
  it.each([[0,'memory'],[1,'silence']])('beendet die Kampagne auch ohne Geheimnisse: %s', (choice,ending)=>{s.zone=4;s.defeated.push('boss4');interact('ending');expect(dialogue!.choices).toHaveLength(2);dialogue!.choices![Number(choice)].action();expect(s.ending).toBe(ending);});
});
describe('Weltgeometrie und Erreichbarkeit',()=>{
  it('verhindert das Durchqueren solider Wände, auch bei einem langen Frame',()=>{const c=new CollisionWorld();c.add(2,0,1,10);const p={x:0,z:0};c.move(p,10,0);expect(p.x).toBeLessThan(1.2);expect(c.clearLine(0,0,4,0)).toBe(false);});
  it.each([0,1,2,3,4])('erlaubt Wege vom Spawn zu allen Interaktionen in Kapitel %i',zone=>{
    s.zone=zone;s.flags.gate=true;const world=new World(s),c=world.collision;const start=ZONES[zone].spawn.map(Math.round);const queue=[start],seen=new Set([start.join(',')]);
    for(let k=0;k<queue.length;k++){const [x,z]=queue[k];for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz,key=`${nx},${nz}`;if(!seen.has(key)&&!c.blocked(nx,nz,.4)){seen.add(key);queue.push([nx,nz]);}}}
    for(const o of ZONES[zone].objects)expect(queue.some(([x,z])=>Math.hypot(x-o.x,z-o.z)<2),`${zone}: ${o.id} muss erreichbar sein`).toBe(true);world.dispose();
  });
});

