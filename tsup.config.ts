import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/bin/req.ts'],
  format: ['esm'],
  target: 'node18',
  splitting: false,
  sourcemap: false,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
