const { normalizePreviewUrl } = require('./previewPayload');
const { validatePreviewPayload } = require('./previewProtocol');

async function fetchPreview(rawUrl, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || 8000;
  const url = normalizePreviewUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.velt.preview+json, application/json',
        'X-Velt-Preview-Version': '1',
      },
    });
    const body = await response.text();
    let payload;
    try {
      payload = body === '' ? {} : JSON.parse(body);
    } catch {
      const error = new Error('La preview répond, mais pas en JSON Velt.');
      error.code = 'invalid_json';
      throw error;
    }

    if (!response.ok) {
      const error = new Error(payload?.error?.message || `La preview a répondu HTTP ${response.status}.`);
      error.code = payload?.error?.code || 'http_error';
      error.status = response.status;
      throw error;
    }

    return { url, ...validatePreviewPayload(payload) };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchPreview };
