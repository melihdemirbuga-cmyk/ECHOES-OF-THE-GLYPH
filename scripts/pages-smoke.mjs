import assert from 'node:assert/strict';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {preview} from 'vite';
import {chromium,expect} from '@playwright/test';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='/ECHOES-OF-THE-GLYPH/',origin='http://127.0.0.1:5175',url=origin+base;
const dist=path.join(project,'dist'),artifacts=path.join(project,'artifacts');
const digest=data=>createHash('sha256').update(data).digest('hex');
async function filesIn(directory,prefix=''){
  const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isDirectory())files.push(...await filesIn(path.join(directory,entry.name),name+'/'));else files.push(name);}return files;
}
const files=new Set(await filesIn(dist)),html=await readFile(path.join(dist,'index.html'),'utf8');
assert(files.has('index.html'),'dist/index.html fehlt');
assert(!html.includes('/src/'),'Produktions-HTML enthält Quellcode-URLs');
assert.equal(digest(await readFile(path.join(dist,'assets/glyph-icons-v2.png'))),digest(await readFile(path.join(project,'public/assets/glyph-icons-v2.png'))),'Bildatlas unterscheidet sich vom Original');
assert.equal(digest(await readFile(path.join(dist,'favicon.svg'))),digest(await readFile(path.join(project,'public/favicon.svg'))));
const references=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1]);
assert(references.some(ref=>ref.endsWith('.js'))&&references.some(ref=>ref.endsWith('.css')));
for(const ref of references){assert(ref.startsWith(base),`Falscher Basis-Pfad: ${ref}`);assert(files.has(ref.slice(base.length)),`Datei fehlt oder Groß-/Kleinschreibung stimmt nicht: ${ref}`);}

let server,browser;const errors=[],failures=[],requests=new Set(),chapters=[];
const watch=async page=>{
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`);});
  await page.route('**/*',route=>{const request=new URL(route.request().url());if(request.protocol==='data:'||request.protocol==='blob:')return route.continue();requests.add(request.pathname);if(request.origin!==origin||!request.pathname.startsWith(base)){failures.push(`Anfrage außerhalb des Pages-Pfads: ${request.href}`);return route.abort();}return route.continue();});
};
try{
  await mkdir(artifacts,{recursive:true});
  server=await preview({root:project,preview:{host:'127.0.0.1',port:5175,strictPort:true}});
  for(const ref of references){const response=await fetch(origin+ref);assert.equal(response.status,200,ref);}
  const css=await readFile(path.join(dist,references.find(ref=>ref.endsWith('.css')).slice(base.length)),'utf8');
  for(const [,ref]of css.matchAll(/url\(["']?([^\s"')]+)["']?\)/g)){if(ref.startsWith('data:'))continue;assert(ref.startsWith(base),`CSS-Asset ohne Pages-Pfad: ${ref}`);assert(files.has(ref.slice(base.length)),`CSS-Asset fehlt: ${ref}`);assert.equal((await fetch(origin+ref)).status,200);}
  browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1440,height:900}});await watch(page);await page.goto(url);
  await expect(page.locator('.home h1')).toBeVisible();await page.getByRole('button',{name:/Neue Geschichte/}).click();await expect(page.locator('#hud')).toBeVisible();await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>typeof window.__game),'undefined','Entwicklungszugang im Produktionsbuild');
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Einstellungen',exact:true}).click();await expect(page.locator('#setting-mode')).toBeFocused();await page.keyboard.press('Escape');await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('KeyI');await expect(page.locator('.inventory-tile .game-icon').first()).toBeVisible();await page.locator('.inventory-tile').first().hover();await expect(page.getByRole('tooltip')).toBeVisible();await page.locator('.panel-close').click();
  await page.keyboard.press('Tab');await expect(page.locator('.full-map-image image')).toHaveAttribute('href',/^data:image\/png/);await page.locator('.panel-close').click();await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('Escape');const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Spielstand exportieren'}).click();const download=await downloadPromise;const snapshot=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(snapshot.version,1);
  const positions=[[3,10],[0,20],[0,21],[0,21],[0,20]];
  for(let zone=0;zone<5;zone++){
    const [x,z]=positions[zone],fixture={...snapshot,zone,x,z,checkpoint:{zone,x,z},flags:{...snapshot.flags,[`bossIntro${zone}`]:true}};
    const chooserPromise=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Spielstand importieren'}).click();await (await chooserPromise).setFiles({name:'pages-pruefung.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
    await expect(page.locator('#overlay')).toBeHidden();await expect(page.locator('#zone-roman')).toHaveText(`KAPITEL ${['I','II','III','IV','V'][zone]}`);await expect(page.locator('#hud')).toBeVisible();await page.waitForTimeout(400);
    assert(await page.locator('#game canvas').evaluate(canvas=>canvas.width>0&&canvas.height>0));chapters.push(await page.locator('#zone-name').innerText());
    if(zone===0)await page.screenshot({path:path.join(artifacts,'github-pages-spiel.png')});await page.keyboard.press('Escape');
  }
  await page.reload();await page.getByRole('button',{name:/Reise fortsetzen/}).click();await expect(page.locator('#zone-roman')).toHaveText('KAPITEL V');
  for(const missing of ['audio','panner']){
    const fallback=await browser.newPage();await watch(fallback);await fallback.addInitScript(missing=>{if(missing==='audio'){window.AudioContext=undefined;window.webkitAudioContext=undefined;}else if(window.AudioContext)window.AudioContext.prototype.createStereoPanner=undefined;},missing);
    await fallback.goto(url);await fallback.getByRole('button',{name:/Neue Geschichte/}).click();await expect(fallback.locator('#hud')).toBeVisible();await fallback.keyboard.press('KeyQ');await fallback.waitForTimeout(250);await fallback.close();
  }
  assert([...requests].some(ref=>ref===base+'assets/glyph-icons-v2.png'),'Bildatlas wurde vom Browser nicht geladen');
  assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);
  const report={result:'passed',base,url,chapters,publicAssets:'unverändert und erreichbar',saveExportImportReload:'passed',audioFallbacks:'passed',requests:[...requests].sort(),errors,failures};
  await writeFile(path.join(artifacts,'github-pages-pruefung.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();if(server)await new Promise((resolve,reject)=>server.httpServer.close(error=>error?reject(error):resolve()));}
