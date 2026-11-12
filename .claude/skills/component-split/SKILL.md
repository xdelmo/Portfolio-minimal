---
name: component-split
description: Separates long inline templates and styles into external .html and .scss files. Trigger on "dividi i componenti", "split template/stili", "componenti troppo lunghi", /component-split, or when an edit makes a component exceed inline thresholds.
---

# Component Split

Splits components with long inline templates or styles into three files (`.ts` + `.html` + `.scss`) following the [Angular style guide recommendation](https://angular.dev/style-guide). Smaller components stay inline (icons, small toggles, sprites).

## Thresholds

- Inline template > ~30 lines (`TEMPLATE_MAX = 30`)
- Inline styles > ~50 lines (`STYLES_MAX = 50`)

Defined in `.claude/skills/component-split/inline-size.mjs`.

## Analysis

Run the scanner to list all components in `src/app` sorted by size and identify any exceeding the limits:

```bash
node .claude/skills/component-split/inline-size.mjs
```

Use `--check` to exit with code 1 if any component exceeds the threshold (used as a guard in `npm run test:scripts`):

```bash
node .claude/skills/component-split/inline-size.mjs --check
```

## Refactor Steps

For each component exceeding thresholds:

1. **Extract template**: move the inline template content into `<name>.html` and replace `template: \`...\`` with `templateUrl: './<name>.html'`. Copy markup byte-for-byte without reformatting to preserve `i18n`, `@@id`, and attribute exactness. Unescape template literals if escaped (`\``, `\${`, `\\`).
2. **Extract styles**: move inline styles into `<name>.scss` and replace `styles: \`...\`` with `styleUrl: './<name>.scss'`. If `<name>.scss` already exists (e.g. `home.scss`), append the styles at the end.
3. **Pure refactor**: do not change class names, selectors, DOM structure, or TypeScript logic.

## Verification Order

Evaluate each step strictly by its exit code:

1. `npm run lint`
2. `npx ng test --no-watch`
3. `npm run test:scripts` (runs `inline-size.test.mjs --check`)
4. `npm run i18n:extract` (ensure trans-unit IDs in `messages.xlf` match `messages.it.xlf`)
5. `npm run build`, followed by Chromium e2e tests for touched areas, and `npm run verify` at completion.
