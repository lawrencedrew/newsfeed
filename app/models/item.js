/**
 * Normalizes a value into a Date object.
 * Returns null if the value is invalid or missing.
 */
function normalizeDate(val) {
  if (val === null || val === undefined) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Creates a canonical normalized item for the RetroFeed system.
 * @param {Object} data - Raw data to be normalized.
 * @returns {Object} A frozen canonical item object.
 */
function createItem(data = {}) {
  const ingestedAt = normalizeDate(data.ingestedAt) || new Date();
  const publishedAt = normalizeDate(data.publishedAt) || ingestedAt;

  const item = {
    id: String(data.id || ''),
    sourceType: String(data.sourceType || 'unknown'),
    sourceName: String(data.sourceName || 'unknown'),
    title: String(data.title || ''),
    body: String(data.body || ''),
    url: String(data.url || ''),
    publishedAt,
    ingestedAt,
    symbols: Array.isArray(data.symbols) ? data.symbols : [],
    entities: Array.isArray(data.entities) ? data.entities : [],
    topics: Array.isArray(data.topics) ? data.topics : [],
    priority: typeof data.priority === 'number' ? data.priority : 0,
    sentiment: typeof data.sentiment === 'number' ? data.sentiment : 0,
    duplicateGroup: data.duplicateGroup ? String(data.duplicateGroup) : null,
    alerts: Array.isArray(data.alerts) ? data.alerts : [],
    raw: data.raw && typeof data.raw === 'object' ? data.raw : {}
  };

  return Object.freeze(item);
}

module.exports = {
  createItem
};
