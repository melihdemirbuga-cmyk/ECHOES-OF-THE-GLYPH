export type Slot = 'weapon' | 'armor' | 'talisman' | 'relic';
export interface ItemDef { name: string; kind: Slot | 'material' | 'consumable' | 'quest'; rarity: number; attack?: number; armor?: number; hp?: number; energy?: number; reach?: number; speed?: number; price: number; description: string; }
export const ITEMS: Record<string, ItemDef> = {
  rusty: { name: 'Rostige Erinnerung', kind: 'weapon', rarity: 0, attack: 8, reach: 2.8, speed: .46, price: 12, description: 'Eine beschädigte Klinge. Etwas in ihr erinnert sich an deine Hand.' },
  chapelBlade: { name: 'Eisenklinge der Kapelle', kind: 'weapon', rarity: 1, attack: 14, reach: 3, speed: .43, price: 65, description: 'Gut ausbalanciert. Aus der Truhe der alten Hüter.' },
  lastLine: { name: 'Schwert der letzten Zeile', kind: 'weapon', rarity: 2, attack: 22, reach: 3.2, speed: .46, price: 140, description: 'Orin hat der Klinge ihren Namen zurückgegeben.' },
  forestBlade: { name: 'Klinge des Wisperwalds', kind: 'weapon', rarity: 2, attack: 24, reach: 3, speed: .42, price: 180, description: 'Jeder Nahkampftreffer heilt 2 Lebenspunkte.' },
  ashBlade: { name: 'Aschenschneider', kind: 'weapon', rarity: 3, attack: 34, reach: 3.6, speed: .7, price: 280, description: 'Schweres Schwert. Schwere Angriffe verursachen 25 % mehr Schaden.' },
  echoBlade: { name: 'Echosplitter', kind: 'weapon', rarity: 4, attack: 38, reach: 3.1, speed: .44, price: 400, description: 'Jeder dritte Klingentreffer gewinnt 5 Glyphenenergie zurück.' },
  robe: { name: 'Zerfallenes Gewand', kind: 'armor', rarity: 0, armor: 2, price: 10, description: 'Die Nähte halten mehr als Stoff zusammen.' },
  mail: { name: 'Mantel des Randwächters', kind: 'armor', rarity: 1, armor: 10, price: 85, description: 'Eine leichte Panzerung aus beschriebenem Eisen.' },
  vestment: { name: 'Gewand der Ersten Schrift', kind: 'armor', rarity: 3, armor: 19, energy: 10, price: 220, description: 'Bewahrt Körper und Glyphen. +10 maximale Energie.' },
  ashCharm: { name: 'Talisman der Asche', kind: 'talisman', rarity: 2, hp: 15, price: 90, description: 'Ilyas Name lebt weiter. +15 maximale Lebenspunkte.' },
  whisper: { name: 'Ring des Wisperns', kind: 'talisman', rarity: 1, energy: 15, price: 80, description: '+15 maximale Glyphenenergie.' },
  feather: { name: 'Feder der ersten Schrift', kind: 'relic', rarity: 3, price: 210, description: 'Miros Lied erweitert die Reichweite des Echo-Pulses um 2 Meter.' },
  heart: { name: 'Herz der vergessenen Glocke', kind: 'relic', rarity: 3, price: 230, description: 'Bewahrt dich einmal pro Wiedererwachen vor dem Tod und stellt 30 % Leben her.' },
  iron: { name: 'Altes Eisen', kind: 'material', rarity: 0, price: 8, description: 'Für Waffen, Rüstungen und den alternativen Glockenmechanismus.' },
  resin: { name: 'Aschenharz', kind: 'material', rarity: 1, price: 10, description: 'Aus flüsternden Wurzeln. Zutat für Heiltränke.' },
  core: { name: 'Glutkern', kind: 'material', rarity: 2, price: 30, description: 'Die Wärme eines besiegten Wächters.' },
  keeperCore: { name: 'Glutkern des Randwächters', kind: 'quest', rarity: 2, price: 0, description: 'An Nemas Klinge gebunden. Für Orins erste Reparatur; kann nicht verkauft oder anderweitig verbraucht werden.' },
  crystal: { name: 'Erinnerungskristall', kind: 'material', rarity: 3, price: 50, description: 'Verdichtete Schrift für die höchste Schmiedestufe.' },
  potion: { name: 'Kleiner Heiltrank', kind: 'consumable', rarity: 0, price: 22, description: 'Stellt 35 Lebenspunkte wieder her.' },
  largePotion: { name: 'Großer Heiltrank', kind: 'consumable', rarity: 1, price: 45, description: 'Stellt 75 Lebenspunkte wieder her.' },
  essence: { name: 'Glyphenessenz', kind: 'consumable', rarity: 1, price: 25, description: 'Stellt 30 Glyphenenergie wieder her.' },
  guardPotion: { name: 'Wächtertrank', kind: 'consumable', rarity: 1, price: 30, description: '30 Sekunden lang +15 Verteidigung.' },
  oil: { name: 'Glutöl', kind: 'consumable', rarity: 1, price: 32, description: '30 Sekunden lang +10 Klingenschaden.' },
  ash: { name: 'Aschezeichen', kind: 'quest', rarity: 2, price: 0, description: 'Ein verlorenes Zeichen. Edda kennt seine Bedeutung.' },
  ember: { name: 'Letzte Glut', kind: 'quest', rarity: 2, price: 0, description: 'Drei dieser Steine erneuern Orins Schmiedefeuer.' },
  song: { name: 'Klangfragment', kind: 'quest', rarity: 2, price: 0, description: 'Ein Takt von Miros vergessenem Lied.' }
};
export const RARITIES = ['Gewöhnlich', 'Ungewöhnlich', 'Selten', 'Episch', 'Legendär'];
export const BALANCE = { walk: 5.3, sprint: 8, dodgeSpeed: 15, dodgeDuration: .3, dodgeCost: 25, interact: 3.1, staminaRegen: 24, energyRegen: 4, maxLevel: 20, resourceRespawn: 90, enemyRespawn:120, autoAttackMultiplier:.62 };
export const RESOURCE_RESPAWN:Record<string,number>={iron:90,resin:60,core:120};
export const ABILITIES = [
  { id: 'ember', name: 'Glutklinge', symbol: 'ϟ', key: 'W', cost: 15, cooldown: 3, description: 'Ein durchdringender Glyphenbogen.' },
  { id: 'echo', name: 'Echo-Puls', symbol: '◎', key: 'E', cost: 20, cooldown: 5, description: 'Schaden, Rückstoß und verborgene Schrift.' },
  { id: 'ward', name: 'Schriftwall', symbol: '◇', key: 'R', cost: 25, cooldown: 12, description: 'Absorbiert 50 Schaden für 8 Sekunden.' }
] as const;
export type EnemyKind = 'hollow' | 'crow' | 'guard' | 'spirit' | 'keeper' | 'root' | 'archivist' | 'bell' | 'eraser';
export const ENEMIES: Record<EnemyKind, { name: string; hp: number; attack: number; armor: number; speed: number; xp: number; gold: number; boss?: boolean; ranged?: boolean }> = {
  hollow: { name: 'Nullhülle', hp: 48, attack: 15, armor: 3, speed: 2, xp: 22, gold: 8 },
  crow: { name: 'Satzkrähe', hp: 38, attack: 13, armor: 1, speed: 4, xp: 26, gold: 9 },
  guard: { name: 'Randwächter', hp: 105, attack: 24, armor: 12, speed: 1.5, xp: 55, gold: 24 },
  spirit: { name: 'Fragmentgeist', hp: 66, attack: 17, armor: 4, speed: 2.1, xp: 40, gold: 16, ranged: true },
  keeper: { name: 'Der Gebrochene Hüter', hp: 340, attack: 25, armor: 10, speed: 2.3, xp: 220, gold: 130, boss: true },
  root: { name: 'Der Wurzelgebundene', hp: 470, attack: 28, armor: 12, speed: 1.8, xp: 280, gold: 160, boss: true },
  archivist: { name: 'Der Namenlose Archivar', hp: 540, attack: 29, armor: 12, speed: 2, xp: 330, gold: 180, boss: true, ranged: true },
  bell: { name: 'Der Stumme Kantor', hp: 640, attack: 32, armor: 16, speed: 2.4, xp: 400, gold: 210, boss: true },
  eraser: { name: 'AVAR · Der Tilger', hp: 1000, attack: 30, armor: 15, speed: 2.2, xp: 600, gold: 300, boss: true, ranged: true }
};
export type InteractKind = 'npc' | 'chest' | 'resource' | 'ash' | 'checkpoint' | 'gate' | 'exit' | 'return' | 'stele' | 'plate' | 'part' | 'mechanism' | 'grave' | 'lore' | 'ember' | 'song' | 'ending';
export interface InteractDef { id: string; kind: InteractKind; name: string; x: number; z: number; data?: string; hidden?: boolean; }
export interface SpawnDef { id: string; kind: EnemyKind; x: number; z: number; }
export interface ZoneDef { name: string; english: string; roman: string; subtitle: string; quote: string; spawn: [number, number]; boss: EnemyKind; objects: InteractDef[]; enemies: SpawnDef[]; }
const obj = (id: string, kind: InteractKind, name: string, x: number, z: number, data?: string, hidden = false): InteractDef => ({ id, kind, name, x, z, data, hidden });
const mob = (id: string, kind: EnemyKind, x: number, z: number): SpawnDef => ({ id, kind, x, z });
export const ZONES: ZoneDef[] = [
  {
    name: 'Die vergessene Kapelle', english: 'THE FORGOTTEN CHAPEL', roman: 'I', subtitle: 'DAS ERWACHEN DER LETZTEN HÜTERIN', quote: 'Die Glocke ist nicht verstummt. Jemand hat ihr den Klang genommen.', spawn: [3, 10], boss: 'keeper',
    objects: [obj('edda','npc','Edda · Die Archivarin',0,4,'edda'),obj('orin','npc','Orin · Schmiede',12,10,'orin'),obj('ash1','ash','Aschezeichen',-5,11),obj('ash2','ash','Aschezeichen',-12,8),obj('ash3','ash','Aschezeichen',-16,0),obj('chest0','chest','Eisentruhe der Hüter',-8,15,'chapelBlade'),obj('iron0a','resource','Alte Eisenader',11,3,'iron'),obj('iron0b','resource','Alte Eisenader',17,-3,'iron'),obj('gate0','gate','Versiegeltes Tor',7,-15),obj('exit0','exit','Zum Wisperwald',7,-25),obj('grave','grave','Der namenlose Grabstein',-18,-8,undefined,true),obj('lore0','lore','Ein Brief an Ilya',-18,12,'Ilya, du sagtest: Ein Name ist ein Zuhause. Ich werde deinen bewahren. — E.'),obj('ember0','ember','Glut der Kapelle',16,-10)],
    enemies: [mob('hollow0','hollow',-12,4),mob('hollow0:flank','hollow',-14.3,2.7),mob('hollow0:rear','hollow',-13.2,1),mob('hollow1','hollow',-17,9),mob('hollow1:flank','hollow',-19.3,7.7),mob('guard0','guard',12,-8),mob('guard0:flank','hollow',14.3,-9.3),mob('graveSpirit','spirit',-18,-4),mob('boss0','keeper',7,-20)]
  },
  {
    name: 'Der Wisperwald', english: 'WHISPERING FOREST', roman: 'II', subtitle: 'DER WALD, DER SICH ERINNERT', quote: 'Erst schlägt die Wurzel. Dann spricht die Stimme. Zuletzt erwacht der Stern.', spawn: [0,20], boss: 'root',
    objects: [obj('back1','return','Zur Kapelle',0,24),obj('miro','npc','Miro · Das verlorene Echo',-3,13,'miro'),obj('veyra','npc','Veyra · Handel',9,15,'veyra'),obj('rootStele','stele','I · Die Wurzel',-11,5,'0',true),obj('voiceStele','stele','II · Die Stimme',7,0,'1',true),obj('starStele','stele','III · Der Stern',-5,-9,'2',true),obj('forestPoem','lore','Das Gedicht der drei Stimmen',-5,8,'Erst schlägt die Wurzel. Dann spricht die Stimme. Zuletzt erwacht der Stern. Ein Echo lässt Verborgenes sprechen.'),obj('resin1','resource','Flüsternde Wurzel',12,6,'resin'),obj('iron1','resource','Eisen im Wurzelwerk',-15,-6,'iron'),obj('chest1','chest','Glyphentruhe',15,-4,'forestBlade'),obj('ember1','ember','Glut des Waldes',13,-12),obj('song1','song','Der erste Takt',-15,12,undefined,true),obj('lore1','lore','Avars Versprechen',-12,-15,'Avar schrieb: Ich höre ihre Schreie noch im Schlaf. Wenn ich nur den Schmerz löschen könnte, würden sie endlich frei sein.'),obj('exit1','exit','Zur Krypta',0,-24)],
    enemies: [mob('crow1a','crow',1,7),mob('crow1a:flank','crow',3.3,5.7),mob('crow1a:rear','crow',2.1,4),mob('crow1b','crow',-10,0),mob('crow1b:flank','crow',-12.3,-1.3),mob('spirit1','spirit',9,-6),mob('spirit1:flank','hollow',11.3,-7.3),mob('guard1','guard',-8,-12),mob('guard1:flank','hollow',-10.3,-13.3),mob('boss1','root',0,-19)]
  },
  {
    name: 'Die Krypta der verlorenen Namen', english: 'CRYPT OF LOST WORDS', roman: 'III', subtitle: 'DIE WAHRHEIT UNTER DEM STEIN', quote: 'Wir banden nicht den Tilger. Wir banden jene, die er vergessen wollte.', spawn: [0,21], boss: 'archivist',
    objects: [obj('back2','return','Zum Wisperwald',0,25),obj('edda2','npc','Edda · Die verschwiegene Wahrheit',-5,13,'edda'),obj('plate0','plate','Platte: Name',-10,6,'0'),obj('plate1','plate','Platte: Schmerz',11,1,'1'),obj('plate2','plate','Platte: Erinnerung',-9,-8,'2'),obj('cryptPoem','lore','Das Archivgesetz',4,11,'Zuerst gab ich dir einen Namen. Dann teilte ich deinen Schmerz. So wurdest du meine Erinnerung. Die Platten bewahren diese Reihenfolge.'),obj('iron2','resource','Archiv-Eisen',13,10,'iron'),obj('chest2','chest','Versiegelte Archivtruhe',14,-9,'vestment'),obj('ember2','ember','Glut des Archivs',-15,-12),obj('song2','song','Der zweite Takt',14,5,undefined,true),obj('lore2','lore','Nemas Unterschrift',-13,14,'Ich, Nema, gebe meine Erinnerung für die drei Siegel. Bewahrt die Namen. Auch dann, wenn ihr mir eines Tages nicht verzeihen könnt.'),obj('exit2','exit','Zum Glockenturm',0,-24)],
    enemies: [mob('spirit2a','spirit',-9,1),mob('spirit2a:flank','hollow',-11.3,-0.3),mob('spirit2b','spirit',10,-6),mob('spirit2b:flank','hollow',12.3,-7.3),mob('guard2','guard',1,-9),mob('guard2:flank','hollow',3.3,-10.3),mob('hollow2','hollow',-13,10.5),mob('hollow2:flank','hollow',-15.3,9.2),mob('boss2','archivist',0,-19)]
  },
  {
    name: 'Der Turm der letzten Glocke', english: 'THE BELL TOWER', roman: 'IV', subtitle: 'DIE GLOCKE OHNE STIMME', quote: 'Man kann einen Klang nicht bewahren, indem man alle Stimmen opfert.', spawn: [0,21], boss: 'bell',
    objects: [obj('back3','return','Zur Krypta',0,25),obj('orin3','npc','Orin · Der Glockenwächter',8,15,'orin'),obj('part0','part','Das erste Zahnrad',-9,9),obj('part1','part','Die Glockenzunge',10,0),obj('part2','part','Die letzte Feder',-9,-10),obj('iron3a','resource','Schachteisen',13,8,'iron'),obj('iron3b','resource','Schachteisen',-14,0,'iron'),obj('core3','resource','Verdichtete Glut',13,-8,'core'),obj('mechanism','mechanism','Der Glockenmechanismus',0,-12),obj('chest3','chest','Truhe des Kantors',14,-14,'ashBlade'),obj('song3','song','Der letzte Takt',-15,12,undefined,true),obj('miro3','npc','Miro · Das vergessene Lied',-5,16,'miro'),obj('exit3','exit','Ins ungeschriebene Nichts',0,-25)],
    enemies: [mob('spirit3a','spirit',-8,3),mob('spirit3a:flank','hollow',-10.3,1.7),mob('spirit3b','spirit',8,-6),mob('spirit3b:flank','hollow',10.3,-7.3),mob('guard3','guard',-10,-6),mob('guard3:flank','hollow',-12.3,-7.3),mob('guard3:rear','hollow',-11.2,-9),mob('boss3','bell',0,-20)]
  },
  {
    name: 'Das ungeschriebene Nichts', english: 'THE UNWRITTEN VOID', roman: 'V', subtitle: 'DAS LETZTE UNGESCHRIEBENE WORT', quote: 'Was würdest du wählen, Nema? Eine Welt, die leidet? Oder eine Welt, die vergisst?', spawn: [0,20], boss: 'eraser',
    objects: [obj('back4','return','Zum Glockenturm',0,24),obj('miro4','npc','Miro · Ein Versprechen',-5,14,'miro'),obj('veyra4','npc','Veyra · Letzter Handel',7,14,'veyra'),obj('seal4a','lore','Das Siegel der Namen',-9,1,'Ein Echo bricht Avars Schriftwall. In seiner letzten Gestalt bleibt er danach zehn Sekunden verwundbar.'),obj('seal4b','lore','Das Siegel des Schmerzes',10,1,'Avar war der höchste Hüter des Archivs. Er wollte die Trauer löschen. Doch ohne Verlust verloren die Menschen auch ihre Liebe.'),obj('chest4','chest','Die letzte Archivtruhe',13,8,'echoBlade'),obj('ending','ending','Die Erste Schrift',0,-20)],
    enemies: [mob('spirit4','spirit',-7,7),mob('spirit4:flank','hollow',-9.3,5.7),mob('guard4','guard',8,5),mob('guard4:flank','hollow',10.3,3.7),mob('boss4','eraser',0,-10)]
  }
];
export const RECIPES: { id: string; name: string; gold: number; needs: Record<string,number>; output: string }[] = [
  { id: 'potion', name: 'Heiltrank brauen', gold: 8, needs: { resin: 1 }, output: 'potion' },
  { id: 'essence', name: 'Glyphenessenz binden', gold: 12, needs: { resin: 2 }, output: 'essence' },
  { id: 'mail', name: 'Wächtermantel schmieden', gold: 40, needs: { iron: 4 }, output: 'mail' },
  { id: 'oil', name: 'Glutöl destillieren', gold: 10, needs: { core: 1 }, output: 'oil' }
];
export const SHOP = ['potion','largePotion','essence','guardPotion','oil','iron','resin','core','whisper','mail'];


