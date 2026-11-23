export class Input {
  keys=new Set<string>();pressed=new Set<string>();released=new Set<string>();mouse={x:0,y:0,active:false};mapAim:{x:number;z:number}|null=null;attack=false;moveClick=false;magic=false;heavy=false;stick={x:0,y:0};
  constructor(canvas:HTMLCanvasElement){
    window.addEventListener('keydown',e=>{if((e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)&&e.code!=='Escape')return;const inDialog=e.target instanceof HTMLElement&&!!e.target.closest('[role="dialog"]');if(inDialog&&['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!e.repeat)this.pressed.add(e.code);this.keys.add(e.code);});
    window.addEventListener('keyup',e=>{if(this.keys.has(e.code))this.released.add(e.code);this.keys.delete(e.code);});
    window.addEventListener('blur',()=>this.clear());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();});
    canvas.addEventListener('pointermove',e=>{this.mapAim=null;this.mouse.x=e.clientX/window.innerWidth*2-1;this.mouse.y=1-e.clientY/window.innerHeight*2;this.mouse.active=e.pointerType==='mouse';});
    canvas.addEventListener('pointerdown',e=>{this.mapAim=null;this.mouse.x=e.clientX/window.innerWidth*2-1;this.mouse.y=1-e.clientY/window.innerHeight*2;this.mouse.active=e.pointerType==='mouse';if(e.button===0)this.attack=true;if(e.button===2)this.moveClick=true;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
  }
  bindTouch(){
    const stick=document.querySelector<HTMLElement>('#stick');if(!stick)return;
    const move=(e:PointerEvent)=>{const r=stick.getBoundingClientRect(),dx=(e.clientX-r.x-r.width/2)/40,dy=(e.clientY-r.y-r.height/2)/40;const l=Math.max(1,Math.hypot(dx,dy));this.stick={x:dx/l,y:dy/l};stick.style.setProperty('--sx',`${this.stick.x*28}px`);stick.style.setProperty('--sy',`${this.stick.y*28}px`);};
    stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);move(e);});stick.addEventListener('pointermove',e=>{if(stick.hasPointerCapture(e.pointerId))move(e);});
    const end=()=>{this.stick={x:0,y:0};stick.style.setProperty('--sx','0px');stick.style.setProperty('--sy','0px');};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
    document.querySelectorAll<HTMLElement>('[data-touch]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const k=b.dataset.touch!;if(k==='attack')this.attack=true;else if(k==='magic')this.magic=true;else{this.pressed.add(k);this.keys.add(k);}});b.addEventListener('pointerup',()=>{const k=b.dataset.touch!;if(this.keys.has(k))this.released.add(k);this.keys.delete(k);});b.addEventListener('pointercancel',()=>this.keys.delete(b.dataset.touch!));});
  }
  take(code:string){const has=this.pressed.has(code);this.pressed.delete(code);return has;}
  takeRelease(code:string){const has=this.released.has(code);this.released.delete(code);return has;}
  axes(){let x=Number(this.keys.has('ArrowRight'))-Number(this.keys.has('ArrowLeft'))+this.stick.x;let y=Number(this.keys.has('ArrowDown'))-Number(this.keys.has('ArrowUp'))+this.stick.y;const n=Math.max(1,Math.hypot(x,y));return {x:x/n,y:y/n};}
  frame(){this.pressed.clear();this.released.clear();this.attack=false;this.moveClick=false;this.magic=false;this.heavy=false;}
  clear(){this.keys.clear();this.mapAim=null;this.frame();this.stick={x:0,y:0};}
}
