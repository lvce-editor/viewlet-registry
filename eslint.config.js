import * as config from '@lvce-editor/eslint-config'
import * as actions from '@lvce-editor/eslint-plugin-github-actions'

export default [
  ...config.default,
  ...actions.default,
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
