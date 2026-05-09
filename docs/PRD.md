# PRD: paperhug

Status: in-progress
Decision: in OSS factory generation

## Scorecard

Total: 88/100
Band: build now
Last scored: 2026-05-10
Scored by: Roger + Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 17/20 | People often need a thoughtful printable card today, but design tools and generic image generators still require too much setup, layout work, and prompt fiddling. |
| Demand signal | 17/20 | Durable demand exists for printable cards, Canva-style templates, AI image generation, and last-minute personalised gifts; Roger has an immediate same-day use case. |
| V1 buildability | 19/20 | A CLI-first Node/TypeScript tool can generate prompts, call an image backend, lay out two A4 PDF pages, and validate fixtures quickly. |
| Differentiation | 14/15 | Focuses on a fast printable-card workflow rather than a generic design surface: occasion templates, reference images, conversation refinement, and print-ready A4 output. |
| Agentic workflow leverage | 13/15 | Strong fit for agent-assisted creative generation, prompt templates, iterative conversation, provider adapters, and reproducible artifacts. |
| Distribution potential | 8/10 | Fun, broadly understandable OSS with seasonal hooks: Mother's Day, Father's Day, birthdays, anniversaries, thank-you cards, and classroom/kids use. |

## Pitch

`paperhug` is a CLI-first open-source kit for creating print-at-home greeting cards with AI-assisted images, friendly occasion prompts, and A4 PDF layouts that are ready to print, fold, glue, and give.

## Why It Matters

Making a personalised card should be faster than driving to the shop. Generic image tools can make nice artwork, but they usually leave the user to invent prompts, choose dimensions, add card copy, export assets, build print layouts, and work out what goes on each side of the paper.

`paperhug` should make the first-card experience mind-bogglingly fast:

```bash
npx paperhug birthday --for "Mum" --style "warm watercolour garden" --message "funny and grateful"
```

The output should be a small folder containing a front image, a back/inside message page, a print-ready A4 PDF, a preview image, and a reusable project JSON file.

## Qualification

### Pub Test

Can this be explained clearly in one sentence? Yes: “A CLI that turns a few words, optional reference images, and occasion templates into printable A4 greeting cards.”

### Competitors / Adjacent Tools

- Canva / Adobe Express — powerful card design products, but account-heavy and not local-first OSS.
- Etsy printable card templates — good market proof, but static/manual and not personalised by default.
- Generic AI image generators such as Nano Banana / Gemini image tools, OpenAI Images, Replicate, and fal — strong generation engines, but not card-specific and not print-layout-aware.
- LaTeX/SVG/PDF template generators — useful for deterministic layouts, but usually not friendly for normal card creation.
- Browser-based greeting card sites — easy, but often closed-source, ad/account-heavy, watermark-heavy, or not programmable.

### Star / Demand Signal

- Roger has a direct same-day desire to use it.
- Greeting cards are seasonal and evergreen: birthdays, Mother's Day, Father's Day, anniversaries, thank-you notes, holidays, teacher gifts, congratulations, sympathy, new baby, and custom occasions.
- “Printable card” and “AI card maker” are obvious search/social hooks.
- Template contributions are approachable for designers, parents, teachers, and developers.

### Real Problem

A thoughtful card has two hard parts under time pressure:

1. Making artwork that feels personal and not generic.
2. Turning that artwork and text into something printable without layout frustration.

`paperhug` should solve both while staying local-first and transparent. The user should know what prompt was used, what image backend was called, what files were produced, and how to re-run or refine the card.

### V1 Buildability

V1 is intentionally small:

- CLI-first TypeScript package.
- A4 two-page layout: front artwork page and back/inside message page designed to be printed separately and glued to cardstock.
- Template-driven prompt builder.
- One or more image provider adapters, with a prompt-only/offline mode for users without API credentials.
- Deterministic PDF generation that can be tested in CI.
- Fixtures for templates and sample generated project files.

## Product Principles

- **First card in under one minute** from a fresh install if credentials are already available.
- **CLI first, web later.** The CLI and core library should be useful before any web UI exists.
- **Provider adapters, not lock-in.** Nano Banana / Gemini-style image input should be supported when available, but the architecture should allow OpenAI, Replicate, fal, local models, or prompt-only mode.
- **Print-ready over pixel-perfect.** A simple, reliable A4 output is better than a complex design surface.
- **Reference-image friendly.** Users should be able to provide a family photo, pet photo, drawing, logo, or moodboard image as generation context.
- **Conversation as advanced mode.** Basic mode should be one command; advanced mode can iteratively refine through chat-like prompts and live previews.
- **No surprise network calls.** Provider calls must be explicit, logged, and credential-driven.

## V1 Scope

### CLI Commands

- `paperhug quick` — shortest path to a card from flags.
- `paperhug wizard` — interactive prompts for occasion, recipient, vibe, message, layout, and image backend.
- `paperhug refine <project.json>` — iterative text refinement of an existing project.
- `paperhug render <project.json>` — regenerate PDFs/previews from saved inputs without rerunning image generation.
- `paperhug templates list` — list occasions, styles, and layouts.
- `paperhug providers list` — show available image backends and required environment variables.

### Occasion Templates

Ship initial templates for:

- birthday
- Mother's Day
- Father's Day
- anniversary
- thank you
- congratulations
- new baby
- custom/freeform

Each occasion template should include:

- required questions
- optional personalisation hints
- default tone suggestions
- guardrails for respectful copy
- image prompt structure
- text prompt structure
- suggested footer/back-of-card metadata

### Style Templates

Ship a small starter set:

- warm watercolour
- kids crayon drawing
- minimal modern
- vintage floral
- cute animal mascot
- bold typographic
- photo-collage inspired

### Layout Templates

V1 layout target:

- A4 portrait front page with generated artwork and optional short cover title.
- A4 portrait back/inside page with message, optional recipient/sender text, tiny footer, generation metadata toggle, and safe margins.

The V1 physical workflow is deliberately simple: print the front and back pages, trim if needed, and glue them to cardstock. Future versions can support duplex printing, fold marks, A5 folded cards, US Letter, bleed/crop marks, and professional cardstock/export presets.

### Image Generation

Provider architecture:

- `none` / prompt-only mode: produce prompts, project JSON, and placeholder PDF.
- `nano-banana` or equivalent Gemini image model adapter when available.
- At least one broadly accessible fallback adapter if credentials exist, such as OpenAI image generation.
- Provider interface must support optional reference image inputs even if an individual provider cannot use them.

Reference image support:

```bash
paperhug quick mothers-day \
  --for "Mum" \
  --style "watercolour garden" \
  --reference ./family-photo.jpg \
  --message "warm, grateful, a little funny"
```

Reference images should be copied into the project output folder or recorded by path, depending on privacy-safe defaults. Do not upload reference images unless the selected provider requires it and the CLI clearly says so.

### Conversation / Refinement Mode

Advanced mode should feel like a creative loop:

```bash
paperhug wizard --conversation
paperhug refine dist/mum-card/project.json
```

Desired flow:

1. Generate first draft quickly.
2. Open or print a preview path in the terminal.
3. User says things like:
   - “make it more Australian native flowers”
   - “less cheesy”
   - “keep the image but make the text shorter”
   - “use the reference photo more subtly”
4. CLI updates the project JSON, prompt, preview, and PDF.

V1 can implement this as terminal conversation with saved revisions. A later local web UI can provide side-by-side previews and chat.

### Artifacts

Each run should produce a self-contained output folder:

```text
dist/<card-slug>/
  project.json
  prompts/
    image-prompt.txt
    text-prompt.txt
  assets/
    front.png
    reference-1.jpg        # if user opted to copy references
  front.pdf
  back.pdf
  card.pdf                 # combined two-page PDF
  preview.png
  README.txt               # print instructions
```

`project.json` should include:

- version
- occasion
- recipient label
- sender label, if provided
- tone/style/layout template IDs
- provider ID and model, if used
- reference image metadata
- prompts
- message text
- output dimensions
- revision history
- creation timestamp

## Out of Scope

- Hosted SaaS.
- Accounts, cloud storage, payments, or public galleries.
- Full Canva-style drag-and-drop editor.
- Perfect professional print-shop output in V1.
- Shipping copyrighted characters, trademarked card themes, or celebrity likeness templates.
- Automatically sending cards to recipients.
- Hidden image uploads or credential discovery.

## CLI/API Sketch

```bash
# Fastest path
npx paperhug birthday --for "Mum" --style "watercolour Australian garden" --message "warm and funny"

# More explicit quick mode
paperhug quick mothers-day \
  --for "Mum" \
  --from "Roger" \
  --style "warm watercolour" \
  --message "grateful, funny, not too cheesy" \
  --layout a4-glue-front-back \
  --provider nano-banana \
  --reference ./mum-and-kids.jpg

# Interactive mode
paperhug wizard

# Advanced conversational refinement
paperhug refine dist/mothers-day-for-mum/project.json

# Re-render without paying for image generation again
paperhug render dist/mothers-day-for-mum/project.json --no-generate

# Inspect installed templates/providers
paperhug templates list
paperhug providers list
```

## Verification

V1 verification gates:

- Unit tests for template loading and schema validation.
- Unit tests for prompt building with and without reference images.
- Unit tests for provider adapter contract using fake providers.
- Snapshot or structural tests for generated `project.json`.
- PDF smoke test that creates a valid two-page A4 PDF from fixture inputs.
- CLI smoke tests for `templates list`, `providers list`, prompt-only quick mode, and render from fixture project JSON.
- Lint/typecheck/build in CI.
- README quickstart tested against prompt-only mode so CI does not require paid image credentials.

Manual dogfood gate before release:

- Generate at least one Mother's Day or birthday card from the CLI.
- Verify `card.pdf` opens locally and contains two A4 pages.
- Verify reference image path flow works with a local fixture image.
- Verify refine mode can change text without regenerating image.

## Implementation Notes for OSS Factory

Recommended V1 stack:

- TypeScript + Node.js ESM CLI.
- `commander` or similar for commands.
- `@inquirer/prompts` for wizard/refine mode.
- `zod` for template/project schemas.
- `pdf-lib` or equivalent for deterministic PDF creation.
- `sharp` or a lighter image probing/rendering dependency if needed for PNG/JPEG sizing and preview generation.
- Provider adapters under `src/providers/`.
- Templates as YAML or JSON under `templates/`.

Potential package scripts:

```json
{
  "check": "npm run typecheck && npm run lint && npm test",
  "smoke": "node dist/cli.js quick birthday --for Test --message cheerful --provider none --out tmp/smoke"
}
```

Default behavior should be safe:

- If no image provider credentials exist, generate prompt-only output with a placeholder cover and clear next steps.
- Never require API keys to run tests.
- Do not upload reference images in prompt-only mode.
- Print the output folder and PDF path prominently.

## Future Scope

- Tiny self-hosted local web app wrapping the same core library.
- Browser preview with chat/refine panel.
- Duplex/fold-card layouts and crop/fold marks.
- US Letter and professional cardstock presets.
- Back-of-card footer templates, copyright/licence text, and optional “made with paperhug” mark.
- QR code linking to a personal message, voice note, or video.
- Sticker/decorative SVG packs.
- Batch holiday-card generation.
- Template marketplace-style folder conventions without central hosting.

## Agent Prompt

Build `paperhug`, a CLI-first TypeScript/Node open-source tool for generating print-at-home greeting cards. The first usable release must let a user create a two-page A4 card PDF quickly from occasion, recipient, style, message, and optional reference image inputs. Use template-driven prompt generation, provider adapters for image generation with prompt-only mode as the CI-safe default, deterministic PDF rendering, and saved project JSON so cards can be re-rendered or refined. Prioritise the fastest possible first-card experience, reference-image support, terminal wizard/refine flows, and clear print instructions. Do not build a hosted service or complex web editor in V1.
