#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
const pkgVersion = pkg.version

const changelog = readFileSync(join(root, '.spec/CHANGELOG.md'), 'utf-8')
const match = changelog.match(/^## \[v(\d+\.\d+\.\d+)\]/m)

if (!match) {
  console.error('::error::Impossibile trovare la versione in .spec/CHANGELOG.md')
  process.exit(1)
}

const changelogVersion = match[1]

if (pkgVersion !== changelogVersion) {
  console.error(
    `::error::Versione non allineata: package.json (${pkgVersion}) != .spec/CHANGELOG.md (${changelogVersion})\n`
    + '  Aggiorna package.json e CHANGELOG.md alla stessa versione prima di committare.',
  )
  process.exit(1)
}

console.log(`✓ Versioni allineate: v${pkgVersion}`)
