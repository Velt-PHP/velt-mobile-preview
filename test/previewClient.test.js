const test = require('node:test');
const assert = require('node:assert/strict');
const { fetchPreview } = require('../src/previewClient');

test('fetches and validates a Velt preview response', async () => {
  const result = await fetchPreview('192.168.1.20:8000/api/preview/demo', {
    fetchImpl: async (url, options) => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ schemaVersion: 1, screen: 'Demo', components: [] }),
    }),
  });
  assert.equal(result.url, 'http://192.168.1.20:8000/api/preview/demo');
  assert.equal(result.payload.screen, 'Demo');
});

test('surfaces structured server errors', async () => {
  await assert.rejects(
    () => fetchPreview('http://192.168.1.20:8000/api/preview/missing', {
      fetchImpl: async () => ({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ error: { code: 'missing', message: 'Session missing' } }),
      }),
    }),
    (error) => error.code === 'missing' && error.status === 404,
  );
});
