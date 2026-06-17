# paperhug

`paperhug` is a CLI-first kit for making print-at-home greeting cards. It turns an occasion, recipient, style, message brief, and optional reference images into a self-contained card folder with prompts, project JSON, preview art, and A4 PDFs.

The default provider is `none`, which means **no network calls, no hidden uploads, and no API keys**. For generated cover artwork, set `OPENAI_API_KEY` and use `--provider openai`; paperhug saves the image into the project and embeds it in the printable foldable PDF.


## App surfaces

Paperhug is growing from a CLI into an app-friendly open-source toolkit:

- `src/` keeps the existing CLI and Node PDF pipeline.
- `packages/app-core/` contains browser-safe card draft, prompt, PDF export, style, and print-intent logic.
- `apps/web/` is a React/Vite web app for local/PWA use with PDF/project downloads.
- `apps/mobile/` is a React/Vite + Capacitor shell for iOS and Android with native share-sheet PDF handoff.

Run the app shells with:

```bash
npm run dev:web
npm run build:web
npm run build:mobile
```

See [`docs/APP_ARCHITECTURE.md`](docs/APP_ARCHITECTURE.md) and [`docs/CAPACITOR_MOBILE_APP_DESIGN.md`](docs/CAPACITOR_MOBILE_APP_DESIGN.md) for the web/mobile direction.

## Quick start

```bash
npx paperhug birthday \
  --for "Mum" \
  --from "Roger" \
  --style "warm watercolour Australian native flowers" \
  --message "funny, grateful, not cheesy" \
  --provider none
```

Output:

```text
dist/birthday-for-mum/
  project.json
  prompts/image-prompt.txt
  prompts/text-prompt.txt
  assets/front.svg
  front.pdf
  back.pdf
  card.pdf
  preview.svg
  README.txt
```

Print with `paperhug print dist/birthday-for-mum/project.json --printer <name>` to force A4 landscape and double-sided short-edge duplex. If printing manually, use A4 landscape at 100% scale and double-sided/short-edge flip, then fold on the centre line.

## Commands

```bash
paperhug quick <occasion> --for <name> [options]
paperhug birthday --for Mum --message cheerful
paperhug wizard
paperhug refine <project.json> --note "less cheesy"
paperhug render <project.json>
paperhug print <project.json|card.pdf> [--printer <name>] [--no-duplex]
paperhug templates list
paperhug providers list
```

### Useful options

- `--for <name>` — recipient label.
- `--from <name>` — sender label. Defaults to `Me`.
- `--style <style>` — built-in style ID or freeform art direction.
- `--message <brief>` — tone/content brief.
- `--idea <story>` — freeform concept for the artwork prompt and inside message.
- `--text <message>` — exact printable message.
- `--title <title>` — cover title override.
- `--no-cover-title` — leave readable cover text out of prompts and PDF overlays.
- `--inside-style <style>` — inside typography treatment: `classic-serif`, `modern-sans`, `typewriter`, or `script`.
- `--reference <path>` — repeatable local reference image path.
- `--provider none` — prompt-only mode. This is the default.
- `--provider openai` — generate front-cover artwork with OpenAI Images and embed it into the printable PDF.
- `--model <model>` — override the selected provider model, for example `gpt-image-1.5`.
- `--out <dir>` — output base directory.
- `--force` — replace an existing output folder.

### Printing

`paperhug print` shells out to the system `lp` command and always includes explicit A4 landscape print options. By default it also requests double-sided short-edge duplex, which matches the landscape half-fold card layout. Use `--no-duplex` only when you want to print pages separately. Set `PAPERHUG_PRINTER=<name>` or pass `--printer <name>` to pick a printer.


## Occasions

Built-in occasion templates:

- birthday
- mothers-day
- fathers-day
- anniversary
- thank-you
- congratulations
- new-baby
- custom

## Providers

`paperhug` has a provider registry with a CI-safe offline default and optional API-backed artwork generation:

- `none` — ready now, CI-safe, no network calls.
- `openai` — uses `OPENAI_API_KEY` to generate front-cover artwork with OpenAI Images. Default model: `gpt-image-1.5`. The generated JPEG is saved as `assets/front.jpg` and embedded into `card.pdf`.
- `nano-banana` — documented placeholder for Gemini-style image generation with references.

Image-generation example:

```bash
OPENAI_API_KEY=... paperhug birthday \
  --for "Mum" \
  --from "Roger" \
  --style "warm watercolour Australian native flowers" \
  --message "funny, grateful, not cheesy" \
  --provider openai \
  --force
```

Idea-driven inside-message example:

```bash
paperhug custom \
  --for "Mum and Dad" \
  --from "Roger, Sarah, Arthur and Henry" \
  --style "classic alpine storybook illustration, mountain meadow, warm family adventure" \
  --idea "Mum and Dad escaping through the mountains to their new cabin" \
  --inside-style script \
  --no-cover-title
```

Run:

```bash
paperhug providers list
```

## Reference images

Reference images are local-first. In prompt-only mode, `paperhug` copies them into the output folder and records metadata in `project.json`; it does not upload them.

```bash
paperhug quick mothers-day \
  --for "Mum" \
  --style "warm watercolour garden" \
  --reference ./family-photo.jpg \
  --message "warm, grateful, a little funny"
```

## Development

```bash
npm test
npm run smoke
bash scripts/validate.sh
npm run release:check
```

## Package contents

The npm package allowlist includes the runtime files plus the public support
documents needed for release review: `README.md`, `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`.
Run `npm run package:smoke` or `npm pack --dry-run` before publishing to
confirm those files are still present in the tarball.

## Release readiness

Run the same checks that CI uses before opening a release PR:

```sh
npm run release:readiness
npm run release:check
```

`release:readiness` validates repository metadata, the package files allowlist, package smoke coverage, and CI placeholder cleanup. `release:check` runs the project build, test, smoke, and package dry-run checks where configured.

## License

MIT
