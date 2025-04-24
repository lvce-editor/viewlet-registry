import { execa } from 'execa'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { root } from './root.js'

const getActualContent = (content) => {
  return content
}

export const generateApiTypes = async () => {
  const ext = process.platform === 'win32' ? '' : ''
  const bundleGeneratorPath = join(root, 'packages', 'build', 'node_modules', '.bin', 'dts-bundle-generator' + ext)
  await execa(bundleGeneratorPath, ['-o', '../../.tmp/dist/dist/index.d.ts', 'src/viewletRegistryMain.ts'], {
    cwd: join(root, 'packages', 'viewlet-registry'),
    reject: false,
  })
  const content = await readFile(join(root, '.tmp', 'dist', 'dist', 'index.d.ts'), 'utf8')
  const actual = getActualContent(content)
  await writeFile(join(root, '.tmp', 'dist', 'dist', 'index.d.ts'), actual)
}
