# Velt Mobile Preview

Minimal React Native client for Velt preview QR sessions.

## What it does

- scans a Velt preview QR code;
- lets you enter a preview URL manually;
- fetches the encoded preview URL;
- renders the Velt preview JSON payload;
- reloads the same preview URL on demand.

The first skeleton preview returns:

```text
Welcome!
```

## Run locally

```bash
npm install
npm start
```

Generate a preview session from a Velt skeleton project:

```bash
php bin/velt serve
php bin/velt preview
```

`php bin/velt serve` starts the web app on `http://127.0.0.1:8000`. A physical
phone cannot reach the PC through `127.0.0.1`, so for mobile preview use the
local network IP that your phone can reach:

```bash
php bin/velt serve 192.168.1.20:8000
php bin/velt preview 192.168.1.20:8000
```

The Android build allows local `http://` preview URLs, so a phone on the same
Wi-Fi can fetch `http://192.168.x.x:8000/api/preview/{id}` directly.

## Test and export

```bash
npm test
npm run export
```

## Native PHP runtime

No files are copied from `php-bin-main` for this first client. The app only needs
camera access and HTTP fetch for the MVP flow.
