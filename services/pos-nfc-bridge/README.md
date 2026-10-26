# POS NFC Bridge (Mac PC/SC → browser)

Reads contactless card UID from ACS ACR1555 (CCID mode) and pushes it to the POS web app.

## Run

From repo root:

```bash
pnpm pos:nfc-bridge
```

First time only:

```bash
pnpm install --frozen-lockfile
pnpm pos:nfc-bridge:install
```

Keep this terminal open while using POS.

## Browser

POS pages connect to `ws://127.0.0.1:8787` automatically.

## Notes

- Emits once per **insert**. Lift the card before scanning again.
- Localhost only.
- Keyboard wedge mode still works if configured.

## Environment

Use the Node version in [the root .nvmrc](../../.nvmrc). The `pnpm pos:nfc-bridge:install` command rebuilds the native PC/SC dependency; the machine needs the platform's PC/SC libraries and native build tools.

`POS_NFC_BRIDGE_PORT` defaults to `8787`. To load configuration from a file, run these commands from the repository root:

```bash
cp services/pos-nfc-bridge/.env.example services/pos-nfc-bridge/.env
node --env-file=services/pos-nfc-bridge/.env services/pos-nfc-bridge/server.mjs
```

The bridge always binds to `127.0.0.1`. If you change the port, the POS WebSocket client must use the same port. The normal `pnpm pos:nfc-bridge` command reads the shell environment; it does not automatically load this `.env` file.
