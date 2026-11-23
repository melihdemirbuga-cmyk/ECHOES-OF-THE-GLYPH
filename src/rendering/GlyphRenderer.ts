import * as THREE from 'three';
import type { Settings } from '../core/model';

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
function createAtlas() {
  const chars = [...new Set(' .,:;~-_=+<>!il*/\\|()[]{}xzvucYJLtfj7T1?oahkbdpqwZOSGH#%MNW@&'.split(''))];
  const tile=48, canvas=document.createElement('canvas');canvas.width=tile*chars.length;canvas.height=64;
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!;ctx.font='bold 43px Consolas, "Courier New", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  const measured=chars.map(char=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='white';ctx.fillText(char,24,32);const pixels=ctx.getImageData(0,0,48,64).data;let n=0;for(let i=3;i<pixels.length;i+=4)n+=pixels[i]/255;return {char,density:n/(48*64)};}).sort((a,b)=>a.density-b.density);
  ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='white';measured.forEach((m,i)=>ctx.fillText(m.char,i*tile+24,32));
  const texture=new THREE.CanvasTexture(canvas);texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
  const max=measured[measured.length-1].density;
  return {texture,densities:measured.map(m=>m.density/max),count:measured.length,directions:['/','\\','|','-'].map(c=>measured.findIndex(m=>m.char===c))};
}
export class GlyphRenderer {
  readonly renderer:THREE.WebGLRenderer;
  private sceneTarget:THREE.WebGLRenderTarget;
  private history:THREE.WebGLRenderTarget[];
  private quadScene=new THREE.Scene();private quadCamera=new THREE.Camera();private quad:THREE.Mesh;
  private classify:THREE.ShaderMaterial;private present:THREE.ShaderMaterial;
  private flip=0;private width=1;private height=1;private columns=1;private rows=1;private frames=0;private average=16;private scale=1;
  settings:Settings;
  constructor(host:HTMLElement,settings:Settings){
    this.settings=settings;
    this.renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance',alpha:false});
    this.renderer.setPixelRatio(1);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.LinearSRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.25;
    this.renderer.domElement.setAttribute('aria-label','Dreidimensionale Glyphenwelt');host.append(this.renderer.domElement);
    this.sceneTarget=new THREE.WebGLRenderTarget(1,1,{depthBuffer:true});this.sceneTarget.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
    this.history=[0,1].map(()=>new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:false}));
    const atlas=createAtlas();
    this.classify=new THREE.ShaderMaterial({vertexShader:vertex,depthTest:false,depthWrite:false,uniforms:{sceneTex:{value:this.sceneTarget.texture},depthTex:{value:this.sceneTarget.depthTexture},previous:{value:this.history[0].texture},grid:{value:new THREE.Vector2(1,1)},density:{value:atlas.densities},glyphCount:{value:atlas.count},directions:{value:new THREE.Vector4(...atlas.directions as [number,number,number,number])},stabilize:{value:.038},hybrid:{value:0}},fragmentShader:`
      varying vec2 vUv; uniform sampler2D sceneTex,depthTex,previous;uniform vec2 grid;uniform float density[${atlas.count}],glyphCount,stabilize,hybrid;uniform vec4 directions;
      float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
      void main(){
        vec2 uv=(floor(vUv*grid)+.5)/grid;vec2 d=.44/grid;
        vec3 c=texture2D(sceneTex,uv).rgb;vec3 l=texture2D(sceneTex,uv-vec2(d.x,0)).rgb,r=texture2D(sceneTex,uv+vec2(d.x,0)).rgb;
        vec3 t=texture2D(sceneTex,uv+vec2(0,d.y)).rgb,b=texture2D(sceneTex,uv-vec2(0,d.y)).rgb;
        vec3 color=c*.4+(l+r+t+b)*.15;
        vec2 grad=vec2(lum(r)-lum(l),lum(t)-lum(b));float edge=length(grad);
        float dep=texture2D(depthTex,uv).r;if(dep>.99999){gl_FragColor=vec4(0.);return;}
        vec2 dg=vec2(texture2D(depthTex,uv+vec2(d.x,0)).r-texture2D(depthTex,uv-vec2(d.x,0)).r,texture2D(depthTex,uv+vec2(0,d.y)).r-texture2D(depthTex,uv-vec2(0,d.y)).r);
        vec2 cell=floor(vUv*grid);float ordered=mod(cell.x+mod(cell.y,2.)*2.,4.)/3.-.5;
        float brightness=clamp(pow(lum(color)*1.6,.46)*1.65+min(length(dg)*5.,.13)+ordered*.035,0.,1.);
        float chosen=0.,best=10.;for(int i=0;i<${atlas.count};i++){float delta=abs(density[i]-brightness);if(delta<best){best=delta;chosen=float(i);}}
        vec4 old=texture2D(previous,uv);int oldIndex=int(floor(old.a*255.+.5));
        for(int i=0;i<${atlas.count};i++){if(i==oldIndex&&abs(density[i]-brightness)<best+stabilize&&abs(lum(old.rgb)-lum(color))<.12)chosen=float(i);}
        if(edge>.13&&brightness<.83){vec2 g=abs(grad);chosen=g.x>g.y*1.7?directions.z:g.y>g.x*1.7?directions.w:grad.x*grad.y>0.?directions.x:directions.y;}
        color+=min(length(dg)*4.,.12)*vec3(.52,.62,.64)*(1.+hybrid);
        gl_FragColor=vec4(color,chosen/255.);
      }`});
    this.present=new THREE.ShaderMaterial({vertexShader:vertex,depthTest:false,depthWrite:false,uniforms:{cells:{value:this.history[0].texture},atlas:{value:atlas.texture},sceneTex:{value:this.sceneTarget.texture},depthTex:{value:this.sceneTarget.depthTexture},glyphWeight:{value:.6},grid:{value:new THREE.Vector2(1,1)},glyphCount:{value:atlas.count},resolution:{value:new THREE.Vector2(1,1)}},fragmentShader:`
      varying vec2 vUv;uniform sampler2D cells,atlas,sceneTex,depthTex;uniform vec2 grid,resolution;uniform float glyphCount,glyphWeight;
      vec3 aces(vec3 c){return clamp((c*(2.51*c+.03))/(c*(2.43*c+.59)+.14),0.,1.);}
      void main(){
        vec2 cell=floor(vUv*grid),local=fract(vUv*grid);vec4 info=texture2D(cells,(cell+.5)/grid);
        float glyph=floor(info.a*255.+.5);float ink=texture2D(atlas,vec2((glyph+local.x)/glyphCount,local.y)).a;
        vec3 col=pow(aces(max(texture2D(sceneTex,vUv).rgb,vec3(0.))*1.25),vec3(1./2.2));
        vec3 bg=vec3(.022,.027,.042);vec3 outColor=bg+mix(col*.9,col*(.12+ink*1.8),glyphWeight);
        vec2 px=1./resolution;float dep=texture2D(depthTex,vUv).r;
        float contour=abs(dep-texture2D(depthTex,vUv+vec2(px.x*1.3,0)).r)+abs(dep-texture2D(depthTex,vUv+vec2(0,px.y*1.3)).r);
        outColor+=clamp(contour*90.,0.,.1)*vec3(.42,.55,.56);
        vec3 bloom=texture2D(sceneTex,vUv+vec2(.003,.003)).rgb+texture2D(sceneTex,vUv-vec2(.003,.003)).rgb;
        outColor+=max(bloom-vec3(.8),vec3(0.))*.04;
        vec2 center=vUv-.5;float vignette=1.-.38*dot(center,center);outColor*=vignette;
        gl_FragColor=vec4(outColor,1.);
      }`});
    this.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.classify);this.quadScene.add(this.quad);this.resize();
  }
  resize(){
    this.width=window.innerWidth;this.height=window.innerHeight;
    const base=this.settings.mode==='fine'?2.35:this.settings.mode==='cinematic'?4:2.65;
    const size=base*(this.settings.quality==='low'?1.35:1)*this.scale;
    this.columns=Math.ceil(this.width/size);this.rows=Math.ceil(this.height/(size*1.46));
    const sceneScale=this.settings.quality==='low'?.65:this.settings.quality==='auto'&&this.scale>1?.8:1;
    this.renderer.setSize(this.width,this.height);this.sceneTarget.setSize(Math.max(1,Math.floor(this.width*sceneScale)),Math.max(1,Math.floor(this.height*sceneScale)));
    this.history.forEach(t=>t.setSize(this.columns,this.rows));
    this.classify.uniforms.grid.value.set(this.columns,this.rows);this.classify.uniforms.hybrid.value=this.settings.mode==='hybrid'?1:0;this.classify.uniforms.stabilize.value=this.settings.reduced?.075:.035;
    this.present.uniforms.grid.value.set(this.columns,this.rows);this.present.uniforms.resolution.value.set(this.width,this.height);
    this.present.uniforms.glyphWeight.value=this.settings.mode==='cinematic'?.82:this.settings.mode==='hybrid'?.45:.62;
    this.renderer.shadowMap.enabled=this.settings.quality!=='low'&&!(this.settings.quality==='auto'&&this.scale>1);
  }
  render(scene:THREE.Scene,camera:THREE.Camera,dt:number){
    this.average=this.average*.98+Math.min(dt*1000,100)*.02;
    if(this.settings.quality==='auto'&&++this.frames%240===0){const next=this.average>28?1.3:1;if(next!==this.scale){this.scale=next;this.resize();}}
    const read=this.history[this.flip],write=this.history[1-this.flip];
    this.renderer.setRenderTarget(this.sceneTarget);this.renderer.render(scene,camera);
    this.classify.uniforms.previous.value=read.texture;this.quad.material=this.classify;this.renderer.setRenderTarget(write);this.renderer.render(this.quadScene,this.quadCamera);
    this.present.uniforms.cells.value=write.texture;this.quad.material=this.present;this.renderer.setRenderTarget(null);this.renderer.render(this.quadScene,this.quadCamera);this.flip=1-this.flip;
  }
  captureMap(scene:THREE.Scene){
    const size=768,target=new THREE.WebGLRenderTarget(size,size,{depthBuffer:true});target.texture.colorSpace=THREE.SRGBColorSpace;
    const camera=new THREE.OrthographicCamera(-28,28,28,-28,.1,180);camera.position.set(0,90,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
    const hidden:THREE.Object3D[]=[];scene.traverse(o=>{if(o.visible&&o.userData.cartographyHidden){hidden.push(o);o.visible=false;}});
    const fog=scene.fog,previous=this.renderer.getRenderTarget();scene.fog=null;
    try{this.renderer.setRenderTarget(target);this.renderer.render(scene,camera);const bytes=new Uint8Array(size*size*4);this.renderer.readRenderTargetPixels(target,0,0,size,size,bytes);const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(size,size);for(let y=0;y<size;y++)pixels.data.set(bytes.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);ctx.putImageData(pixels,0,0);return canvas.toDataURL('image/png');}
    finally{hidden.forEach(o=>o.visible=true);scene.fog=fog;this.renderer.setRenderTarget(previous);target.dispose();}
  }
}
