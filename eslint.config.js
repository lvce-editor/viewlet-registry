import { defineConfig } from 'eslint/config'
import * as config from '@lvce-editor/eslint-config'

export default defineConfig([
  ...config.default,
  ...config.recommendedActions,
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
])
