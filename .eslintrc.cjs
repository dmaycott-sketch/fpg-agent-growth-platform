module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  overrides: [
    {
      files: ['**/*.cjs', '**/*.test.{js,cjs,mjs}', '**/tests/**/*.{js,cjs,mjs}'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ],
};
