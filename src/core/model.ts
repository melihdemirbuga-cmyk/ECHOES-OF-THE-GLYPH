import { BALANCE, ITEMS, RECIPES, RESOURCE_RESPAWN, type Slot } from '../data/content';
export interface ItemInstance { uid: string; id: string; upgrade: number; }
export interface Settings { mode: 'fine' | 'cinematic' | 'hybrid'; quality: 'auto' | 'high' | 'low'; volume: number; music: number; reduced: boolean; numbers: boolean; zoom: number; hudSize:'tiny'|'small'|'normal'; }
export interface SaveState {
  version: 1; zone: number; x: number; z: number; hp: number; energy: number; stamina: number;
  level: number; xp: number; points: number; gold: number; attributes: Record<'strength'|'will'|'vitality'|'dexterity',number>;
  inventory: Record<string,number>; equipment: ItemInstance[]; equipped: Record<Slot,string>;
  bag: (string|null)[];
  flags: Record<string,boolean>; puzzle: Record<string,number>; defeated: string[]; opened: string[]; discovered: string[];
  resources: Record<string,number>; stock: Record<string,number>; activeTime: number; kills: number;
  checkpoint: { zone: number; x: number; z: number }; ending: string | null; settings: Settings; serial: number;
}
export const DEFAULT_SETTINGS: Settings = { mode: 'fine', quality: 'auto', volume: .5, music: .35, reduced: false, numbers: true, zoom: 1,hudSize:'small' };
export function newState(settings = DEFAULT_SETTINGS): SaveState {
  return { version: 1, zone: 0, x: 3, z: 10, hp: 100, energy: 60, stamina: 100, level: 1, xp: 0, points: 0, gold: 0,
    attributes: { strength: 0, will: 0, vitality: 0, dexterity: 0 }, inventory: { potion: 3 },bag:['potion',null,null,null,null,null],
    equipment: [{uid:'item1',id:'rusty',upgrade:0},{uid:'item2',id:'robe',upgrade:0}], equipped: { weapon:'item1',armor:'item2',talisman:'',relic:'' },
    flags: {}, puzzle: {}, defeated: [], opened: [], discovered: [], resources: {}, stock: {}, activeTime:0,kills:0,
    checkpoint: {zone:0,x:3,z:10}, ending:null, settings:{...settings},serial:2 };
}
export function assignBag(s:SaveState,slot:number,id:string|null){
  if(!Number.isInteger(slot)||slot<0||slot>5)return false;
  if(id&&!canUseInCombat(s,id))return false;
  if(id)s.bag=s.bag.map(value=>value===id?null:value);s.bag[slot]=id;return true;
}
export function canUseInCombat(s:SaveState,id:string){return s.equipment.some(i=>i.uid===id)||(Object.hasOwn(ITEMS,id)&&ITEMS[id].kind==='consumable'&&(s.inventory[id]??0)>0);}
export function meleePower(s:SaveState,heavy=false,automatic=false,bonus=0){const multiplier=heavy?(equipped(s,'weapon')?.id==='ashBlade'?2.25:1.8):1;return (stats(s).attack+bonus)*multiplier*(automatic?BALANCE.autoAttackMultiplier:1);}
export function equipped(s: SaveState, slot: Slot) { return s.equipment.find(i=>i.uid===s.equipped[slot]); }
export function stats(s: SaveState) {
  const entries = Object.values(s.equipped).map(uid=>s.equipment.find(i=>i.uid===uid)).filter((i): i is ItemInstance=>!!i);
  const bonus = (key: 'hp'|'energy'|'armor')=>entries.reduce((n,i)=>n+(ITEMS[i.id][key]??0)+(key==='armor'&&ITEMS[i.id].kind==='armor'?i.upgrade*3:0),0);
  const w=equipped(s,'weapon'); const def=ITEMS[w?.id??'rusty'];
  return { maxHp:100+(s.level-1)*12+s.attributes.vitality*10+bonus('hp'), maxEnergy:60+(s.level-1)*4+s.attributes.will*3+bonus('energy'),
    attack:10+(def.attack??0)+(w?.upgrade??0)*4+s.attributes.strength*3+(s.level-1)*1.5,
    magic:25+s.attributes.will*5+(s.level-1)*3, defense:2+bonus('armor'), reach:def.reach??3, speed:Math.max(.23,(def.speed??.46)-s.attributes.dexterity*.008), regen:BALANCE.staminaRegen+s.attributes.dexterity*2 };
}
export function damage(raw: number, armor: number) { return Math.max(1,Math.round(Math.max(0,raw)*(50/(Math.max(0,armor)+50)))); }
export function xpRequired(level: number) { return 100+40*(level-1)+15*(level-1)**2; }
export function addXp(s: SaveState, amount: number) {
  const before=s.level; s.xp+=Math.max(0,amount);
  while(s.level<BALANCE.maxLevel&&s.xp>=xpRequired(s.level)) {s.xp-=xpRequired(s.level);s.level++;s.points++;}
  if(s.level===BALANCE.maxLevel) s.xp=0;
  if(s.level>before){s.hp=stats(s).maxHp;s.energy=stats(s).maxEnergy;}
  return s.level-before;
}
export function addItem(s: SaveState, id: string, amount=1) {
  if(!ITEMS[id]||amount<=0||!Number.isInteger(amount)) return;
  if(['weapon','armor','talisman','relic'].includes(ITEMS[id].kind)) {
    for(let i=0;i<amount;i++)s.equipment.push({uid:`item${++s.serial}`,id,upgrade:0});
  } else s.inventory[id]=(s.inventory[id]??0)+amount;
}
export function equip(s: SaveState, uid: string) {
  const item=s.equipment.find(i=>i.uid===uid); if(!item)return false;
  const slot=ITEMS[item.id].kind; if(!['weapon','armor','talisman','relic'].includes(slot))return false;
  s.equipped[slot as Slot]=uid;clampResources(s);return true;
}
export function clampResources(s: SaveState) {const st=stats(s);s.hp=Math.max(0,Math.min(s.hp,st.maxHp));s.energy=Math.max(0,Math.min(s.energy,st.maxEnergy));s.stamina=Math.max(0,Math.min(s.stamina,100));}
export function spend(s: SaveState, gold: number, needs: Record<string,number>) {
  if(s.gold<gold||Object.entries(needs).some(([id,n])=>(s.inventory[id]??0)<n))return false;
  s.gold-=gold;for(const [id,n]of Object.entries(needs))if(n>0)s.inventory[id]=(s.inventory[id]??0)-n;return true;
}
export function upgradeCost(level: number) {return {gold:[40,85,150,250,400][level]??Infinity,iron:2+level*2,core:level>=2?level-1:0,crystal:level===4?1:0};}
export function upgrade(s: SaveState, uid: string) {
  const i=s.equipment.find(i=>i.uid===uid);if(!i||!['weapon','armor'].includes(ITEMS[i.id].kind)||i.upgrade>=5)return false;
  const c=upgradeCost(i.upgrade);if(!spend(s,c.gold,{iron:c.iron,core:c.core,crystal:c.crystal}))return false;i.upgrade++;return true;
}
export function repair(s: SaveState) {
  if(s.flags.repaired||!s.flags.forgeQuest||!s.defeated.includes('guard0')||!spend(s,0,{iron:5,keeperCore:1}))return false;
  s.flags.repaired=true;addItem(s,'lastLine');equip(s,s.equipment[s.equipment.length-1].uid);s.gold+=60;addXp(s,120);return true;
}
export function craft(s: SaveState, id: string) {
  const r=RECIPES.find(r=>r.id===id);if(!r||!spend(s,r.gold,r.needs))return false;addItem(s,r.output);return true;
}
export function buy(s: SaveState,id:string) {
  const d=ITEMS[id];if(!d||d.kind==='quest'||(s.stock[id]??0)>=8||!spend(s,d.price,{}))return false;
  s.stock[id]=(s.stock[id]??0)+1;addItem(s,id);return true;
}
export function sell(s: SaveState,id:string) {
  const inst=s.equipment.find(i=>i.uid===id);const item=ITEMS[inst?.id??id];if(!item||item.kind==='quest')return false;
  if(inst){if(Object.values(s.equipped).includes(id))return false;s.equipment=s.equipment.filter(i=>i.uid!==id);s.bag=s.bag.map(value=>value===id?null:value);}
  else {if((s.inventory[id]??0)<1)return false;s.inventory[id]--;}
  s.gold+=Math.max(1,Math.floor(item.price*.3));return true;
}
export function consume(s: SaveState,id:string) {
  if(s.hp<=0||(s.inventory[id]??0)<1)return false;
  const st=stats(s);if(id==='potion'||id==='largePotion'){if(s.hp>=st.maxHp)return false;s.hp=Math.min(st.maxHp,s.hp+(id==='potion'?35:75));}
  else if(id==='essence'){if(s.energy>=st.maxEnergy)return false;s.energy=Math.min(st.maxEnergy,s.energy+30);}
  else if(!['guardPotion','oil'].includes(id))return false;
  s.inventory[id]--;return true;
}
export function allocate(s: SaveState,key:keyof SaveState['attributes']) {
  if(s.points<1||!(key in s.attributes)||s.attributes[key]>=30)return false;s.attributes[key]++;s.points--;if(key==='vitality')s.hp+=10;return true;
}
export function reward(s: SaveState,id:string,gold:number,xp:number,items:Record<string,number>={}) {
  if(s.flags[`reward:${id}`])return false;s.flags[`reward:${id}`]=true;s.gold+=gold;addXp(s,xp);for(const [key,n]of Object.entries(items))addItem(s,key,n);return true;
}
export function openChest(s: SaveState,id:string,item:string) {
  if(s.opened.includes(id))return false;s.opened.push(id);addItem(s,item);s.gold+=35+s.zone*20;addItem(s,'iron',2);addItem(s,'potion',1);if(s.zone>1)addItem(s,'crystal');return true;
}
export function gather(s: SaveState,id:string,type:string) {
  if((s.resources[id]??-Infinity)>s.activeTime)return false;
  s.resources[id]=s.activeTime+(RESOURCE_RESPAWN[type]??BALANCE.resourceRespawn);addItem(s,type,type==='iron'?5:type==='core'?2:3);return true;
}
export function puzzleStep(s: SaveState,key:string,value:number,length=3) {
  if(s.flags[key])return 'done';const n=s.puzzle[key]??0;
  if(value!==n){s.puzzle[key]=0;return 'wrong';}
  s.puzzle[key]=n+1;if(n+1===length){s.flags[key]=true;reward(s,key,40,90);return 'solved';}return 'next';
}
export function rest(s: SaveState) {
  const st=stats(s);s.hp=st.maxHp;s.energy=st.maxEnergy;s.stamina=100;s.flags.heartUsed=false;
  s.checkpoint={zone:s.zone,x:s.x,z:s.z};
}
export function secretReady(s: SaveState) {return !!(s.flags.graveDone&&s.flags.emberDone&&s.flags.songDone&&s.flags.sparedOrin&&['lore0','lore1','lore2'].every(id=>s.discovered.includes(id)));}
export function bossReady(s: SaveState,zone=s.zone) {return zone===0?!!s.flags.gate:zone===1?!!s.flags.voices:zone===2?!!s.flags.names:zone===3?!!s.flags.bellRepaired:true;}
export function objective(s: SaveState): {title:string;detail:string;target:string} {
  if(s.ending)return {title:'Die Geschichte ist geschrieben',detail:'Du kannst die Welt weiter erkunden.',target:'ending'};
  if(s.zone===0){
    if(!s.flags.intro)return {title:'Das Flüstern der Asche',detail:'Sprich mit Edda vor der Kapelle.',target:'edda'};
    if(!s.flags.echo){
      if((s.inventory.ash??0)<3)return {title:'Das Flüstern der Asche',detail:`Finde die drei Aschezeichen · ${s.inventory.ash??0}/3`,target:['ash1','ash2','ash3'].find(id=>!s.discovered.includes(id))??'edda'};
      if(!s.defeated.includes('hollow0'))return {title:'Das Flüstern der Asche',detail:'Besiege die Nullhülle im Friedhof.',target:'hollow0'};
      if(!s.opened.includes('chest0'))return {title:'Das Flüstern der Asche',detail:'Öffne die Eisentruhe südlich des Friedhofs.',target:'chest0'};
      return {title:'Das Flüstern der Asche',detail:'Kehre zu Edda zurück. Die Zeichen warten.',target:'edda'};
    }
    if(!s.flags.forgeQuest)return {title:'Die Klinge des Vergessenen',detail:'Sprich mit Orin an der Schmiede.',target:'orin'};
    if(!s.flags.repaired){
      if(!s.defeated.includes('guard0'))return {title:'Die Klinge des Vergessenen',detail:'Sammle 5 Eisen. Besiege den Randwächter im Nordosten.',target:(s.inventory.iron??0)<5?'iron0a':'guard0'};
      return {title:'Die Klinge des Vergessenen',detail:'Bringe 5 Eisen und den Glutkern zu Orin. Repariere die Klinge.',target:'orin'};
    }
    if(!s.flags.gate)return {title:'Der Hüter ohne Namen',detail:'Wirke Echo-Puls (E loslassen) am nördlichen Tor.',target:'gate0'};
  }
  if(s.zone===1&&!s.flags.voices)return {title:'Die drei Stimmen',detail:`Enthülle und aktiviere: Wurzel, Stimme, Stern · ${s.puzzle.voices??0}/3`,target:['rootStele','voiceStele','starStele'][s.puzzle.voices??0]};
  if(s.zone===2&&!s.flags.names)return {title:'Die verlorenen Namen',detail:`Aktiviere die Platten: Name, Schmerz, Erinnerung · ${s.puzzle.names??0}/3`,target:['plate0','plate1','plate2'][s.puzzle.names??0]};
  if(s.zone===3&&!s.flags.bellRepaired){const parts=['part0','part1','part2'].filter(id=>s.discovered.includes(id)).length;return {title:'Die Glocke ohne Stimme',detail:parts<3?`Finde die drei Mechanismusteile · ${parts}/3`:'Repariere mit Orin den Glockenmechanismus.',target:parts<3?['part0','part1','part2'].find(id=>!s.discovered.includes(id))!:'mechanism'};}
  if(!s.defeated.includes(`boss${s.zone}`))return {title:s.zone===4?'Das letzte ungeschriebene Wort':'Das Siegel der Erinnerung',detail:s.zone===4?'Stelle dich Avar. Echo-Puls bricht seinen letzten Schriftwall.':'Besiege den Hüter am nördlichen Ausgang.',target:`boss${s.zone}`};
  return {title:s.zone===4?'Die Erste Schrift':'Ein Weg bleibt geschrieben',detail:s.zone===4?'Berühre die Erste Schrift und wähle Aethras Zukunft.':'Gehe durch den nördlichen Ausgang.',target:s.zone===4?'ending':`exit${s.zone}`};
}


