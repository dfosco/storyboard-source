import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', '.worktrees', '.github', 'packages/storyboard/dist', 'packages/core', 'packages/react', 'packages/tiny-canvas', 'packages/react-primer', 'packages/react-reshaped'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'vitest.setup.js'],
    languageOptions: {
      globals: { ...globals.vitest, ...globals.node },
    },
  },
  {
    files: [
      '**/vite.config.js',
      '**/vitest.config.js',
      '**/vitest.*.config.js',
      'eslint.config.js',
      'scripts/**/*.js',
      '**/scaffold.js',
      'packages/storyboard/src/core/cli/**/*.js',
      'packages/storyboard/src/core/canvas/**/*.js',
      'packages/storyboard/src/core/worktree/**/*.js',
      'packages/storyboard/src/core/rename-watcher/**/*.js',
      'packages/storyboard/src/core/autosync/**/*.js',
      'packages/storyboard/src/core/server/**/*.js',
      'packages/storyboard/src/core/vite/**/*.js',
      'packages/storyboard/src/core/tools/**/*.js',
      'packages/storyboard/src/internals/vite/**/*.js',
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
]
