function extractPreviewMessage(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Welcome!';
  }

  if (typeof payload.message === 'string' && payload.message !== '') {
    return payload.message;
  }

  const queue = Array.isArray(payload.components) ? [...payload.components] : [];

  while (queue.length > 0) {
    const component = queue.shift();

    if (!component || typeof component !== 'object') {
      continue;
    }

    if (component.type === 'Text') {
      if (typeof component.content === 'string' && component.content !== '') {
        return component.content;
      }

      if (typeof component.value === 'string' && component.value !== '') {
        return component.value;
      }

      if (typeof component.text === 'string' && component.text !== '') {
        return component.text;
      }

      if (
        component.props &&
        typeof component.props.value === 'string' &&
        component.props.value !== ''
      ) {
        return component.props.value;
      }
    }

    if (Array.isArray(component.children)) {
      queue.push(...component.children);
    }
  }

  return 'Welcome!';
}

function normalizePreviewUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    throw new Error('QR preview invalide.');
  }

  let candidate = rawUrl.trim();
  const embeddedUrl = candidate.match(/https?:\/\/[^\s"'<>]+/i);

  if (embeddedUrl) {
    candidate = embeddedUrl[0];
  } else if (/^(?:[a-z0-9.-]+|\[[0-9a-f:]+\]):\d+(?:\/.*)?$/i.test(candidate)) {
    candidate = `http://${candidate}`;
  }

  let parsed;

  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('QR preview invalide. Scanne un QR genere par Velt.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('QR preview invalide. L URL doit commencer par http:// ou https://.');
  }

  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(parsed.hostname)) {
    throw new Error(
      'Ce QR pointe vers le PC local, pas vers le telephone. Lance php bin/velt serve 0.0.0.0:8000 puis php bin/velt preview IP_DU_PC:8000 avec le telephone sur le meme Wi-Fi.'
    );
  }

  return parsed.toString();
}

module.exports = {
  extractPreviewMessage,
  normalizePreviewUrl,
};
