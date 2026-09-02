# paperhug OSS Factory Orchestration

`paperhug` was generated from the StackForge OSS factory path after the `oss-ideas` PRD was approved and merged.

## Source idea

- Idea repo: `rogerchappel/oss-ideas`
- PRD PR: <https://github.com/rogerchappel/oss-ideas/pull/9>
- PRD path at generation time: `ideas/in-progress/paperhug/PRD.md`
- Local source PRD copy: `docs/PRD.md`

## Factory contract

The first release must be useful without credentials:

1. `paperhug quick birthday --for Mum --provider none` creates a printable card folder.
2. No network calls are made unless a non-`none` provider is explicitly selected.
3. Reference images remain local in prompt-only mode.
4. Every run writes prompts, project JSON, PDFs, preview SVG, and print instructions.
5. Tests and CI do not require paid APIs.

## Completed waves

1. **Scaffold** — StackForge `oss-cli` template, repository metadata, GitHub workflows, validation script, PRD import.
2. **Core model** — occasion/style templates, prompt builder, project JSON, reference metadata.
3. **CLI workflows** — quick, occasion aliases, wizard, refine, render, templates list, providers list.
4. **Renderer/provider safety** — prompt-only default provider, documented provider registry, deterministic A4 PDFs, preview SVG.
5. **Verification** — unit and CLI smoke tests.
6. **Publish/release** — public GitHub repository, protected main, `v0.1.0` tag/release, and `oss-ideas` built marker.

## Release gates

Before a release tag is created:

```bash
npm test
npm run smoke
bash scripts/validate.sh
npm run release:check
```

A release is eligible when all commands pass and a prompt-only card artifact exists under `tmp/smoke/`.

## Dogfood flow before registry publication

First follow the local-tarball installation in the README's
[Quick start](../README.md#quick-start). The package is not yet available from
the npm registry, so use the installed `paperhug` command for a same-day card:

```bash
paperhug birthday \
  --for "Mum" \
  --from "Roger" \
  --style "warm watercolour Australian native flowers" \
  --message "funny, grateful, not cheesy" \
  --provider none \
  --out dist
```

Then open `dist/birthday-for-mum/card.pdf` and, if desired, paste `prompts/image-prompt.txt` into Nano Banana/Gemini or another image tool, replace `assets/front.svg`, and rerun `paperhug render dist/birthday-for-mum/project.json`.

## Known limits in v0.1.0

- Provider adapters beyond `none` are documented placeholders.
- PDF output uses simple Helvetica text and placeholder vector art.
- `refine` stores terminal revision notes and rerenders; it does not call an LLM yet.
- `preview.png` from the PRD is currently `preview.svg` to avoid native image dependencies.

## Release result

- Repository: <https://github.com/rogerchappel/paperhug>
- Release: <https://github.com/rogerchappel/paperhug/releases/tag/v0.1.0>
- `oss-ideas` built marker: `ideas/built/paperhug/PRD.md`
