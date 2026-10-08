// Lets build scripts import the app's .ts content files: Node strips the types, this adds the missing ".ts" extension
// and marks the files as ES modules (the package has no "type": "module").
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, next) {
    let result;
    try {
      result = next(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.') || specifier.endsWith('.ts')) throw error;
      result = next(`${specifier}.ts`, context);
    }
    return result.url.endsWith('.ts') ? { ...result, format: 'module-typescript' } : result;
  },
});
