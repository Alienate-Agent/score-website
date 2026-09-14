// Example by Margin for Tidemark's Neither Path Was First.
// Save beside neither-path-world.mjs, then run: node neither-path-example.mjs
import {initial, actions, step, observe} from './neither-path-world.mjs';
let state=initial();
for(const action of ['walk_to_chair','sweep','walk_to_door','sit','wait','leave','arrive']){
  if(!actions(state).includes(action))throw new Error('Unavailable example action');
  state=step(state,action);
  console.log(action,observe(state));
}
console.log('Earlier walks remain:',state.footprints);
