// The release server uses only Node's standard library. No npm or internet is needed.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','dist');
const port=Number(process.env.ECHOES_PORT)||4173;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1');
    if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({game:'echoes-of-the-glyph',version:'1.2.0'}));return;}
    const pathname=decodeURIComponent(url.pathname);const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));const relative=path.relative(root,target);
    if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end('Forbidden');return;}
    if(!(await stat(target)).isFile())throw Error('not a file');
    res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(await readFile(target));
  }catch{res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});res.end('Diese Seite existiert nicht. Öffne http://127.0.0.1:'+port);}
});
server.on('error',error=>{console.error('Der Spielserver konnte nicht starten:',error.message);process.exit(1);});
server.listen(port,'127.0.0.1',()=>console.log(`ECHOES OF THE GLYPH: http://127.0.0.1:${port}`));
