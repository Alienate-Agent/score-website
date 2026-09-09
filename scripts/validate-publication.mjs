import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const excludedDirectories = new Set([
  '.git',
  '.next',
  '.vinext',
  '.wrangler',
  'coverage',
  'dist',
  'node_modules',
  'out',
  'outputs',
  'work',
]);

const windowsSeparatorPattern = String.fromCharCode(92).repeat(2);
const windowsPathSegmentPattern = '[^' + windowsSeparatorPattern + '\\s"\'<>]+';

const structuralRules = [
  {
    id: 'absolute-macos-home-path',
    pattern: new RegExp('/' + 'Users' + '/[^/\\s]+', 'g'),
  },
  {
    id: 'absolute-linux-home-path',
    pattern: new RegExp('/' + 'home' + '/[^/\\s]+', 'g'),
  },
  {
    id: 'absolute-windows-drive-path',
    pattern: new RegExp(
      '[A-Z]:' +
        windowsSeparatorPattern +
        '(?:Users|Documents and Settings)' +
        windowsSeparatorPattern +
        windowsPathSegmentPattern,
      'gi',
    ),
  },
  {
    id: 'absolute-windows-unc-path',
    sourceOnly: true,
    pattern: new RegExp(
      '(?<!' +
        windowsSeparatorPattern +
        ')' +
        windowsSeparatorPattern.repeat(2) +
        windowsPathSegmentPattern +
        windowsSeparatorPattern +
        windowsPathSegmentPattern,
      'g',
    ),
  },
  {
    id: 'file-uri',
    pattern: new RegExp('file:' + '//[^\\s]+', 'gi'),
  },
  {
    id: 'email-address',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
];

async function listTextCandidates(root) {
  const result = [];
  async function walk(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      if (item.isDirectory() && excludedDirectories.has(item.name)) continue;
      const path = resolve(directory, item.name);
      if (item.isDirectory()) await walk(path);
      else if (item.isFile()) result.push(path);
    }
  }
  await walk(root);
  return result;
}

async function readDenyList(path, root) {
  if (!path) {
    throw new Error(
      'Publication denied: PUBLICATION_DENY_LIST_PATH is required.',
    );
  }
  const absolute = resolve(path);
  const relation = relative(root, absolute);
  if (!relation.startsWith('..' + sep) && relation !== '..') {
    throw new Error(
      'Publication denied: the private deny list must remain outside the site repository.',
    );
  }
  const parsed = JSON.parse(await readFile(absolute, 'utf8'));
  if (
    parsed.schema_version !== 1 ||
    !Array.isArray(parsed.rules) ||
    parsed.rules.length === 0
  ) {
    throw new Error('Publication denied: private deny-list schema is invalid.');
  }
  for (const rule of parsed.rules) {
    if (
      typeof rule.id !== 'string' ||
      !Array.isArray(rule.values) ||
      rule.values.length === 0 ||
      rule.values.some((value) => typeof value !== 'string' || value.length < 4)
    ) {
      throw new Error(
        'Publication denied: a private deny-list rule is invalid.',
      );
    }
  }
  return parsed.rules;
}

function inspectText(text, file, privateRules, includeSourceOnlyRules) {
  const hits = [];
  // Unmodified p5 1.11.11 contains three regexp literals that this broad UNC
  // heuristic mistakes for paths. Bound this review to exact bytes + offsets.
  // Every private deny-list rule and other structural rule still applies.
  const reviewedP5 = ['public/lens/p5.min.js','scripts/patch-assets/p5.min.js'].includes(file)
    && createHash('sha256').update(text).digest('hex') === '1343f616bf9914da8253faae00201ea5f72772916998bc6add4c2a07e00a662c';
  for (const rule of structuralRules) {
    if (rule.sourceOnly && !includeSourceOnlyRules) continue;
    rule.pattern.lastIndex = 0;
    const unreviewed = [...text.matchAll(rule.pattern)].some(match =>
      !(reviewedP5 && rule.id === 'absolute-windows-unc-path'
        && [163208,163250,673106].includes(match.index)));
    if (unreviewed) hits.push({ file, rule: rule.id });
  }
  for (const rule of privateRules) {
    const haystack = rule.case_sensitive === true ? text : text.toLowerCase();
    for (const value of rule.values) {
      const needle = rule.case_sensitive === true ? value : value.toLowerCase();
      if (haystack.includes(needle)) {
        hits.push({ file, rule: rule.id });
        break;
      }
    }
  }
  return hits;
}

export async function validatePublication({
  root = projectRoot,
  scanRoot = root,
  denyListPath,
}) {
  const absoluteRoot = resolve(root);
  const absoluteScanRoot = resolve(scanRoot);
  const scanStat = await stat(absoluteScanRoot);
  if (!scanStat.isDirectory()) {
    throw new Error('Publication denied: scan target is not a directory.');
  }
  const privateRules = await readDenyList(denyListPath, absoluteRoot);
  const includeSourceOnlyRules = absoluteScanRoot === absoluteRoot;
  const files = await listTextCandidates(absoluteScanRoot);
  const hits = [];
  for (const file of files) {
    const buffer = await readFile(file);
    if (buffer.includes(0)) continue;
    hits.push(
      ...inspectText(
        buffer.toString('utf8'),
        relative(absoluteScanRoot, file),
        privateRules,
        includeSourceOnlyRules,
      ),
    );
  }
  if (hits.length) {
    const summary = hits
      .map((hit) => `${hit.file || '.'} [${hit.rule}]`)
      .join('\n');
    throw new Error(
      `Publication denied: protected material detected.\n${summary}`,
    );
  }
  return {
    files_scanned: files.length,
    private_rule_count: privateRules.length,
  };
}

async function runCli() {
  const phaseIndex = process.argv.indexOf('--phase');
  const phase = phaseIndex >= 0 ? process.argv[phaseIndex + 1] : 'source';
  const scanRoot =
    phase === 'output' ? resolve(projectRoot, 'dist') : projectRoot;
  const result = await validatePublication({
    root: projectRoot,
    scanRoot,
    denyListPath: process.env.PUBLICATION_DENY_LIST_PATH,
  });
  process.stdout.write(
    `Publication ${phase} scan passed: ${result.files_scanned} files, ${result.private_rule_count} private rule groups.\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  runCli().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
