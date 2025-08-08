import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      // TypeScript specific rules (corregidas)
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',

      // General JavaScript rules (no usar versiones de TypeScript que no existen)
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'off',
      'no-unused-vars': 'off', // Desactivar la versión JS en favor de la de TS
    },
  },
  {
    // Ignorar archivos
    ignores: ['dist/', 'node_modules/', '*.js', '*.mjs', 'coverage/'],
  }
);
