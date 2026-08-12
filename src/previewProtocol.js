const SUPPORTED_SCHEMA_VERSIONS = [1];
const SUPPORTED_COMPONENTS = new Set([
  'Alert', 'Button', 'Card', 'Column', 'Divider', 'Image', 'Input', 'Link', 'Row',
  'ScrollView', 'Stack', 'Text', 'Toggle', 'View',
]);

class PreviewProtocolError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'PreviewProtocolError';
    this.code = code;
    this.details = details;
  }
}

function validatePreviewPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new PreviewProtocolError('invalid_payload', 'La réponse n’est pas un payload Velt valide.');
  }

  if (!SUPPORTED_SCHEMA_VERSIONS.includes(payload.schemaVersion)) {
    throw new PreviewProtocolError(
      'unsupported_schema',
      `Version de protocole non supportée: ${String(payload.schemaVersion)}.`,
      { supported: SUPPORTED_SCHEMA_VERSIONS },
    );
  }

  if (!Array.isArray(payload.components)) {
    throw new PreviewProtocolError('invalid_components', 'Le payload Velt doit contenir une liste components.');
  }

  const unsupported = [];
  walkComponents(payload.components, (component) => {
    if (typeof component.type !== 'string' || component.type === '') {
      throw new PreviewProtocolError('invalid_component', 'Chaque composant Velt doit déclarer un type.');
    }
    if (!SUPPORTED_COMPONENTS.has(component.type)) {
      unsupported.push(component.type);
    }
  });

  return {
    payload,
    capabilities: {
      schemaVersion: payload.schemaVersion,
      supportedComponents: [...SUPPORTED_COMPONENTS],
      unsupportedComponents: [...new Set(unsupported)],
    },
  };
}

function walkComponents(components, visit) {
  for (const component of components) {
    if (!component || typeof component !== 'object' || Array.isArray(component)) {
      throw new PreviewProtocolError('invalid_component', 'Un composant Velt est mal formé.');
    }
    visit(component);
    if (component.children !== undefined && !Array.isArray(component.children)) {
      throw new PreviewProtocolError('invalid_children', 'La propriété children doit être une liste.');
    }
    if (Array.isArray(component.children)) {
      walkComponents(component.children, visit);
    }
  }
}

module.exports = {
  PreviewProtocolError,
  SUPPORTED_SCHEMA_VERSIONS,
  validatePreviewPayload,
};
