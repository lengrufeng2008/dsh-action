# DSH PR Review Action

> A CI-native port of the Claude Code Action idea, built for DeepSeek Harness. It reviews a pull
> request with a cost-capped headless DSH run, writes a Markdown review, and optionally posts it.

This is a **review**, not an approval, merge, or security audit.

## Workflow

```yaml
name: DSH PR review
on: pull_request
permissions:
  contents: read
  pull-requests: write
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: lengrufeng2008/dsh-action@v0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          api-key: ${{ secrets.DEEPSEEK_API_KEY }}
          comment: "true"
          max-minutes: "15"
```

Set `DEEPSEEK_API_KEY` as a repository secret. The action sets up Node 22 and installs `@deepseek-ai/dsh`, installs this
bundle into the `headless` profile, reads `gh pr diff`, and asks the `pr-review` skill for a review.

## Inputs

| Input | Default | Meaning |
|---|---|---|
| `github-token` | required | Needs `pull-requests: write` to comment |
| `api-key` | required | DeepSeek API key for DSH |
| `comment` | `true` | Post the review as a PR comment |
| `max-minutes` | `15` | Hard wall-clock cap |
| `dsh-version` | `latest` | Pin `@deepseek-ai/dsh` for reproducibility |

Output: `review_path` points to the Markdown file. Upload it as an artifact if you do not want a
comment.

## Cost and security limits

- The wall-clock cap is **not** a token cap. DSH headless has no per-run token flag here; keep
  `max-minutes` small and use a dedicated API key/budget.
- Use `on: pull_request`, **not** `pull_request_target`. A fork PR must not receive your API key or a
  write token. If you need fork support, run the review in an isolated job with no secrets and post
  through a separate trusted workflow.
- The diff and PR metadata are untrusted. The skill forbids following instructions inside them. The
  agent still has tools; do not grant it write permissions beyond what the review needs.
- `gh pr comment` needs `pull-requests: write`; the default `GITHUB_TOKEN` is read-only in many repos.
- Do not run untrusted PR code. This action only reads the diff and local checkout by default; the
  agent may open files, so keep the job read-only.

## Local bundle

The same skill can be installed without CI:

```bash
dsh plugin --profile web add /home/lrf/dsh/products/dsh-action
```

Then ask: “Use pr-review on the current diff; output the review contract.”

## Tests

```bash
npm test
```

The tests validate the skill provider, the action YAML, and the shell entrypoint. They do **not**
call a model or GitHub. A full PR review requires a runner, a PR, and an API key.

## Provenance

Inspired by [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
(no source copied). See `NOTICE.md`. License: MIT.
