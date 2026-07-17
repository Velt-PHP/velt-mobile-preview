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

module.exports = {
  extractPreviewMessage,
};
