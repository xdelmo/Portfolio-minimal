// The handbook is public (issue #454): stop its build on anything that looks like a secret, an e-mail address or a
// path on a developer's machine. Run by .github/workflows/docs.yml before `mkdocs build`, and through its test by CI.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES = [
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,})/],
  ['Netlify build hook', /api\.netlify\.com\/build_hooks\/\w/],
  ['API key', /\b(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35})/],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['e-mail address', /[\w.+-]+@[\w-]+\.[a-z]{2,}/i],
  ['local path', /(\/Users\/|\/home\/)[\w.-]+|[A-Z]:\\Users\\/],
];

/** Every leak in one file's text, as `line: rule`. */
export function findLeaks(text) {
  return text.split('\n').flatMap((line, i) => RULES.filter(([, re]) => re.test(line)).map(([name]) => `${i + 1}: ${name}`));
}

/** The handbook's text files with their leaks, relative to the repository root. */
export function checkHandbook(root) {
  const files = ['mkdocs.yml', ...readdirSync(join(root, 'handbook'), { recursive: true }).map((f) => join('handbook', f))];
  return files
    .filter((f) => /\.(md|ya?ml|css|txt|html|js)$/.test(f))
    .flatMap((f) => findLeaks(readFileSync(join(root, f), 'utf8')).map((leak) => `${f}:${leak}`));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const leaks = checkHandbook(join(fileURLToPath(import.meta.url), '../..'));
  if (leaks.length) {
    console.error(`The handbook is public, remove:\n${leaks.join('\n')}`);
    process.exit(1);
  }
  console.log('handbook: nothing sensitive found');
}
