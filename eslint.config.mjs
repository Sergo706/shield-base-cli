import tseslint from 'typescript-eslint';
import { defineConfig } from "eslint/config";


export default defineConfig(
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'eslint.config.mjs',
            'tsconfig.json',
        ]
    },
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: import.meta.dirname,
                projectService: true
            }
        }
    },
    {
        name: 'project-rules',
        files: ['**/*.{js,ts}'],
        rules: {
            'array-bracket-spacing': ['error', 'never'],
            'semi': 'warn',
            'no-undef': 'off',
            '@typescript-eslint/unified-signatures': 'error',
            '@typescript-eslint/no-deprecated': 'off',
        }
    },
    {
        files: ['**/*.{js,cjs,mjs}'],
        rules: { 'no-undef': 'error' }
    },
 )