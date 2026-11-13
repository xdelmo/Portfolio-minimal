import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEMPLATE_MAX = 30;
export const STYLES_MAX = 50;

/**
 * Recursively find all TypeScript files in a directory, excluding specs.
 *
 * @param {string} dir
 * @returns {string[]}
 */
export function findComponentFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findComponentFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      files.push(full);
    }
  }
  return files;
}

/**
 * Parse an Angular component file to extract sizes and external URLs.
 *
 * @param {string} filePath
 * @param {string} content
 * @returns {ComponentInfo | null}
 */
export function parseComponent(filePath, content) {
  if (!content.includes('@Component')) {
    return null;
  }

  const totalLines = content.split('\n').length;

  const tUrlMatch = content.match(/templateUrl\s*:\s*[`'"]([^`'"]+)[`'"]/);
  const templateUrl = tUrlMatch ? tUrlMatch[1] : null;

  const sUrlMatch = content.match(/styleUrls?\s*:\s*(?:\[\s*[`'"]([^`'"]+)[`'"]\s*\]|[`'"]([^`'"]+)[`'"])/);
  const styleUrl = sUrlMatch ? sUrlMatch[1] || sUrlMatch[2] : null;

  let templateLines = 0;
  const tMatch = content.match(/template\s*:\s*`((?:[^`\\]|\\.)*)`/);
  if (tMatch) {
    templateLines = tMatch[1].split('\n').length;
  }

  let stylesLines = 0;
  const sMatch = content.match(/styles\s*:\s*(?:\[\s*)?`((?:[^`\\]|\\.)*)`(?:\s*\])?/);
  if (sMatch) {
    stylesLines = sMatch[1].split('\n').length;
  }

  const overTemplate = templateLines > TEMPLATE_MAX;
  const overStyles = stylesLines > STYLES_MAX;
  const isOver = overTemplate || overStyles;

  return {
    file: filePath,
    totalLines,
    templateLines,
    stylesLines,
    templateUrl,
    styleUrl,
    isOver,
    overTemplate,
    overStyles,
  };
}

/**
 * Scans a root directory (containing src/app) and returns all component stats.
 *
 * @param {string} rootDir
 * @returns {ComponentInfo[]}
 */
export function scanComponents(rootDir) {
  const appDir = resolve(rootDir, 'src/app');
  if (!existsSync(appDir)) {
    throw new Error(`Directory not found: ${appDir}`);
  }

  const files = findComponentFiles(appDir);
  const results = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    const info = parseComponent(file, content);
    if (info) {
      results.push(info);
    }
  }

  // Sort descending by largest inline size, then total lines
  results.sort((a, b) => {
    const sizeA = Math.max(a.templateLines, a.stylesLines);
    const sizeB = Math.max(b.templateLines, b.stylesLines);
    if (sizeB !== sizeA) return sizeB - sizeA;
    const sumA = a.templateLines + a.stylesLines;
    const sumB = b.templateLines + b.stylesLines;
    if (sumB !== sumA) return sumB - sumA;
    return b.totalLines - a.totalLines;
  });

  return results;
}

// CLI execution
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const rootDir = existsSync(resolve(process.cwd(), 'src/app'))
    ? process.cwd()
    : fileURLToPath(new URL('../../../', import.meta.url));

  const isCheck = process.argv.includes('--check');
  const components = scanComponents(rootDir);
  const overThreshold = components.filter((c) => c.isOver);

  console.log(`Scanning Angular components in src/app (Thresholds: TEMPLATE_MAX=${TEMPLATE_MAX}, STYLES_MAX=${STYLES_MAX})\n`);
  console.log(
    'Status'.padEnd(8) +
      'Component'.padEnd(52) +
      'Total'.padStart(7) +
      'Tpl (inline)'.padStart(14) +
      'Styles (inline)'.padStart(17) +
      '  ' +
      'External (template / styles)'
  );
  console.log('-'.repeat(125));

  for (const c of components) {
    const relPath = relative(rootDir, c.file);
    const status = c.isOver ? '[OVER]' : '  ok  ';
    const ext = `${c.templateUrl || '-'} / ${c.styleUrl || '-'}`;
    console.log(
      `${status.padEnd(8)}${relPath.padEnd(52)}${String(c.totalLines).padStart(7)}${String(c.templateLines).padStart(14)}${String(c.stylesLines).padStart(17)}  ${ext}`
    );
  }

  console.log('-'.repeat(125));
  console.log(`Total components: ${components.length} | Over threshold: ${overThreshold.length}`);

  if (isCheck && overThreshold.length > 0) {
    console.error(`\nError: ${overThreshold.length} component(s) exceed inline limits (template > ${TEMPLATE_MAX} or styles > ${STYLES_MAX}).`);
    process.exit(1);
  }
}
