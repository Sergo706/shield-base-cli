import { defineConfig, type UserConfig } from 'tsdown';

const config: UserConfig = {
    target: ['node18', "es2020"],
    clean: true,
    sourcemap: true,
    tsconfig: 'tsconfig.json',
    dts: true,
    failOnWarn: true,
    treeshake: true,
    minify: false,
    copy: { from: 'public/**', to: 'dist/', flatten: true },
    deps: {
        neverBundle: [
            '@riavzon/json-to-ts',
            'cidr-calc',
            'consola',
            'extract-zip',
            'ipaddr.js',
            'lmdb',
            'magic-regexp',
            'stream-json',
            'stream-chain',
            'tar',
            'citty',
        ]
    },
    publint: {
      level: 'error',
      enabled: 'ci-only',
      strict: true,
    },
    attw: {
      level: 'error',
      enabled: 'ci-only'
    },
}

export default defineConfig([
    {
        entry: {
             main: 'src/scripts/index.ts',
            _internal: 'src/scripts/_internal.ts'
        },
        target: ['node18', "es2020"],
        format: ['esm', 'cjs'],
        ...config
   },
   {
     entry: {
        cli: 'src/index.ts'
     },
     format: ['esm'],
   }
])