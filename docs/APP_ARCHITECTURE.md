# Paperhug app architecture

Paperhug now has three open-source surfaces that share the same app-safe card model:

- `src/` — the existing CLI and Node PDF pipeline.
- `packages/app-core/` — browser-safe card draft, prompt, style, and print-intent logic.
- `apps/web/` — React/Vite web app for local browser use and future PWA hosting.
- `apps/mobile/` — React/Vite + Capacitor shell for iOS and Android.

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

## Next implementation steps

- Move more prompt/template mapping from `src/` into browser-safe shared packages.
- Add a shared React UI package if web and mobile screens begin duplicating too much.
- Add PDF preview/export that works inside a mobile WebView.
- Add native print/share adapters behind an interface rather than calling platform APIs directly from screens.
