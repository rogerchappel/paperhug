# Paperhug Capacitor Mobile App Design

## Purpose

Paperhug should be usable by someone who wants to make a thoughtful card without touching a terminal, printer driver settings, project JSON, or provider flags.

The CLI remains the automation and developer surface. The mobile app becomes the consumer surface:

> Open Paperhug, pick an occasion, add a recipient and message brief, choose a design, preview the fold, then print or share.

## Target platforms

- iOS first-class support, including AirPrint and photo picker.
- Android first-class support, including Android print/share flows and photo picker.
- Desktop remains served by the CLI for now; a desktop shell can reuse the same core later.

## Recommended technology

Use **Capacitor + React + TypeScript**.

Reasons:

- Reuses Paperhug's existing TypeScript direction instead of rewriting the product logic in Swift/Kotlin/Dart.
- Ships one app codebase to iOS and Android.
- Gives native access to photo picking, sharing, filesystem storage, and print/share handoff.
- Keeps the UI fast to iterate with normal web tooling.
- Allows a future hosted/local web preview because most UI remains React.

Avoid using a local HTTP server as the primary app architecture. Mobile Paperhug should run its card creation and rendering logic in-app, not by starting a localhost API.

## Product principle

The app must hide implementation details.

Users should not need to know:

- what `lp` means,
- what a provider flag is,
- where `project.json` lives,
- whether the PDF is front/back/two-page internally,
- which duplex setting matches a landscape fold.

The app should always present the task in human terms:

- "Birthday card for Mum"
- "From Henry and Arthur"
- "Funny, loving, not cheesy"
- "Print folded card"

## User flow

### 1. Home

Primary actions:

- Make a card
- Reprint a recent card
- Browse saved cards

Recent cards should show occasion, recipient, thumbnail, and last edited date.

### 2. Occasion

Pick from templates:

- Birthday
- Mother's Day
- Father's Day
- Anniversary
- Thank you
- Congratulations
- New baby
- Custom

### 3. Details

Collect the minimum useful inputs:

- Recipient
- Sender
- Tone/message brief
- Optional exact message
- Optional cover title
- Optional reference photos

Offer quick chips:

- Warm
- Funny
- From the kids
- Less cheesy
- Australian native flowers
- Elegant
- Playful

### 4. Style

Show friendly visual style cards backed by existing Paperhug style templates.

Examples:

- Warm watercolour
- Kids crayon
- Native flowers
- Minimal elegant
- Bright birthday

### 5. Generate and preview

Generate a local project and render previews:

- Outside/front spread
- Inside/message spread
- Fold guide
- Final PDF preview

For provider-backed image generation, the app should clearly show when an API call will happen and which provider is used. Prompt-only mode should remain available and safe.

### 6. Refine

Support one-tap refinements:

- Warmer
- Funnier
- Shorter
- More heartfelt
- Less cheesy
- More like a child wrote it
- Try another cover

Each refinement updates the saved project revision history.

### 7. Print/share

Primary button: **Print folded card**.

Default print intent:

- Paper: A4
- Orientation: landscape
- Duplex: short-edge / flip on short edge
- Scale: fit/100% depending on platform capability

If the platform print dialog cannot enforce duplex/orientation, the app must display a pre-print checklist:

- Select A4
- Select landscape
- Select double-sided
- Flip on short edge

Secondary actions:

- Share PDF
- Save PDF
- Export project bundle

## Architecture

Refactor toward shared packages:

```text
packages/
  paperhug-core/       occasion/style templates, project model, prompts, revisions
  paperhug-render/     browser-safe SVG/PDF rendering
  paperhug-providers/  optional AI provider adapters with explicit consent
  paperhug-ui/         shared React components and flow screens

apps/
  cli/                 Node CLI wrapper around the shared packages
  mobile/              Capacitor iOS/Android app
```

The current repo can evolve incrementally toward this layout. The first mobile PR does not need to split every package at once, but new code should keep Node-only APIs out of core logic.

## Boundaries

### Core package

Allowed:

- Pure TypeScript data model
- Template loading from bundled JSON
- Prompt construction
- Project revision operations
- Provider-independent generation contracts

Not allowed:

- `node:fs`
- shelling out to `lp`
- direct process/env access
- platform-specific printing code
- browser DOM assumptions

### Render package

Should generate:

- preview SVG/HTML for app display
- print-ready PDF bytes or blob
- optional thumbnail image

Requirements:

- deterministic output for tests
- works in mobile WebView context
- does not require native Node canvas dependencies for basic output

### Mobile app

Owns:

- file/photo picker integration
- local project persistence
- native share/print bridge
- provider API key or account UX if added later
- platform-specific permission handling

### CLI

Owns:

- command parsing
- filesystem IO
- terminal wizard
- `paperhug print` using desktop print commands
- automation-friendly JSON output

## Data model

A mobile project should remain compatible with CLI project JSON.

Minimum shape:

```json
{
  "version": 1,
  "occasion": { "id": "birthday", "label": "Birthday" },
  "style": { "id": "warm-watercolour", "label": "Warm watercolour" },
  "recipient": "Mum",
  "sender": "Henry and Arthur",
  "messageBrief": "funny, loving, not cheesy",
  "message": "...",
  "coverTitle": "Happy Birthday",
  "references": [],
  "layout": {
    "id": "a4-landscape-fold-half",
    "paper": "A4",
    "orientation": "landscape",
    "duplex": "short-edge"
  },
  "revisions": [],
  "outputs": {}
}
```

## Printing strategy

Capacitor cannot guarantee identical print controls across every printer and OS version. Treat printing as an intent plus a guardrail UX.

### iOS

- Generate PDF in-app.
- Use AirPrint/native print interaction where possible.
- Present explicit instructions before the system print sheet if duplex/orientation cannot be preselected.
- Keep a fallback Share PDF action.

### Android

- Generate PDF in-app.
- Use Android Print Framework or share intent.
- Present explicit instructions for landscape and duplex.
- Keep Save/Share PDF as fallback.

### Desktop CLI

The existing CLI `paperhug print` remains the most deterministic local desktop printing path because it can pass explicit printer options.

## Provider/API strategy

Default mobile mode should be local/prompt-only unless the user explicitly chooses a provider-backed generation mode.

Rules:

- Never upload reference photos without clear confirmation.
- Show the provider and action before any network call.
- Keep tests passing without API keys.
- Store generated artifacts inside the local project bundle.
- Keep prompt-only mode useful and polished.

Potential provider modes:

1. Prompt-only: create prompts, placeholders, and print layout.
2. Bring-your-own-key: user enters an API key stored in platform secure storage.
3. Hosted account: future option only if Paperhug becomes a service.

## Storage

Use local-first storage.

- Store projects in app documents/data storage.
- Store reference photos as copied app-local assets, with user consent.
- Export/import project bundle as a folder or zip later.
- Do not require login for local card creation.

## MVP scope

A credible mobile MVP should include:

- Capacitor app scaffold for iOS and Android.
- React flow: occasion, details, style, preview, print/share.
- Shared core functions extracted from current CLI.
- Browser/mobile-safe render path for the existing A4 landscape fold-half layout.
- Local project save/load.
- Photo picker references recorded in the project.
- Print/share PDF action with A4 landscape duplex checklist.
- Tests for core project creation and render defaults.

Out of scope for MVP:

- App Store polish.
- Accounts/sync.
- In-app purchases.
- Hosted generation service.
- Complex drag-and-drop editor.
- Full native print setting enforcement on every printer.

## Incremental implementation plan

### Phase 1: Extract app-safe core

- Move project creation, templates, prompts, and layout defaults behind browser-safe functions.
- Keep CLI behavior unchanged.
- Add tests proving the layout default is A4 landscape short-edge duplex.

### Phase 2: Browser-safe preview/render

- Make render functions return bytes/strings instead of writing directly to disk.
- Keep CLI filesystem writing as a wrapper.
- Add deterministic preview fixtures.

### Phase 3: Capacitor scaffold

- Add `apps/mobile` with Capacitor, React, Vite, and TypeScript.
- Implement the guided flow with local-only generation.
- Render preview in the app.

### Phase 4: Mobile print/share

- Generate PDF blob/file in app storage.
- Add share and print actions.
- Add pre-print checklist for A4 landscape duplex.

### Phase 5: Provider-backed generation

- Add explicit-consent provider flow.
- Store provider settings securely.
- Keep prompt-only fallback.

## Open questions

- Should the first mobile app be iPad-optimized, phone-first, or both?
- Should generated cards default to A4 worldwide, or offer Letter with a clear region setting?
- Should provider-backed generation use BYO keys first or a hosted Paperhug relay later?
- Should family-friendly defaults include reusable sender profiles like "Henry and Arthur"?
- Should the app offer direct printer profiles for known home printers after first successful print?

## Recommendation

Build Paperhug as **Capacitor app first, shared TypeScript core underneath, CLI preserved as a power-user wrapper**.

The app should move card creation and rendering in-app rather than depending on a local server. The local server idea is useful for fast desktop prototyping, but it is not the right long-term architecture for iOS and Android.
