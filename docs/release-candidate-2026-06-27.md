# paperhug release candidate notes

Date: 2026-06-27

## Scope

This release candidate focuses on the public package surface for the existing
CLI-first greeting card generator.

## Verification

```sh
npm run release:check
```

Expected coverage:

- Syntax check and Node test suite.
- Prompt-only CLI smoke with `--provider none`, which makes no network calls.
- Package smoke that confirms the CLI, runtime entrypoint, bundled templates,
  and Paperhug card skill are present before `npm pack --dry-run`.

## Release notes starter

- Add package smoke file checks for the shipped CLI/runtime/template/skill
  surface.
- Document the release package contents in README with concrete pack checks.
- Add limitations for personal output data, optional provider uploads, and
  local printer-driver behavior.

## Limitations

Prompt-only mode remains the safest default. Provider-backed image generation
and host printing are explicit local actions with environment and device
dependencies.
