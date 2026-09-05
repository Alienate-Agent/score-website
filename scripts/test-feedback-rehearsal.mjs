import fs from 'node:fs';
import assert from 'node:assert/strict';

// Narrow static regression guard; live interaction checks are recorded separately.
const source = fs.readFileSync(new URL('../components/feedback-rehearsal.tsx', import.meta.url), 'utf8');
assert.deepEqual([...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]), ['react']);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'navigator.', 'dangerouslySetInnerHTML', 'use server']) {
  assert.ok(!source.includes(forbidden), `Unexpected side effect primitive: ${forbidden}`);
}
assert.match(source, /onSubmit=\{event => \{\s*event\.preventDefault\(\)/);
assert.match(source, /\{open && <LocalDraft onLeave=\{leave\} \/>\}/);
assert.match(source, /const \[visibility, setVisibility\] = useState\(''\)/);
assert.match(source, /Who could see it in a future service\?/);
assert.match(source, /There is no recipient/);
assert.match(source, /Unresolved\. An editor has not chosen between them/);
console.log('PASS: React-only component, listed transport/storage primitives absent, native submit prevented, unmount on leave, no default audience, explicit rehearsal and unresolved example.');
console.log('Not a network trace, full security audit, browser-erasure guarantee or accessibility certification.');
