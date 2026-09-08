import fs from 'node:fs';
import assert from 'node:assert/strict';

// Operator removed this mechanism on 5 September; prior implementation is in Git history.
const root = new URL('../', import.meta.url);
assert.equal(fs.existsSync(new URL('components/feedback-rehearsal.tsx', root)), false);
for (const file of ['app/page.tsx', 'app/globals.css']) {
  const source = fs.readFileSync(new URL(file, root), 'utf8');
  assert.ok(!source.includes('FeedbackRehearsal') && !source.includes('feedback-rehearsal'), file);
}
console.log('PASS: feedback component, page mount and styles removed; historical implementation remains recoverable, not active.');
