import {PLANET_DEFS,COLLECTORS,TERRAFORM_COST,LASER_COST,LASER_DAMAGE,POWER_CAP,ECONOMY_CYCLE_SECONDS,makeGame,planet,beamLinks,objective,launchFleet,terraform,laserPulse,aimCollector,advanceTime} from './game-core.js';

const $=id=>document.getElementById(id);
let state=makeGame(new URLSearchParams(location.search).get('mode')==='optics'?'optics':'frontier');
let feedback='Drag from green Eos to Iona to send ships.';
let selectedCollector=null,selectedRival=null,keyboardSource=null,drag=null,suppressClick=false;
const map=$('map'),nodes=$('planetNodes'),collectorNodes=$('collectorNodes'),overlay=$('dragOverlay'),dragLine=$('dragLine');

function start(mode){
 state=makeGame(mode);selectedCollector=null;selectedRival=null;keyboardSource=null;drag=null;
 const url=new URL(location);if(mode==='optics')url.searchParams.set('mode','optics');else url.searchParams.delete('mode');history.replaceState(null,'',url);
 feedback=mode==='optics'?'Drag each gold collector to a built green receiver.':'Drag from green Eos to Iona to send ships.';
 overlay.hidden=true;render();
}
function mapLines(){
 const parts=['<ellipse cx="500" cy="325" rx="84" ry="63" class="star-orbit"/>','<ellipse cx="500" cy="325" rx="350" ry="238" class="system-orbit"/>'];
 for(const link of beamLinks(state)){
  const collector=COLLECTORS.find(c=>c.id===link.collector),p=planet(state,link.target);
  if(p)parts.push(`<line x1="${collector.x*10}" y1="${collector.y*6.5}" x2="${p.x*10}" y2="${p.y*6.5}" class="beam ${link.active?'active':'inactive'}"/>`);
 }
 for(const f of state.fleets){
  const a=planet(state,f.from),b=planet(state,f.to),progress=Math.max(0,Math.min(1,(f.total-f.eta)/f.total));
  const x=(a.x+(b.x-a.x)*progress)*10,y=(a.y+(b.y-a.y)*progress)*6.5;
  parts.push(`<line x1="${a.x*10}" y1="${a.y*6.5}" x2="${b.x*10}" y2="${b.y*6.5}" class="fleet-path"/><path d="M${x-8} ${y+7}L${x+10} ${y}L${x-8} ${y-7}Z" class="fleet-marker"/>`);
 }
 return parts.join('');
}
function handlePlanetClick(id,event){
 if(suppressClick||state.won)return;
 const p=planet(state,id);
 if(selectedCollector){const result=aimCollector(state,selectedCollector,id);feedback=result.message;if(result.ok)selectedCollector=null;render();return;}
 if(event?.detail===0&&state.mode==='frontier'){
  if(keyboardSource){const source=keyboardSource;keyboardSource=null;const amount=fleetAmount(planet(state,source));feedback=launchFleet(state,source,id,amount).message;render();return;}
  if(p.owner==='player'&&p.terraform){keyboardSource=id;feedback=`${p.name} selected. Choose a destination planet to send ${fleetAmount(p)} ships.`;render();return;}
 }
 if(state.mode==='frontier'&&p.owner==='player'&&!p.terraform){feedback=terraform(state,id).message;render();return;}
 if(state.mode==='frontier'&&p.owner==='rival'){selectedRival=id;feedback=`${p.name} has ${p.ships} defenders. Fire the optional laser or drag ships here.`;render();return;}
 feedback=p.owner==='player'?'Drag from this green planet to another planet to send ships.':'Drag ships here from a green planet.';render();
}
function renderMap(){
 $('routes').innerHTML=mapLines();
 if(!nodes.children.length){for(const def of PLANET_DEFS){const b=document.createElement('button');b.type='button';b.className='planet';b.dataset.planetId=def.id;b.innerHTML='<span class="planet-core"></span><span class="planet-name"></span><span class="planet-ships"></span>';b.onclick=event=>handlePlanetClick(def.id,event);nodes.append(b);}}
 for(const p of state.planets){const b=nodes.querySelector(`[data-planet-id="${p.id}"]`);b.className=`planet ${p.owner} ${p.terraform?'terraformed':'unformed'} ${selectedRival===p.id?'targeted':''}`;b.style.left=p.x+'%';b.style.top=p.y+'%';b.style.setProperty('--planet-color',p.color);b.setAttribute('aria-label',`${p.name}, ${p.owner}, ${p.terraform?'built':'not built'}, ${p.ships} ships. ${p.owner==='player'?'Drag to send a fleet.':'Fleet target.'}`);b.querySelector('.planet-name').textContent=p.name;b.querySelector('.planet-ships').textContent=p.ships;}
 if(!collectorNodes.children.length){for(const def of COLLECTORS){const b=document.createElement('button');b.type='button';b.className='collector-node';b.dataset.collectorId=def.id;b.innerHTML=`<span aria-hidden="true">✦</span><b>${def.name.split(' / ')[1]}</b>`;b.onclick=()=>{if(suppressClick||state.won)return;selectedCollector=def.id;feedback=`${def.name} selected. Choose a built green receiver, or drag its beam there.`;render();};collectorNodes.append(b);}}
 const links=beamLinks(state);for(const def of COLLECTORS){const b=collectorNodes.querySelector(`[data-collector-id="${def.id}"]`),link=links.find(x=>x.collector===def.id);b.className=`collector-node ${link.active?'linked':'offline'} ${selectedCollector===def.id?'selected':''}`;b.style.left=def.x+'%';b.style.top=def.y+'%';b.disabled=state.won;b.setAttribute('aria-label',`${def.name}, ${link.reason}. Drag to a built planet receiver.`);}
 $('flightReadout').textContent=state.fleets.length?state.fleets.map(f=>`${f.ships} → ${planet(state,f.to).name} · ${Math.max(0,f.eta).toFixed(1)}s`).join('  •  '):'No fleets in transit';
}
function fleetAmount(p){return Math.max(1,Math.floor(p.ships*Number($('fleetShare').value)/100));}
function renderCollectors(){
 const links=beamLinks(state),box=$('collectors');
 if(!box.children.length)for(const def of COLLECTORS){const b=document.createElement('button');b.type='button';b.className='collector';b.dataset.collectorId=def.id;b.onclick=()=>{selectedCollector=def.id;feedback=`${def.name} selected. Choose a built green receiver on the map.`;render();};box.append(b);}
 for(const def of COLLECTORS){const link=links.find(x=>x.collector===def.id),b=box.querySelector(`[data-collector-id="${def.id}"]`);b.className=`collector ${link.active?'linked':'offline'} ${selectedCollector===def.id?'selected':''}`;b.disabled=state.won;b.textContent=`${def.name}  →  ${planet(state,link.target).name}  ·  ${link.active?'+'+def.yield+' light':link.reason}`;}
}
function render(){
 const o=objective(state);$('turn').textContent=String(state.turn).padStart(2,'0');$('worlds').textContent=`${o.worlds} / ${o.requiredWorlds}`;$('power').textContent=state.power;$('output').textContent=`${o.output} / ${o.requiredOutput}`;
 $('goal').textContent=state.mode==='optics'?'Aim for 80 light output':'Four worlds + 75 output';$('announcement').textContent=feedback;
 $('unlockKicker').textContent=state.mode==='optics'?'OPTICS SIMULATION':'CAMPAIGN UNLOCK';$('unlockTitle').textContent=state.mode==='optics'?'4 RECEIVERS':'EOS ONLINE';$('unlockSub').textContent=state.mode==='optics'?'Light routing challenge · no fleets':'1 built world · live stellar map';
 $('frontierMode').classList.toggle('selected',state.mode==='frontier');$('opticsMode').classList.toggle('selected',state.mode==='optics');$('fleetOrders').hidden=state.mode==='optics';$('fleetShareValue').textContent=$('fleetShare').value+'%';
 $('laserAction').hidden=state.mode!=='frontier'||!selectedRival||state.won;if(selectedRival){$('laserTargetName').textContent=`${planet(state,selectedRival).name} · ${planet(state,selectedRival).ships} defenders`;$('fireLaser').disabled=state.power<LASER_COST;}
 renderMap();renderCollectors();$('log').replaceChildren(...state.log.map(message=>{const li=document.createElement('li');li.textContent=message;return li;}));
 $('victory').hidden=!state.won;if(state.won){$('victoryTitle').textContent=state.mode==='optics'?'The light paths align.':'The stellar network expands.';$('victoryText').textContent=state.mode==='optics'?'Four separate planet receivers now take the full 82 units from the collectors.':'Four built worlds and at least 75 light output have opened the next campaign layer.';}
}
function populateRules(){const values={terraformCost:TERRAFORM_COST,laserCost:LASER_COST,laserDamage:LASER_DAMAGE,powerCap:POWER_CAP,cycleSeconds:ECONOMY_CYCLE_SECONDS,frontierWorlds:objective(makeGame('frontier')).requiredWorlds,frontierOutput:objective(makeGame('frontier')).requiredOutput,opticsOutput:objective(makeGame('optics')).requiredOutput};for(const element of document.querySelectorAll('[data-rule]'))element.textContent=values[element.dataset.rule];$('collectorRules').replaceChildren(...COLLECTORS.map(def=>{const row=document.createElement('tr');for(const value of [def.name,def.yield+' light',def.options.map(id=>PLANET_DEFS.find(p=>p.id===id).name).join(' · ')]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}return row;}));}
function showTab(tab,updateUrl=true){const rules=tab==='rules';$('playPanel').hidden=rules;$('rulesPanel').hidden=!rules;$('gameContext').hidden=rules;for(const [id,selected] of [['playTab',!rules],['rulesTab',rules]]){const button=$(id);button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}if(updateUrl){const url=new URL(location);if(rules)url.searchParams.set('tab','rules');else{url.searchParams.delete('tab');if(url.hash.startsWith('#rules-'))url.hash='';}history.replaceState(null,'',url);$('gameTabs').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}

function mapPoint(event){const rect=map.getBoundingClientRect();return{x:(event.clientX-rect.left)/rect.width,y:(event.clientY-rect.top)/rect.height};}
function nearestPlanet(point,excluded=null){let best=null,distance=Infinity;for(const p of state.planets){if(p.id===excluded)continue;const dx=(p.x/100-point.x)*map.clientWidth,dy=(p.y/100-point.y)*map.clientHeight,d=Math.hypot(dx,dy);if(d<distance){distance=d;best=p;}}return distance<=Math.max(45,Math.min(map.clientWidth,map.clientHeight)*.13)?best:null;}
function validReceiver(collectorId,p){const def=COLLECTORS.find(c=>c.id===collectorId);return !!p&&p.owner==='player'&&p.terraform&&def.options.includes(p.id)&&!beamLinks(state).some(link=>link.active&&link.target===p.id&&link.collector!==collectorId);}
function showDrag(point,candidate){const origin=drag.type==='fleet'?planet(state,drag.id):COLLECTORS.find(c=>c.id===drag.id);overlay.hidden=false;overlay.classList.toggle('aiming',drag.type==='collector');dragLine.setAttribute('x1',origin.x*10);dragLine.setAttribute('y1',origin.y*6.5);dragLine.setAttribute('x2',point.x*1000);dragLine.setAttribute('y2',point.y*650);for(const b of nodes.children)b.classList.toggle('snap-candidate',b.dataset.planetId===candidate?.id);}
map.addEventListener('pointerdown',event=>{if(state.won||event.button!==0)return;const collector=event.target.closest('.collector-node'),planetButton=event.target.closest('.planet');if(collector)drag={type:'collector',id:collector.dataset.collectorId,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};else if(planetButton&&state.mode==='frontier'&&planet(state,planetButton.dataset.planetId).owner==='player')drag={type:'fleet',id:planetButton.dataset.planetId,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,moved:false};else return;event.preventDefault();map.setPointerCapture?.(event.pointerId);});
map.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.pointerId)return;const point=mapPoint(event);if(Math.hypot(event.clientX-drag.startX,event.clientY-drag.startY)>6)drag.moved=true;if(!drag.moved)return;const near=nearestPlanet(point,drag.type==='fleet'?drag.id:null);drag.candidate=drag.type==='collector'&&validReceiver(drag.id,near)?near:drag.type==='fleet'?near:null;showDrag(point,drag.candidate);});
map.addEventListener('pointerup',event=>{if(!drag||event.pointerId!==drag.pointerId)return;const current=drag,point=mapPoint(event),near=nearestPlanet(point,current.type==='fleet'?current.id:null);drag=null;overlay.hidden=true;for(const b of nodes.children)b.classList.remove('snap-candidate');suppressClick=true;setTimeout(()=>suppressClick=false,0);
 if(current.type==='fleet'){if(current.moved&&near){const result=launchFleet(state,current.id,near.id,fleetAmount(planet(state,current.id)));feedback=result.message;}else if(!current.moved){const p=planet(state,current.id);feedback=p.terraform?'Drag this green planet onto another planet to send ships.':terraform(state,current.id).message;}else feedback='Drop on another planet to send ships.';}
 else if(current.moved&&validReceiver(current.id,near)){selectedCollector=null;feedback=aimCollector(state,current.id,near.id).message;}else if(!current.moved){selectedCollector=current.id;feedback=`${COLLECTORS.find(c=>c.id===current.id).name} selected. Choose a built green receiver.`;}else feedback='No click: move the beam to a reachable, unused green receiver.';
 render();});
map.addEventListener('pointercancel',()=>{drag=null;overlay.hidden=true;for(const b of nodes.children)b.classList.remove('snap-candidate');});

$('playTab').onclick=()=>showTab('play');$('rulesTab').onclick=()=>showTab('rules');$('heroRules').onclick=()=>showTab('rules');$('returnGame').onclick=()=>showTab('play');$('beginnerPlay').onclick=()=>showTab('play');$('gameTabs').onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const next=event.key==='ArrowLeft'||event.key==='Home'?'play':'rules';showTab(next);$(next==='play'?'playTab':'rulesTab').focus();};
$('frontierMode').onclick=()=>start('frontier');$('opticsMode').onclick=()=>start('optics');$('reset').onclick=()=>start(state.mode);$('playAgain').onclick=()=>start(state.mode);$('fleetShare').oninput=()=>{$('fleetShareValue').textContent=$('fleetShare').value+'%';};$('fireLaser').onclick=()=>{const result=laserPulse(state,selectedRival);feedback=result.message;if(result.ok){map.classList.remove('pulse');void map.offsetWidth;map.classList.add('pulse');selectedRival=null;}render();};
populateRules();if(location.hash.startsWith('#rules-'))document.querySelector('.full-rules').open=true;showTab(new URLSearchParams(location.search).get('tab')==='rules'||location.hash.startsWith('#rules-')?'rules':'play',false);if(location.hash.startsWith('#rules-'))requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());else if(new URLSearchParams(location.search).get('tab')==='rules')requestAnimationFrame(()=>$('gameTabs').scrollIntoView());render();
let lastTime=performance.now();setInterval(()=>{const now=performance.now(),delta=Math.min(2,(now-lastTime)/1000);lastTime=now;if(state.mode==='frontier'&&!state.won){advanceTime(state,delta);if(!drag)render();}},200);
