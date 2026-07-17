const assert = require('node:assert/strict');
const test = require('node:test');
const { extractPreviewMessage } = require('../src/previewPayload');

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
