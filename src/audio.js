// Original procedural audio: no recordings, downloads, or third-party licenses.
export class Sound {
 constructor(){this.ctx=null;this.layers={};this.enabled=true}
 async unlock(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);const c=this.ctx;const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate);const a=buffer.getChannelData(0);let last=0;for(let i=0;i<a.length;i++){last=(last+Math.random()*.04-.02)/1.02;a[i]=last*3;}for(const [name,freq]of Object.entries({room:180,kettle:450,pour:1400,steam:3000,rain:2300})){const src=c.createBufferSource();src.buffer=buffer;src.loop=true;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=freq;const gain=c.createGain();gain.gain.value=0;src.connect(filter).connect(gain).connect(this.master);src.start();this.layers[name]=gain;}}
 await this.ctx.resume();this.mute(!this.enabled);this.level('room',.16)}
 mute(off){this.enabled=!off;if(this.ctx)this.master.gain.setTargetAtTime(off?0:.3,this.ctx.currentTime,.3)}
 level(name,value){if(this.ctx)this.layers[name].gain.setTargetAtTime(value,this.ctx.currentTime,.6)}
 chime(){if(!this.ctx)return;for(const [i,f]of [523.25,1046.5,1569.75].entries()){const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime;o.frequency.value=f;g.gain.setValueAtTime(.06/(i+1),t);g.gain.exponentialRampToValueAtTime(.0001,t+2.8);o.connect(g).connect(this.master);o.start();o.stop(t+3)}}
}
