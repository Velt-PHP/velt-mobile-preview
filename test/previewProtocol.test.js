const test = require('node:test');
const assert = require('node:assert/strict');
const { validatePreviewPayload, PreviewProtocolError } = require('../src/previewProtocol');

test('accepts schema v1 and reports unsupported components', () => {
  const result = validatePreviewPayload({
    schemaVersion: 1,
    components: [{ type: 'Card', children: [{ type: 'Map', children: [] }] }],
  });
  assert.deepEqual(result.capabilities.unsupportedComponents, ['Map']);
});

test('rejects unknown protocol versions', () => {
  assert.throws(
    () => validatePreviewPayload({ schemaVersion: 99, components: [] }),
    (error) => error instanceof PreviewProtocolError && error.code === 'unsupported_schema',
  );
});

test('rejects malformed component children', () => {
  assert.throws(
    () => validatePreviewPayload({ schemaVersion: 1, components: [{ type: 'Card', children: 'bad' }] }),
    (error) => error.code === 'invalid_children',
  );
});
