import * as THREE from 'three';
import { ABILITIES, BALANCE, ENEMIES, ITEMS, ZONES, type EnemyKind, type SpawnDef } from '../data/content';
import { Actor, type ActorMotion } from '../characters/Actor';
import { GlyphRenderer } from '../rendering/GlyphRenderer';
import { Effects } from '../rendering/Effects';
import { World, elevation, type WorldObject } from '../world/World';
import { Input } from './Input';
import { addItem, addXp, allocate, assignBag, bossReady, buy, consume, craft, damage, meleePower, equip, equipped, newState, repair, rest, sell, stats, upgrade, type SaveState } from './model';
import { Campaign, type Dialogue } from '../narrative/Campaign';
import { SaveManager, decodeSave } from '../persistence/SaveManager';
import { AudioManager } from '../audio/AudioManager';
import { UI } from '../ui/UI';
import { enemyLoot } from '../loot/LootSystem';
import {CommandController} from './CommandController';
import {EnemyNavigator} from '../world/EnemyNavigator';
import {nearestWalkable} from '../world/Navigation';

export interface Enemy {def:SpawnDef;actor:Actor;hp:number;max:number;mode:'idle'|'patrol'|'alert'|'chase'|'attack'|'recover'|'stunned'|'dead';timer:number;cooldown:number;pattern:number;phase:number;warning:THREE.Mesh;deadTime:number;navigation:EnemyNavigator;}
interface Projectile {mesh:THREE.Mesh;dx:number;dz:number;life:number;friendly:boolean;damage:number;hit:Set<string>;radius:number;}
interface Wave {x:number;z:number;y:number;age:number;max:number;damage:number;hit:boolean;mesh:THREE.Mesh;}
interface Hazard {x:number;z:number;y:number;age:number;radius:number;damage:number;hit:boolean;erase:boolean;mesh:THREE.Mesh;}
export class Game {
  state=newState();readonly saves=new SaveManager();readonly audio=new AudioManager();readonly ui:UI;readonly graphics:GlyphRenderer;readonly input:Input;
  world:World;player:Actor;campaign:Campaign;effects:Effects;enemies:Enemy[]=[];
  commands:CommandController;private lastMapGate=false;
  camera=new THREE.OrthographicCamera(-20,20,14,-14,.1,160);
  playing=false;paused=false;cinematic=false;activeAbility=0;cooldowns=[0,0,0];shield=0;
  private shieldTime=0;private dodgeTime=0;private dodgeCooldown=0;private dodgeDir=new THREE.Vector2();private invulnerable=0;private attackCooldown=0;private attackTime=0;private attackLength=.3;private castTime=0;private hurtTime=0;private healCooldown=0;private blockTime=0;
  private pendingStrike?:{timer:number;heavy:boolean;angle:number;automatic:boolean};private oil=0;private guardBuff=0;private exposed=0;private hitCounter=0;
  private projectiles:Projectile[]=[];private waves:Wave[]=[];private hazards:Hazard[]=[];private target=new THREE.Vector3(-8,1,2);private raycaster=new THREE.Raycaster();private groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);private rayPoint=new THREE.Vector3();private closest?:WorldObject;
  private clock=0;private lastTime=0;private uiTime=0;private saveTime=0;private steps=0;private hitstop=0;private returnMenu='home';private lastLevel=1;private cameraIntro=0;private companion?:Actor;private hints=new Set<string>();
  constructor(){
    this.ui=new UI((a,id)=>this.action(a,id));this.graphics=new GlyphRenderer(document.getElementById('game')!,this.state.settings);this.input=new Input(this.graphics.renderer.domElement);this.input.bindTouch();this.commands=new CommandController(this);
    this.world=new World(this.state);this.effects=new Effects(this.world.scene);this.player=new Actor();this.world.scene.add(this.player.root);this.campaign=this.createCampaign();this.buildEnemies();this.positionPlayer();
    this.refreshMap();const cached=this.saves.load();if(cached){this.state.settings=cached.settings;this.applySettings();}
    this.ui.home(!!cached);this.ui.update(this.state,0,this.cooldowns,0);this.resize();window.addEventListener('resize',()=>this.resize());
    window.addEventListener('blur',()=>{if(this.playing&&!this.paused)this.openMenu('pause');});document.addEventListener('visibilitychange',()=>{if(document.hidden&&this.playing&&!this.paused)this.openMenu('pause');});
    window.addEventListener('beforeunload',()=>{if(this.playing)this.saves.save(this.state);});
    this.graphics.renderer.domElement.addEventListener('wheel',e=>{if(!this.playing||this.paused)return;e.preventDefault();this.state.settings.zoom=THREE.MathUtils.clamp(this.state.settings.zoom-e.deltaY*.001,.7,1.8);},{passive:false});
    this.graphics.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.paused=true;this.ui.toast('Grafikkontext unterbrochen. Lade die Seite neu; dein letzter Spielstand bleibt erhalten.');});
    requestAnimationFrame(t=>this.frame(t));
    if(import.meta.env.DEV&&(new URLSearchParams(location.search).has('test')))Object.assign(window,{__game:this});
  }
  private createCampaign(){return new Campaign(this.state,{say:d=>this.say(d),toast:t=>this.ui.toast(t),menu:n=>this.openMenu(n),travel:n=>this.travel(n),save:()=>this.save(),ending:()=>{this.paused=true;this.ui.ending(this.state);}});}
  private resize(){this.graphics.resize();const aspect=innerWidth/innerHeight;const h=14;this.camera.left=-h*aspect;this.camera.right=h*aspect;this.camera.top=h;this.camera.bottom=-h;this.camera.updateProjectionMatrix();}
  private applySettings(){this.graphics.settings=this.state.settings;this.graphics.resize();this.audio.set(this.state.settings.volume,this.state.settings.music);document.body.classList.toggle('reduced-motion',this.state.settings.reduced);document.documentElement.style.setProperty('--hud-scale',String({tiny:.65,small:.82,normal:1}[this.state.settings.hudSize]??.82));document.body.dataset.hudSize=this.state.settings.hudSize;}
  private rebuild(){
    this.commands.reset();
    this.world.dispose();this.world=new World(this.state);this.effects=new Effects(this.world.scene);this.player=new Actor();this.world.scene.add(this.player.root);this.campaign=this.createCampaign();this.projectiles=[];this.waves=[];this.hazards=[];this.pendingStrike=undefined;this.dodgeTime=0;this.attackTime=0;this.attackCooldown=0;this.dodgeCooldown=0;this.castTime=0;this.hurtTime=0;this.hitstop=0;this.buildEnemies();this.positionPlayer();this.companion=undefined;
    if(this.state.flags.miro){this.companion=new Actor(0xa9c9c3,false,'miro');this.companion.root.position.set(this.state.x+1,0,this.state.z+1);this.world.scene.add(this.companion.root);}
    const armor=equipped(this.state,'armor');this.player.setEquipment(armor?.id??'robe',equipped(this.state,'weapon')?.upgrade??0);this.closest=undefined;this.ui.interaction(null);this.ui.hideBoss();
    this.refreshMap();
  }
  private refreshMap(){this.world.update(this.clock,0,this.state);this.ui.setWorldMap(this.graphics.captureMap(this.world.scene));this.lastMapGate=!!this.state.flags.gate;}
  private positionPlayer(){const s=this.state;if(this.world.collision.blocked(s.x,s.z)){[s.x,s.z]=ZONES[s.zone].spawn;}this.player.root.position.set(s.x,elevation(s.zone,s.x,s.z),s.z);}
  private buildEnemies(){
    this.enemies=ZONES[this.state.zone].enemies.map(source=>{
      const safe=nearestWalkable(this.world.collision,source,ENEMIES[source.kind].boss?.85:.58),def={...source,...safe};
      const type=ENEMIES[def.kind],boss=!!type.boss,actor=new Actor(boss?0x8c788c:def.kind==='spirit'?0x829c9e:0x6b616e,boss,def.kind==='guard'?'guard':def.kind==='crow'?'crow':'enemy');
      if(boss)actor.root.scale.setScalar(def.kind==='eraser'?2.2:1.7);if(def.kind==='root')actor.body.scale.set(1.6,1.2,1.4);
      actor.root.position.set(def.x,elevation(this.state.zone,def.x,def.z),def.z);this.world.scene.add(actor.root);
      const warning=new THREE.Mesh(new THREE.RingGeometry(.94,1,64),new THREE.MeshBasicMaterial({color:0xe4a177,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));warning.rotation.x=-Math.PI/2;warning.visible=false;this.world.scene.add(warning);
      const max=type.hp*(boss?1:1+this.state.zone*.16),dead=this.state.defeated.includes(def.id);actor.root.visible=!dead;
      return {def,actor,hp:dead?0:max,max,mode:dead?'dead':'idle',timer:0,cooldown:1,pattern:0,phase:1,warning,deadTime:-100,navigation:new EnemyNavigator(this.world.collision,boss?.8:.5)};
    });
  }
  start(continueGame:boolean){
    const loaded=continueGame?this.saves.load():null;this.state=loaded??newState(this.state.settings);
    if(this.state.hp<=0){this.state.zone=this.state.checkpoint.zone;this.state.x=this.state.checkpoint.x;this.state.z=this.state.checkpoint.z;rest(this.state);}
    this.playing=true;this.paused=false;this.cinematic=false;this.cooldowns=[0,0,0];this.activeAbility=this.state.flags.echo?1:0;this.shield=0;this.oil=0;this.guardBuff=0;this.invulnerable=1;this.lastLevel=this.state.level;
    this.rebuild();this.target.set(this.state.x,1,this.state.z);this.cameraIntro=this.state.settings.reduced?0:1.8;this.applySettings();this.ui.close();this.ui.setPlaying(true);this.ui.chapter(this.state);this.input.clear();void this.audio.start();this.save();
    if(!continueGame)window.setTimeout(()=>{if(this.playing&&!this.paused&&this.state.zone===0)this.ui.toast('Rechtsklick zum Laufen · F zum Interagieren · QWER halten zum Zielen, loslassen zum Wirken.');},5000);
  }
  private say(d:Dialogue){this.commands.armed=null;this.paused=true;this.input.clear();this.audio.pause(true);this.ui.showDialogue(d);}
  private openMenu(name:string){
    this.commands.armed=null;this.paused=true;this.input.clear();this.audio.pause(true);
    if(name==='inventory')this.ui.inventory(this.state);else if(name==='journal')this.ui.map(this.state);else if(name==='forge')this.ui.forge(this.state);else if(name==='shop')this.ui.shop(this.state);else this.ui.pause();
  }
  private resume(){this.paused=false;this.ui.close();this.input.clear();this.audio.pause(false);}
  action(a:string,id:string){
    const s=this.state;
    if(a==='new'){if(this.saves.load())this.ui.confirmNew();else this.start(false);}
    else if(a==='new-confirm')this.start(false);
    else if(a==='continue')this.start(true);
    else if(a==='resume'){this.resume();this.save();}
    else if(a==='home'){if(this.playing)this.save();this.playing=false;this.paused=true;this.ui.setPlaying(false);this.ui.home(!!this.saves.load());this.audio.pause(true);}
    else if(a==='settings'||a==='controls'){this.returnMenu=this.playing?'pause':'home';this.paused=true;a==='settings'?this.ui.settings(s):this.ui.controls();}
    else if(a==='back'){if(this.playing)this.ui.pause();else this.ui.home(!!this.saves.load());}
    else if(a==='settings-save'){s.settings=this.ui.readSettings();this.applySettings();if(this.playing){this.save();this.ui.pause();}else{const cached=this.saves.load();if(cached){cached.settings=s.settings;this.saves.save(cached);}this.ui.home(!!cached);}}
    else if(a==='export')this.saves.export(s);
    else if(a==='fullscreen'){if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>this.ui.toast('Vollbild ist in dieser Browseransicht nicht verfügbar.'));}
    else if(a==='import'){const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.onchange=async()=>{const f=file.files?.[0];if(!f)return;const loaded=decodeSave(await f.text());if(!loaded){this.ui.toast('Dieser Spielstand ist ungültig oder inkompatibel.');return;}this.saves.save(loaded);this.start(true);};file.click();}
    else if(a==='pause'||a==='inventory'||a==='journal'||a==='forge'||a==='shop')this.openMenu(a);
    else if(a==='ability'){this.activeAbility=Number(id);}
    else if(a==='skill'){this.commands.arm(id);this.commands.confirm();}
    else if(a==='attack-target'){const enemy=this.enemies.find(e=>e.def.id===id&&e.hp>0);if(enemy){if(this.paused)this.resume();this.commands.queueAttack(enemy);}}
    else if(a==='enemy-aim'){const enemy=this.enemies.find(e=>e.def.id===id&&e.hp>0);if(enemy){if(this.paused)this.resume();this.commands.queueAim(enemy.actor.root.position);}}
    else if(a==='map-move'){const [x,z]=id.split(',').map(Number);if(Number.isFinite(x)&&Number.isFinite(z)){if(this.paused)this.resume();this.commands.queueMove({x,z});}}
    else if(a==='map-point'){const [x,z]=id.split(',').map(Number);if(Number.isFinite(x)&&Number.isFinite(z))this.input.mapAim={x,z};}
    else if(a==='screen-point'){const [x,y]=id.split(',').map(Number);if(Number.isFinite(x)&&Number.isFinite(y)){this.input.mapAim=null;this.input.mouse={x:x/innerWidth*2-1,y:1-y/innerHeight*2,active:true};}}
    else if(a==='map-aim'){const [x,z]=id.split(',').map(Number);if(Number.isFinite(x)&&Number.isFinite(z)){if(this.paused)this.resume();this.commands.queueAim({x,z});}}
    else if(a==='bag-use')this.useBag(Number(id));
    else if(a==='bag-assign'){const [slot,item]=id.split('|');if(assignBag(s,Number(slot),item)){if(this.ui.menu==='inventory')this.ui.inventory(s);this.save();}else this.ui.toast('In die Tasche passen nur Kampftränke und wechselbare Ausrüstung.');}
    else if(a==='bag-remove'){const slot=s.bag.indexOf(id);if(slot>=0&&assignBag(s,slot,null)){if(this.ui.menu==='inventory')this.ui.inventory(s);this.save();}}
    else if(a==='heal')this.use('potion');
    else if(a==='respawn'){s.zone=s.checkpoint.zone;s.x=s.checkpoint.x;s.z=s.checkpoint.z;rest(s);this.rebuild();this.target.set(s.x,1,s.z);this.invulnerable=2;this.resume();this.save();}
    else if(a==='equip'){if(equip(s,id)){this.player.setEquipment(equipped(s,'armor')?.id??'robe',equipped(s,'weapon')?.upgrade??0);this.audio.play('loot');this.ui.inventory(s);this.save();}}
    else if(a==='allocate'){if(allocate(s,id as keyof SaveState['attributes'])){this.ui.inventory(s);this.save();}}
    else if(a==='consume'){this.use(id);this.ui.inventory(s);}
    else if(a==='repair'){if(repair(s)){this.ui.toast('Schwert der letzten Zeile wiederhergestellt und angelegt. Das Tor wartet im Norden.');this.audio.play('bell');this.ui.forge(s);this.save();}}
    else if(a==='upgrade'){if(upgrade(s,id)){this.audio.play('bell');this.ui.toast('Die Schrift wird stärker. Ausrüstung verbessert.');this.ui.forge(s);this.save();}}
    else if(a==='craft'){if(craft(s,id)){this.audio.play('loot');this.ui.forge(s);this.save();}}
    else if(a==='buy'){if(buy(s,id)){this.audio.play('loot');this.ui.shop(s);this.save();}}
    else if(a==='sell'){if(sell(s,id)){this.audio.play('loot');this.ui.shop(s);this.save();}}
  }
  save(){this.ui.saved(this.saves.save(this.state));}
  useBag(index:number){
    const id=this.state.bag[index];if(!id){this.ui.toast(`Taschenfeld ${index+1} ist leer. Ziehe im Inventar ein Bild in die Tasche.`);return;}
    const item=this.state.equipment.find(i=>i.uid===id);
    if(item){if(equip(this.state,id)){this.player.setEquipment(equipped(this.state,'armor')?.id??'robe',equipped(this.state,'weapon')?.upgrade??0);this.save();}}
    else if(ITEMS[id]?.kind==='consumable')this.use(id);
    else this.ui.toast(`${ITEMS[id]?.name??''} · ${this.state.inventory[id]??0} im Inventar. Wird an der Schmiede oder für Quests verwendet.`);
    if(this.ui.menu==='inventory')this.ui.inventory(this.state);
  }
  cancelPendingAttack(){this.pendingStrike=undefined;this.attackTime=0;}
  getDodgeCooldown(){return this.dodgeCooldown;}
  getAttackCooldown(){return this.attackCooldown;}
  travel(zone:number){
    if(!ZONES[zone])return;this.save();this.state.zone=zone;[this.state.x,this.state.z]=ZONES[zone].spawn;this.state.checkpoint={zone,x:this.state.x,z:this.state.z};this.rebuild();this.target.set(this.state.x,1,this.state.z);this.cooldowns=[0,0,0];this.shield=0;this.exposed=0;this.invulnerable=2;this.ui.chapter(this.state);this.audio.play('bell');this.save();
  }
  private use(id:string){if(this.healCooldown>0||!this.playing)return;if(consume(this.state,id)){if(id==='oil')this.oil=30;if(id==='guardPotion')this.guardBuff=30;this.healCooldown=1;this.castTime=.3;this.effects.ring(this.state.x,this.player.root.position.y,this.state.z,id==='oil'?0xff8c42:0xa9c9c3,1.7);this.audio.play('loot');this.ui.toast(`${ITEMS[id].name} verwendet.`);this.save();}else this.ui.toast('Gerade nicht verfügbar oder bereits vollständig erholt.');}
  private frame(time:number){
    const dt=Math.min((time-this.lastTime)/1000||.016,.05);this.lastTime=time;this.clock+=dt;
    this.processInput();
    if(this.playing&&!this.paused&&!this.cinematic&&this.state.hp>0){this.state.activeTime+=dt;if(this.hitstop<=0)this.update(dt);else this.hitstop-=dt;this.saveTime+=dt;if(this.saveTime>12){this.saveTime=0;this.save();}}
    this.world.update(this.clock,dt,this.state);this.effects.update(this.paused?0:dt);this.updateCamera(dt);this.world.updateVisibility(this.camera,this.player.root.position,dt,this.enemies.filter(e=>e.hp>0&&Math.hypot(e.actor.root.position.x-this.state.x,e.actor.root.position.z-this.state.z)<12).map(e=>e.actor.root.position.clone().add(new THREE.Vector3(0,1.5,0))));if(this.state.zone===0&&this.lastMapGate!==!!this.state.flags.gate)this.refreshMap();this.graphics.render(this.world.scene,this.camera,dt);
    if(this.uiTime<=0){this.ui.update(this.state,this.activeAbility,this.cooldowns,this.shield);if(this.playing&&!this.paused)this.updateLabels();this.uiTime=.1;}this.uiTime-=dt;
    this.input.frame();requestAnimationFrame(t=>this.frame(t));
  }
  private processInput(){
    const i=this.input;if(!this.playing)return;
    if(i.take('Escape')){if(!this.paused&&this.commands.armed){this.commands.armed=null;return;}if(this.ui.menu==='dialogue'){this.ui.closeDialogue();return;}if(this.paused&&this.ui.menu!=='death'&&this.ui.menu!=='ending')this.resume();else if(!this.paused){this.cinematic=false;this.openMenu('pause');}return;}
    if(this.paused){if(i.take('KeyF')||i.take('Enter')){if(this.ui.menu==='dialogue')this.ui.nextDialogue();}if((this.ui.menu==='inventory'&&i.take('KeyI'))||(this.ui.menu==='journal'&&i.take('Tab')))this.resume();return;}
    if(i.take('KeyI')){this.openMenu('inventory');return;}if(i.take('Tab')){this.openMenu('journal');return;}
    if(i.take('KeyC')){this.commands.stop();this.cinematic=!this.cinematic;this.ui.toast(this.cinematic?'Nemas Nahansicht · C kehrt zur Reise zurück.':'Die Geschichte geht weiter.');}
    if(this.cinematic)return;
    if(i.take('KeyF')&&this.closest){this.commands.stop();this.castTime=.25;this.campaign.interact(this.closest.def);this.audio.play('loot');}
    if(i.take('KeyJ'))this.attack(false);if(i.take('KeyK'))this.attack(true);
    if(i.magic)this.cast();
    this.commands.process();
    if(i.take('KeyB'))this.blockTime=.18;
  }
  private update(dt:number){
    const s=this.state,st=stats(s);this.cooldowns=this.cooldowns.map(t=>Math.max(0,t-dt));this.attackCooldown=Math.max(0,this.attackCooldown-dt);this.attackTime=Math.max(0,this.attackTime-dt);this.castTime=Math.max(0,this.castTime-dt);this.hurtTime=Math.max(0,this.hurtTime-dt);this.healCooldown=Math.max(0,this.healCooldown-dt);this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);this.invulnerable=Math.max(0,this.invulnerable-dt);this.blockTime=Math.max(0,this.blockTime-dt);this.oil=Math.max(0,this.oil-dt);this.guardBuff=Math.max(0,this.guardBuff-dt);this.exposed=Math.max(0,this.exposed-dt);this.shieldTime=Math.max(0,this.shieldTime-dt);if(!this.shieldTime)this.shield=0;
    s.energy=Math.min(st.maxEnergy,s.energy+dt*BALANCE.energyRegen);s.stamina=Math.min(100,s.stamina+dt*st.regen*(this.input.keys.has('KeyB')?.3:1));
    const movement=this.commands.update(dt);let dx=movement.dx,dz=movement.dz;const moving=Math.hypot(dx,dz)>.1;
    const sprint=moving&&this.input.keys.has('ShiftLeft')&&s.stamina>2&&this.dodgeTime<=0;let speed=sprint?BALANCE.sprint:BALANCE.walk;if(sprint)s.stamina=Math.max(0,s.stamina-dt*34);
    if(this.input.keys.has('KeyB'))speed*=.5;if(this.attackTime>0)speed*=.65;
    let motion:ActorMotion=moving?sprint?'run':'walk':'idle';
    if(this.dodgeTime>0){this.dodgeTime-=dt;dx=this.dodgeDir.x;dz=this.dodgeDir.y;speed=BALANCE.dodgeSpeed;motion='dodge';}
    if(moving||this.dodgeTime>0)this.world.collision.move(s,dx*speed*dt,dz*speed*dt,.38);
    if(moving&&this.attackTime<=0)this.player.facing=Math.atan2(dx,dz);
    this.player.root.position.set(s.x,elevation(s.zone,s.x,s.z),s.z);
    if(this.pendingStrike){this.pendingStrike.timer-=dt;if(this.pendingStrike.timer<=0){this.strike(this.pendingStrike.heavy,this.pendingStrike.angle,this.pendingStrike.automatic);this.pendingStrike=undefined;}}
    if(this.attackTime>0)motion='attack';else if(this.castTime>0)motion='cast';else if(this.hurtTime>0)motion='hurt';
    this.player.update(dt,this.clock,motion,1-this.attackTime/this.attackLength);
    if(this.companion){const p=this.companion.root.position,dx=s.x-1.5-p.x,dz=s.z+1-p.z;this.world.collision.move(p,dx*dt*2,dz*dt*2,.2);p.y=elevation(s.zone,p.x,p.z)+.7+Math.sin(this.clock*2)*.1;this.companion.facing=Math.atan2(dx,dz);this.companion.update(dt,this.clock,'idle');
      for(const o of this.world.objects)if(o.def.hidden&&!s.discovered.includes(`reveal:${o.def.id}`)&&!this.hints.has(o.def.id)&&Math.hypot(o.def.x-s.x,o.def.z-s.z)<5){this.hints.add(o.def.id);this.ui.toast('Miro: Hier flimmert eine fehlende Zeile. Lass dein Echo sprechen.');break;}}
    if(moving){this.steps+=dt;if(this.steps>.35){this.audio.play('step');this.steps=0;}}
    this.updateEnemies(dt);this.updateProjectiles(dt);this.updateWaves(dt);this.updateHazards(dt);this.findInteraction();
    if(this.state.level>this.lastLevel){this.lastLevel=this.state.level;this.ui.toast(`STUFE ${s.level} · Leben & Energie erneuert · Attributpunkt im Inventar (I).`);this.audio.play('bell');this.effects.ring(s.x,this.player.root.position.y,s.z,0xe2a765,4,1.5);this.save();}
  }
  private aim(){
    if(this.input.mouse.active){this.raycaster.setFromCamera(new THREE.Vector2(this.input.mouse.x,this.input.mouse.y),this.camera);this.groundPlane.constant=-this.player.root.position.y;if(this.raycaster.ray.intersectPlane(this.groundPlane,this.rayPoint))return Math.atan2(this.rayPoint.x-this.state.x,this.rayPoint.z-this.state.z);}
    const near=this.enemies.filter(e=>e.hp>0&&(!ENEMIES[e.def.kind].boss||bossReady(this.state))&&e.actor.root.position.distanceTo(this.player.root.position)<6).sort((a,b)=>a.actor.root.position.distanceToSquared(this.player.root.position)-b.actor.root.position.distanceToSquared(this.player.root.position))[0];
    return near?Math.atan2(near.actor.root.position.x-this.state.x,near.actor.root.position.z-this.state.z):this.player.facing;
  }
  attack(heavy=false,forcedAngle?:number,automatic=false){
    if(!this.playing||this.paused||this.attackCooldown>0||this.dodgeTime>0||this.state.hp<=0)return;const cost=heavy?22:8;if(this.state.stamina<cost)return;this.state.stamina-=cost;this.attackLength=heavy?.5:.3;this.attackTime=this.attackLength;this.attackCooldown=stats(this.state).speed*(heavy?1.6:1);this.player.facing=forcedAngle??this.aim();this.pendingStrike={timer:heavy?.2:.09,heavy,angle:this.player.facing,automatic};this.audio.play('sword');
  }
  private strike(heavy:boolean,angle:number,automatic=false){
    const s=this.state,st=stats(s),weapon=equipped(s,'weapon');this.effects.ring(s.x,this.player.root.position.y+.6,s.z,heavy?0xff8c42:0xe2cba6,st.reach,.28,Math.PI*1.1,angle);
    for(const e of this.enemies){if(automatic&&e!==this.commands.target)continue;const p=e.actor.root.position,dx=p.x-s.x,dz=p.z-s.z,dist=Math.hypot(dx,dz);if(e.hp<=0||dist>st.reach+(ENEMIES[e.def.kind].boss?.65:.3)||Math.abs(p.y-this.player.root.position.y)>2)continue;
      const diff=Math.atan2(Math.sin(Math.atan2(dx,dz)-angle),Math.cos(Math.atan2(dx,dz)-angle));if(Math.abs(diff)>Math.PI*.6||!this.world.collision.clearLine(s.x,s.z,p.x,p.z))continue;
      this.hitEnemy(e,meleePower(s,heavy,automatic,this.oil>0?10:0),false);
      if(weapon?.id==='forestBlade')s.hp=Math.min(st.maxHp,s.hp+2);if(weapon?.id==='echoBlade'&&++this.hitCounter%3===0)s.energy=Math.min(st.maxEnergy,s.energy+5);
    }
  }
  cast(forcedAngle?:number){
    const s=this.state,a=ABILITIES[this.activeAbility];if(!this.playing||this.paused||s.hp<=0)return;
    if(!s.flags[a.id]){this.ui.toast(a.id==='ward'?'Besiege den Hüter des Wisperwalds, um Schriftwall zu erlernen.':'Edda kann diese Glyphenkraft erwecken.');return;}
    if(this.cooldowns[this.activeAbility]>0||s.energy<a.cost||this.dodgeTime>0)return;s.energy-=a.cost;this.cooldowns[this.activeAbility]=a.cooldown;this.castTime=.45;this.player.facing=forcedAngle??this.aim();this.audio.play('magic');const y=this.player.root.position.y;
    if(a.id==='ember'){this.spawnProjectile(s.x,y+1,s.z,Math.sin(this.player.facing)*16,Math.cos(this.player.facing)*16,stats(s).magic*1.35,true);}
    else if(a.id==='echo'){
      const radius=equipped(s,'relic')?.id==='feather'?9:7;this.effects.ring(s.x,y,s.z,0xa9c9c3,radius,.75);this.campaign.reveal(s.x,s.z,radius);
      for(const e of this.enemies){const p=e.actor.root.position;if(e.hp>0&&Math.hypot(p.x-s.x,p.z-s.z)<radius&&this.world.collision.clearLine(s.x,s.z,p.x,p.z)){if(e.def.kind==='eraser'){this.exposed=10;this.ui.toast('Avars Schriftwall bricht · 10 Sekunden verwundbar.');}this.hitEnemy(e,stats(s).magic*(e.def.kind==='spirit'?2:1.1),true);const dx=p.x-s.x,dz=p.z-s.z,n=Math.max(.1,Math.hypot(dx,dz));this.world.collision.move(p,dx/n*(ENEMIES[e.def.kind].boss?.35:1.6),dz/n*(ENEMIES[e.def.kind].boss?.35:1.6),.5);}}
    }else{this.shield=50+this.state.attributes.will*4;this.shieldTime=8;this.effects.ring(s.x,y,s.z,0xa9c9c3,1.8,8);}
  }
  dodge(){if(this.dodgeCooldown>0||this.state.stamina<BALANCE.dodgeCost||this.state.hp<=0)return;this.state.stamina-=BALANCE.dodgeCost;const a=this.input.axes(),n=Math.hypot(a.x,a.y);if(n>.1)this.dodgeDir.set((a.x+a.y)*Math.SQRT1_2,(a.y-a.x)*Math.SQRT1_2);else this.dodgeDir.set(Math.sin(this.player.facing),Math.cos(this.player.facing));this.dodgeTime=BALANCE.dodgeDuration;this.dodgeCooldown=2.5;this.invulnerable=.4;this.audio.play('dodge');this.pendingStrike=undefined;}
  private hitEnemy(e:Enemy,raw:number,magic:boolean){
    if(e.hp<=0||e.mode==='dead'||(ENEMIES[e.def.kind].boss&&!bossReady(this.state)))return;
    if(e.def.kind==='eraser'&&e.hp/e.max<.34&&this.exposed<=0){this.effects.burst(e.actor.root.position.x,2,e.actor.root.position.z,0xa9c9c3,6);return;}
    const n=damage(raw,ENEMIES[e.def.kind].armor*(magic?.5:1));e.hp=Math.max(0,e.hp-n);const p=e.actor.root.position;
    this.effects.burst(p.x,p.y+1.5,p.z,magic?0xa9c9c3:0xe2a765);this.audio.play('hit',(p.x-this.state.x)/15);if(this.state.settings.numbers){const screen=this.project(p.clone().add(new THREE.Vector3(0,3,0)));this.ui.floating(String(n),screen.x,screen.y);}
    if(!ENEMIES[e.def.kind].boss){e.mode='stunned';e.timer=.22;e.warning.visible=false;}this.hitstop=.025;
    if(e.hp===0){e.mode='dead';e.deadTime=this.state.activeTime;e.timer=.65;e.warning.visible=false;if(!this.state.defeated.includes(e.def.id))this.state.defeated.push(e.def.id);this.state.kills++;const d=ENEMIES[e.def.kind];this.state.gold+=d.gold;addXp(this.state,d.xp);
      for(const drop of enemyLoot(e.def.kind,this.state.zone,this.state.kills))addItem(this.state,drop.id,drop.amount);
      if(!d.boss&&e.def.id!=='graveSpirit')this.state.resources[`enemy:${e.def.id}`]=this.state.activeTime+BALANCE.enemyRespawn;
      if(e.def.id==='guard0'&&!this.state.flags.repaired&&!this.state.inventory.keeperCore)addItem(this.state,'keeperCore');
      this.ui.toast(`+${d.xp} XP · +${d.gold} Gold${e.def.kind==='guard'?' · Glutkern':''}`);this.save();
      if(d.boss){this.ui.hideBoss();this.audio.play('bell');this.effects.ring(p.x,p.y,p.z,0xe2a765,7,1.5);this.campaign.bossDefeated(this.state.zone);}
    }
  }
  private hurt(raw:number,source?:Enemy,physical=true){
    if(this.invulnerable>0||this.state.hp<=0)return;let n=damage(raw,stats(this.state).defense+(this.guardBuff>0?15:0));
    if(this.input.keys.has('KeyB')&&this.state.stamina>10&&physical){if(this.blockTime>0&&source&&!ENEMIES[source.def.kind].boss){source.mode='stunned';source.timer=1.4;this.ui.toast('Pariert');n=0;}else n=Math.round(n*.3);this.state.stamina=Math.max(0,this.state.stamina-raw*.9);}
    if(this.shield>0){const absorb=Math.min(this.shield,n);this.shield-=absorb;n-=absorb;}
    this.state.hp=Math.max(0,this.state.hp-n);this.invulnerable=.55;this.hurtTime=.25;if(n>0){this.ui.hit();this.audio.play('hurt');}
    if(this.state.hp<=0&&equipped(this.state,'relic')?.id==='heart'&&!this.state.flags.heartUsed){this.state.flags.heartUsed=true;this.state.hp=stats(this.state).maxHp*.3;this.invulnerable=2;this.ui.toast('Das Herz der Glocke bewahrt deine letzte Zeile.');}
    if(this.state.hp<=0){this.player.update(0,this.clock,'dead');this.paused=true;this.audio.play('death');this.ui.death();this.save();}
  }
  private updateEnemies(dt:number){
    const s=this.state;
    for(const e of this.enemies){const d=ENEMIES[e.def.kind],p=e.actor.root.position,boss=!!d.boss,dist=Math.hypot(s.x-p.x,s.z-p.z);e.timer-=dt;e.cooldown=Math.max(0,e.cooldown-dt);
      if(e.mode==='dead'){
        if(!boss&&e.def.id!=='graveSpirit'&&(s.resources[`enemy:${e.def.id}`]??0)<=s.activeTime&&Math.hypot(s.x-e.def.x,s.z-e.def.z)>12){
          e.hp=e.max;e.mode='idle';e.timer=0;e.cooldown=2;e.actor.root.visible=true;e.actor.root.scale.set(e.def.kind==='crow'?.7:1,e.def.kind==='crow'?.5:1,e.def.kind==='crow'?.9:1);p.set(e.def.x,elevation(s.zone,e.def.x,e.def.z),e.def.z);e.navigation.reset();
        }else{if(e.timer>0){e.actor.update(dt,this.clock,'dead');e.actor.root.scale.multiplyScalar(Math.max(.8,1-dt*2));}else e.actor.root.visible=false;continue;}
      }
      p.y=elevation(s.zone,p.x,p.z)+(e.def.kind==='crow'?.7+Math.sin(this.clock*4)*.12:0);
      if(boss&&!bossReady(s)){e.actor.update(dt,this.clock,'idle');continue;}
      if(boss&&dist<13&&!s.flags[`bossIntro${s.zone}`]){s.flags[`bossIntro${s.zone}`]=true;
        this.say({speaker:d.name,lines:e.def.kind==='eraser'?['„Sie nennen mich den Tilger. Doch ich war der Einzige, der ihre Schreie hörte.“','Nema: „Du hast ihre Namen gestohlen.“\nAvar: „Ich nahm ihnen den Schmerz.“','Nema: „Und alles, was sie zu sich selbst machte.“\nAvar: „Was würdest du wählen? Eine Welt, die leidet? Oder eine Welt, die vergisst?“','Ein Echo bricht in seiner letzten Phase Avars Schriftwall. Lies die Angriffe, weiche aus und bewahre deine Energie.']:['Ein Hüter erhebt sich zwischen den letzten Zeichen.','Achte auf den leuchtenden Boden: Er kündigt den Angriff an. Weiche durch Wellen aus und nutze die Erholungspausen.']});return;}
      e.phase=boss?(e.hp/e.max<.34?3:e.hp/e.max<.66?2:1):1;
      const line=this.world.collision.clearLine(s.x,s.z,p.x,p.z),dx=(s.x-p.x)/Math.max(.01,dist),dz=(s.z-p.z)/Math.max(.01,dist);
      if(dist<(boss?15:9)&&e.mode==='idle'){e.mode='alert';e.timer=.6;const group=e.def.id.split(':')[0];for(const ally of this.enemies)if(ally!==e&&ally.mode==='idle'&&ally.def.id.split(':')[0]===group){ally.mode='alert';ally.timer=.6;}}
      if(e.mode==='stunned'){if(e.timer<=0)e.mode='chase';e.actor.update(dt,this.clock,'hurt');continue;}
      if(e.mode==='alert'){if(e.timer<=0)e.mode='chase';e.actor.update(dt,this.clock,'idle');continue;}
      if(e.mode==='idle'||e.mode==='patrol'){
        e.mode='idle';const returning=Math.hypot(p.x-e.def.x,p.z-e.def.z)>.4;if(returning){const v=e.navigation.direction(p,e.def,dt);this.world.collision.move(p,v.x*d.speed*dt,v.z*d.speed*dt,boss?.8:.5);}e.actor.update(dt,this.clock,returning?'walk':'idle');continue;
      }
      e.actor.facing=Math.atan2(dx,dz);
      if(e.mode==='chase'){
        const attackRange=d.ranged?10:boss?4.2:2.15;
        if(dist<attackRange&&line&&e.cooldown<=0){e.mode='attack';e.timer=boss?.95:.75;e.warning.visible=true;e.warning.position.set(p.x,p.y+.06,p.z);e.warning.scale.setScalar(boss?4.5:2.3);}
        else{const retreat=d.ranged&&dist<5?-1:1,move=dist>(d.ranged?7:1.8)||retreat<0;
          if(move){const goal=retreat<0?{x:p.x-dx*3,z:p.z-dz*3}:s,v=e.navigation.direction(p,goal,dt);this.world.collision.move(p,v.x*d.speed*dt,v.z*d.speed*dt,boss?.8:.5);}
          e.actor.update(dt,this.clock,move?'walk':'idle');}
      }else if(e.mode==='attack'){
        (e.warning.material as THREE.MeshBasicMaterial).opacity=.2+.5*(1-Math.max(0,e.timer)/(boss?.95:.75));
        e.actor.update(dt,this.clock,'cast');if(e.timer<=0){e.warning.visible=false;e.mode='recover';e.timer=boss?(e.phase===3?1:1.5):1;e.cooldown=e.timer+.35;const pattern=e.pattern++%3;
          if(e.def.kind==='root'&&pattern===1){for(let i=-1;i<=1;i++)this.spawnHazard(s.x+i*2.6,this.player.root.position.y,s.z,2.1,d.attack,false);}
          else if(boss&&pattern===1){this.spawnWave(p.x,p.y,p.z,8,d.attack);if(e.def.kind==='bell'&&e.phase>=2){this.spawnWave(p.x,p.y,p.z,10,d.attack);this.waves.at(-1)!.age=-.8;}}
          else if(d.ranged||boss&&pattern===2){const a=Math.atan2(dx,dz),spread=boss?e.phase+1:0;for(let i=-spread;i<=spread;i++){const angle=a+i*.2;this.spawnProjectile(p.x,p.y+1.5,p.z,Math.sin(angle)*7.5,Math.cos(angle)*7.5,d.attack*(1+s.zone*.08),false);}}
          else {this.effects.ring(p.x,p.y,p.z,0xd28f78,boss?4.6:2.5,.35,Math.PI*1.6,e.actor.facing);if(dist<(boss?4.8:2.8)&&line&&Math.abs(p.y-this.player.root.position.y)<2)this.hurt(d.attack*(1+s.zone*.07),e);}
          this.audio.play('sword',(p.x-s.x)/20);
          if(e.def.kind==='eraser'&&e.phase>=2)this.spawnHazard(s.x,this.player.root.position.y,s.z,3,d.attack,true);
          if(e.def.kind==='archivist'&&pattern===2){const x=e.def.x+(e.pattern%2?5:-5),z=e.def.z+2;if(!this.world.collision.blocked(x,z,.8)){this.effects.burst(p.x,p.y+2,p.z,0xa9c9c3,24);p.x=x;p.z=z;}}
        }
      }else if(e.mode==='recover'){e.actor.update(dt,this.clock,'attack',Math.max(0,1-e.timer));if(e.timer<=0)e.mode='chase';}
      p.y=elevation(s.zone,p.x,p.z)+(e.def.kind==='crow'?.7+Math.sin(this.clock*4)*.12:0);
      if(!boss&&dist>21){e.mode='idle';e.warning.visible=false;}
    }
  }
  private spawnProjectile(x:number,y:number,z:number,dx:number,dz:number,raw:number,friendly:boolean){
    const mesh=new THREE.Mesh(friendly?new THREE.TorusGeometry(.65,.09,5,16,Math.PI):new THREE.OctahedronGeometry(.22),new THREE.MeshBasicMaterial({color:friendly?0xff8c42:0xbc8fba}));mesh.position.set(x,y,z);mesh.rotation.y=Math.atan2(dx,dz);this.world.scene.add(mesh);this.projectiles.push({mesh,dx,dz,life:friendly?1.1:3.4,friendly,damage:raw,hit:new Set(),radius:friendly?.85:.35});
  }
  private updateProjectiles(dt:number){
    for(const p of this.projectiles){p.life-=dt;const at=p.mesh.position,steps=Math.max(1,Math.ceil(Math.hypot(p.dx,p.dz)*dt/.3));for(let k=0;k<steps&&p.life>0;k++){at.x+=p.dx*dt/steps;at.z+=p.dz*dt/steps;if(this.world.collision.blocked(at.x,at.z,.1)){p.life=0;break;}
      if(p.friendly){for(const e of this.enemies)if(e.hp>0&&!p.hit.has(e.def.id)&&Math.hypot(e.actor.root.position.x-at.x,e.actor.root.position.z-at.z)<p.radius+(ENEMIES[e.def.kind].boss?1:.55)&&Math.abs(e.actor.root.position.y+1-at.y)<3){p.hit.add(e.def.id);this.hitEnemy(e,p.damage,true);}}
      else if(Math.hypot(at.x-this.state.x,at.z-this.state.z)<.65&&Math.abs(at.y-this.player.root.position.y-1)<2){p.life=0;this.hurt(p.damage,undefined,false);}
    }p.mesh.rotation.z+=dt*4;if(p.life<=0){this.world.scene.remove(p.mesh);p.mesh.geometry.dispose();(p.mesh.material as THREE.Material).dispose();}}
    this.projectiles=this.projectiles.filter(p=>p.life>0);
  }
  private spawnWave(x:number,y:number,z:number,max:number,raw:number){const mesh=new THREE.Mesh(new THREE.TorusGeometry(1,.09,5,80),new THREE.MeshBasicMaterial({color:0xc393a4,transparent:true,opacity:.8}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y+.15,z);this.world.scene.add(mesh);this.waves.push({x,z,y,age:0,max,damage:raw,hit:false,mesh});}
  private updateWaves(dt:number){for(const w of this.waves){w.age+=dt;const radius=Math.max(.01,w.age*4.5);w.mesh.scale.setScalar(radius);w.mesh.visible=w.age>0;const d=Math.hypot(this.state.x-w.x,this.state.z-w.z);if(w.age>0&&!w.hit&&Math.abs(d-radius)<.6&&Math.abs(this.player.root.position.y-w.y)<1.8){w.hit=true;this.hurt(w.damage,undefined,false);}if(radius>w.max){this.world.scene.remove(w.mesh);w.mesh.geometry.dispose();(w.mesh.material as THREE.Material).dispose();}}this.waves=this.waves.filter(w=>w.age*4.5<w.max);}
  private spawnHazard(x:number,y:number,z:number,radius:number,raw:number,erase:boolean){const mesh=new THREE.Mesh(new THREE.CircleGeometry(radius,48),new THREE.MeshBasicMaterial({color:erase?0x9e779c:0xc0a073,transparent:true,opacity:.14,depthWrite:false,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y+.035,z);this.world.scene.add(mesh);this.hazards.push({x,y,z,age:0,radius,damage:raw,erase,hit:false,mesh});this.effects.ring(x,y,z,erase?0xc1a6c5:0xbdae82,radius,1.2);}
  private updateHazards(dt:number){for(const h of this.hazards){h.age+=dt;const mat=h.mesh.material as THREE.MeshBasicMaterial;if(h.age<1.2)mat.opacity=.1+h.age*.2;else{mat.color.setHex(h.erase?0x080912:0x796348);mat.opacity=h.erase?.94:.5;if(!h.hit){h.hit=true;if(Math.hypot(this.state.x-h.x,this.state.z-h.z)<h.radius&&Math.abs(this.player.root.position.y-h.y)<1.8)this.hurt(h.damage,undefined,false);if(!h.erase)this.effects.burst(h.x,h.y+.5,h.z,0xa9c9c3,32);}}if(h.age>3){this.world.scene.remove(h.mesh);h.mesh.geometry.dispose();mat.dispose();}}this.hazards=this.hazards.filter(h=>h.age<=3);}
  private findInteraction(){
    const s=this.state;this.closest=this.world.objects.filter(o=>o.group.visible&&Math.hypot(o.def.x-s.x,o.def.z-s.z)<BALANCE.interact&&(!['ash','part','ember','song'].includes(o.def.kind)||!s.discovered.includes(o.def.id))).sort((a,b)=>Math.hypot(a.def.x-s.x,a.def.z-s.z)-Math.hypot(b.def.x-s.x,b.def.z-s.z))[0];
    if(this.closest){const p=this.closest.group.position.clone().add(new THREE.Vector3(0,2.5,0));const remaining=Math.max(0,Math.ceil((s.resources[this.closest.def.id]??0)-s.activeTime));const cooldown=this.closest.def.kind==='resource'&&remaining>0?` · ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`:'';this.ui.interaction(this.closest.def.name+cooldown,this.project(p));}else this.ui.interaction(null);
  }
  private updateCamera(dt:number){
    const aspect=innerWidth/innerHeight,base=this.playing?10.8/this.state.settings.zoom:18.5;
    let height=base;const look=new THREE.Vector3();
    if(this.playing){look.set(this.state.x,1.2+elevation(this.state.zone,this.state.x,this.state.z),this.state.z);if(this.cinematic){height=4.2;look.y+=.6;}}
    else look.set(-10,3,3);
    this.target.lerp(look,this.state.settings.reduced?1:1-Math.exp(-dt*4));
    this.cameraIntro=Math.max(0,this.cameraIntro-dt);height+=this.cameraIntro*.7;
    this.camera.top=THREE.MathUtils.lerp(this.camera.top,height,1-Math.exp(-dt*5));this.camera.bottom=-this.camera.top;this.camera.left=-this.camera.top*aspect;this.camera.right=this.camera.top*aspect;
    const a=this.cinematic?this.clock*.15:Math.PI/4;this.camera.position.set(this.target.x+Math.sin(a)*26,this.target.y+28,this.target.z+Math.cos(a)*26);this.camera.lookAt(this.target);this.camera.updateProjectionMatrix();
  }
  private project(p:THREE.Vector3){p.project(this.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight};}
  private updateLabels(){
    const list=[];let activeBoss=false;
    for(const e of this.enemies){if(e.hp<=0||e.mode==='dead')continue;const boss=!!ENEMIES[e.def.kind].boss,dist=e.actor.root.position.distanceTo(this.player.root.position);if(boss&&dist<17&&bossReady(this.state)){this.ui.boss(e.def.kind,e.hp,e.max,e.phase);activeBoss=true;}else if(!boss&&dist<12){const at=this.project(e.actor.root.position.clone().add(new THREE.Vector3(0,3.3,0)));list.push({id:e.def.id,name:ENEMIES[e.def.kind].name,x:at.x,y:at.y,hp:e.hp,max:e.max});}}
    if(!activeBoss)this.ui.hideBoss();this.ui.enemies(list);
    const pictures:Record<string,string>={chest:'chest',checkpoint:'crystal',ash:'ash',gate:'ward',exit:'feather',return:'feather',stele:'ash',plate:'ash',part:'forge',mechanism:'forge',grave:'ashCharm',lore:'song',ember:'ember',song:'song',ending:'crystal'};
    const labels=this.world.objects.filter(o=>o.group.visible&&o!==this.closest&&Math.hypot(o.def.x-this.state.x,o.def.z-this.state.z)<11&&!(['ash','part','ember','song'].includes(o.def.kind)&&this.state.discovered.includes(o.def.id))).map(o=>{const at=this.project(o.group.position.clone().add(new THREE.Vector3(0,o.def.kind==='npc'?3.4:2,0)));return {name:o.def.name.split(' · ')[0],picture:o.def.kind==='npc'?o.def.data!:o.def.kind==='resource'?o.def.data!:pictures[o.def.kind]??'ash',x:at.x,y:at.y,near:Math.hypot(o.def.x-this.state.x,o.def.z-this.state.z)<7};}).filter(o=>o.x>25&&o.x<innerWidth-25&&o.y>100&&o.y<innerHeight-190);this.ui.worldLabels(labels);
    const viewport:{x:number;z:number}[]=[];const plane=new THREE.Plane(new THREE.Vector3(0,1,0),-this.player.root.position.y);
    for(const [x,y]of [[-1,-1],[1,-1],[1,1],[-1,1]]){this.raycaster.setFromCamera(new THREE.Vector2(x,y),this.camera);const p=this.raycaster.ray.intersectPlane(plane,new THREE.Vector3());if(p)viewport.push({x:p.x,z:p.z});}
    this.ui.mapTracking({enemies:this.enemies.filter(e=>e.hp>0).map(e=>({id:e.def.id,name:ENEMIES[e.def.kind].name,x:e.actor.root.position.x,z:e.actor.root.position.z,boss:!!ENEMIES[e.def.kind].boss})),path:this.commands.path,viewport});
  }
}
