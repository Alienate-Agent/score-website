import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';

export const root = dirname(fileURLToPath(import.meta.url));
const upstream = resolve(root, '../2026-09-17-entrances/exchange-print');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const xml = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
const num = value => Number(value.toFixed(6));
export const stages = ['01-proposal', '02-challenge', '03-after-withdrawal'];
const pens = {
  'excluded-name': ['01', 'Magenta', '#ce218d'],
  'reserved-rights': ['02', 'Coral', '#db603b'],
  'bundled-ballot': ['03', 'Plum', '#9c4f89'],
  challenge: ['04', 'Blue', '#306687'],
  correction: ['05', 'Black', '#282323'],
};

// Keep existing model paths, not a new drawing. One of the six proposal passes
// and one of the two challenge passes per word survive the physical translation.
export function plotPaths(paths) {
  const seen = new Map();
  return paths.filter(path => {
    const index = seen.get(path.layer) ?? 0;
    seen.set(path.layer, index + 1);
    return path.alpha > 0 && (path.layer === 'correction' || (path.layer === 'challenge' ? index % 2 === 0 : index % 6 === 2));
  });
}

function drawingPath(path, plot) {
  const scale = plot ? 148 : 546;
  const ox = plot ? 105 : 294;
  const oy = plot ? 148.5 : 324;
  return path.points.map(([x, y], i) => `${i ? 'L' : 'M'}${num(ox + x * scale)},${num(oy + y * scale)}`).join(' ');
}

export function renderSvg(paths, { stage, plot = false, layer = null, fingerprint }) {
  const visible = (plot ? plotPaths(paths) : paths.filter(p => p.alpha > 0)).filter(p => !layer || p.layer === layer);
  const label = `${stages[stage]} — ${plot ? 'A4 pen proof, one contour per word' : 'screen vector master, 600 × 648 reference'}`;
  const metadata = { study: 'After an objection', stage, fingerprint, model: 'frozen/model.mjs', data: 'frozen/exchange-data.json', steps: 160,
    translation: plot ? 'One existing contour per word; opaque 0.25 mm pens on paper. Withdrawn trace retained in grey. No claim of physical testing.' : 'Full browser contour density and alpha; same 600 × 648 reference transform; not a pixel capture.', layer };
  const groups = [...new Set(visible.map(p => p.layer))].map(id => {
    const [order, normalName, normalColor] = pens[id];
    const faded = stage === 2 && id === 'excluded-name';
    const penName = faded ? 'Grey — retained withdrawn trace' : normalName;
    const color = faded ? '#a79b94' : normalColor;
    const content = visible.filter(p => p.layer === id).map(p => `    <path d="${drawingPath(p, plot)}" stroke="${plot ? color : p.color}" stroke-width="${plot ? .25 : p.width}"${plot ? '' : ` stroke-opacity="${num(p.alpha)}"`}/>`).join('\n');
    return `  <g id="${id}" inkscape:groupmode="layer" inkscape:label="${xml(plot ? `${order} ${penName} — ${id}` : id)}" fill="none" stroke-linecap="round" stroke-linejoin="miter">\n${content}\n  </g>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${plot ? 210 : 200}mm" height="${plot ? 297 : 216}mm" viewBox="0 0 ${plot ? '210 297' : '600 648'}">\n  <title>${xml(label)}</title>\n  <desc>Programmatic interpretation of selected public contributions by Alienate and episteme, 16–17 September 2026. Website-authored geometry and interpretive mapping; not a measurement of belief or consent to a commercial edition.</desc>\n  <metadata>${xml(JSON.stringify(metadata))}</metadata>\n${plot ? '' : '  <rect width="600" height="648" fill="#171516"/>\n'}${groups}\n</svg>\n`;
}

function lengthMm(paths) {
  return paths.reduce((sum, path) => sum + path.points.slice(1).reduce((total, p, i) => total + Math.hypot(p[0] - path.points[i][0], p[1] - path.points[i][1]) * 148, 0), 0);
}

export async function exportBundle() {
  // Freeze the model and selection on first export; reruns always use that frozen
  // pair, so future prototype edits cannot silently rewrite a potential edition.
  const frozen = resolve(root, 'frozen');
  await mkdir(frozen, { recursive: true });
  for (const name of ['model.mjs', 'exchange-data.json']) {
    try { await readFile(resolve(frozen, name)); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await writeFile(resolve(frozen, name), await readFile(resolve(upstream, name)), { flag: 'wx' });
    }
  }
  const modelBytes = await readFile(resolve(frozen, 'model.mjs'));
  const dataBytes = await readFile(resolve(frozen, 'exchange-data.json'));
  const { buildModel, contours } = await import(pathToFileURL(resolve(frozen, 'model.mjs')));
  const data = JSON.parse(dataBytes), model = buildModel(data), artifacts = [];
  for (const directory of ['screen-masters', 'pen-proofs', 'pen-proofs/separated']) await mkdir(resolve(root, directory), { recursive: true });
  for (let stage = 0; stage < 3; stage++) {
    const paths = contours(model, stage, 160);
    const outputs = [
      [`screen-masters/${stages[stage]}.svg`, false, null],
      [`pen-proofs/${stages[stage]}.svg`, true, null],
      ...[...new Set(plotPaths(paths).map(p => p.layer))].map(layer => [`pen-proofs/separated/${stages[stage]}--${layer}.svg`, true, layer]),
    ];
    for (const [file, plot, layer] of outputs) {
      const svg = renderSvg(paths, { stage, plot, layer, fingerprint: model.fingerprint });
      await writeFile(resolve(root, file), svg);
      const selected = (plot ? plotPaths(paths) : paths.filter(p => p.alpha > 0)).filter(p => !layer || p.layer === layer);
      artifacts.push({ file, sha256: sha256(svg), stage, type: plot ? 'pen-proof' : 'screen-master', layer, paths: selected.length,
        ...(plot ? { penDownMetres: num(lengthMm(selected) / 1000) } : {}) });
    }
  }
  const manifest = { version: 1, title: data.title, status: 'Local proofs — not a released commercial edition',
    reference: { screen: { viewBox: [0, 0, 600, 648], widthMm: 200, heightMm: 216 }, pen: { pageMm: [210, 297], normalizedGeometryScaleMm: 148, translateMm: [105,148.5], minimumMarginMm: 15, strokeMm: .25, blankPaper: true, density: 'one existing contour per word' }, steps: 160 },
    reproducibility: { modelSha256: sha256(modelBytes), dataSha256: sha256(dataBytes), exporterSha256: sha256(await readFile(fileURLToPath(import.meta.url))),
      seedAlgorithm: '32-bit FNV-1a on UTF-8 key + | + occurredAt + | + excerpt; not cryptographic',
      seeds: { proposal: model.proposalSeed, challenge: model.challengeSeed, correction: model.correctionSeed }, fingerprint: model.fingerprint },
    sources: data.sources.map(({key, author, occurredAt, url, bodySha256}) => ({key, author, occurredAt, url, bodySha256})), artifacts };
  await writeFile(resolve(root, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await exportBundle();
  console.log(JSON.stringify({ files: manifest.artifacts.length, seeds: manifest.reproducibility.seeds,
    proofs: manifest.artifacts.filter(a => a.type === 'pen-proof' && !a.layer).map(a => ({file:a.file, paths:a.paths, penDownMetres:a.penDownMetres})) }, null, 2));
}
