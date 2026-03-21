/**
 * Base class for all source adapters in RetroFeed.
 * Enforces a standard lifecycle: fetch -> normalize.
 */
class BaseAdapter {
  constructor(options = {}) {
    this.name = options.name || 'unknown';
    this.type = options.type || 'base';
    this.config = options.config || {};
  }

  /**
   * Returns metadata about the source.
   */
  getMetadata() {
    return {
      name: this.name,
      type: this.type,
      config: { ...this.config }
    };
  }

  /**
   * Abstract method to fetch raw data from the source.
   * Should return an array of raw items.
   * @returns {Promise<Array>}
   */
  async fetch() {
    throw new Error('Adapter must implement fetch()');
  }

  /**
   * Abstract method to normalize a single raw item.
   * Must return a canonical item using createItem.
   * @param {Object} raw
   * @returns {Object} Canonical Item
   */
  normalize(raw) {
    if (!raw) throw new Error('raw item is required');
    throw new Error('Adapter must implement normalize()');
  }

  /**
   * Orchestrates the full polling lifecycle.
   * @returns {Promise<Array>} Array of canonical items.
   */
  async poll() {
    try {
      const rawItems = await this.fetch();
      if (!Array.isArray(rawItems)) {
        return [];
      }
      return rawItems.map(raw => {
        const normalized = this.normalize(raw);
        // Ensure we attach source metadata if not present
        return {
          ...normalized,
          sourceType: normalized.sourceType === 'unknown' ? this.type : normalized.sourceType,
          sourceName: normalized.sourceName === 'unknown' ? this.name : normalized.sourceName
        };
      });
    } catch (error) {
      console.error(`[${this.name}] Polling failed:`, error.message);
      return [];
    }
  }
}

module.exports = BaseAdapter;
