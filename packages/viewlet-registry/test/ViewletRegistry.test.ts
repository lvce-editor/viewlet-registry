import { expect, test } from '@jest/globals'
import * as ViewletRegistry from '../src/parts/ViewletRegistry/ViewletRegistry.ts'

test('create', async () => {
  expect(ViewletRegistry.create).toBeDefined()
})
