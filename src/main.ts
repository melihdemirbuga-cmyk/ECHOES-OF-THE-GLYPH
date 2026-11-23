import './style.css';
import './ui-v2.css';
import { Game } from './core/Game';
try {new Game();}catch(error){console.error(error);document.getElementById('ui')!.innerHTML=`<div class="fatal"><h1>Die Schrift konnte nicht erwachen.</h1><p>Dieses Spiel benötigt WebGL2. Aktiviere die Hardwarebeschleunigung in deinem Browser und lade die Seite neu.</p><p>Technischer Hinweis: ${String(error).replace(/[<>]/g,'')}</p><button onclick="location.reload()">Erneut versuchen</button></div>`;}
