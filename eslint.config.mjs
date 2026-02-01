import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astroParser from 'astro-eslint-parser';
import astroPlugin from 'eslint-plugin-astro';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
    {
        ignores: ['dist', 'node_modules', '.astro', '*.json', '*.md'],
    },
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-types': 'off',
            'prettier/prettier': 'warn',
        },
    },
    {
        files: ['**/*.astro'],
        languageOptions: {
            parser: astroParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                extraFileExtensions: ['.astro'],
                parser: tsParser,
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                },
            },
            globals: {
                Astro: 'readonly',
                Fragment: 'readonly',
                URL: 'readonly',
            },
        },
        plugins: {
            astro: astroPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...astroPlugin.configs.recommended.rules,
            'prettier/prettier': 'warn',
        },
    },
    prettierConfig,
];
