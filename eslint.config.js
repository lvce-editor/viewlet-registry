import * as config from '@lvce-editor/eslint-config'

export default [
  ...config.default,
  ...config.recommendedNode,
  {
    files: ['**/*.ts'],
    rules: {
      'n/no-unsupported-features/es-syntax': 'off',
    },
  },
  {
    files: ['**/Logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]
