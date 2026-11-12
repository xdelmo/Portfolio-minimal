import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseComponent, STYLES_MAX, TEMPLATE_MAX } from '../.claude/skills/component-split/inline-size.mjs';

test('parseComponent flags components with inline template or styles exceeding threshold', () => {
  const bigTemplate = `@Component({
    selector: 'app-sample',
    template: \`\n${'<div>line</div>\n'.repeat(TEMPLATE_MAX + 1)}\`,
    styles: \`body { color: red; }\`,
  }) export class Sample {}`;

  const info1 = parseComponent('sample.ts', bigTemplate);
  assert.ok(info1);
  assert.equal(info1.overTemplate, true);
  assert.equal(info1.isOver, true);

  const bigStyles = `@Component({
    selector: 'app-sample',
    template: \`<div>short</div>\`,
    styles: \`\n${'.rule { display: block; }\n'.repeat(STYLES_MAX + 1)}\`,
  }) export class Sample {}`;

  const info2 = parseComponent('sample.ts', bigStyles);
  assert.ok(info2);
  assert.equal(info2.overStyles, true);
  assert.equal(info2.isOver, true);

  const smallComponent = `@Component({
    selector: 'app-sample',
    template: \`<div>small</div>\`,
    styles: \`div { margin: 0; }\`,
  }) export class Sample {}`;

  const info3 = parseComponent('sample.ts', smallComponent);
  assert.ok(info3);
  assert.equal(info3.isOver, false);

  const externalComponent = `@Component({
    selector: 'app-sample',
    templateUrl: './sample.html',
    styleUrl: './sample.scss',
  }) export class Sample {}`;

  const info4 = parseComponent('sample.ts', externalComponent);
  assert.ok(info4);
  assert.equal(info4.templateLines, 0);
  assert.equal(info4.stylesLines, 0);
  assert.equal(info4.templateUrl, './sample.html');
  assert.equal(info4.styleUrl, './sample.scss');
  assert.equal(info4.isOver, false);
});

test('inline-size.mjs --check exits 0 on the repository', () => {
  const rootDir = resolve(fileURLToPath(import.meta.url), '../..');
  const scriptPath = resolve(rootDir, '.claude/skills/component-split/inline-size.mjs');
  const result = execFileSync(process.execPath, [scriptPath, '--check'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.ok(result.includes('Total components:'));
  assert.ok(result.includes('Over threshold: 0'));
});
