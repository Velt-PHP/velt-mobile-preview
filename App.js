const React = require('react');
const { useCallback, useState } = React;
const {
  ActivityIndicator,
  Button,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} = require('react-native');
const { CameraView, useCameraPermissions } = require('expo-camera');
const { extractPreviewMessage } = require('./src/previewPayload');

const logo = require('./assets/icon.png');

function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState('scan');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadPreview = useCallback(async (url) => {
    setMode('loading');
    setError(null);

    try {
      const response = await fetch(url);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Unable to load preview.');
      }

      setMessage(extractPreviewMessage(payload));
      setMode('preview');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load preview.');
      setMode('error');
    }
  }, []);

  const handleBarcodeScanned = useCallback(({ data }) => {
    if (mode !== 'scan' || !data) {
      return;
    }

    setPreviewUrl(data);
    loadPreview(data);
  }, [loadPreview, mode]);

  const reset = useCallback(() => {
    setMode('scan');
    setPreviewUrl(null);
    setMessage(null);
    setError(null);
  }, []);

  const reload = useCallback(() => {
    if (previewUrl) {
      loadPreview(previewUrl);
    }
  }, [loadPreview, previewUrl]);

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.center}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.text}>Camera permission is required.</Text>
          <Button title="Allow camera" onPress={requestPermission} />
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
          <Image source={logo} style={styles.logoSmall} />
          <Text style={styles.scanText}>Scan a Velt preview QR code</Text>
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
      <View style={styles.center}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.message}>{mode === 'error' ? error : message}</Text>
        <View style={styles.actions}>
          {previewUrl ? <Button title="Reload" onPress={reload} /> : null}
          <Button title="Scan" onPress={reset} />
        </View>
      </View>
    </SafeAreaView>
  );
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
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 24,
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
    marginBottom: 16,
  },
  scanText: {
    color: '#ffffff',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
    minWidth: 160,
  },
});

module.exports = App;
