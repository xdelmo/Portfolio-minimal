// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = defineConfig([
  {
    ignores: ['dist/', '.angular/', 'coverage/', '.lighthouseci/', 'playwright-report/', 'test-results/', 'node_modules/'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      angular.configs.tsRecommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          // root config files live outside every tsconfig; type them with the e2e (Node) config
          allowDefaultProject: ['playwright.config.ts'],
          defaultProject: 'e2e/tsconfig.json',
        },
        tsconfigRootDir: __dirname,
      },
    },
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      // signal inputs, queries and outputs only (issue #428)
      '@angular-eslint/prefer-signals': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      // Angular components and services are decorated classes, often without members.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
      // inject() inside a render hook's callback runs outside the injection context: NG0203 at runtime (issue #330).
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name=/^after(Next)?Render(Effect)?$/] CallExpression[callee.name='inject']",
          message: 'inject() runs outside the injection context here (NG0203): inject in the constructor and use the value in the callback.',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  {
    files: ['**/*.mjs', '**/*.js', '**/*.cjs'],
    extends: [eslint.configs.recommended, tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly', __dirname: 'readonly', require: 'readonly', module: 'writable' },
    },
  },
]);
