# Velt Mobile Preview

Experimental Android companion for connecting to Velt development sessions. This alpha is not yet the final Compose/NativePHP companion and must not be described as production-ready.

## Implemented in this alpha

- QR scanning and manual network URL entry;
- strict URL normalization that rejects phone-inaccessible loopback addresses;
- versioned Preview schema validation and capability diagnostics;
- structured HTTP/protocol errors and request timeout;
- recent-project history stored on device;
- automatic refresh every 2.5 seconds with manual reload;
- Velt rendering for containers, text, links, buttons, inputs, alerts, images, dividers and toggles;
- navigation between known Velt preview routes;
- Android JS bundle export and EAS APK profile.

## Not complete yet

- the application renderer still uses React Native, not the target Jetpack Compose renderer;
- PHP is not embedded in this companion;
- device API calls do not yet traverse the real `nativephp_call()`/JNI bridge;
- signed session negotiation, WebSocket diffs, reconnect backoff and discovery remain pending;
- no instrumented emulator/device test is present;
- an exported Metro bundle is not an APK; APK/AAB builds require EAS or Gradle;
- unresolved Expo/Metro advisories block a stable tag.

The complete architecture and release gates live in [`velt-mobile-architecture`](https://github.com/Velt-PHP/velt-mobile-architecture).

## Run

```bash
npm ci
npm start
```

From a cross-platform Velt project:

```bash
velt serve 0.0.0.0:8000
velt preview 192.168.1.20:8000
```

The phone and computer must share a reachable network. `127.0.0.1` on the phone is the phone itself and is rejected.

## Validate

```bash
npm test
npx expo-doctor
npm run export
npm audit
```

## Build an internal APK

```bash
eas build --platform android --profile preview
```

The preview profile uses EAS-managed Android credentials. Production signing and Play delivery are separate release gates.

## Security note

Cleartext local-network traffic is enabled only because this is a development companion. The final release architecture separates debug and production network security configurations.

## License

MIT
