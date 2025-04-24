import { execa } from 'execa'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { root } from './root.js'

const RE_WORD = /\w+/

const getActualContent = (content) => {
  return content
  // const lines = content.split('\n')

  // const newLines = []
  // let state = 'default'
  // for (const line of lines) {
  //   switch (state) {
  //     case 'default':
  //       if (line.startsWith('export')) {
  //         state = 'export'
  //         newLines.push('export interface TestApi {')
  //       } else {
  //         newLines.push(line)
  //       }
  //       break
  //     case 'export':
  //       if (line.startsWith('};')) {
  //         state = 'after-export'
  //         newLines.push('  readonly expect: any')
  //         newLines.push('  readonly Locator: (selector: string, options?: any) => any')
  //         newLines.push('}')
  //         newLines.push('')
  //         newLines.push('export interface Test {')
  //         newLines.push('  (api: TestApi): Promise<void>')
  //         newLines.push('}')
  //       } else {
  //         const word = line.match(RE_WORD)
  //         newLines.push(`  readonly ${word}: typeof ${word},`)
  //       }
  //       break
  //     case 'after-export':
  //       break
  //     default:
  //       break
  //   }
  // }
  // newLines.push('\n')
  // return newLines.join('\n')
}

export const generateApiTypes = async () => {
  const ext = process.platform === 'win32' ? '' : ''
  const bundleGeneratorPath = join(root, 'packages', 'build', 'node_modules', '.bin', 'dts-bundle-generator' + ext)
  await execa(bundleGeneratorPath, ['-o', '../../.tmp/dist/index.d.ts', 'src/viewletRegistryMain.ts'], {
    cwd: join(root, 'packages', 'viewlet-registry-worker'),
    reject: false,
    stdio: 'inherit',
  })
  const content = await readFile(join(root, '.tmp', 'dist', 'index.d.ts'), 'utf8')
  const actual = getActualContent(content)
  await writeFile(join(root, '.tmp', 'dist', 'index.d.ts'), actual)
}
