import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const results=[],errors=[];
for(const [width,height]of [[1440,900],[1366,768],[1280,720],[1024,600],[564,700],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1}),page=await context.newPage();page.on('pageerror',error=>errors.push(String(error)));
  await page.goto('http://127.0.0.1:4173/?layout=1');await page.locator('.home h1').waitFor();
  await page.getByRole('button',{name:/Neue Geschichte/}).click();await page.locator('#hud').waitFor();await page.reload();await page.getByRole('button',{name:/Reise fortsetzen/}).waitFor();
  const layout=await page.evaluate(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right};};return {brand:box('.home-brand'),subtitle:box('.home-body>.eyebrow'),nav:box('.home-nav'),footer:box('.home-footer'),width:document.querySelector('.home').scrollWidth,viewport:innerWidth,scrollable:document.querySelector('.home-scrim').scrollHeight>innerHeight};});
  if(layout.brand.bottom+12>layout.subtitle.top||layout.nav.bottom+12>layout.footer.top||layout.width>layout.viewport)throw Error(`Überlappung bei ${width}x${height}: ${JSON.stringify(layout)}`);
  if(width===1366||width===390)await page.screenshot({path:`artifacts/hauptmenue-100-${width}x${height}.png`});
  await page.locator('[data-action=settings]').click();await page.getByRole('heading',{name:'Die Form der Schrift'}).waitFor();results.push({size:`${width}x${height}`,gap:Math.round(layout.subtitle.top-layout.brand.bottom),scrollable:layout.scrollable,settings:'reachable'});await context.close();
}
await browser.close();if(errors.length)throw Error(JSON.stringify(errors));console.log(JSON.stringify({zoom:'100%',results,errors},null,2));
