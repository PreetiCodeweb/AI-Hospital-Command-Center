import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const eslintConfig = [{ ignores: ['.next/**', 'next-env.d.ts', 'postcss.config.mjs'] }, ...compat.extends('next/core-web-vitals', 'next/typescript'), {
  rules: {
    '@typescript-eslint/no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    '@next/next/no-img-element': 'off',
  },
}];

export default eslintConfig;
