import * as THREE from 'three';
import type {Game,Enemy} from './Game';
import {ENEMIES} from '../data/content';
import {bossReady,stats} from './model';
import {findPath,type Waypoint} from '../world/Navigation';
import {elevation} from '../world/World';
import {combatHud} from '../ui/Hud';
export type Skill='blade'|'ember'|'echo'|'ward'|'dodge';
export class CommandController {
  armed:Skill|null=null;path:Waypoint[]=[];target:Enemy|null=null;aimPoint:Waypoint|null=null;
  private ray=new THREE.Raycaster();private plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);private point=new THREE.Vector3();private repath=0;private heavy=false;
  private queued:{type:'move';point:Waypoint}|{type:'aim';point:Waypoint}|{type:'attack';target:Enemy}|null=null;
  constructor(private game:Game){}
  reset(){this.armed=null;this.path=[];this.target=null;this.aimPoint=null;this.repath=0;this.queued=null;}
  queueMove(point:Waypoint){this.queued={type:'move',point};}
  queueAim(point:Waypoint){this.queued={type:'aim',point};}
  queueAttack(target:Enemy){this.queued={type:'attack',target};}
  arm(skill:string){
    const g=this.game;
    if(!['blade','ember','echo','ward','dodge'].includes(skill))return;
    if(skill!=='blade'&&skill!=='dodge'&&!g.state.flags[skill]){g.ui.toast(skill==='ward'?'Schriftwall wird nach dem Wisperwald erlernt.':'Edda muss deine Glyphenkraft zuerst erwecken.');return;}
    this.armed=skill as Skill;this.heavy=skill==='blade'&&(g.input.keys.has('ShiftLeft')||g.input.keys.has('ShiftRight'));
    if(skill!=='blade'&&skill!=='dodge')g.activeAbility=['ember','echo','ward'].indexOf(skill);
    this.hud();
  }
  groundPoint():Waypoint{
    const g=this.game;if(g.input.mapAim)return g.input.mapAim;this.ray.setFromCamera(new THREE.Vector2(g.input.mouse.x,g.input.mouse.y),g.camera);this.plane.constant=0;this.ray.ray.intersectPlane(this.plane,this.point);
    for(let i=0;i<3;i++){this.plane.constant=-elevation(g.state.zone,this.point.x,this.point.z);this.ray.ray.intersectPlane(this.plane,this.point);}return {x:this.point.x,z:this.point.z};
  }
  private angle(point:Waypoint){return Math.atan2(point.x-this.game.state.x,point.z-this.game.state.z);}
  confirm(point=this.groundPoint()){
    const g=this.game;this.aimPoint=point;g.player.facing=this.angle(point);
    if(this.armed){const skill=this.armed;this.armed=null;if(skill==='blade')g.attack(this.heavy,this.angle(point));else if(skill==='dodge')this.dash();else{g.activeAbility=['ember','echo','ward'].indexOf(skill);g.cast(this.angle(point));}}
    this.hud();
  }
  moveTo(point:Waypoint){
    const g=this.game;this.armed=null;this.target=null;g.cancelPendingAttack();this.path=findPath(g.world.collision,g.state,point);this.aimPoint=point;
    if(this.path.length){const last=this.path[this.path.length-1];g.effects.ring(last.x,elevation(g.state.zone,last.x,last.z),last.z,0xb5d3ba,.5,.65);}else g.ui.toast('Für dieses Ziel ist kein begehbarer Weg erreichbar.');this.hud();
  }
  rightClick(){
    const g=this.game;g.world.scene.updateMatrixWorld(true);this.ray.setFromCamera(new THREE.Vector2(g.input.mouse.x,g.input.mouse.y),g.camera);
    const enemies=g.enemies.filter(e=>e.hp>0&&e.actor.root.visible&&(!ENEMIES[e.def.kind].boss||bossReady(g.state)));
    const hit=this.ray.intersectObjects(enemies.map(e=>e.actor.root),true)[0];let target=hit?enemies.find(e=>{let o:THREE.Object3D|null=hit.object;while(o){if(o===e.actor.root)return true;o=o.parent;}return false;}):undefined;
    if(!target){let nearest=Infinity;for(const e of enemies){const root=e.actor.root,center=root.position.clone().add(new THREE.Vector3(0,1.45*root.scale.y,0)),point=this.ray.ray.intersectSphere(new THREE.Sphere(center,.8*Math.max(root.scale.x,root.scale.y,root.scale.z)),new THREE.Vector3());if(point){const distance=point.distanceTo(this.ray.ray.origin);if(distance<nearest){nearest=distance;target=e;}}}}
    if(target)this.attackTarget(target);
    else this.moveTo(this.groundPoint());
  }
  attackTarget(target:Enemy){this.stop();if(target.hp<=0)return;if(ENEMIES[target.def.kind].boss&&!bossReady(this.game.state)){this.game.ui.toast('Dieser Hüter ist noch versiegelt. Folge zuerst deinem Questziel.');return;}this.target=target;this.repath=0;this.hud();}
  stop(){this.target=null;this.path=[];this.armed=null;this.game.cancelPendingAttack();this.hud();}
  dash(){const g=this.game;if(this.aimPoint)g.player.facing=this.angle(this.aimPoint);else if(g.input.mouse.active)g.player.facing=this.angle(this.groundPoint());g.dodge();this.hud();}
  process(){const i=this.game.input;
    const bindings=[['KeyQ','blade'],['KeyW','ember'],['KeyE','echo'],['KeyR','ward'],['Space','dodge']] as const;
    for(const [code,skill]of bindings)if(i.take(code))this.arm(skill);
    if(i.moveClick)this.rightClick();if(i.take('KeyS'))this.stop();
    const queued=this.queued;this.queued=null;if(queued){if(queued.type==='move')this.moveTo(queued.point);else if(queued.type==='aim'){this.aimPoint=queued.point;this.game.player.facing=this.angle(queued.point);}else this.attackTarget(queued.target);}
    if(this.armed){this.aimPoint=this.groundPoint();this.game.player.facing=this.angle(this.aimPoint);}
    for(const [code,skill]of bindings)if(i.takeRelease(code)&&this.armed===skill)this.confirm();
    for(let n=0;n<6;n++)if(i.take(`Digit${n+1}`))this.game.useBag(n);
  }
  update(dt:number){
    const g=this.game,axes=g.input.axes();this.repath-=dt;
    if(Math.hypot(axes.x,axes.y)>.1){this.target=null;this.path=[];return {dx:(axes.x+axes.y)*Math.SQRT1_2,dz:(axes.y-axes.x)*Math.SQRT1_2};}
    if(this.target){const e=this.target;if(e.hp<=0){this.target=null;this.path=[];}
      else{const p=e.actor.root.position,d=Math.hypot(p.x-g.state.x,p.z-g.state.z),inRange=d<stats(g.state).reach-.15&&Math.abs(p.y-g.player.root.position.y)<2&&g.world.collision.clearLine(g.state.x,g.state.z,p.x,p.z);
        if(inRange){this.path=[];if(!this.armed)g.attack(false,this.angle(p),true);}
        else if(this.repath<=0){this.path=findPath(g.world.collision,g.state,p);this.repath=.45;}}
    }
    while(this.path.length&&Math.hypot(this.path[0].x-g.state.x,this.path[0].z-g.state.z)<.18)this.path.shift();
    const next=this.path[0];let dx=0,dz=0;if(next){const x=next.x-g.state.x,z=next.z-g.state.z,len=Math.hypot(x,z),scale=Math.min(1,len/Math.max(.01,8*dt));dx=x/len*scale;dz=z/len*scale;}
    this.hud();return {dx,dz};
  }
  private hud(){const g=this.game;combatHud(this.armed,g.getDodgeCooldown(),g.getAttackCooldown(),this.target?ENEMIES[this.target.def.kind].name:null);}
}
