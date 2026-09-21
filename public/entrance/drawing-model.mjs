// Authored mappings of admitted public text. No sentiment or agency inference.
export const clamp = (x, low = 0, high = 1) => Math.max(low, Math.min(high, x));
export const words = text => text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) || [];
export function hash(text) {
  let h = 2166136261;
  for (const byte of new TextEncoder().encode(text)) { h ^= byte; h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const seedOf = source => hash(`${source.key}|${source.occurredAt}|${source.excerpt}`);
export function buildModel(data) {
  if (data.sources.length !== 3 || data.claims.length !== 3) throw new Error('Expected this study’s three selected contributions and three named tests.');
  const [proposal, challenge, correction] = data.sources;
  if (!(proposal.occurredAt < challenge.occurredAt && challenge.occurredAt < correction.occurredAt)) throw new Error('Source chronology is not ordered.');
  for (const claim of data.claims) if (!proposal.excerpt.includes(claim.text)) throw new Error(`Claim is not verbatim in the selected proposal: ${claim.id}`);
  const withdrawal = data.annotations.find(x => x.operation === 'withdraw-test');
  const objection = data.annotations.find(x => x.operation === 'challenge');
  if (withdrawal?.target !== 'excluded-name' || objection?.target !== withdrawal.target || withdrawal.source !== correction.key || objection.source !== challenge.key) throw new Error('Mapping does not match the reviewed exchange.');
  let offset = 0;
  const claims = data.claims.map(claim => {
    const tokens = words(claim.text), start = offset;
    offset += tokens.length;
    return { ...claim, tokens, start, seed: hash(claim.text) };
  });
  return {
    data, claims, totalWords: offset,
    proposalSeed: seedOf(proposal), challengeSeed: seedOf(challenge), correctionSeed: seedOf(correction),
    challengeWords: words(challenge.excerpt), correctionWords: words(correction.excerpt),
    fingerprint: hash(JSON.stringify(data)).toString(16).padStart(8, '0'),
  };
}

const TAU = Math.PI * 2;
function shape(u, v, token, seed, influence = 0, shift = 0) {
  const h = hash(token), phase = (h % 4096) / 4096 * TAU;
  const band = v * 2 - 1, lean = ((seed % 1000) / 1000 - .5) * .48;
  const lexical = clamp((token.length - 2) / 12);
  const knot = u + (1.1 + lexical * .45) * Math.sin(u * 2 + band * 1.3) * .38;
  const radius = .20 + v * .23;
  const fold = Math.sin(u * 3 + band * 1.5 + (seed % 314) * .01);
  let x = Math.cos(knot) * radius * (.72 + .28 * Math.cos(u * 2 - .6));
  let y = Math.sin(knot) * radius;
  x += .09 * fold * Math.sin(u + band * .8);
  y += .09 * Math.sin(u * 3 - band * 1.7) * Math.sin(u);
  x += .035 * lexical * Math.sin(u * 4 + phase);
  y += .025 * lexical * Math.cos(u * 3 + phase);
  // The objection's field deforms only the specifically challenged test.
  x += influence * .12 * Math.sin(u * 2 + phase * .15) * Math.sin(u);
  y += influence * .10 * Math.cos(u * 3 - band);
  x += .10 * Math.sin(y * 5 + band * .6);
  y += .06 * Math.sin(x * 6 + band);
  x += shift * Math.cos(u + band * 3); y += shift * Math.sin(u * 2 - band);
  return [(x * Math.cos(lean) - y * Math.sin(lean)) * 1.18, x * Math.sin(lean) + y * Math.cos(lean)];
}

export function contours(model, position, steps = 180) {
  const challenge = clamp(position), withdrawal = clamp(position - 1), result = [];
  const ink = ['#fd29ce', '#fa835c', '#e57ec7'];
  for (const [claimIndex, claim] of model.claims.entries()) {
    const withdrawn = claim.id === 'excluded-name';
    claim.tokens.forEach((token, i) => {
      const v = (claim.start + i) / Math.max(1, model.totalWords - 1);
      for (let pass = 0; pass < 6; pass++) {
        const points = [];
        for (let j = 0; j <= steps; j++) points.push(shape(j / steps * TAU, v, token, model.proposalSeed, withdrawn ? challenge : 0, (pass - 2.5) * .0024));
        result.push({layer:claim.id, points, color:withdrawn && withdrawal > .99 ? '#a79b94' : ink[claimIndex], alpha:.66 * (withdrawn ? 1 - withdrawal * .82 : 1), width:.65});
      }
    });
  }
  model.challengeWords.forEach((token, i) => {
    const v = i / Math.max(1, model.challengeWords.length - 1);
    for (let pass = 0; pass < 2; pass++) {
      const points = [];
      for (let j = 0; j <= steps; j++) {
        const p = shape(j / steps * TAU, v * .63, token, model.proposalSeed, 1, (pass - .5) * .002);
        const angle = -.42 + (model.challengeSeed % 120) / 600;
        points.push([p[0] * Math.cos(angle) - p[1] * Math.sin(angle) - .045, p[0] * Math.sin(angle) + p[1] * Math.cos(angle) - .035]);
      }
      result.push({layer:'challenge', points, color:'#f0e5cb', alpha:.28 * challenge, width:.5});
    }
  });
  model.correctionWords.forEach((token, i) => {
    const v = i / Math.max(1, model.correctionWords.length - 1), points = [];
    for (let j = 0; j <= steps; j++) {
      const p = shape(j / steps * TAU, .18 + v * .5, token, model.correctionSeed, .6, .003);
      points.push([p[0] * .9 + .10, p[1] * 1.06 + .05]);
    }
    result.push({layer:'correction', points, color:'#f5c3b7', alpha:.23 * withdrawal, width:.45});
  });
  return result;
}

export function positionAt(ms, reduced = false) {
  if (reduced) return ms < 3500 ? 0 : ms < 7500 ? 1 : 2;
  if (ms < 1500) return 0;
  if (ms < 3500) return (ms - 1500) / 2000;
  if (ms < 5500) return 1;
  if (ms < 7500) return 1 + (ms - 5500) / 2000;
  return 2;
}
