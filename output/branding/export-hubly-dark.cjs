// Vector asset export from the approved light-mode silhouettes.
// Paths preserve the approved lettering rather than substituting a font.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('../../web/node_modules/sharp');
const out = path.join(__dirname, 'modo-oscuro');
fs.mkdirSync(out, { recursive: true });

function area(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}
function simplify(points, epsilon = 1) {
  if (points.length < 3) return points;
  const a = points[0], b = points.at(-1), dx = b[0] - a[0], dy = b[1] - a[1];
  let max = 0, at = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const t = Math.max(0, Math.min(1, ((p[0]-a[0])*dx + (p[1]-a[1])*dy)/(dx*dx+dy*dy || 1)));
    const d = Math.hypot(p[0]-a[0]-t*dx, p[1]-a[1]-t*dy);
    if (d > max) { max = d; at = i; }
  }
  if (max <= epsilon) return [a, b];
  return [...simplify(points.slice(0, at+1), epsilon).slice(0,-1), ...simplify(points.slice(at), epsilon)];
}
function trace(mask, w, h, minimumArea = 250) {
  const edges = new Map();
  const key = (x, y) => y * (w + 1) + x;
  const add = (a, b) => { if (!edges.has(a)) edges.set(a, []); edges.get(a).push(b); };
  const has = (x,y) => x>=0 && x<w && y>=0 && y<h && mask[y*w+x];
  for (let y=0; y<h; y++) for (let x=0; x<w; x++) if(has(x,y)) {
    if(!has(x,y-1)) add(key(x,y),key(x+1,y));
    if(!has(x+1,y)) add(key(x+1,y),key(x+1,y+1));
    if(!has(x,y+1)) add(key(x+1,y+1),key(x,y+1));
    if(!has(x-1,y)) add(key(x,y+1),key(x,y));
  }
  const contours=[];
  while(edges.size) {
    const start=edges.keys().next().value, loop=[]; let current=start;
    do {
      loop.push([current%(w+1), Math.floor(current/(w+1))]);
      const next=edges.get(current);
      if(!next?.length) break;
      const n=next.pop(); if(!next.length) edges.delete(current); current=n;
    } while(current!==start);
    if(current===start && Math.abs(area(loop))>=minimumArea) contours.push(loop);
  }
  return contours.sort((a,b)=>Math.abs(area(b))-Math.abs(area(a)));
}
function d(contours) {
  return contours.map(loop=>{
    const middle=Math.floor(loop.length/2);
    const pts=[...simplify(loop.slice(0,middle+1),.85).slice(0,-1),...simplify([...loop.slice(middle),loop[0]],.85)];
    return 'M'+pts.map(p=>p.join(',')).join('L')+'Z';
  }).join('');
}
function bounds(contours) {
  const points=contours.flat(), xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const x=Math.min(...xs), y=Math.min(...ys);
  return {x,y,w:Math.max(...xs)-x,h:Math.max(...ys)-y};
}
async function read(name) {
  const {data,info}=await sharp(path.join(__dirname,name)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  return {data,w:info.width,h:info.height};
}
function mask(image, predicate) {
  const result=new Uint8Array(image.w*image.h);
  for(let i=0;i<result.length;i++) {
    const p=i*4; result[i]=predicate(image.data[p],image.data[p+1],image.data[p+2],image.data[p+3],i%image.w,Math.floor(i/image.w))?1:0;
  }
  return result;
}
const svg=(w,h,body,label)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${body}</svg>`;
async function save(id,w,h,body,label) {
  const source=svg(w,h,body,label), file=path.join(out,`hubly-${id}-dark`);
  fs.writeFileSync(file+'.svg',source);
  await sharp(Buffer.from(source)).png().toFile(file+'.png');
}
(async()=>{
  const cat=await read('hubly-isotipo.png'),word=await read('hubly-logotipo.png');
  const silhouette=trace(mask(cat,(_r,_g,_b,a)=>a>170),cat.w,cat.h).slice(0,1);
  const ear=trace(mask(cat,(r,g,b,a,x,y)=>a>180&&r<170&&g>110&&b>150&&g>r*1.3&&x>cat.w*.60&&y<cat.h*.55),cat.w,cat.h).slice(0,1);
  const features=trace(mask(cat,(r,g,b,a)=>a>180&&r>150&&g>160&&b>180),cat.w,cat.h).slice(0,3);
  const letters=trace(mask(word,(r,g,b,a)=>a>170&&Math.max(r,g,b)<120),word.w,word.h,500);
  if(!silhouette.length||!ear.length||features.length!==3||letters.length!==6) throw Error(`Unexpected contours: ${JSON.stringify({silhouette:silhouette.length,ear:ear.length,features:features.length,letters:letters.length})}`);
  const cb=bounds(silhouette), wb=bounds(letters);
  const face=`<g transform="translate(${-cb.x} ${-cb.y})"><path fill="#DCEFF9" d="${d(silhouette)}"/><path fill="#7CC8EE" d="${d(ear)}"/><path fill="#16324F" d="${d(features)}"/></g>`;
  const text=`<g transform="translate(${-wb.x} ${-wb.y})"><path fill="#FFFFFF" fill-rule="evenodd" d="${d(letters)}"/></g>`;
  const side=1000, catScale=860/cb.w, catHeight=cb.h*catScale;
  await save('isotipo',side,side,`<g transform="translate(70 ${(side-catHeight)/2}) scale(${catScale})">${face}</g>`,'Hubly, carita de Hubi para modo oscuro');
  const wordScale=1400/wb.w, wordHeight=Math.ceil(wb.h*wordScale);
  await save('logotipo',1520,wordHeight+120,`<g transform="translate(60 60) scale(${wordScale})">${text}</g>`,'hubly, logotipo para modo oscuro');
  const faceScale=300/cb.h, textScale=300/wb.h, fw=cb.w*faceScale, tw=wb.w*textScale;
  const combinedWidth=Math.ceil(fw+tw+180), combinedHeight=420;
  await save('isologo',combinedWidth,combinedHeight,`<g transform="translate(60 60) scale(${faceScale})">${face}</g><g transform="translate(${120+fw} 60) scale(${textScale})">${text}</g>`,'Hubly, carita y nombre para modo oscuro');
  const bg='#111C27', layers=[];
  const specs=[['isologo',60,95,1480,420],['isotipo',90,610,500,380],['logotipo',690,650,820,300]];
  for(const [id,x,y,w,h] of specs) {
    const img=await sharp(path.join(out,`hubly-${id}-dark.png`)).resize({width:w,height:h,fit:'contain',background:{r:17,g:28,b:39,alpha:0}}).png().toBuffer();
    layers.push({input:img,left:x,top:y});
  }
  const headings=Buffer.from(`<svg width="1600" height="1060"><g fill="#DCEFF9" font-family="Arial,sans-serif"><text x="60" y="55" font-size="28" font-weight="700">Hubly · Modo oscuro</text><text x="60" y="575" font-size="23">Isotipo</text><text x="690" y="575" font-size="23">Logotipo</text></g></svg>`);
  layers.push({input:headings,left:0,top:0});
  await sharp({create:{width:1600,height:1060,channels:3,background:bg}}).composite(layers).png().toFile(path.join(out,'vista-previa.png'));
  console.log(JSON.stringify({contours:{face:silhouette.length,ear:ear.length,features:features.length,letters:letters.length},files:fs.readdirSync(out)},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
