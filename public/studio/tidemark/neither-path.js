import {initial, actions, step} from './resources/neither-path-world.mjs';

// Presentation derivative. No storage, timer, network request or action tracking.
let state=initial();
const $=id=>document.getElementById(id);
const controls=[...document.querySelectorAll('[data-action]')];
const routes=[['M300 370 Q150 300 165 145','M300 370 Q460 290 435 145'],['M300 370 Q65 235 165 145','M300 370 Q320 240 435 145'],['M300 370 Q270 240 165 145','M300 370 Q545 240 435 145']];
const prose={threshold:'Two warm paths. Neither asks to be first.',chair:'The chair is here. The door remains available.',door:'The door is here. The chair remains available.',seated:'Nothing is counting down. Nothing is waiting to be earned.',outside:'You have left. The arrangement remains for someone else.'};

function render(){
  $('chairpath').setAttribute('d',routes[state.arrangement][0]);
  $('doorpath').setAttribute('d',routes[state.arrangement][1]);
  $('status').textContent=prose[state.place];
  $('visitor').textContent='Visitor '+state.visitor+' / arrangement '+(state.arrangement+1);
  const available=actions(state);
  for(const button of controls){button.hidden=!available.includes(button.dataset.action);button.disabled=button.hidden;}
  $('traces').replaceChildren();
  for(const [i,f] of state.footprints.entries()){
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',routes[f.arrangement][f.to==='chair'?0:1]);
    path.setAttribute('class','trace');path.setAttribute('stroke-dashoffset',String(i*11));
    $('traces').append(path);
  }
  $('state').textContent=JSON.stringify(state,null,2);
  $('ledger').textContent=state.footprints.length+' walks remain in the floor. Sweeping moves the open paths, not their history.';
}
for(const button of controls)button.addEventListener('click',()=>{
  state=step(state,button.dataset.action);render();
  // Keep keyboard focus on a still-available action, or its successor after departure.
  if(button.hidden)controls.find(control=>!control.hidden)?.focus({preventScroll:true});
});
render();
document.body.dataset.museumReady='true';
