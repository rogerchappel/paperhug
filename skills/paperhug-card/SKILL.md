---
name: paperhug-card
description: Create, refine, preview, and print greeting cards with the Paperhug CLI on an OpenClaw host. Use when a user asks to make a card, revise a card draft, preview a printable card, or send a card to a configured local printer.
---

# Paperhug Card

Use Paperhug for chat-driven greeting cards that are created, refined, previewed, and printed from the local OpenClaw host.

## Runtime Contract

Paperhug is a CLI skill. The runtime must have:

- `paperhug` installed and available on `PATH`, or a `paperhugBin` config value.
- `OPENAI_API_KEY` available when `provider` is `openai`.
- A configured printer when the user asks to print.
- `jq` available if you read OpenClaw skill config from `OPENCLAW_CONFIG_PATH`.

Paperhug is not yet published to the npm registry. Install the versioned
release asset when the command is unavailable:

```bash
npm install -g https://github.com/rogerchappel/paperhug/releases/download/v0.1.0/paperhug-0.1.0.tgz
```

Read config from the OpenClaw skill entry when available:

```bash
CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/openclaw.json}"
PAPERHUG_BIN=$(jq -r '.skills.entries["paperhug-card"].config.paperhugBin // "paperhug"' "$CONFIG_PATH" 2>/dev/null)
PAPERHUG_CARDS_DIR=$(jq -r '.skills.entries["paperhug-card"].config.cardsDir // empty' "$CONFIG_PATH" 2>/dev/null)
PAPERHUG_PRINTER=$(jq -r '.skills.entries["paperhug-card"].config.printer // env.PAPERHUG_PRINTER // empty' "$CONFIG_PATH" 2>/dev/null)
PAPERHUG_PROVIDER=$(jq -r '.skills.entries["paperhug-card"].config.provider // "openai"' "$CONFIG_PATH" 2>/dev/null)
OPENAI_API_KEY=$(jq -r '.skills.entries["paperhug-card"].env.OPENAI_API_KEY // env.OPENAI_API_KEY // empty' "$CONFIG_PATH" 2>/dev/null)
: "${PAPERHUG_BIN:=paperhug}"
: "${PAPERHUG_CARDS_DIR:=$HOME/Paperhug/cards}"
: "${PAPERHUG_PROVIDER:=openai}"
PAPERHUG_CARDS_DIR="${PAPERHUG_CARDS_DIR/#\~/$HOME}"
export OPENAI_API_KEY PAPERHUG_PRINTER
```

If `OPENAI_API_KEY` is empty and the provider is `openai`, stop and ask the user to add the Paperhug OpenAI secret in CrewCMD.

## Create A Draft

Collect only the missing essentials:

- occasion
- recipient
- sender
- card idea or tone
- visual style
- whether cover text should be printed separately or left to the generated image

Then create the card:

```bash
"$PAPERHUG_BIN" custom \
  --for "$RECIPIENT" \
  --from "$SENDER" \
  --idea "$IDEA" \
  --style "$STYLE" \
  --message "$MESSAGE_BRIEF" \
  --provider "$PAPERHUG_PROVIDER" \
  --out "$PAPERHUG_CARDS_DIR" \
  --force
```

Use `birthday`, `mothers-day`, `fathers-day`, `anniversary`, `thank-you`, `congratulations`, or `new-baby` instead of `custom` when the occasion is clear.

Use `--no-cover-title` when the generated image should carry any stylized text itself.

Reply with:

- occasion, recipient, sender, and style
- the inside message
- cover concept summary
- generated `card.pdf` path
- generated `preview.svg` path
- suggested next actions: refine text, try another image, or print

Do not print after creating a draft.

## Refine A Draft

Use the most recent unambiguous `project.json` for the conversation. If there are multiple possible cards, ask which draft to refine.

```bash
"$PAPERHUG_BIN" refine "$PROJECT_JSON" --note "$USER_FEEDBACK"
"$PAPERHUG_BIN" render "$PROJECT_JSON"
```

Preserve the prior project unless the user explicitly asks to replace it. After refinement, reply with the updated inside message and paths.

## Print

Print only after an explicit user request such as "print it" or "send this card to the printer".

Before printing:

- verify the latest draft is unambiguous
- verify `card.pdf` exists
- verify printing is enabled in config when `allowPrint` is present
- use the configured printer, not arbitrary user-supplied printer names

Dry-run if anything is unclear:

```bash
"$PAPERHUG_BIN" print "$PROJECT_JSON" --printer "$PAPERHUG_PRINTER" --dry-run
```

Print:

```bash
"$PAPERHUG_BIN" print "$PROJECT_JSON" --printer "$PAPERHUG_PRINTER"
```

Report the printer name, A4 landscape short-edge duplex settings, and job output. Never print automatically after generation or refinement.

## Safety

- Never reveal API keys or raw secret values.
- Tell the user when reference photos or provider-backed image generation will send data to an external service.
- Prefer `provider none` for tests or dry runs.
- Keep output concise and action-oriented.
