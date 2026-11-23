import {test,expect,type Page} from '@playwright/test';
const game=()=>((window as any).__game);
async function boot(page:Page){await page.goto('/?test=1');await page.getByRole('button',{name:/Neue Geschichte/}).click();await expect(page.locator('#hud')).toBeVisible();await page.waitForFunction(()=>(window as any).__game.state.activeTime>.4);}
async function dismiss(page:Page){for(let i=0;i<12;i++){const next=page.locator('[data-action="dialogue-next"]');if(!await next.count())break;await next.click();}}
async function at(page:Page,id:string){await page.evaluate(id=>{const g=(window as any).__game,o=g.world.objects.find((o:any)=>o.def.id===id);if(!o)throw Error('Missing '+id);g.resume();g.state.x=o.def.x;g.state.z=o.def.z+1;g.positionPlayer();g.closest=o;g.input.mouse.active=false;},id);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function interact(page:Page,id:string){await at(page,id);await page.keyboard.press('KeyF');await page.waitForFunction(()=>!(window as any).__game.input.pressed.has('KeyF'));await dismiss(page);}
async function kill(page:Page,id:string){await page.evaluate(id=>{const g=(window as any).__game,e=g.enemies.find((e:any)=>e.def.id===id);g.hitEnemy(e,100000,false);},id);await dismiss(page);}
async function pulse(page:Page,id:string){await at(page,id);await page.evaluate(()=>{const g=(window as any).__game;g.cooldowns[1]=0;g.state.energy=100;g.activeAbility=1;});await page.keyboard.press('KeyE');await page.mouse.click(880,380);await page.waitForFunction(()=>(window as any).__game.cooldowns[1]>0);await dismiss(page);}

test('startet fehlerfrei, verarbeitet Tastatur, echte Treffer, Ausweichen und Inventar',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await boot(page);const before=await page.evaluate(()=>({x:(window as any).__game.state.x,z:(window as any).__game.state.z}));
  await page.keyboard.down('ArrowUp');await page.waitForFunction(()=>Math.hypot((window as any).__game.state.x-3,(window as any).__game.state.z-10)>.6);await page.keyboard.up('ArrowUp');
  expect(await page.evaluate(()=>Math.hypot((window as any).__game.state.x-3,(window as any).__game.state.z-10))).toBeGreaterThan(.5);
  await page.evaluate(()=>{const g=(window as any).__game;g.state.x=3;g.state.z=10;g.positionPlayer();g.input.mouse.active=false;for(const e of g.enemies){e.mode='dead';e.hp=0;e.actor.root.visible=false;}const e=g.enemies[0];e.hp=e.max;e.mode='chase';e.cooldown=3;e.actor.root.visible=true;e.actor.root.position.set(4,0,10);});
  await page.keyboard.press('KeyJ');await page.waitForTimeout(400);expect(await page.evaluate(()=>{const g=(window as any).__game;return g.enemies[0].hp<g.enemies[0].max;})).toBe(true);
  await page.evaluate(()=>{const g=(window as any).__game,e=g.enemies[0];e.mode='attack';e.timer=.01;e.cooldown=0;g.invulnerable=0;});await page.waitForTimeout(220);
  const hurt=await page.evaluate(()=>(window as any).__game.state.hp);expect(hurt).toBeLessThan(100);
  await page.keyboard.press('Space');await page.waitForTimeout(80);expect(await page.evaluate(()=>{const g=(window as any).__game,h=g.state.hp;g.hurt(40);return {protected:g.state.hp===h,stamina:g.state.stamina};})).toMatchObject({protected:true});
  await page.keyboard.press('KeyI');await expect(page.getByRole('heading',{name:'Nemas Vermächtnis'})).toBeVisible();await page.keyboard.press('KeyI');await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('Escape');await expect(page.getByRole('heading',{name:'Die Welt wartet.'})).toBeVisible();await page.getByRole('button',{name:'Reise fortsetzen'}).click();expect(errors).toEqual([]);
});

test('durchläuft alle fünf Kapitel und das geheime Ende mit kontrollierten Kampf- und Wegfixtures',async({page})=>{
  test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await boot(page);
  await interact(page,'edda');for(const id of ['ash1','ash2','ash3','chest0'])await interact(page,id);await kill(page,'hollow0');await interact(page,'edda');
  expect(await page.evaluate(()=>(window as any).__game.state.flags.echo)).toBe(true);
  await interact(page,'orin');await page.getByRole('button',{name:'Schmiede öffnen'}).click();await page.locator('.panel-close').click();
  await interact(page,'iron0a');await kill(page,'guard0');await interact(page,'orin');await page.getByRole('button',{name:'Schmiede & Herstellung'}).click();await page.getByRole('button',{name:'Klinge wiederherstellen'}).click();await page.locator('.panel-close').click();
  await interact(page,'lore0');await kill(page,'graveSpirit');await pulse(page,'grave');await interact(page,'grave');await interact(page,'edda');await interact(page,'ember0');
  await pulse(page,'gate0');expect(await page.evaluate(()=>(window as any).__game.state.flags.gate)).toBe(true);await kill(page,'boss0');await interact(page,'exit0');
  expect(await page.evaluate(()=>(window as any).__game.state.zone)).toBe(1);
  await interact(page,'miro');for(const id of ['rootStele','voiceStele','starStele']){await pulse(page,id);await interact(page,id);}await dismiss(page);
  await interact(page,'lore1');await interact(page,'ember1');await pulse(page,'song1');await interact(page,'song1');await interact(page,'chest1');await kill(page,'boss1');await interact(page,'exit1');
  expect(await page.evaluate(()=>(window as any).__game.state.zone)).toBe(2);
  await interact(page,'edda2');await page.getByRole('button',{name:'Ich werde die Wahrheit bewahren.'}).click();
  for(const id of ['plate0','plate1','plate2'])await interact(page,id);await interact(page,'lore2');await interact(page,'ember2');await pulse(page,'song2');await interact(page,'song2');await interact(page,'chest2');await kill(page,'boss2');await interact(page,'exit2');
  expect(await page.evaluate(()=>(window as any).__game.state.zone)).toBe(3);
  await interact(page,'orin3');await page.getByRole('button',{name:'Zur Schmiede'}).click();await page.locator('.panel-close').click();
  await pulse(page,'song3');await interact(page,'song3');await interact(page,'miro3');
  for(const id of ['part0','part1','part2','iron3a','iron3b','core3'])await interact(page,id);
  await interact(page,'mechanism');await page.getByRole('button',{name:/Neue Seele schmieden/}).click();await kill(page,'boss3');await interact(page,'exit3');
  expect(await page.evaluate(()=>(window as any).__game.state.zone)).toBe(4);
  await at(page,'seal4a');await page.evaluate(()=>{const g=(window as any).__game;g.state.flags.bossIntro4=true;const e=g.enemies.find((e:any)=>e.def.id==='boss4');e.hp=e.max*.3;g.exposed=0;});
  const protectedHp=await page.evaluate(()=>{const g=(window as any).__game,e=g.enemies.find((e:any)=>e.def.id==='boss4'),before=e.hp;g.hitEnemy(e,99999,false);return e.hp===before;});expect(protectedHp).toBe(true);
  await page.evaluate(()=>{const g=(window as any).__game,e=g.enemies.find((e:any)=>e.def.id==='boss4');g.resume();g.state.x=e.actor.root.position.x;g.state.z=e.actor.root.position.z+4;g.positionPlayer();g.activeAbility=1;g.cooldowns[1]=0;g.state.energy=100;g.cast();});await kill(page,'boss4');
  await interact(page,'ending');await page.getByRole('button',{name:'Die Schrift neu schreiben',exact:true}).click();await expect(page.getByRole('heading',{name:'Die Schrift neu schreiben'})).toBeVisible();
  await page.screenshot({path:'artifacts/08-geheimes-ende.png'});
  expect(await page.evaluate(()=>{const g=(window as any).__game;return {ending:g.state.ending,grave:g.state.flags.graveDone,embers:g.state.flags.emberDone,song:g.state.flags.songDone,orin:g.state.flags.sparedOrin};})).toEqual({ending:'rewrite',grave:true,embers:true,song:true,orin:true});
  await page.reload();await page.getByRole('button',{name:/Reise fortsetzen/}).click();expect(await page.evaluate(()=>(window as any).__game.state.ending)).toBe('rewrite');expect(errors).toEqual([]);
});

test('prüft mobile Menüs, Touch-Schaltflächen und alle drei Glyphenmodi',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(String(e)));await boot(page);await expect(page.locator('.touch-controls')).toBeVisible();
  await page.keyboard.press('KeyI');await expect(page.getByRole('heading',{name:'Nemas Vermächtnis'})).toBeVisible();expect(await page.evaluate(()=>document.querySelector('.panel')!.scrollWidth<=document.querySelector('.panel')!.clientWidth)).toBe(true);await page.keyboard.press('KeyI');
  for(const mode of ['fine','cinematic','hybrid']){await page.evaluate(mode=>{const g=(window as any).__game;g.state.settings.mode=mode;g.applySettings();},mode);await page.waitForTimeout(150);}
  await page.locator('[data-touch="magic"]').tap();await expect(page.locator('.toast').last()).toContainText('Edda');await page.screenshot({path:'artifacts/07-mobil.png'});expect(errors).toEqual([]);await context.close();
});

