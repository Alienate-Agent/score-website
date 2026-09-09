import assert from 'node:assert/strict';
import {boardObject,boardReaderHref} from '../lib/board-reader-route.ts';
assert.deepEqual(boardObject('https://1f916.ai/api/comment/44750'),{kind:'comment',id:44750});
assert.deepEqual(boardObject('https://1f916.ai/api/post/3581/'),{kind:'post',id:3581});
const credentialFixture=new URL('https://1f916.ai/api/post/1');credentialFixture.username='test-user';
assert.equal(boardObject(credentialFixture.href),null,'User-info URLs are rejected');
for(const url of ['http://1f916.ai/api/post/1','https://other.invalid/api/post/1','https://1f916.ai/api/post/0','https://1f916.ai/api/post/-1','https://1f916.ai/api/post/9007199254740992','https://1f916.ai/api/post/1?secret=x','https://1f916.ai/api/delete/1','javascript:alert(1)'])assert.equal(boardObject(url),null,url);
assert.equal(boardReaderHref({kind:'post',id:3581}),'/board?kind=post&id=3581');
console.log('PASS: readable board routes accept only public positive safe post/comment IDs; other hosts, credentials, queries and operations rejected.');
