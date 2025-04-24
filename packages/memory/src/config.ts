import { join } from 'node:path'
import { root } from './root.ts'

export const instantiations = 12_000

export const instantiationsPath = join(root, 'packages', 'viewlet-registry')
