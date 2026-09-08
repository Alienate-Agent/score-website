import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Source-level text contrast, not a computed-style or whole-page accessibility audit.
// Formula and unrounded threshold: W3C WCAG 2.2, Understanding SC 1.4.3.
// The notation guide inherits paper; source cards use paper-raised.
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const root = css.match(/:root\s*\{([^}]+)\}/)?.[1];
assert.ok(root, 'Root palette must exist');
const palette = Object.fromEntries([...root.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)]
  .map((match) => [match[1], match[2]]));

function luminance(hex) {
  assert.match(hex, /^#[\da-f]{6}$/i);
  const rgb = hex.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255)
    .map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (values[1] + 0.05) / (values[0] + 0.05);
}

assert.equal(contrast('#000000', '#ffffff'), 21);
assert.equal(contrast('#123456', '#123456'), 1);
assert.ok(contrast('#8a681e', '#eee9dc') < 4.5, 'Original Advisor pair is a negative control');

const foregrounds = ['--ink', '--ink-soft', '--reveal', '--voice-operator',
  '--voice-site', '--voice-advisor', '--voice-infrastructure', '--voice-polity'];
const results = [];
for (const background of ['--paper', '--paper-raised']) {
  for (const foreground of foregrounds) {
    assert.ok(palette[foreground] && palette[background], `Missing ${foreground} or ${background}`);
    const ratio = contrast(palette[foreground], palette[background]);
    results.push({ foreground, background, ratio });
  }
}
// Operator-adopted cyan/magenta are fields, not text on paper.
const voices=await readFile(new URL('../app/public-voices.css',import.meta.url),'utf8');
assert.match(voices,/background:#ff00ff; color:#000;/);
assert.match(voices,/data-origin=tidemark\] \{ background:#00ffff; \}/);
for(const background of ['--voice-alienate','--voice-tidemark'])results.push({foreground:'black nameplate text',background,ratio:contrast('#000000',palette[background])});
const failures = results.filter(({ ratio }) => ratio < 4.5);
assert.equal(failures.length, 0, JSON.stringify(failures));
// Selected marks use a dark field. Speaker-specific colors must not override
// the inverse foreground (Alienate's ordinary ink otherwise disappears).
assert.match(css, /\.score-mark\.is-current \.speaker-signature\s*\{\s*color: var\(--paper\);\s*\}/);
assert.match(css, /\.score-mark\.is-current \.event-chord\s*\{\s*border-left-color: var\(--paper\);\s*\}/);
assert.ok(contrast(palette['--paper'], palette['--ink']) >= 4.5);
const minimum = results.reduce((lowest, item) => item.ratio < lowest.ratio ? item : lowest);
console.log(`PASS: ${results.length} opaque reading-palette pairs; lowest ${minimum.ratio.toFixed(3)}:1 (${minimum.foreground} on ${minimum.background}).`);
console.log('Not a rendered cascade, opacity, deep-paper, dark-theme, focus/non-text, zoom, or screen-reader check.');
