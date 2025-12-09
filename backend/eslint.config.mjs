import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'prisma/**/*.js', 'src/utils/fix-queries.js',
      "scripts/**/*.js",
      "tests/**/*.js",
      "src/__tests__/performance/**/*.js"
    ],
  },
  {
    files: ['**/*.ts', '**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-console': 'off',
      'no-undef': 'off' // TypeScript handles this
    },
  },
  {
    files: ['**/*.js', 'scripts/**/*.ts', 'prisma/**/*.ts', '**/*.mjs', 'src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
