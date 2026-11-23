import {ITEMS,RARITIES} from '../data/content';
import {equipped,stats,type SaveState} from '../core/model';
export const escapeHtml=(value:unknown)=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export const ICONS:Record<string,number>={rusty:0,chapelBlade:1,lastLine:2,forestBlade:3,ashBlade:4,echoBlade:5,robe:6,mail:7,vestment:8,ashCharm:9,whisper:10,feather:11,heart:12,iron:13,resin:14,core:15,keeperCore:15,crystal:16,potion:17,largePotion:18,essence:19,guardPotion:20,oil:21,ash:22,ember:23,song:24,forge:25,chest:26,gold:27,strength:28,will:29,vitality:30,dexterity:31,blade:2,emberSkill:32,echo:33,ward:34,dodge:35,attack:2,defense:7,hp:30,energy:19,magic:29,edda:8,orin:25,miro:24,veyra:27};
export function icon(id:string,extra=''){const n=ICONS[id]??22;return `<span class="game-icon ${extra}" style="--ix:${n%6};--iy:${Math.floor(n/6)}" aria-hidden="true"></span>`;}
const tips=new Map<string,string>();
export function tooltip(key:string,html:string){tips.set(key,html);return `data-tip="${escapeHtml(key)}"`;}
export function itemTooltip(s:SaveState,id:string,uid?:string){
  const instance=uid?s.equipment.find(i=>i.uid===uid):undefined,d=ITEMS[id],st=stats(s),on=instance&&Object.values(s.equipped).includes(instance.uid),up=instance?.upgrade??0;
  const attack=d.attack?10+d.attack+up*4+s.attributes.strength*3+(s.level-1)*1.5:0;
  const difference=Math.round(attack-st.attack),equippedWeapon=equipped(s,'weapon');
  return `<header>${icon(id)}<div><small class="rarity-${d.rarity}">${RARITIES[d.rarity]}${up?` · +${up}`:''}${on?' · ANGELEGT':''}</small><h3>${escapeHtml(d.name)}</h3></div></header><p>${escapeHtml(d.description)}</p><dl class="tip-stats">${d.attack?`<div><dt>Gesamter Klingenschaden</dt><dd>${Math.round(attack)}</dd></div><div><dt>Angriffszeit / Reichweite</dt><dd>${d.speed?.toFixed(2)} s / ${d.reach} m</dd></div>${uid!==equippedWeapon?.uid?`<div><dt>Vergleich zur angelegten Klinge</dt><dd class="${difference>=0?'positive':'negative'}">${difference>=0?'+':''}${difference}</dd></div>`:''}`:''}${d.armor?`<div><dt>Verteidigung</dt><dd>${d.armor+up*3}</dd></div>`:''}${d.hp?`<div><dt>Maximales Leben</dt><dd>+${d.hp}</dd></div>`:''}${d.energy?`<div><dt>Maximale Glyphenenergie</dt><dd>+${d.energy}</dd></div>`:''}${d.kind==='material'||d.kind==='quest'||d.kind==='consumable'?`<div><dt>Du hast</dt><dd>${s.inventory[id]??0}</dd></div>`:''}</dl><footer>${d.kind==='consumable'?'Klicken: verwenden · In ein Taschenfeld ziehen':d.kind==='material'||d.kind==='quest'?'Bleibt im Inventar · Für Herstellung und Quests':on?'Bereits angelegt':'Klicken: anlegen · In die Tasche ziehen: Schnellzugriff'}${d.kind==='quest'?' · Questgegenstand geschützt':''}</footer>`;
}
export function itemTip(s:SaveState,id:string,uid?:string,scope='item'){return tooltip(`${scope}:${uid??id}`,itemTooltip(s,id,uid));}
export class Tooltips {
  private el:HTMLElement;private source?:HTMLElement;private x=0;private y=0;
  constructor(root:HTMLElement){
    this.el=document.createElement('aside');this.el.id='item-tooltip';this.el.className='item-tooltip';this.el.setAttribute('role','tooltip');this.el.hidden=true;root.append(this.el);
    root.addEventListener('pointerover',e=>{const source=(e.target as HTMLElement).closest<HTMLElement>('[data-tip]');if(source){this.source=source;this.x=(e as PointerEvent).clientX;this.y=(e as PointerEvent).clientY;this.show(source);}});
    root.addEventListener('pointermove',e=>{this.x=e.clientX;this.y=e.clientY;if(this.source&&!this.el.hidden)this.place();});
    root.addEventListener('pointerout',e=>{if(this.source&&!this.source.contains((e as PointerEvent).relatedTarget as Node))this.hide();});
    root.addEventListener('focusin',e=>{const source=(e.target as HTMLElement).closest<HTMLElement>('[data-tip]');if(source){const r=source.getBoundingClientRect();this.x=r.right;this.y=r.top;this.source=source;this.show(source);}});
    root.addEventListener('focusout',()=>this.hide());root.addEventListener('dragstart',()=>this.hide());root.addEventListener('scroll',()=>this.hide(),true);
  }
  hide(){this.el.hidden=true;this.source=undefined;}
  private show(source:HTMLElement){const html=tips.get(source.dataset.tip!);if(!html)return;this.el.innerHTML=html;this.el.hidden=false;this.place();}
  private place(){const r=this.el.getBoundingClientRect();let left=this.x+18,top=this.y+16;if(left+r.width>innerWidth-12)left=this.x-r.width-18;if(top+r.height>innerHeight-12)top=innerHeight-r.height-12;this.el.style.left=`${Math.max(12,left)}px`;this.el.style.top=`${Math.max(12,top)}px`;}
}
