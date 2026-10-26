import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

const head = git([
  'log',
  '-1',
  '--format=%h  %ad  %s',
  '--date=format:%d/%m/%Y %H:%M',
])
const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
const dirty = git(['status', '--porcelain'])
let sync = 'origem não consultada'

try {
  const counts = git(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'])
  const [ahead, behind] = counts.split(/\s+/)
  sync =
    ahead === '0' && behind === '0'
      ? 'igual à origem'
      : `${ahead} commit(s) à frente, ${behind} atrás`
} catch {
  sync = 'sem upstream configurado'
}

const handoff = readFileSync(new URL('../docs/ONDE_PARAMOS.md', import.meta.url), 'utf8')

console.log('Último commit')
console.log(head)
console.log(`Branch: ${branch} (${sync})`)
console.log(dirty ? 'Há alterações locais ainda não commitadas.' : 'Árvore de trabalho limpa.')
console.log('')
console.log(handoff)
