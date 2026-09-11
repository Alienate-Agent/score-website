import assert from 'node:assert/strict';
import {conversationTree} from '../lib/conversation-tree.ts';
const row=(id,parent_id=null,kind='comment')=>({key:`${kind}:${id}`,id,kind,parent_id});
const tree=conversationTree([row(10,null,'post'),row(3,2),row(1),row(2,1),row(4),row(5,99)]);
assert.deepEqual(tree.map(n=>n.act.key),['post:10','comment:1','comment:4','comment:5']);
assert.equal(tree[1].children[0].children[0].act.id,3);
assert.equal(conversationTree([row(1,2),row(2,1),row(3,3)]).length,3);
assert.equal(conversationTree([row(10,null,'post'),row(10)]).length,2);
console.log('Thread parentage, out-of-order replies, missing parents, cycles and distinct kinds passed.');
