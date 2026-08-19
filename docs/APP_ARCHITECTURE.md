# Paperhug app architecture

Paperhug now has three open-source surfaces that share the same app-safe card model:

- `src/` — the existing CLI and Node PDF pipeline.
- `packages/app-core/` — browser-safe card draft, prompt, style, and print-intent logic.
- `apps/web/` — React/Vite web app for local browser use and future PWA hosting, including card PDF and project JSON download.
- `apps/mobile/` — React/Vite + Capacitor shell for iOS and Android, including native share-sheet PDF handoff when running on device.

## Why this split

The CLI remains useful infrastructure for power users and automation, but the product surface should be approachable for families. The app layers hide project JSON, terminal commands, printer flags, and provider details behind a guided flow:

1. Occasion
2. Recipient
3. Style
4. Message
5. Preview
6. Print/share

The shared `@paperhug/app-core` package keeps this flow consistent between web and mobile while avoiding Node-only APIs. It should not import `node:fs`, shell out to `lp`, read process globals, or assume a desktop printer.

## Print intent

All app surfaces carry an explicit print intent:

- paper: A4
- orientation: landscape
- duplex: short-edge
- scale: fit-to-page

The CLI translates this to platform commands today. Mobile and browser adapters should translate it into AirPrint, Android Print Framework, share-sheet, or browser print behaviour without changing the card model.

## Open-source contribution boundaries

Good first issues can now target independent layers:

- Add occasions/styles in `packages/app-core`.
- Improve guided UX in `apps/web`.
- Add Capacitor plugins/adapters in `apps/mobile`.
- Improve CLI/PDF rendering in `src`.

Provider integrations must remain optional and consent-based. Tests should pass without API keys or real network access.

## Current end-to-end app flow

The shared app core can now turn a draft into:

- a browser-safe `project.json` export;
- a two-page A4 landscape PDF;
- bytes/Blob helpers for web download and native handoff.

Card text is encoded as UTF-16 in browser and mobile PDFs so accented names,
non-Latin scripts, and emoji are not silently replaced with question marks.
Glyph display uses the PDF viewer's Unicode font substitution; colour emoji may
appear as monochrome glyphs.

The web app downloads the generated PDF or project JSON directly in the browser. The mobile shell writes the PDF to Capacitor cache and opens the native share sheet on iOS/Android; that is the handoff point for AirPrint, Android Print Framework, Files, Messages, or other installed destinations.

## Next implementation steps

- Move more prompt/template mapping from `src/` into browser-safe shared packages.
- Add a shared React UI package if web and mobile screens begin duplicating too much.
- Add richer PDF preview pages and artwork placement once generated image assets are in the app model.
- Add true native print adapters if the share-sheet handoff is not enough on-device.
