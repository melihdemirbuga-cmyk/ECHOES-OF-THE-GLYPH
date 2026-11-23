import { ZONES, ITEMS, type InteractDef } from '../data/content';
import { addItem, gather, openChest, puzzleStep, reward, secretReady, type SaveState } from '../core/model';
export interface Choice {label:string;action:()=>void;disabled?:boolean;}
export interface Dialogue {speaker:string;lines:string[];choices?:Choice[];}
export interface CampaignHost { say:(dialogue:Dialogue)=>void;toast:(text:string)=>void;menu:(name:'forge'|'shop')=>void;travel:(zone:number)=>void;save:()=>void;ending:()=>void; }
export class Campaign {
  constructor(public s:SaveState,private host:CampaignHost){}
  private say(speaker:string,lines:string[],choices?:Choice[]){this.host.say({speaker,lines,choices});}
  private mark(id:string){if(!this.s.discovered.includes(id))this.s.discovered.push(id);}
  interact(d:InteractDef){
    const s=this.s,h=this.host;
    if(d.kind==='npc'){this.npc(d.data!);return;}
    if(d.kind==='resource'){const collected=gather(s,d.id,d.data!);const remaining=Math.max(0,Math.ceil((s.resources[d.id]??0)-s.activeTime));h.toast(collected?`${ITEMS[d.data!].name} +${d.data==='iron'?5:d.data==='core'?2:3} · Erneut sammelbar in ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`:`${d.name} erschöpft · Noch ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} aktive Spielzeit`);}
    else if(d.kind==='chest'){
      if(openChest(s,d.id,d.data!))this.say('Ein Fund zwischen den Zeilen',[`${ITEMS[d.data!].name}\n+${35+s.zone*20} Gold · +2 Eisen · +1 Heiltrank${s.zone>1?' · +1 Erinnerungskristall':''}`,'Dein Fund liegt im Inventar. Mit I kannst du Ausrüstung vergleichen und anlegen.']);
      else h.toast('Diese Truhe hat dir alles gegeben.');
    }else if(d.kind==='ash'){
      if(!s.discovered.includes(d.id)){this.mark(d.id);addItem(s,'ash');h.toast(`Aschezeichen gefunden · ${s.inventory.ash}/3`);}
    }else if(d.kind==='lore'){
      this.mark(d.id);reward(s,d.id,0,20);this.say(d.name,[d.data!]);
    }else if(d.kind==='song'||d.kind==='ember'){
      if(!s.discovered.includes(d.id)){this.mark(d.id);addItem(s,d.kind);h.toast(d.kind==='song'?`Klangfragment · ${s.inventory.song}/3. Miro hört dich.`:`Letzte Glut · ${s.inventory.ember}/3. Bringe sie zu Orin.`);}
    }else if(d.kind==='stele'||d.kind==='plate'){
      const key=d.kind==='stele'?'voices':'names',result=puzzleStep(s,key,Number(d.data));
      h.toast(result==='wrong'?'Die Schrift verstummt. Beginne erneut mit der ersten Zeile.':result==='solved'?'Die Erinnerung ist vollständig. Der nördliche Hüter erwacht.':result==='done'?'Die Schrift ruht im Gleichgewicht.':`Ein Zeichen antwortet · ${s.puzzle[key]}/3`);
    }else if(d.kind==='part'){
      if(!s.discovered.includes(d.id)){this.mark(d.id);h.toast(`${d.name} geborgen. Der Mechanismus wartet im Norden.`);}
    }else if(d.kind==='mechanism')this.mechanism();
    else if(d.kind==='gate')h.toast(s.flags.repaired?'Ein Echo kann dieses Tor öffnen. Halte E und lasse die Taste los, um das Echo zu wirken.':'Repariere zuerst mit Orin deine Klinge.');
    else if(d.kind==='grave'){
      if(!s.discovered.includes('lore0'))this.say('Der namenlose Grabstein',['Eine Hand hat einen einzigen Buchstaben bewahrt: I. Ein Brief liegt südlich des Friedhofs.']);
      else if(!s.defeated.includes('graveSpirit'))h.toast('Ein Fragmentgeist hält den Namen fest. Besiege ihn.');
      else {this.mark('grave');s.flags.graveRestored=true;this.say('Ilya',['Du schreibst den Namen in den Stein. Die fremde Trauer fühlt sich für einen Moment wie deine eigene an.','Edda sollte erfahren, dass Ilyas Name wieder ein Zuhause hat.']);}
    }else if(d.kind==='exit'){
      if(s.defeated.includes(`boss${s.zone}`))h.travel(s.zone+1);else h.toast('Der Hüter dieses Ortes bewacht noch den Weg.');
    }else if(d.kind==='return')h.travel(s.zone-1);
    else if(d.kind==='ending'&&s.defeated.includes('boss4'))this.chooseEnding();
    h.save();
  }
  reveal(x:number,z:number,radius:number){
    let n=0;for(const d of ZONES[this.s.zone].objects){if(d.hidden&&Math.hypot(d.x-x,d.z-z)<=radius&&!this.s.discovered.includes(`reveal:${d.id}`)){this.mark(`reveal:${d.id}`);n++;}}
    if(this.s.zone===0&&Math.hypot(x-7,z+15)<radius&&this.s.flags.repaired&&!this.s.flags.gate){this.s.flags.gate=true;this.host.toast('Das Tor erinnert sich an seinen Namen. Der Hüter erwacht.');this.host.save();}
    else if(n)this.host.toast(`${n===1?'Eine verborgene Erinnerung antwortet':`${n} verborgene Erinnerungen antworten`}.`);
    this.host.save();
  }
  npc(id:string){
    const s=this.s,h=this.host;
    if(id==='edda'){
      if(!s.flags.intro){s.flags.intro=true;this.say('Edda · Die Archivarin',['Du bist später gekommen, als die Schrift es vorgesehen hat.','Du fragst, ob ich dich kenne? Ich kannte deinen Namen. Einst. Doch selbst Namen sterben in dieser Welt.','Suche drei Aschezeichen auf dem Friedhof westlich der Kapelle. Besiege die Nullhülle und öffne die alte Truhe. Dann kehre zu mir zurück.']);}
      else if(s.zone>=2&&!s.flags.truth){s.flags.truth=true;this.say('Edda · Die verschwiegene Wahrheit',['Ja, ich wusste es. Du hast damals deine Erinnerung für die Siegel gegeben. Und mit deiner Erinnerung banden wir auch die Namen der anderen.','Ich wollte, dass du zuerst lernst, warum sich diese Welt zu retten lohnt. Es war feige, dir die Wahl zu nehmen.'],[{label:'Ich werde die Wahrheit bewahren.',action:()=>{s.flags.forgaveEdda=true;h.toast('Edda neigt den Kopf. Diesmal bleibt kein Wort ungesagt.');h.save();}},{label:'Vertrauen muss neu geschrieben werden.',action:()=>{s.flags.doubtedEdda=true;h.toast('Edda: Dann werde ich warten, bis du mich wieder lesen kannst.');h.save();}}]);}
      else if(!s.flags.echo&&(s.inventory.ash??0)>=3&&s.defeated.includes('hollow0')&&s.opened.includes('chest0')){
        s.flags.echo=true;s.flags.ember=true;reward(s,'ashes',70,130,{essence:2});
        this.say('Edda · Die letzte Zeile',['Die Zeichen erkennen dich. Du bist Nema, die letzte Glyphenhüterin.','Erlernt: ECHO-PULS und GLUTKLINGE. W wirkt Glutklinge, E wirkt Echo-Puls. Halte die Taste zum Zielen und lasse sie los, um die Fähigkeit zum Mauszeiger auszulösen. Q ist dein Klingenschlag.','Ein Echo enthüllt verborgene Schrift. Westlich der Kapelle wartet ein namenloses Grab. Ein Brief südlich des Friedhofs nennt seinen Namen.','Sprich nun mit Orin an der Schmiede im Osten. Eine Welt lässt sich nicht mit einer gebrochenen Klinge bewahren.']);
      }else if(s.flags.graveRestored&&!s.flags.graveDone){s.flags.graveDone=true;reward(s,'grave',65,100,{ashCharm:1});this.say('Edda',['Ilya. Mein Bruder. Ich fürchtete, auch seine letzte Spur zu verlieren.','Du hast ihm kein Leben zurückgegeben. Aber einen Namen. Manchmal ist das die Form, die Liebe nach dem Tod annimmt.','Nebenquest abgeschlossen: Der Name auf dem Grabstein.\n+65 Gold · +100 XP · Talisman der Asche']);}
      else this.say('Edda',[s.flags.truth?(s.flags.forgaveEdda?'Danke, dass du mich trotz allem noch lesen willst.':'Ich werde keine Wahrheit mehr vor dir bewahren.'):s.flags.echo?'Der Tilger löscht den Schmerz. Doch mit ihm verschwinden auch die Menschen, die wir lieben. Vergiss das nicht.':`Die drei Aschezeichen fehlen noch nicht alle? Suche westlich der Kapelle. Öffne die Truhe und besiege die Nullhülle. Du hast ${s.inventory.ash??0}/3 Zeichen.`]);
    }else if(id==='orin'){
      if(!s.flags.forgeQuest){s.flags.forgeQuest=true;this.say('Orin · Der Glockenwächter',['Diese Klinge … sie wurde in einem Feuer geschmiedet, das seit Jahrhunderten nicht mehr brennt.','Bring mir fünf Stück altes Eisen aus den Adern nördlich der Schmiede und den Glutkern des Randwächters im Nordosten. Die erste Reparatur kostet kein Gold.','Und wenn du drei Steine der letzten Glut findest — bei der Kapelle, im Wald und im Archiv — kann mein Feuer wieder erwachen.'],[{label:'Schmiede öffnen',action:()=>h.menu('forge')}]);}
      else if((s.inventory.ember??0)>=3&&!s.flags.emberDone){s.flags.emberDone=true;reward(s,'embers',100,140,{core:2});this.say('Orin',['Du hast die Glut zurückgebracht. Mein Feuer wird nicht länger von gestohlenen Erinnerungen leben.','Nebenquest abgeschlossen: Die letzte Glut.\n+100 Gold · +140 XP · +2 Glutkerne. Glutöl kann jetzt hergestellt werden.'],[{label:'Zur Schmiede',action:()=>h.menu('forge')}]);}
      else this.say('Orin',[s.flags.repaired?(s.flags.sparedOrin?'Du hast mir meine Erinnerung gelassen. Den Namen meiner Tochter werde ich nun selbst bewahren.':'Ein Schwert trägt die Entscheidungen seines Besitzers. Lass uns sehen, was deines noch weiß.'):'Stahl lässt sich reparieren. Erinnerungen nicht so leicht. Hast du das Eisen und den Glutkern?'],[{label:'Schmiede & Herstellung',action:()=>h.menu('forge')},{label:'Waren handeln',action:()=>h.menu('shop')}]);
    }else if(id==='miro'){
      if((s.inventory.song??0)>=3&&!s.flags.songDone){s.flags.songDone=true;reward(s,'song',80,160,{feather:1});this.say('Miro · Das vergessene Lied',['Jetzt weiß ich es wieder. Du hast dieses Lied gesungen, Nema. Für die Menschen, deren Namen du bewahren wolltest.','Ich bin kein verlorenes Kind. Ich bin dein Versprechen an sie.','Nebenquest abgeschlossen: Das vergessene Lied.\n+80 Gold · +160 XP · Feder der ersten Schrift.','Drei gerettete Geschichten, eine unversehrte Erinnerung und die Wahrheit aus drei Briefen. So könnte eine neue Schrift entstehen.']);}
      else if(!s.flags.miro){s.flags.miro=true;this.say('Miro · Das verlorene Echo',['Du trägst ein Wort, das niemand mehr lesen kann. Es beginnt mit einem Versprechen. Und endet mit einer Lüge.','Die Stelen schlafen. Wecke sie mit einem Echo. Dann: Wurzel, Stimme, Stern. So lautet das Gedicht.','Ich habe mein Lied verloren. Drei Takte liegen verborgen im Wald, im Archiv und am Fuß des Glockenturms. Ein Echo kann sie finden.']);}
      else this.say('Miro',[s.zone===4?'In Avars letzter Gestalt schützt ihn ein Schriftwall. Dein Echo kann ihn für zehn Sekunden brechen. Auch Macht braucht einen Moment der Stille.':`Ich höre ${s.inventory.song??0} von drei Takten. Suche das blasse Flimmern in den Seitenwegen und wirke Echo-Puls.`,s.flags.songDone?'Vielleicht können wir bewahren, ohne einzusperren. Erinnern, ohne für immer zu leiden.':'Wald, Krypta, Glockenturm. Dort sind die fehlenden Takte.']);
    }else if(id==='veyra')this.say('Veyra · Die Erinnerungsreisende',['Gold verliert seinen Wert, wenn niemand mehr weiß, wem es gehörte. Ich sammle es trotzdem. Manche Dinge werden erst wertvoll, wenn die Welt sie vergessen hat.'],[{label:'Handel öffnen',action:()=>h.menu('shop')}]);
    h.save();
  }
  private mechanism(){
    const s=this.s,h=this.host;if(s.flags.bellRepaired){h.toast('Die Glocke hat ihre Stimme wieder.');return;}
    if(!['part0','part1','part2'].every(id=>s.discovered.includes(id))){h.toast('Drei Mechanismusteile fehlen noch. Suche auf allen Ebenen.');return;}
    const finish=(spared:boolean)=>{s.flags.bellRepaired=true;s.flags.sparedOrin=spared;if(spared){s.inventory.iron-=8;s.inventory.core-=2;}reward(s,'bellRepair',80,160);h.toast(spared?'Die Glocke singt. Orin behält die Erinnerung an seine Tochter.':'Orin gibt den Namen seiner Tochter. Die Glocke erwacht.');h.save();};
    this.say('Orin · Ein Name gegen einen Klang',['Die Feder ist zu schwach. Meine letzte Erinnerung könnte sie tragen. Der Name meiner Tochter.','Oder wir schmieden eine neue Seele: acht Eisen und zwei Glutkerne. Es ist schwerer. Aber dann müsste ich sie nicht noch einmal verlieren.'],[
      {label:`Neue Seele schmieden · 8 Eisen, 2 Glutkerne (du hast ${s.inventory.iron??0}/${s.inventory.core??0})`,disabled:(s.inventory.iron??0)<8||(s.inventory.core??0)<2,action:()=>finish(true)},
      {label:'Orins Opfer annehmen',action:()=>finish(false)},
      {label:'Ich suche zuerst die Materialien.',action:()=>h.toast('Die Eisenadern und verdichtete Glut liegen auf den unteren Ebenen.')}
    ]);
  }
  bossDefeated(zone:number){
    const lines=[
      ['Die erste Erinnerung','„Du solltest nicht zurückkehren“, flüstert eine Stimme. „Ich bin derjenige, der sich noch erinnert, was du getan hast.“','Der Weg in den Wisperwald ist frei.'],
      ['Das Siegel der Namen','Avar wollte keine Welt zerstören. Er wollte den Schmerz aus ihr nehmen. Doch mit der Trauer verschwand auch die Liebe.','Erstes Erinnerungssiegel geborgen. SCHRIFTWALL erlernt · Taste R.'],
      ['Das Siegel des Schmerzes','Deine eigene Unterschrift steht unter dem Erlass. Du hast die Siegel erschaffen. Du hast ihre Namen gebunden.','Zweites Erinnerungssiegel geborgen. Der Glockenturm wartet.'],
      ['Das Siegel der Erinnerung','Die Glocke singt wieder. Drei Siegel, drei Zeilen. Die Welt hält für einen Atemzug still.','Drittes Erinnerungssiegel geborgen. Der Weg zu Avar ist offen.'],
      ['Das letzte ungeschriebene Wort','Avar sinkt zwischen die Zeichen. „Ich wollte nur, dass es aufhört wehzutun.“','Du legst die Klinge nieder. Die Erste Schrift wartet im Norden. Die letzte Entscheidung gehört dir.']
    ][zone];
    if(zone===1)this.s.flags.ward=true;if(zone===3)addItem(this.s,'heart');
    this.say(lines[0],lines.slice(1));this.host.save();
  }
  private chooseEnding(){
    const s=this.s,h=this.host;const finish=(ending:string)=>{s.ending=ending;h.save();h.ending();};
    this.say('Die Erste Schrift',['Avar: „Eine Welt, die leidet? Oder eine Welt, die vergisst?“','Nema: „Eine Welt, die wählen darf.“','Die Schrift legt sich in deine Hände. Keine Erinnerung kann dir diese Entscheidung abnehmen.'],[
      {label:'Die Erinnerung bewahren',action:()=>finish('memory')},
      {label:'Die Stille wählen',action:()=>finish('silence')},
      ...(secretReady(s)?[{label:'Die Schrift neu schreiben',action:()=>finish('rewrite')}]:[])
    ]);
  }
}
export const EPILOGUES:Record<string,{title:string;text:string}>={
  memory:{title:'Die Erinnerung bewahren',text:'Die Namen kehren zurück. Auch ihre Trauer. Edda liest Ilyas Namen laut, und zum ersten Mal seit der Auslöschung weint sie. Nema öffnet das Archiv. Niemand soll darin wieder eingeschlossen werden. Aethra erinnert sich. Und lebt.'},
  silence:{title:'Die Stille wählen',text:'Nema nimmt einen Teil von Avars Macht. Nicht jede Wunde wird geschlossen; manche Seiten bleiben weiß. Orin weiß nicht mehr, warum ihn die Glocke zum Weinen bringt. Aber er hört ihr zu. Eine stille Welt beginnt zu lernen, was sie verloren hat.'},
  rewrite:{title:'Die Schrift neu schreiben',text:'Miro singt das vollständige Lied. Orin spricht den Namen seiner Tochter. Edda schreibt Ilyas Geschichte. Nema ersetzt die Siegel durch offene Seiten. Erinnerungen werden bewahrt — und können sich verändern. Zum ersten Mal schreibt die Welt selbst weiter.'}
};


