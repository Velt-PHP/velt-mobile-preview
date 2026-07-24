const React = require('react');
const { useCallback, useState } = React;
const {
  ActivityIndicator,
  Button,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} = require('react-native');
const { CameraView, useCameraPermissions } = require('expo-camera');
const { normalizePreviewUrl } = require('./src/previewPayload');

const logo = require('./assets/icon.png');

function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('home');
  const [manualUrl, setManualUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewPayload, setPreviewPayload] = useState(null);
  const [error, setError] = useState(null);

  const loadPreview = useCallback(async (url) => {
    setMode('loading');
    setError(null);

    try {
      const normalizedUrl = normalizePreviewUrl(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      let response;
      let payload;

      setPreviewUrl(normalizedUrl);

      try {
        response = await fetch(normalizedUrl, { signal: controller.signal });
        const body = await response.text();
        payload = body ? JSON.parse(body) : {};
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Unable to load preview.');
      }

      setPreviewPayload(payload);
      setMode('preview');
    } catch (caught) {
      const message =
        caught instanceof SyntaxError
          ? 'La preview repond, mais pas en JSON Velt. Verifie que l URL scannee pointe vers /api/preview/{id}.'
          : caught instanceof Error && caught.name === 'AbortError'
            ? 'Connexion trop lente ou impossible. Verifie que le telephone et le PC sont sur le meme Wi-Fi.'
            : caught instanceof TypeError
              ? 'Connexion impossible. Verifie que le serveur Velt tourne et utilise l IP Wi-Fi du PC pour le telephone, pas 127.0.0.1.'
              : caught instanceof Error
                ? caught.message
                : 'Unable to load preview.';

      setError(message);
      setMode('error');
    }
  }, []);

  const handleBarcodeScanned = useCallback(({ data }) => {
    if (mode !== 'scan' || !data) {
      return;
    }

    loadPreview(data);
  }, [loadPreview, mode]);

  const openScan = useCallback(async () => {
    setError(null);

    if (permission?.granted) {
      setMode('scan');
      return;
    }

    const result = await requestPermission();

    if (result?.granted) {
      setMode('scan');
      return;
    }

    setError('Autorise la camera pour scanner un QR, ou saisis l adresse manuellement.');
  }, [permission?.granted, requestPermission]);

  const openManual = useCallback(() => {
    setError(null);
    setMode('manual');
  }, []);

  const submitManualUrl = useCallback(() => {
    loadPreview(manualUrl);
  }, [loadPreview, manualUrl]);

  const reset = useCallback(() => {
    setMode('home');
    setPreviewUrl(null);
    setPreviewPayload(null);
    setError(null);
  }, []);

  const reload = useCallback(() => {
    if (previewUrl) {
      loadPreview(previewUrl);
    }
  }, [loadPreview, previewUrl]);

  if (mode === 'home') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.home}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.homeTitle}>Velt Preview</Text>
          <Text style={styles.homeSubtitle}>
            Connecte une app Velt depuis un QR code ou depuis une adresse de preview.
          </Text>
          {error ? <Text style={styles.inlineError}>{error}</Text> : null}
          <View style={styles.homeActions}>
            <ActionButton label="Scanner un QR" onPress={openScan} />
            <ActionButton label="Ecrire l adresse" onPress={openManual} variant="secondary" />
          </View>
          <Text style={styles.homeHint}>
            Web local: http://127.0.0.1:8000. Telephone: utilise l IP Wi-Fi du PC, par exemple http://192.168.1.20:8000/api/preview/ID.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'manual') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.home}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.homeTitle}>Adresse preview</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setManualUrl}
            onSubmitEditing={submitManualUrl}
            placeholder="http://192.168.1.20:8000/api/preview/ID"
            returnKeyType="go"
            style={styles.manualInput}
            value={manualUrl}
          />
          <View style={styles.homeActions}>
            <ActionButton label="Ouvrir" onPress={submitManualUrl} />
            <ActionButton label="Retour" onPress={reset} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'scan' && !permission) {
    return <View style={styles.center} />;
  }

  if (mode === 'scan' && !permission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.text}>Autorise la camera pour scanner un QR Velt.</Text>
          <Button title="Autoriser la camera" onPress={openScan} />
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'scan') {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <SafeAreaView style={styles.overlay}>
          <View style={styles.scanTop}>
            <Image source={logo} style={styles.logoSmall} />
            <Text style={styles.scanText}>Scanne le QR Velt Preview</Text>
          </View>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.scanBottom}>
            <Text style={styles.scanHint}>Garde le QR dans le carre</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (mode === 'loading') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      {mode === 'error' ? (
        <View style={styles.center}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.message}>{error}</Text>
          <View style={styles.actions}>
            {previewUrl ? <ActionButton label="Reload" onPress={reload} /> : null}
            <ActionButton label="Accueil" onPress={reset} variant="secondary" />
          </View>
        </View>
      ) : (
        <View style={styles.previewScreen}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>{previewPayload?.screen || 'Velt Preview'}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.previewContent}>
            {(previewPayload?.components || []).map((component, index) =>
              renderVeltComponent(component, `root-${index}`, {
                previewUrl,
                loadPreview,
              })
            )}
          </ScrollView>
          <View style={styles.previewBottomBar}>
            <ActionButton label="Reload" onPress={reload} />
            <ActionButton label="Accueil" onPress={reset} variant="secondary" />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress, variant = 'primary' }) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, variant === 'secondary' ? styles.actionButtonSecondary : null]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <Text style={[styles.actionButtonText, variant === 'secondary' ? styles.actionButtonSecondaryText : null]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function renderVeltComponent(component, key, context) {
  if (!component || typeof component !== 'object') {
    return null;
  }

  const type = component.type;
  const props = component.props || {};
  const children = Array.isArray(component.children) ? component.children : [];
  const childNodes = children.map((child, index) => renderVeltComponent(child, `${key}-${index}`, context));

  if (type === 'Text') {
    return (
      <Text key={key} style={[styles.veltText, textStyleForTag(props.as)]}>
        {component.content || component.value || props.value || ''}
      </Text>
    );
  }

  if (type === 'Link') {
    return (
      <TouchableOpacity
        key={key}
        style={styles.veltLink}
        onPress={() => openPreviewLink(component.href, context)}
        activeOpacity={0.72}
      >
        <Text style={styles.veltLinkText}>{component.content || component.label || component.href || 'Link'}</Text>
      </TouchableOpacity>
    );
  }

  if (type === 'Button') {
    return (
      <TouchableOpacity key={key} style={styles.veltButton} activeOpacity={0.72}>
        <Text style={styles.veltButtonText}>{component.content || 'Button'}</Text>
      </TouchableOpacity>
    );
  }

  if (type === 'Input') {
    return (
      <View key={key} style={styles.veltInputGroup}>
        {component.label ? <Text style={styles.veltInputLabel}>{component.label}</Text> : null}
        <TextInput
          editable={false}
          placeholder={props.placeholder}
          value={props.value ? String(props.value) : ''}
          secureTextEntry={props.type === 'password'}
          style={styles.veltInput}
        />
      </View>
    );
  }

  if (type === 'Alert') {
    return (
      <View key={key} style={styles.veltAlert}>
        <Text style={styles.veltAlertText}>{component.content || ''}</Text>
      </View>
    );
  }

  return (
    <View key={key} style={styles.veltContainer}>
      {childNodes}
    </View>
  );
}

function openPreviewLink(href, context) {
  if (typeof href !== 'string' || href === '') {
    return;
  }

  const previewRouteUrl = previewUrlForHref(href, context?.previewUrl);

  if (previewRouteUrl) {
    context.loadPreview(previewRouteUrl);
    return;
  }

  if (href.startsWith('http')) {
    Linking.openURL(href);
  }
}

function previewUrlForHref(href, currentPreviewUrl) {
  if (!href.startsWith('/') || !currentPreviewUrl) {
    return null;
  }

  let origin;

  try {
    origin = new URL(currentPreviewUrl).origin;
  } catch {
    return null;
  }

  const route = href === '/' ? 'homepage' : href.replace(/^\/+/, '').replace(/\/+$/, '');

  return `${origin}/api/preview-route/${encodeURIComponent(route)}`;
}

function textStyleForTag(tag) {
  return {
    h1: styles.veltH1,
    h2: styles.veltH2,
    h3: styles.veltH3,
    strong: styles.veltStrong,
    small: styles.veltSmall,
    span: styles.veltSpan,
  }[tag] || null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  home: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  homeTitle: {
    color: '#111827',
    fontFamily: 'Poppins',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 10,
    textAlign: 'center',
  },
  homeSubtitle: {
    color: '#4b5563',
    fontFamily: 'Poppins',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 20,
    textAlign: 'center',
  },
  homeActions: {
    gap: 10,
    marginTop: 4,
  },
  homeHint: {
    color: '#6b7280',
    fontFamily: 'Poppins',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 18,
    textAlign: 'center',
  },
  inlineError: {
    color: '#b91c1c',
    fontFamily: 'Poppins',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  manualInput: {
    borderColor: '#d1d5db',
    borderWidth: 1,
    color: '#111827',
    fontFamily: 'Poppins',
    fontSize: 15,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logo: {
    width: 96,
    height: 96,
    resizeMode: 'contain',
    marginBottom: 24,
  },
  logoSmall: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  scanTop: {
    alignItems: 'center',
  },
  scanText: {
    color: '#ffffff',
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    fontFamily: 'Poppins',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  scanFrame: {
    width: 270,
    height: 270,
    maxWidth: '82%',
    aspectRatio: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderColor: '#ffffff',
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBottomRight: {
    right: -2,
    bottom: -2,
    borderRightWidth: 4,
    borderBottomWidth: 4,
  },
  scanBottom: {
    minHeight: 48,
    justifyContent: 'center',
  },
  scanHint: {
    color: '#ffffff',
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    fontFamily: 'Poppins',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'Poppins',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Poppins',
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    minWidth: 104,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderColor: '#2563eb',
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#ffffff',
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
  },
  actionButtonSecondaryText: {
    color: '#2563eb',
  },
  previewScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  previewHeader: {
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  previewTitle: {
    color: '#111827',
    fontFamily: 'Poppins',
    fontSize: 18,
    fontWeight: '700',
  },
  previewBottomBar: {
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  previewContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  veltContainer: {
    gap: 10,
    paddingVertical: 4,
  },
  veltText: {
    color: '#1f2937',
    fontFamily: 'Poppins',
    fontSize: 16,
    lineHeight: 23,
  },
  veltH1: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  veltH2: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  veltH3: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  veltStrong: {
    color: '#111827',
    fontWeight: '800',
  },
  veltSmall: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 16,
  },
  veltSpan: {
    color: '#1f2937',
  },
  veltLink: {
    alignSelf: 'flex-start',
    borderColor: '#2563eb',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  veltLinkText: {
    color: '#2563eb',
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
  },
  veltButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  veltButtonText: {
    color: '#ffffff',
    fontFamily: 'Poppins',
    fontSize: 15,
    fontWeight: '700',
  },
  veltInputGroup: {
    gap: 6,
  },
  veltInputLabel: {
    color: '#374151',
    fontFamily: 'Poppins',
    fontSize: 14,
    fontWeight: '700',
  },
  veltInput: {
    borderColor: '#d1d5db',
    borderWidth: 1,
    color: '#111827',
    fontFamily: 'Poppins',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  veltAlert: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    borderWidth: 1,
    padding: 12,
  },
  veltAlertText: {
    color: '#92400e',
    fontFamily: 'Poppins',
    fontSize: 15,
    lineHeight: 21,
  },
});

module.exports = App;
