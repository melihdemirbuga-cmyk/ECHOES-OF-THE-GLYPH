import { ITEMS, ZONES, RESOURCE_RESPAWN } from '../data/content';
import { clampResources, DEFAULT_SETTINGS, newState, type SaveState } from '../core/model';
export const SAVE_KEY='echoes-of-the-glyph-v1';
export function decodeSave(raw:string|null):SaveState|null {
  if(!raw)return null;
  try {
    const v=JSON.parse(raw);if(v.version!==1||!Number.isInteger(v.zone)||!ZONES[v.zone]||!Number.isFinite(v.hp)||!Number.isFinite(v.x)||!Number.isFinite(v.z))return null;
    const base=newState();const s={...base,...v,settings:{...DEFAULT_SETTINGS,...v.settings}} as SaveState;
    const record=(value:unknown)=>value!==null&&typeof value==='object'&&!Array.isArray(value);
    if(![s.flags,s.puzzle,s.inventory,s.resources,s.stock,s.attributes,s.equipped].every(record))return null;
    if(!Object.values(s.flags).every(n=>typeof n==='boolean')||!Object.values(s.puzzle).every(n=>Number.isInteger(n)&&n>=0&&n<=3))return null;
    if(!Object.values(s.resources).every(n=>Number.isFinite(n)&&n>=0)||!Object.values(s.stock).every(n=>Number.isInteger(n)&&n>=0&&n<=8))return null;
    if(s.ending!==null&&!['memory','silence','rewrite'].includes(s.ending))return null;
    if(!Array.isArray(s.equipment)||!s.equipment.length||!s.equipment.every(i=>ITEMS[i.id]&&typeof i.uid==='string'&&Number.isInteger(i.upgrade)&&i.upgrade>=0&&i.upgrade<=5))return null;
    if(new Set(s.equipment.map(i=>i.uid)).size!==s.equipment.length)return null;
    for(const slot of ['weapon','armor','talisman','relic'] as const){if(s.equipped[slot]&&!s.equipment.some(i=>i.uid===s.equipped[slot]&&ITEMS[i.id].kind===slot))return null;}
    if(!s.equipped.weapon||!s.equipped.armor)return null;
    for(const key of ['level','xp','gold','points','activeTime','serial','energy','stamina'] as const)if(!Number.isFinite(s[key])||s[key]<0)return null;
    s.serial=Math.max(Math.floor(s.serial),...s.equipment.map(i=>/^item\d+$/.test(i.uid)?Number(i.uid.slice(4)):0));
    if(s.level<1||s.level>20||!Object.values(s.attributes).every(n=>Number.isInteger(n)&&n>=0&&n<=30))return null;
    if(!['strength','will','vitality','dexterity'].every(k=>k in s.attributes))return null;
    if(!Object.entries(s.inventory).every(([id,n])=>!!ITEMS[id]&&Number.isInteger(n)&&n>=0))return null;
    if(!['defeated','opened','discovered'].every(k=>Array.isArray(v[k])&&v[k].every((i:unknown)=>typeof i==='string')))return null;
    if(!s.checkpoint||!ZONES[s.checkpoint.zone]||!Number.isFinite(s.checkpoint.x)||!Number.isFinite(s.checkpoint.z))return null;
    const entry=ZONES[s.checkpoint.zone].spawn;s.checkpoint={zone:s.checkpoint.zone,x:entry[0],z:entry[1]};
    if(Math.abs(s.x)>26||Math.abs(s.z)>26){[s.x,s.z]=ZONES[s.zone].spawn;}
    s.settings.volume=Math.max(0,Math.min(1,Number(s.settings.volume)||0));s.settings.music=Math.max(0,Math.min(1,Number(s.settings.music)||0));
    if(!['fine','cinematic','hybrid'].includes(s.settings.mode))s.settings.mode='fine';
    if(!['auto','high','low'].includes(s.settings.quality))s.settings.quality='auto';
    s.settings.zoom=Math.max(.7,Math.min(1.8,Number(s.settings.zoom)||1));
    s.settings.reduced=!!s.settings.reduced;s.settings.numbers=!!s.settings.numbers;
    const savedBag=Array.isArray(v.bag)?v.bag:base.bag;
    s.bag=Array.from({length:6},(_,i)=>{const id=savedBag[i];return typeof id==='string'&&((Object.hasOwn(ITEMS,id)&&ITEMS[id].kind==='consumable')||s.equipment.some(item=>item.uid===id))?id:null;});
    s.bag=s.bag.map((id,i)=>id&&s.bag.indexOf(id)!==i?null:id);
    if(!['tiny','small','normal'].includes(s.settings.hudSize))s.settings.hudSize='small';
    for(const zone of ZONES)for(const object of zone.objects)if(object.kind==='resource'&&s.resources[object.id]>s.activeTime+(RESOURCE_RESPAWN[object.data!]??90))s.resources[object.id]=s.activeTime+(RESOURCE_RESPAWN[object.data!]??90);
    if(s.defeated.includes('guard0')&&!s.flags.repaired&&!s.inventory.keeperCore)s.inventory.keeperCore=1;
    clampResources(s);return s;
  } catch{return null;}
}
export class SaveManager {
  warning='';
  load(){try{const main=decodeSave(localStorage.getItem(SAVE_KEY));if(main)return main;const backup=decodeSave(localStorage.getItem(`${SAVE_KEY}-backup`));if(backup)this.warning='Die letzte gültige Sicherung wurde wiederhergestellt.';return backup;}catch{this.warning='Browser-Speicher ist nicht verfügbar.';return null;}}
  save(s:SaveState){try{const old=localStorage.getItem(SAVE_KEY);if(decodeSave(old))localStorage.setItem(`${SAVE_KEY}-backup`,old!);localStorage.setItem(SAVE_KEY,JSON.stringify(s));return true;}catch{this.warning='Speichern fehlgeschlagen. Exportiere deinen Spielstand im Pausenmenü.';return false;}}
  export(s:SaveState){const url=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='echoes-spielstand.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
