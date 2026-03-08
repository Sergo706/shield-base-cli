import { defineConfig, type Options } from 'tsup';

const config: Options = {
  entry: {
    main: 'src/scripts/index.ts',
    cli: 'src/index.ts'
  },
  format: ['esm'],
  tsconfig: 'tsconfig.json',
  target: 'node18',
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true,  
  outDir: 'dist',
  external: [
    'consola',
    'ipaddr.js',
    'magic-regexp',
  ],
  treeshake: true,
};

export default defineConfig(config);