import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// Values a caller controls: dispatch inputs and event payloads (titles, bodies, branch names).
const UNTRUSTED = /\$\{\{[^}]*\b(inputs\.|github\.event\.|github\.head_ref)/;
// Allowed only as the whole value of a mapping key (`env:`, `with:`, `if:`), never inside a script line.
const MAPPING = /^\s*-?\s*[A-Za-z_][\w-]*:\s*\$\{\{[^}]*\}\}\s*$/;

export function scriptLines(yaml) {
  return yaml.split('\n').flatMap((line, i) => (UNTRUSTED.test(line) && !MAPPING.test(line) ? [`${i + 1}: ${line.trim()}`] : []));
}

test('a caller-controlled ${{ }} never reaches a run script (issue #627)', () => {
  const dir = '.github/workflows';
  const found = readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .flatMap((f) => scriptLines(readFileSync(`${dir}/${f}`, 'utf8')).map((l) => `${f}:${l}`));
  assert.deepEqual(found, [], 'pass it through env: and read "$VAR" in the script');
});

test('the guard tells a mapping from a script line', () => {
  assert.deepEqual(scriptLines('          BUMP: ${{ inputs.bump || \'auto\' }}'), []);
  assert.deepEqual(scriptLines('    if: ${{ github.event.pull_request.merged }}'), []);
  assert.equal(scriptLines('          ARGS="--bump ${{ inputs.bump }}"').length, 1);
  assert.equal(scriptLines('        run: echo "${{ github.event.issue.title }}"').length, 1);
  assert.equal(scriptLines('          gh pr edit --title "${{ github.head_ref }}"').length, 1);
});
