export class AudioManager {
  private ctx?:AudioContext;private master?:GainNode;private ambience?:GainNode;private notes:OscillatorNode[]=[];
  volume=.5;music=.35;
  async start(){
    const AudioContextType=window.AudioContext??(window as Window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
    if(!AudioContextType)return;
    try{
    if(!this.ctx){this.ctx=new AudioContextType();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.ambience=this.ctx.createGain();this.ambience.connect(this.master);
      for(const [i,f]of [55,82.4069,110,130.8128].entries()){const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=i===0?.11:.025;o.connect(g);g.connect(this.ambience);o.start();this.notes.push(o);}
    }await this.ctx.resume();this.set(this.volume,this.music);
    }catch{/* Audio can be disabled by the browser; the game remains playable. */}
  }
  set(volume:number,music:number){this.volume=volume;this.music=music;if(this.ctx&&this.master&&this.ambience){this.master.gain.setTargetAtTime(volume,this.ctx.currentTime,.1);this.ambience.gain.setTargetAtTime(music,this.ctx.currentTime,.3);}}
  pause(paused:boolean){if(this.ctx&&this.ambience)this.ambience.gain.setTargetAtTime(paused?this.music*.2:this.music,this.ctx.currentTime,.2);}
  play(kind:'sword'|'hit'|'hurt'|'magic'|'bell'|'loot'|'step'|'dodge'|'death',pan=0){
    const ctx=this.ctx;if(!ctx||ctx.state!=='running'||!this.master)return;const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),p=typeof ctx.createStereoPanner==='function'?ctx.createStereoPanner():ctx.createGain();if('pan' in p)p.pan.value=Math.max(-1,Math.min(1,pan));o.connect(g);g.connect(p);p.connect(this.master);
    const values={sword:[320,65,.12,.07],hit:[160,45,.12,.15],hurt:[95,35,.24,.13],magic:[220,880,.5,.055],bell:[523.25,520,2.5,.13],loot:[660,1320,.3,.055],step:[65,40,.04,.025],dodge:[140,450,.18,.045],death:[110,27.5,1.7,.13]}[kind];
    o.type=kind==='bell'||kind==='magic'||kind==='loot'?'sine':kind==='step'?'triangle':'sawtooth';o.frequency.setValueAtTime(values[0],now);o.frequency.exponentialRampToValueAtTime(values[1],now+values[2]);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(values[3],now+.01);g.gain.exponentialRampToValueAtTime(.0001,now+values[2]);o.start(now);o.stop(now+values[2]+.03);o.onended=()=>{o.disconnect();g.disconnect();p.disconnect();};
  }
}
