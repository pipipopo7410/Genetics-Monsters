/* 小怪獸遺傳實驗室 2.0 原版精修｜同染色體基因連鎖（不模擬互換） */
(()=>{'use strict';
const $=x=>document.getElementById(x);
const PARENTS={dad:[{id:'d1a',type:1,genes:['A','b','d']},{id:'d1b',type:1,genes:['a','B','d']},{id:'d2a',type:2,genes:['e','F']},{id:'d2b',type:2,genes:['E','f']},{id:'d3a',type:3,genes:['g','h']},{id:'d3b',type:3,genes:['G','h']}],mom:[{id:'m1a',type:1,genes:['A','b','D']},{id:'m1b',type:1,genes:['a','b','d']},{id:'m2a',type:2,genes:['e','f']},{id:'m2b',type:2,genes:['e','F']},{id:'m3a',type:3,genes:['g','H']},{id:'m3b',type:3,genes:['g','h']}]};
const TRAITS=[{k:'A',name:'體色',dom:'綠色',rec:'黃色'},{k:'B',name:'翅膀',dom:'沒有翅膀',rec:'有翅膀'},{k:'D',name:'手數',dom:'兩隻手',rec:'四隻手'},{k:'E',name:'長角',dom:'有角',rec:'沒有角'},{k:'F',name:'腳長',dom:'短腳',rec:'長腳'},{k:'G',name:'斑紋',dom:'無斑紋',rec:'有斑紋'},{k:'H',name:'眼數',dom:'兩隻眼',rec:'三隻眼'}];
const FILES={green:'body-green',yellow:'body-yellow',wing:'wings',hands2:'hands-two',hands4:'hands-four',horn:'horn',legsShort:'legs-short',legsLong:'legs-long',spots:'spots',eyes2:'eyes-two',eyes3:'eyes-three'};
const FOCUS=[['A'],['A','B','E'],TRAITS.map(t=>t.k)];
const STORE='monster_genetics_original_refined_v4';
function defaultState(){return {mode:7,stage:0,unlocked:0,choice:{dad:[null,null,null],mom:[null,null,null]},records:[],nextId:1,lastId:null,proof:[],guess:null,page:'dad',manualDone:false};}
let state=defaultState(),busy=false,animToken=0,batchToken=0,batchActive=false,recordPage=0,detailId=null,toastTimer=null,drag=null;
try{const s=JSON.parse(localStorage.getItem(STORE)||'null');if(s&&Array.isArray(s.records)&&s.choice&&s.choice.dad&&s.choice.mom){state={...defaultState(),...s};state.records=state.records.slice(-200);state.choice={dad:[...s.choice.dad].slice(0,3),mom:[...s.choice.mom].slice(0,3)};}}catch{}
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify(state));}catch{}};
const chr=(side,id)=>PARENTS[side].find(x=>x.id===id);
const chosen=(side)=>state.choice[side].map(id=>id?chr(side,id):null);
const ready=(side)=>chosen(side).every(Boolean);
const randGamete=(side)=>[1,2,3].map(p=>PARENTS[side][(p-1)*2+Math.floor(Math.random()*2)]);
const copyGamete=(side)=>chosen(side).map(c=>({...c,genes:[...c.genes]}));
function genotype(gamDad,gamMom){const genes={};for(const g of [...gamDad,...gamMom])for(const s of g.genes){const k=s.toUpperCase();(genes[k]??=[]).push(s);}return Object.fromEntries(TRAITS.map(({k})=>[k,(genes[k]||[]).sort((a,b)=>Number(b===b.toUpperCase())-Number(a===a.toUpperCase())).join('')]));}
const phenotypes=g=>Object.fromEntries(TRAITS.map(t=>[t.k,g[t.k].includes(t.k)]));
function individual(side){return phenotypeFromGenes(PARENTS[side].flatMap(c=>c.genes));}
function phenotypeFromGenes(all){return Object.fromEntries(TRAITS.map(t=>[t.k,all.includes(t.k)]));}
function monsterLayers(t){return [!t.B&&'wing',t.D?'hands2':'hands4',t.F?'legsShort':'legsLong',t.A?'green':'yellow',t.H?'eyes2':'eyes3',t.E&&'horn',!t.G&&'spots'].filter(Boolean);}
const imgURL=key=>`./assets/${FILES[key]}.webp?v=4`;
function monsterHTML(t){return monsterLayers(t).map(key=>`<img class="monster-layer" src="${imgURL(key)}" decoding="async" alt="" draggable="false" onerror="this.onerror=null;this.style.opacity=0;this.closest('.monster-view, .record-monster-thumb, .detail-monster')?.classList.add('asset-missing');">`).join('');}
function renderMonsterTo(id,t){const el=$(id);if(!el)return;el.innerHTML=monsterHTML(t);el.classList.remove('baby-empty');}
function chrRect(info,x,y,i,side,selected=false,fade=false,scale=1){
 const sizes=[80,60,42],h=sizes[info.type-1];const w=13;
 const col=side==='dad'?(i%2?'#85c1e9':'#3498db'):(i%2?'#f1948a':'#e74c3c');
 const focus=state.mode===9?FOCUS[2]:FOCUS[state.stage];
 const labels=info.genes.map((s,j)=>{
   const sy=4+(j+.5)*(h-8)/info.genes.length;
   const left=true;
   return `<line class="chr-site" x1="-3" y1="${sy.toFixed(1)}" x2="16" y2="${sy.toFixed(1)}" stroke="#263c52" stroke-width="1.5"/><text class="allele ${focus.includes(s.toUpperCase())?'focus-label':''}" x="-2" y="${(sy+4.7).toFixed(1)}" text-anchor="end">${s}</text>`;
 }).join('');
 return `<g class="chr-hit ${fade?'faded':''} ${selected?'selected':''} ${focus.some(k=>info.genes.some(g=>g.toUpperCase()===k))?'':'dimmed'}" data-side="${side}" data-id="${info.id}" transform="translate(${x} ${y}) scale(${scale})" role="button" tabindex="${fade?-1:0}" aria-label="${side==='dad'?'爸爸':'媽媽'}第${info.type}對，${info.genes.join('、')}，${selected?'已選入配子':'點選送入配子'}">
 ${selected?`<rect class="chr-pick" x="-8" y="-6" width="31" height="${h+12}" rx="8"/>`:''}
 <rect class="chr-bar" x="0" y="0" width="${w}" height="${h}" rx="6" fill="#fff" stroke="${col}" stroke-width="1"/>
 <rect class="chr-body" x="1" y="1" width="${w-2}" height="${h-2}" rx="5.5" fill="${col}"/>${labels}</g>`;
}
function parentSVG(side){const P=PARENTS[side];const ch=state.choice[side];const x=[16,40,82,106,148,172];return `<svg class="cell-svg" viewBox="0 0 200 200" aria-label="三對同源染色體，可點選或拖曳到配子" xmlns="http://www.w3.org/2000/svg">${P.map((c,i)=>{const height=[80,60,42][c.type-1];return chrRect(c,x[i],(200-height)/2,i,side,ch.includes(c.id),ch.includes(c.id));}).join('')}</svg>`;}
function tokenSVG(c,side,i){
 const h=[56,42,31][c.type-1], x=29+i*33, y=(132-h)/2;
 const col=side==='dad'?'#3498db':'#e74c3c';
 const rows=c.genes.map((g,j)=>{
  const gy=y+(j+.5)*h/c.genes.length;
  return `<line x1="${x-2}" y1="${gy.toFixed(1)}" x2="${x+11}" y2="${gy.toFixed(1)}" stroke="#26394a" stroke-width="1.4"/><text x="${x+13}" y="${(gy+3.8).toFixed(1)}" font-size="10.5" font-weight="900" fill="#25364a" stroke="white" stroke-width="2" paint-order="stroke">${g}</text>`;
 }).join('');
 return `<g class="gamete-chr" data-remove-side="${side}" data-remove-i="${i}" role="button" tabindex="0" aria-label="移回第${i+1}對的染色體" style="cursor:pointer"><rect x="${x}" y="${y.toFixed(1)}" rx="4" width="11" height="${h}" fill="${col}" opacity=".8"/>${rows}</g>`;
}
function gameteSVG(side){
 const g=chosen(side),color=side==='dad'?'#3498db':'#e74c3c';
 const tail=side==='dad'?`<svg class="sperm-tail" viewBox="0 0 110 60" aria-hidden="true"><path d="M 108 30 C 87 25, 80 11, 60 29 S 35 50, 12 27 S 2 15, 2 15"/></svg>`:'';
 return `${tail}<svg class="gamete-svg" viewBox="0 0 132 132" role="img" aria-label="${side==='dad'?'精子':'卵子'}"><path d="M 17 98 Q 66 115 114 98" stroke="${color}" stroke-width="1" opacity=".20" fill="none"/>${g.map((c,i)=>c?tokenSVG(c,side,i):`<text x="${34+i*33}" y="79" font-size="21" fill="#d1d8dd" text-anchor="middle">·</text>`).join('')}</svg><span class="gamete-caption">${side==='dad'?'精子':'卵子'}</span>`;
}
function childSVG(record){const x=[16,40,82,106,148,172];const gametes=[record.dad,record.mom];let html='';for(let type=1;type<=3;type++)for(let parent=0;parent<2;parent++){
 const c=gametes[parent][type-1];const i=(type-1)*2+parent;const h=[80,60,42][type-1];html+=chrRect(c,x[i],(200-h)/2,parent,parent===0?'dad':'mom',false,false,1);
 }return `<svg class="cell-svg" viewBox="0 0 200 200" aria-label="受精卵含六條染色體，各三條來自父母">${html.replaceAll('tabindex="0"','tabindex="-1"')}</svg>`;}
function renderParent(side){$(side+'Cell').innerHTML=parentSVG(side);const n=chosen(side).filter(Boolean).length;$(side+'Status').textContent=n===3?'配子形成完成 ✓':'選一條染色體送進配子';$(side+'Status').className='cell-status '+(n===3?'selected-status':'');const zone=$(side==='dad'?'spermArea':'eggArea');zone.innerHTML=gameteSVG(side);const mobile=$(side==='dad'?'mobileDadGamete':'mobileMomGamete');mobile.innerHTML=`<div class="gamete ${side==='mom'?'mom':''}" data-side="${side}" aria-label="${side==='dad'?'精子':'卵子'}">${gameteSVG(side)}</div><div class="gamete-counter clean">${side==='dad'?'精子':'卵子'}</div>`;$(side==='dad'?'dadCount':'momCount').textContent=`${side==='dad'?'精子':'卵子'}`;}
function renderChild(){const rec=state.records.find(x=>x.id===state.lastId);for(const id of ['childCell','childMonster','childMonsterDesktop']){const el=$(id);el.classList.toggle('revealed',!!rec);}
 if(!rec){$('childCell').innerHTML='<div class="empty-cell">?</div>';for(const id of ['childMonster','childMonsterDesktop']){$(id).innerHTML='?';$(id).classList.add('baby-empty');}for(const id of ['childInfo','childInfoDesktop'])$(id).textContent='等待受精';return;}
 $('childCell').innerHTML=childSVG(rec);for(const id of ['childMonster','childMonsterDesktop'])renderMonsterTo(id,rec.traits);for(const id of ['childInfo','childInfoDesktop'])$(id).textContent=`第 ${rec.id} 胎｜${rec.traits.A?'綠色':'黃色'}小怪獸`;
}
function renderUI(){
 for(const side of ['dad','mom'])renderParent(side);
 renderChild();
 const dad=ready('dad'),mom=ready('mom');
 const b=$('combineBtn');
 b.disabled=!dad||!mom||busy||batchActive;
 b.textContent='受精作用';
 b.classList.toggle('ready',dad&&mom&&!busy&&!batchActive);
 const mb=$('combineBtnMobile');mb.disabled=b.disabled;mb.classList.toggle('ready',dad&&mom&&!busy&&!batchActive);
 $('combineHint').textContent='';
 $('mode7').classList.toggle('on',state.mode===7);$('mode9').classList.toggle('on',state.mode===9);
 $('stages').hidden=state.mode===9;
 document.querySelectorAll('[data-stage]').forEach(el=>{const s=Number(el.dataset.stage);el.classList.toggle('on',s===state.stage);el.classList.toggle('locked',s>state.unlocked);el.disabled=s>state.unlocked;});
 const grade7Tags=['A：體色','B：翅膀','D：手數','E：長角','F：腳長','G：斑紋','H：眼數'];
 const grade9Tags=['A：體色（綠顯／黃隱）','B：翅膀（無翅顯／有翅隱）','D：手數（2手顯／4手隱）','E：長角（有角顯／無角隱）','F：腳長（短腳顯／長腳隱）','G：斑紋（無斑顯／有斑隱）','H：眼數（2眼顯／3眼隱）'];
 document.querySelectorAll('.trait-tag').forEach((el,i)=>{el.textContent=(state.mode===9?grade9Tags:grade7Tags)[i];el.classList.toggle('focus',state.mode===7&&FOCUS[state.stage].includes(TRAITS[i].k));});

 const batch=$('batchBtn');batch.disabled=busy||batchActive||!state.manualDone;
 batch.textContent=state.manualDone?'✦ 連生 5 胎':'✦ 先手動生 1 胎';batch.classList.toggle('batch-locked',!state.manualDone);
 $('recordBadge').textContent=`${state.records.length} 胎`;renderMobile();save();
}
function renderMobile(){const narrow=window.matchMedia('(max-width:639px), (max-width:950px) and (max-height:470px)').matches;const p=state.page;document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('on',b.dataset.page===p));document.querySelectorAll('.lab>.panel').forEach(el=>el.classList.remove('active-mobile'));
 if(!narrow)return;
 const panelIds=p==='dad'?['dad-cell']:p==='mom'?['mom-cell']:p==='child'?['child-cell']:[];
 panelIds.forEach(name=>document.querySelector(`[data-panel="${name}"]`)?.classList.add('active-mobile'));
 if(p==='records'&&$('recordsMask').hidden)openRecords();}
function setPage(p){state.page=p;renderMobile();save();}
function sourceChromosomeCenter(side,id){
 const el=Array.from(document.querySelectorAll('.chr-hit')).find(g=>g.dataset.side===side&&g.dataset.id===id&&g.getBoundingClientRect().width>0);
 const r=el?.getBoundingClientRect();
 return r?{x:r.left+r.width*.5,y:r.top+r.height*.5}:null;
}
function visibleGamete(side){
 const zones=[...document.querySelectorAll(`.gamete[data-side="${side}"]`)];
 return zones.find(z=>{const r=z.getBoundingClientRect();return r.width>20&&r.height>20&&r.bottom>0&&r.top<innerHeight;})||zones[0];
}
function centerOf(el){const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null;}
function chromosomeGhost(side,id){
 const c=chr(side,id),el=document.createElement('div');if(!c)return null;
 const h=[80,60,42][c.type-1];
 el.className='chromosome-ghost';
 el.innerHTML=`<svg viewBox="0 0 72 126" aria-hidden="true">${chrRect(c,29,(126-h)/2,(PARENTS[side].indexOf(c)%2),side,false,false,1)}</svg>`;
 document.body.appendChild(el);return el;
}
function rejectHomolog(side,id,from){
 const source=sourceChromosomeCenter(side,id)||{x:innerWidth*.5,y:innerHeight*.5};
 const target=centerOf(visibleGamete(side))||source;
 const origin=from||source;
 const visual=chromosomeGhost(side,id);
 if(visual){
  visual.style.left=origin.x+'px';visual.style.top=origin.y+'px';
  const dx=target.x-origin.x,dy=target.y-origin.y;
  const backX=source.x-origin.x,backY=source.y-origin.y;
  const a=visual.animate([
   {transform:'translate(-50%,-50%) translate(0px,0px) rotate(0deg)',offset:0},
   {transform:`translate(-50%,-50%) translate(${dx*.90}px,${dy*.90}px) rotate(0deg) scale(1.12)`,offset:.38},
   {transform:`translate(-50%,-50%) translate(${dx*.78}px,${dy*.81}px) rotate(-16deg) scale(1.18)`,offset:.55},
   {transform:`translate(-50%,-50%) translate(${backX}px,${backY}px) rotate(12deg) scale(.88)`,offset:1}
  ],{duration:560,easing:'ease-out'});
  a.finished.catch(()=>null).then(()=>visual.remove());
 }
 const zone=visibleGamete(side);zone?.classList.remove('reject-shake');void zone?.offsetWidth;zone?.classList.add('reject-shake');
 const note=document.createElement('span');note.className='reject-tip';note.textContent='同源只能選一條';
 note.style.left=Math.max(95,Math.min(innerWidth-95,target.x))+'px';
 note.style.top=Math.max(35,target.y-58)+'px';document.body.appendChild(note);
 note.animate([{opacity:0,transform:'translate(-50%,-8px)'},{opacity:1,transform:'translate(-50%,-50%)',offset:.2},{opacity:1,offset:.68},{opacity:0,transform:'translate(-50%,-75%)'}],{duration:1100,easing:'ease-out'}).finished.catch(()=>null).then(()=>note.remove());
 setTimeout(()=>zone?.classList.remove('reject-shake'),480);
}
function choose(side,id,origin){
 if(busy||batchActive)return;
 const c=chr(side,id);if(!c)return;
 const i=c.type-1,existing=state.choice[side][i];
 if(existing&&existing!==id){rejectHomolog(side,id,origin);return;}
 state.choice[side][i]=existing===id?null:id;
 renderUI();
 if(ready('dad')&&ready('mom')&&window.matchMedia('(max-width:639px), (max-width:950px) and (max-height:470px)').matches)setPage('child');
}
function createRecord(dad,mom){const gt=genotype(dad,mom),traits=phenotypes(gt);const r={id:state.nextId++,dad:dad.map(c=>({...c})),mom:mom.map(c=>({...c})),genotype:gt,traits};state.records.push(r);if(state.records.length>200){const evict=state.records.shift();state.proof=state.proof.filter(n=>n!==evict.id);}state.lastId=r.id;save();return r;}
function clearFusionVisual(){document.body.classList.remove('fusion-active');document.querySelector('.fusion-stage')?.remove();for(const id of ['spermArea','eggArea'])$(id).style.cssText='';}
function cancelAnimation(){animToken++;batchToken++;busy=false;batchActive=false;clearFusionVisual();document.querySelectorAll('.chromosome-ghost,.reject-tip').forEach(el=>el.remove());}
function reset(){cancelAnimation();state.choice={dad:[null,null,null],mom:[null,null,null]};state.lastId=null;renderUI();toast('已重新準備配子；之前出生的小怪獸仍保留在紀錄簿。');}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function fusionPositions(){
 const a=visibleGamete('dad')?.getBoundingClientRect(),b=visibleGamete('mom')?.getBoundingClientRect();
 const bothVisible=a&&b&&a.width>40&&b.width>40&&a.top>=0&&b.top>=0&&a.right>0&&b.right>0;
 if(bothVisible){
  const mX=((a.left+a.width*.5)+(b.left+b.width*.5))/2,mY=((a.top+a.height*.5)+(b.top+b.height*.5))/2;
  return {dad:{x:a.left+a.width*.5,y:a.top+a.height*.5,w:a.width,h:a.height},mom:{x:b.left+b.width*.5,y:b.top+b.height*.5,w:b.width,h:b.height},mid:{x:mX,y:mY}};
 }
 // Phone screens show one panel at a time; animate both complete gametes together on a centered overlay.
 const w=Math.min(104,innerWidth*.23),h=w*.82,midX=innerWidth*.5,midY=innerHeight*.52;
 return {dad:{x:midX-w*1.18,y:midY,w,h},mom:{x:midX+w*1.18,y:midY,w,h:w},mid:{x:midX,y:midY}};
}
function cloneGameteForFusion(side,geometry,scene){
 const el=document.createElement('div');el.className=`gamete ${side==='mom'?'mom':''}`;el.dataset.side=side;
 el.innerHTML=gameteSVG(side);
 el.style.left=(geometry.x-geometry.w/2)+'px';el.style.top=(geometry.y-geometry.h/2)+'px';
 el.style.width=geometry.w+'px';el.style.height=geometry.h+'px';
 scene.appendChild(el);return el;
}
async function fusionMovement(auto,token){
 const root=document.createElement('div');root.className='fusion-stage';document.body.classList.add('fusion-active');document.body.appendChild(root);
 const pos=fusionPositions();
 const dad=cloneGameteForFusion('dad',pos.dad,root),mom=cloneGameteForFusion('mom',pos.mom,root);
 const duration=auto?580:860;
 const dadDx=pos.mid.x-pos.dad.x,dadDy=pos.mid.y-pos.dad.y,momDx=pos.mid.x-pos.mom.x,momDy=pos.mid.y-pos.mom.y;
 const animations=[dad.animate([{transform:'translate(0,0)'},{transform:`translate(${dadDx}px,${dadDy}px)`}],{duration,fill:'forwards',easing:'cubic-bezier(.4,0,.2,1)'}),
 mom.animate([{transform:'translate(0,0)'},{transform:`translate(${momDx}px,${momDy}px)`}],{duration,fill:'forwards',easing:'cubic-bezier(.4,0,.2,1)'})];
 await Promise.all(animations.map(a=>a.finished.catch(()=>null)));
 if(token!==animToken){root.remove();document.body.classList.remove('fusion-active');return null;}
 dad.remove();mom.remove();return {root,pos};
}
async function animateBirthSequence(gDad,gMom,{auto=false}={}){
 const token=++animToken;busy=true;renderUI();
 const fusion=await fusionMovement(auto,token);if(token!==animToken||!fusion)return null;
 const rec=createRecord(gDad,gMom);
 const diameter=Math.min(150,Math.max(78,(fusion.pos.dad.w+fusion.pos.mom.w)*.70));
 const result=document.createElement('div');result.className='fusion-zygote';
 result.style.left=(fusion.pos.mid.x-diameter/2)+'px';result.style.top=(fusion.pos.mid.y-diameter/2)+'px';
 result.style.width=diameter+'px';result.style.height=diameter+'px';
 result.innerHTML=childSVG(rec);fusion.root.appendChild(result);
 result.animate([{opacity:.25,transform:'scale(.65)'},{opacity:1,transform:'scale(1.06)',offset:.6},{opacity:1,transform:'scale(1)'}],{duration:auto?270:430,easing:'ease-out'});
 await sleep(auto?290:470);if(token!==animToken)return null;
 renderChild();$('recordBadge').textContent=`${state.records.length} 胎`;
 fusion.root.remove();document.body.classList.remove('fusion-active');busy=false;return rec;
}
async function fertilize(){
 if(!ready('dad')||!ready('mom')||busy||batchActive)return;
 const sperm=copyGamete('dad'),egg=copyGamete('mom');
 const rec=await animateBirthSequence(sperm,egg,{auto:false});if(!rec)return;
 state.manualDone=true;state.choice={dad:[null,null,null],mom:[null,null,null]};renderUI();
 if(window.matchMedia('(max-width:639px), (max-width:950px) and (max-height:470px)').matches)setPage('child');
 toast(`第 ${rec.id} 胎誕生！`);
}
async function animatedChromosomeSelection(side,id,ms,run){
 const source=sourceChromosomeCenter(side,id),target=centerOf(visibleGamete(side));
 if(source&&target){
  const ghost=chromosomeGhost(side,id);ghost.style.left=source.x+'px';ghost.style.top=source.y+'px';
  await ghost.animate([{transform:'translate(-50%,-50%) translate(0px,0px)',opacity:1},{transform:`translate(-50%,-50%) translate(${target.x-source.x}px,${target.y-source.y}px)`,opacity:1}],{duration:ms,fill:'forwards',easing:'ease-in-out'}).finished.catch(()=>null);
  ghost.remove();
 }else await sleep(ms);
 if(run!==batchToken)return;
 state.choice[side][chr(side,id).type-1]=id;
 renderUI();
}
async function batch(){
 if(busy||batchActive)return;
 if(!state.manualDone){toast('先親手完成 1 胎');return;}
 batchActive=true;const run=++batchToken;state.choice={dad:[null,null,null],mom:[null,null,null]};renderUI();
 for(let i=0;i<5;i++){
  if(run!==batchToken)return;
  state.choice={dad:[null,null,null],mom:[null,null,null]};state.lastId=null;renderUI();
  for(let j=0;j<3;j++){
   const d=randGamete('dad')[j],m=randGamete('mom')[j];
   await animatedChromosomeSelection('dad',d.id,155,run);if(run!==batchToken)return;
   await animatedChromosomeSelection('mom',m.id,155,run);if(run!==batchToken)return;
  }
  if(run!==batchToken)return;
  const rec=await animateBirthSequence(copyGamete('dad'),copyGamete('mom'),{auto:true});
  if(!rec||run!==batchToken)return;
  await sleep(190);
 }
 if(run!==batchToken)return;
 batchActive=false;state.choice={dad:[null,null,null],mom:[null,null,null]};renderUI();
 recordPage=Math.max(0,Math.ceil(state.records.length/8)-1);openRecords();
 toast('連生 5 胎完成！');
}
function toast(msg){const el=$('toast');clearTimeout(toastTimer);el.textContent=msg;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,3200);}
function openRecords(){closeDialog();$('recordsMask').hidden=false;recordPage=Math.max(0,Math.min(recordPage,Math.ceil(state.records.length/8)-1));renderRecords();}
function closeRecords(){$('recordsMask').hidden=true;if(state.page==='records'){state.page='child';renderMobile();save();}}
function renderRecords(){const r=state.records,n=r.length,pages=Math.max(1,Math.ceil(n/8));recordPage=Math.max(0,Math.min(recordPage,pages-1));$('recordsTotal').textContent=`${n} 胎`;$('recordPaging').textContent=`第 ${recordPage+1} / ${pages} 頁`;$('prevRecords').disabled=recordPage<=0;$('nextRecords').disabled=recordPage>=pages-1;
 const list=r.slice(recordPage*8,recordPage*8+8);$('recordGrid').innerHTML=list.length?list.map(item=>`<button type="button" class="record-tile ${state.proof.includes(item.id)?'evidence':''}" data-record="${item.id}" aria-label="第${item.id}胎，查看基因型"><span class="record-num">第 ${item.id} 胎 ${state.proof.includes(item.id)?'✓':''}</span><div class="record-thumb"><div class="record-monster-thumb">${monsterHTML(item.traits)}</div><div class="record-zygote-thumb">${childSVG(item)}</div></div><span class="record-note">${item.traits.A?'綠':'黃'} · ${item.genotype.A}</span></button>`).join(''):`<div class="record-empty">還沒有出生紀錄。<p>先親手完成一胎，再解鎖「連生 5 胎」。</p></div>`;
 renderProof();}
function renderProof(){const text=$('proofText'),actions=$('proofActions'),heading=$('proofTitle');$('proofCount').textContent=`${state.proof.length} 筆證據`;
 if(state.mode===9){heading.textContent='九年級｜觀察與推論';text.textContent='已提供顯隱性對照。點選子代可回看精子、卵子與基因型。';actions.innerHTML='';return;}
 if(state.stage===0){heading.textContent='任務 1｜找出顯性體色';text.textContent='在紀錄中選取一隻 Aa 的綠色怪獸和一隻 aa 的黃色怪獸作為證據，再選擇哪種體色是顯性。';actions.innerHTML=`<button class="choice ${state.guess==='green'?'active':''}" data-guess="green">綠色是顯性</button><button class="choice ${state.guess==='yellow'?'active':''}" data-guess="yellow">黃色是顯性</button><button class="choice go" data-proof-action="verify">驗證我的推論 →</button>`;return;}
 if(state.stage===1){heading.textContent='任務 2｜多項性狀比較';text.textContent='在紀錄簿中選兩隻小怪獸，找出翅膀或角的差異，並觀察相對應的基因型。';actions.innerHTML='<button class="choice go" data-proof-action="verify-multi">完成比較，開放七項性狀 →</button>';return;}
 heading.textContent='七項性狀已全部開放';text.textContent='留意 A/B/D 位於同一對染色體，E/F 也在同一對，G/H 也在同一對；沒有互換時，同一條染色體上的基因會一起傳遞。';actions.innerHTML='';}
function verify(){const items=state.records.filter(x=>state.proof.includes(x.id));if(!state.guess){toast('請先選擇哪種體色是顯性。');return;}
 if(!items.some(r=>r.genotype.A==='Aa'&&r.traits.A)||!items.some(r=>r.genotype.A==='aa'&&!r.traits.A)){toast('還缺少 Aa 綠色與 aa 黃色的兩種證據，可再多生幾胎。');return;}
 if(state.guess!=='green'){toast('Aa 是綠色，aa 是黃色。請再想想哪種體色能蓋過另一種。');return;}
 state.stage=1;state.unlocked=Math.max(state.unlocked,1);state.guess=null;state.proof=[];renderUI();renderRecords();toast('推論成功！已解鎖第二階段：比較多項性狀。');}
function verifyMulti(){const selected=state.records.filter(x=>state.proof.includes(x.id));if(selected.length<2){toast('請先挑選至少兩隻小怪獸作為比較證據。');return;}let varies=false;for(let i=0;i<selected.length;i++)for(let j=i+1;j<selected.length;j++)if(selected[i].traits.B!==selected[j].traits.B||selected[i].traits.E!==selected[j].traits.E)varies=true;
 if(!varies){toast('這兩隻的翅膀和角相同，請找出不同的子代比較。');return;}
 state.stage=2;state.unlocked=2;state.proof=[];renderUI();renderRecords();toast('解鎖成功！七項性狀都能研究了。');}
function openDialog(title,html,buttons=''){$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;$('dialogFoot').innerHTML=buttons;$('dialogMask').hidden=false;}
function closeDialog(){$('dialogMask').hidden=true;detailId=null;}
function detail(id){const rec=state.records.find(x=>x.id===id);if(!rec)return;detailId=id;const rows=TRAITS.map(t=>`<tr><td>${t.name}</td><td><b>${rec.genotype[t.k]}</b></td><td>${rec.traits[t.k]?t.dom:t.rec}</td></tr>`).join('');const d=rec.dad.map(x=>x.genes.join('')).join('／'),m=rec.mom.map(x=>x.genes.join('')).join('／');const button=state.mode===7&&state.stage<2?`<button class="btn purple" data-evidence="${id}">${state.proof.includes(id)?'✓ 已選為證據（點此移除）':'＋ 選這一胎作為證據'}</button>`:'';
 openDialog(`第 ${rec.id} 胎｜基因型與表現型`,`<div class="detail-main"><div class="detail-monster">${monsterHTML(rec.traits)}</div><div class="detail-info"><h3>精子 + 卵子 → 受精卵</h3><p><b>精子：</b>${d}</p><p><b>卵子：</b>${m}</p><table class="detail-table"><thead><tr><th>性狀</th><th>基因型</th><th>外在表現</th></tr></thead><tbody>${rows}</tbody></table></div></div>`,button);}
function confirmClear(){if(!state.records.length){toast('目前沒有需要清空的紀錄。');return;}openDialog('清空全部子代紀錄？',`<p class="dialog-text">將刪除目前裝置記錄的 ${state.records.length} 胎小怪獸與已選證據。已解鎖的探索階段會保留。</p>`,`<button class="btn" data-cancel-dialog>取消</button><button class="btn orange" id="confirmClear">確定清空</button>`);}
function clearRecords(){state.records=[];state.lastId=null;state.nextId=1;state.proof=[];state.guess=null;recordPage=0;closeDialog();renderUI();renderRecords();toast('全部子代紀錄已清空。');}
function beginDrag(e){
 const hit=e.target.closest('.chr-hit');
 if(!hit||hit.classList.contains('faded')||busy||batchActive||e.button>0)return;
 e.preventDefault();
 drag={id:hit.dataset.id,side:hit.dataset.side,x:e.clientX,y:e.clientY,pointerId:e.pointerId,moved:false,ghost:null,source:hit};
 try{hit.setPointerCapture(e.pointerId);}catch{}
}
function moveDrag(e){
 if(!drag||e.pointerId!==drag.pointerId)return;
 const dd=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
 if(dd>9&&!drag.moved){
  drag.moved=true;drag.ghost=chromosomeGhost(drag.side,drag.id);
  drag.source?.classList.add('drag-source');
 }
 if(!drag.moved)return;
 drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
 document.querySelectorAll('.gamete').forEach(zone=>{const rect=zone.getBoundingClientRect();zone.classList.toggle('drop-here',zone.dataset.side===drag.side&&rect.width>20&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom);});
}
function endDrag(e){
 if(!drag||e.pointerId!==drag.pointerId)return;
 const d=drag;drag=null;d.source?.classList.remove('drag-source');d.ghost?.remove();
 document.querySelectorAll('.gamete').forEach(el=>el.classList.remove('drop-here'));
 if(!d.moved){choose(d.side,d.id);return;}
 const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.gamete');
 if(target?.dataset.side===d.side)choose(d.side,d.id,{x:e.clientX,y:e.clientY});
 // Dropping outside a gamete simply returns the chromosome without extra instructions.
}
function onChrKey(e){const g=e.target.closest('.chr-hit');if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault();if(!g.classList.contains('faded'))choose(g.dataset.side,g.dataset.id);}}
function removeGamete(e){const g=e.target.closest('[data-remove-i]');if(!g||busy)return;const side=g.dataset.removeSide,i=Number(g.dataset.removeI);state.choice[side][i]=null;renderUI();}
function stage(n){if(state.mode===9)return;if(n>state.unlocked){toast('完成目前的證據任務後才能解鎖。');return;}state.stage=n;renderUI();}
function mode(n){cancelAnimation();state.mode=n;state.stage=n===9?2:Math.min(state.unlocked,state.stage===2?2:state.stage);state.proof=[];state.guess=null;renderUI();toast(n===9?'九年級模式已啟用。':'七年級：循序探索模式已啟用。');}
function orientation(){let dismissed=false;try{dismissed=sessionStorage.getItem('monster_orient_dismissed')==='1';}catch{}if(window.matchMedia('(orientation:portrait)').matches&&window.innerWidth<900&&!dismissed)$('orientTip').hidden=false;else $('orientTip').hidden=true;}
function setup(){for(const side of ['dad','mom']){const el=$(side+'Cell');el.addEventListener('pointerdown',beginDrag);el.addEventListener('keydown',onChrKey);}document.addEventListener('pointermove',moveDrag);document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null;document.querySelectorAll('.gamete').forEach(el=>el.classList.remove('drop-here'));});$('spermArea').addEventListener('click',removeGamete);$('eggArea').addEventListener('click',removeGamete);$('mobileDadGamete').addEventListener('click',removeGamete);$('mobileMomGamete').addEventListener('click',removeGamete);$('combineBtn').addEventListener('click',fertilize);$('combineBtnMobile').addEventListener('click',fertilize);$('reset').addEventListener('click',reset);$('batchBtn').addEventListener('click',batch);$('recordsBtn').addEventListener('click',openRecords);$('mode7').addEventListener('click',()=>mode(7));$('mode9').addEventListener('click',()=>mode(9));document.querySelectorAll('[data-stage]').forEach(el=>el.addEventListener('click',()=>stage(Number(el.dataset.stage))));document.querySelectorAll('[data-page]').forEach(el=>el.addEventListener('click',()=>el.dataset.page==='records'?openRecords():setPage(el.dataset.page)));$('clearRecords').addEventListener('click',confirmClear);$('prevRecords').addEventListener('click',()=>{recordPage--;renderRecords();});$('nextRecords').addEventListener('click',()=>{recordPage++;renderRecords();});$('recordGrid').addEventListener('click',e=>{const item=e.target.closest('[data-record]');if(item)detail(Number(item.dataset.record));});$('proofActions').addEventListener('click',e=>{const g=e.target.closest('[data-guess]');if(g){state.guess=g.dataset.guess;renderProof();save();return;}const a=e.target.closest('[data-proof-action]');if(a){if(a.dataset.proofAction==='verify')verify();else if(a.dataset.proofAction==='verify-multi')verifyMulti();}});$('dialogFoot').addEventListener('click',e=>{const v=e.target.closest('[data-evidence]');if(v){const id=Number(v.dataset.evidence);state.proof=state.proof.includes(id)?state.proof.filter(i=>i!==id):[...state.proof,id];save();closeDialog();renderRecords();toast(state.proof.includes(id)?'已加入這一胎作為證據。':'已移除此證據。');return;}if(e.target.id==='confirmClear')clearRecords();if(e.target.matches('[data-cancel-dialog]'))closeDialog();});document.querySelectorAll('[data-close]').forEach(btn=>btn.addEventListener('click',()=>{if(btn.dataset.close==='recordsMask')closeRecords();else closeDialog();}));$('recordsMask').addEventListener('click',e=>{if(e.target===$('recordsMask'))closeRecords();});$('dialogMask').addEventListener('click',e=>{if(e.target===$('dialogMask'))closeDialog();});document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('dialogMask').hidden)closeDialog();else if(!$('recordsMask').hidden)closeRecords();}});$('dismissOrient').addEventListener('click',()=>{try{sessionStorage.setItem('monster_orient_dismissed','1');}catch{}$('orientTip').hidden=true;});window.addEventListener('resize',()=>{renderMobile();orientation();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&busy){cancelAnimation();renderUI();}});}
renderMonsterTo('dadMonster',individual('dad'));renderMonsterTo('dadMonsterDesktop',individual('dad'));renderMonsterTo('momMonster',individual('mom'));renderMonsterTo('momMonsterDesktop',individual('mom'));
setup();renderUI();orientation();
window.__monsterQA={parents:PARENTS,genotype,phenotypes,createRecord,randGamete,getState:()=>structuredClone(state),choose,reset};
})();
