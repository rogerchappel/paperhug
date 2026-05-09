# paperhug Task Waves

This file tracks the OSS factory task waves for the first usable `paperhug` release.

## Wave 0 — StackForge scaffold

Status: done

- [x] Generate repository from the StackForge `oss-cli` template.
- [x] Import the approved `oss-ideas` PRD into `docs/PRD.md`.
- [x] Keep the repository CLI-first and local-first.
- [x] Add MIT license, contribution, security, CI, release, and validation scaffolding.

## Wave 1 — Core product model

Status: done

- [x] Define occasion templates for birthday, Mother's Day, Father's Day, anniversary, thank-you, congratulations, new baby, and custom cards.
- [x] Define starter style templates.
- [x] Add template lookup with aliases and freeform style fallback.
- [x] Add project JSON model with revision history, provider metadata, layout metadata, references, prompts, and output paths.
- [x] Add safe reference-image handling that copies local references only when requested.

## Wave 2 — CLI-first workflows

Status: done

- [x] Add `paperhug quick` for the fastest same-day card path.
- [x] Add direct occasion aliases such as `paperhug birthday`.
- [x] Add `paperhug templates list`.
- [x] Add `paperhug providers list`.
- [x] Add `paperhug render <project.json>` for no-generation rerenders.
- [x] Add `paperhug refine <project.json>` for terminal revision notes and message updates.
- [x] Add `paperhug wizard` for interactive first-card creation.

## Wave 3 — Prompt-only provider and renderer

Status: done

- [x] Make `none` the default provider so tests and first use require no credentials.
- [x] Document placeholder provider entries for Nano Banana/Gemini-style and OpenAI image adapters.
- [x] Build image and text prompts from occasion/style/reference inputs.
- [x] Render deterministic A4 `front.pdf`, `back.pdf`, and two-page `card.pdf` without paid dependencies.
- [x] Render `preview.svg` and `assets/front.svg` placeholder art.
- [x] Write print instructions and prompt artifacts for every run.

## Wave 4 — Verification

Status: done

- [x] Unit-test template loading and alias resolution.
- [x] Unit-test prompt generation with reference-image guidance.
- [x] Unit-test deterministic two-page PDF rendering.
- [x] Smoke-test `templates list`.
- [x] Smoke-test `providers list`.
- [x] Smoke-test prompt-only card generation.
- [x] Run `npm test`.
- [x] Run `npm run smoke`.
- [x] Run `bash scripts/validate.sh` after documentation updates.
- [x] Run `npm run release:check` before tagging.

## Wave 5 — Publish and release

Status: done

- [x] Create public GitHub repository `rogerchappel/paperhug`.
- [x] Push `main`.
- [x] Confirm GitHub Actions status.
- [x] Tag `v0.1.0`.
- [x] Confirm GitHub Release exists.
- [ ] Mark the `oss-ideas` entry as built.

## Future backlog

- Implement a real Nano Banana/Gemini image provider adapter.
- Implement an OpenAI Images adapter.
- Add a tiny local web UI using the same project JSON and renderer.
- Add duplex/fold layouts, crop marks, and US Letter support.
- Add richer text generation/refinement with local or API LLM adapters.
