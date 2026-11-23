import {chromium} from '@playwright/test';
const b=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await p.goto('http://127.0.0.1:5173/?test=1');await p.getByRole('button',{name:/Neue Geschichte/}).click();await p.waitForFunction(()=>window.__game.state.activeTime>1);await p.evaluate(()=>{document.querySelector('#chapter-banner').hidden=true;document.querySelector('#toasts').innerHTML='';});
for(let zone=1;zone<5;zone++){
  await p.evaluate(zone=>{const g=window.__game;g.state.zone=zone;g.state.level=zone+3;g.state.x=0;g.state.z=zone===4?8:2;g.state.flags={...g.state.flags,echo:true,ember:true,ward:true,voices:true,names:true,bellRepaired:true,bossIntro0:true,bossIntro1:true,bossIntro2:true,bossIntro3:true,bossIntro4:true};g.rebuild();g.target.set(0,2,g.state.z);g.state.hp=100+(g.state.level-1)*12;g.state.energy=60+(g.state.level-1)*4;g.paused=true;g.ui.close();document.querySelector('#toasts').innerHTML='';},zone);
  await p.waitForTimeout(1200);await p.screenshot({path:`artifacts/region-${zone+1}.png`});
}
console.log(JSON.stringify({errors,frameAverage:await p.evaluate(()=>window.__game.graphics.average)},null,2));await b.close();
