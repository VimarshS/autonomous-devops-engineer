/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['../../packages/config/eslint/react.js', 'next/core-web-vitals'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};