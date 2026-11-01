// DSH bundle: registers the pr-review skill. The GitHub Action installs this bundle into the
// headless profile; the review prompt is in skills/pr-review/SKILL.md.
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url))
const SKILL_PATH = join(PLUGIN_DIR, '..', 'skills', 'pr-review', 'SKILL.md')
const PROVIDER = 'dsh-action'

function stripFrontmatter(text) {
  if (!text.startsWith('---\n')) return text
  const end = text.indexOf('\n---\n', 4)
  return end === -1 ? text : text.slice(end + 5)
}
const summary = {
  name: 'pr-review',
  description: 'Review a pull request diff with evidence, risk ranking, and a cost-aware review plan. Use in CI or locally; output is a review, not an approval.',
  whenToUse: 'A PR diff needs a review with concrete evidence, test gaps, and security/regression risks.',
  invocation: { modelInvocable: true, userInvocable: true },
  source: 'bundled', provider: PROVIDER,
  resourceBase: { kind: 'directory', path: join(PLUGIN_DIR, '..', 'skills', 'pr-review') },
  rank: 600, locator: 'pr-review', metadata: { domain: 'ci-review', version: '0.1.0' },
}

export const name = 'dsh-action'
export const inject = ['skills']
export function apply(ctx) {
  ctx.skills.registerProvider(() => ({
    name: PROVIDER,
    async list() { return [summary] },
    async get(candidate) {
      if (candidate?.name !== 'pr-review') return undefined
      return { ...summary, content: stripFrontmatter(await readFile(SKILL_PATH, 'utf8')) }
    },
  }))
}
