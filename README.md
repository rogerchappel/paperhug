# paperhug

`paperhug` is a CLI-first kit for making print-at-home greeting cards. It turns an occasion, recipient, style, message brief, and optional reference images into a self-contained card folder with prompts, project JSON, preview art, and A4 PDFs.

The default provider is `none`, which means **no network calls, no hidden uploads, and no API keys**. You can use the generated image prompt in Nano Banana/Gemini, OpenAI Images, or another image tool, then rerender the saved project.


## App surfaces

Paperhug is growing from a CLI into an app-friendly open-source toolkit:

- `src/` keeps the existing CLI and Node PDF pipeline.
- `packages/app-core/` contains browser-safe card draft, prompt, style, and print-intent logic.
- `apps/web/` is a React/Vite web app scaffold for local/PWA use.
- `apps/mobile/` is a React/Vite + Capacitor shell for iOS and Android.

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
- `--text <message>` — exact printable message.
- `--title <title>` — cover title override.
- `--reference <path>` — repeatable local reference image path.
- `--provider none` — prompt-only mode. This is the default.
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

`paperhug` has a provider registry but v0.1.0 intentionally ships only prompt-only generation:

- `none` — ready now, CI-safe, no network calls.
- `nano-banana` — documented placeholder for Gemini-style image generation with references.
- `openai` — documented placeholder for OpenAI image generation.

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

## License

MIT
