# Velt Mobile Preview

Experimental Android companion for connecting to Velt development sessions. This alpha is not yet the final Compose/NativePHP companion and must not be described as production-ready.

The product goal is a Velt development companion with an experience comparable to Expo Go: scan a project, open it quickly, refresh changes, inspect protocol problems and exercise the native component catalogue without rebuilding for every PHP/UI edit. That comparison describes the intended developer experience, not the current implementation level.

> Release channel: `0.2.0-alpha`. Use it for local experimentation only. Do not distribute it as a production application and do not claim that it embeds PHP yet.

## Product boundaries

The companion and the final application APK solve different problems:

| Product | PHP location | Native capabilities | Rebuild policy |
| --- | --- | --- | --- |
| Preview companion | development computer | fixed catalogue shipped with the companion | UI/PHP changes reload without rebuild |
| Custom development client | development computer | project-specific catalogue | rebuild after adding native Kotlin/runtime code |
| Final Velt APK/AAB | embedded in the Android process | exact project catalogue | signed build for release |

The alpha in this repository implements only the first row, currently with a React Native renderer. The target renderer is Jetpack Compose and the final application path uses the embedded NativePHP runtime.

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

### Prerequisites

- Node.js LTS and npm;
- Android device with camera access or an emulator;
- the development computer and phone on the same reachable network;
- a Velt project exposing a compatible Preview schema;
- EAS CLI and an Expo account only when producing a hosted build.

```bash
npm ci
npm start
```

Then open the project with an Android development client. Camera permission is requested only when scanning a QR code; manual entry remains available.

From a cross-platform Velt project:

```bash
velt serve 0.0.0.0:8000
velt preview 192.168.1.20:8000
```

The phone and computer must share a reachable network. `127.0.0.1` on the phone is the phone itself and is rejected.

## Connection lifecycle

1. The CLI creates a Preview session for a Velt route.
2. The developer scans the QR code or enters the session URL.
3. The client normalizes the URL and rejects loopback or malformed targets.
4. The server returns a versioned payload.
5. The client validates the schema before rendering any component.
6. The renderer maps known Velt types to mobile controls.
7. Refresh runs every 2.5 seconds in the alpha; manual refresh remains available.
8. The project is saved in recent history only after a valid connection.

The target lifecycle replaces polling with authenticated WebSocket snapshots/diffs and reconnect backoff.

## Supported alpha components

| Velt type | Alpha behavior |
| --- | --- |
| container/stack | groups and lays out children |
| text | renders textual content and basic variants |
| link | opens or navigates to a known Preview route |
| button | renders a pressable action |
| input | captures editable text |
| alert | displays semantic feedback |
| image | displays a validated image source |
| divider | separates visual groups |
| toggle | captures a boolean value |

Unsupported types must produce an explicit diagnostic. They must never be silently interpreted as executable JavaScript, HTML or a WebView fragment.

## Protocol validation

The client checks the root object, schema version, screen metadata and component tree before rendering. Network failures, timeouts, invalid JSON, unsupported versions and unknown component types are distinct error categories so framework contributors can locate the failing layer.

Protocol implementation lives in:

```text
src/previewClient.js       HTTP, timeout and response errors
src/previewProtocol.js     version/capability checks
src/previewPayload.js      component payload validation
src/recentProjects.js      on-device connection history
```

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

An internal APK is successful only when EAS reports a completed artifact and that artifact can be installed and launched. `expo export` validates the JavaScript bundle but does not create an APK. A stable release additionally requires a reproducible Gradle path, release signing ownership, provenance/SBOM and an AAB tested through Play’s internal track.

## Configuration

`app.json` defines the Expo application identity, Android package name, permissions and network build properties. `eas.json` defines the internal preview profile. Never commit a keystore, service-account JSON or access token. Production and debug network policies must be separate before stable release.

## Security note

Cleartext local-network traffic is enabled only because this is a development companion. The final release architecture separates debug and production network security configurations.

Additional rules:

- do not connect the alpha to untrusted public endpoints;
- do not place permanent credentials in QR codes or recent-project storage;
- validate all component types, props, routes and events against a closed catalogue;
- redact session tokens from logs and screenshots;
- request Android permissions at the moment of use and explain why;
- reject remote code evaluation and WebView fallbacks;
- report vulnerabilities privately through the organization security policy.

## Tests and release checklist

```bash
npm ci
npm test
npx expo-doctor
npm run export
npm audit
```

The automated suite covers URL handling, HTTP behavior, protocol payloads and recent projects. Before calling the companion complete, CI must also run Android instrumented tests for scanning, connection, rendering, actions, process recreation, offline recovery and accessibility on supported API levels.

Stable release gates include:

- Jetpack Compose renderer with no WebView;
- signed session negotiation and capability handshake;
- WebSocket updates, ordered diffs and reconnect recovery;
- real interaction tests against `velt/preview` fixtures;
- APK installation on x86_64 emulator and arm64 device;
- accessibility labels, focus, font scaling and dark mode;
- crash reporting and diagnostics without secret leakage;
- zero unresolved high-severity production advisories;
- reproducible APK/AAB and documented signing procedure.

## Troubleshooting

### The phone cannot connect

Bind Velt to `0.0.0.0`, use the computer’s LAN address, verify both devices share a network and allow the development port through the firewall. Never replace the LAN address with `localhost` on the phone.

### The QR code opens an invalid address

Regenerate it with an explicit address: `velt preview 192.168.1.20:8000`. VPNs and multiple network adapters can make automatic detection choose the wrong interface.

### A component is not rendered

Open diagnostics, verify `schemaVersion`, inspect the component type and compare it with the supported table. Adding a native capability to the future Compose catalogue may require a custom client rebuild.

### `expo export` succeeds but there is no APK

This is expected. Export produces a Metro bundle. Run the EAS build command or the documented Gradle build once the native project is generated.

## Repository layout

```text
App.js                 alpha application shell and renderer
src/                   protocol, client and persistence modules
test/                  Node contract tests
assets/                application icon assets
app.json               Expo/Android configuration
eas.json               hosted build profiles
```

## Contribution

Changes to the schema require matching fixtures in `velt-preview`. Changes to a native capability require an architecture note explaining whether the standard companion can support it or whether a custom development client is necessary. Every behavioral fix should include a regression test and preserve explicit errors rather than hiding unsupported behavior.

## License

MIT
