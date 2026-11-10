import { isChunkLoadError } from './chunk-error';

describe('isChunkLoadError', () => {
  it('knows each engine’s failed dynamic import', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/chunk-AB.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module: https://x/chunk-AB.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
  });

  it('leaves every other error to the error handler', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});
