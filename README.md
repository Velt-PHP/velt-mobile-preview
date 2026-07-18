# Velt Mobile Preview

Minimal React Native client for Velt preview QR sessions.

## What it does

- scans a Velt preview QR code;
- fetches the encoded preview URL;
- displays the first `Text` message from the JSON payload;
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

If the automatic IP detection is wrong, pass the local network IP that your
phone can reach:

```bash
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
