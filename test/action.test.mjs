import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../plugin/index.js'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))

test('the action YAML has the required inputs, step id, and output', async () => {
  const text = await readFile(join(ROOT, 'action.yml'), 'utf8')
  assert.match(text, /using: composite/)
  assert.match(text, /setup-node@v4/)
  assert.match(text, /node-version: "22"/)
  assert.match(text, /github-token:/)
  assert.match(text, /api-key:/)
  assert.match(text, /id: review/)
  assert.match(text, /review_path:/)
  assert.match(text, /outputs\.review_path/)
  const script = await readFile(join(ROOT, 'scripts/review.sh'), 'utf8')
  assert.match(script, /dsh --profile headless/)
})

test('the review shell script is syntactically valid', () => {
  assert.doesNotThrow(() => execFileSync('bash', ['-n', join(ROOT, 'scripts/review.sh')]))
})

test('the bundle registers the pr-review skill', async () => {
  let factory
  apply({ skills: { registerProvider(fn) { factory = fn } } })
  const provider = factory()
  const list = await provider.list()
  assert.equal(list.length, 1)
  assert.equal(list[0].name, 'pr-review')
  const skill = await provider.get({ name: 'pr-review' })
  assert.match(skill.content, /## Verdict/)
  assert.match(skill.content, /untrusted/)
  assert.equal(await provider.get({ name: 'missing' }), undefined)
})
