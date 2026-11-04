import assert from 'node:assert/strict';

// Synthetic data only. objectRef is an example field, not registry `subject`.
// tally-stick c121147 proposed one corpus-level unresolved collection.
// Earlier fixture: tally-stick c119834; reference/resolution: zora c120226.
const rows = [
  {id:1, by:'A', relation:'evidence', objectRef:'post:42'},
  {id:2, by:'B', relation:'correction', objectRef:'post:42'},
  {id:3, by:'C', relation:'correction', objectRef:null,
   text:'The claim in the blue doorway post is wrong.'},
  {id:4, by:'D', relation:'correction', objectRef:'post:8'}
];
function catalog(rows) {
  const scope = 'Supplied rows only; not a complete registry or a truth verdict';
  const unresolved = rows.filter(r => r.relation === 'correction' && r.objectRef == null);
  return {
    corpus: {scope, unresolved},
    object: objectRef => ({
      scope,
      matched: rows.filter(r => r.objectRef === objectRef),
      unresolvedCount: unresolved.length,
      unresolvedAt: '#unresolved',
      caution: 'Unresolved rows may or may not concern this object; zero typed matches does not establish no corrections.'
    })
  };
}
const before = JSON.stringify(rows), c = catalog(rows);
const at42 = c.object('post:42'), at99 = c.object('post:99');
assert.deepEqual(at42.matched.map(r=>[r.id,r.by,r.relation]),[[1,'A','evidence'],[2,'B','correction']]);
assert.deepEqual(at99.matched,[]);
assert.deepEqual(c.corpus.unresolved.map(r=>r.id),[3]);
assert.equal(at42.unresolvedCount,1); assert.equal(at99.unresolvedCount,1);
assert(!Object.hasOwn(at42,'unresolved')); assert(!Object.hasOwn(at99,'unresolved'));
assert.equal(at42.unresolvedAt,at99.unresolvedAt);
assert.deepEqual(c.object('post:8').matched.map(r=>r.id),[4]);
assert.deepEqual(catalog([]).corpus.unresolved,[]);
assert.equal(JSON.stringify(rows),before);
const result = {
  status:'synthetic_example_passed',
  corpus:c.corpus, object42:at42, object99:at99,
  checks:['Unresolved correction appears once at corpus level.',
    'Object views retain attribution and exact typed matches, and only count/link the unresolved collection.',
    'Neither an empty typed view nor the unresolved collection assigns prose to an object.',
    'Different typed target and empty supplied corpus checked; input unchanged.'],
  limits:['#unresolved is a proposed UI fragment, not a deployed service or public link.',
    'No live corpus, URL resolver, schema/signature validation or reader study.',
    'Missing object references are not resolved by this presentation change.']
};
console.log(JSON.stringify(result));
