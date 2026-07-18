const assert = require('node:assert/strict');
const test = require('node:test');
const { extractPreviewMessage, normalizePreviewUrl } = require('../src/previewPayload');

test('extracts the first Text component value from a Velt preview payload', () => {
  const payload = {
    schemaVersion: '1.0',
    screen: 'home',
    components: [
      {
        type: 'Text',
        value: 'Welcome!',
      },
    ],
  };

  assert.equal(extractPreviewMessage(payload), 'Welcome!');
});

test('falls back to Welcome when the payload is empty', () => {
  assert.equal(extractPreviewMessage(null), 'Welcome!');
});

test('keeps reachable preview URLs', () => {
  assert.equal(
    normalizePreviewUrl('http://192.168.1.20:8000/api/preview/demo'),
    'http://192.168.1.20:8000/api/preview/demo'
  );
});

test('extracts a preview URL embedded in scanned text', () => {
  assert.equal(
    normalizePreviewUrl('URL: http://192.168.1.20:8000/api/preview/demo'),
    'http://192.168.1.20:8000/api/preview/demo'
  );
});

test('adds http to local network host previews without a scheme', () => {
  assert.equal(
    normalizePreviewUrl('192.168.1.20:8000/api/preview/demo'),
    'http://192.168.1.20:8000/api/preview/demo'
  );
});

test('rejects loopback preview URLs because phones cannot reach the PC localhost', () => {
  assert.throws(
    () => normalizePreviewUrl('http://127.0.0.1:8000/api/preview/demo'),
    /pointe vers le PC local/
  );
});
