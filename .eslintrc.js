module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
  extends: ['plugin:vue/essential', 'eslint:recommended', '@vue/eslint-config-prettier'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  globals: {
    google: 'readonly',
  },
  rules: {
    // Vue
    'vue/multi-word-component-names': 'off',
    'vue/no-unused-vars': 'warn',

    // JavaScript
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error',

    // Prettier
    'prettier/prettier': [
      'error',
      {
        semi: false,
        singleQuote: true,
        printWidth: 100,
        trailingComma: 'es5',
        tabWidth: 2,
        arrowParens: 'always',
      },
    ],
  },
}
