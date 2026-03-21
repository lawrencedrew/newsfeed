const { createItem } = require('../models/item');

/**
 * In-memory storage for canonical items.
 * Enforces deduplication, ordering, and capacity limits.
 */
class Store {
  constructor(maxItems = 500) {
    this.maxItems = maxItems;
    this.items = [];
    this.seen = new Set();
    this.listeners = [];
    this.scorer = null;
    this.alertsEngine = null;
  }

  /**
   * Optional scoring engine injection.
   */
  setScorer(engine) {
    this.scorer = engine;
  }

  /**
   * Optional alerts engine injection.
   */
  setAlertsEngine(engine) {
    this.alertsEngine = engine;
  }

  /**
   * Adds a single item to the store.
   * Returns true if the item was added, false if it was a duplicate.
   */
  add(item) {
    if (!item.id || this.seen.has(item.id)) return false;

    // Apply scoring if engine is present
    let finalItem = this.scorer ? this.scorer.score(item) : item;

    // Apply alerts if engine is present
    if (this.alertsEngine) {
      const matches = this.alertsEngine.evaluate(finalItem);
      if (matches.length > 0) {
        // Create new item with alerts attached
        finalItem = createItem({ ...finalItem, alerts: matches, raw: finalItem.raw });
      }
    }

    this.seen.add(finalItem.id);

    // Insert in reverse-chronological order (newest first)
    const idx = this.items.findIndex(i => i.publishedAt <= finalItem.publishedAt);
    if (idx === -1) {
      this.items.push(finalItem);
    } else {
      this.items.splice(idx, 0, finalItem);
    }

    // Enforce capacity
    if (this.items.length > this.maxItems) {
      const removed = this.items.pop();
      this.seen.delete(removed.id);
    }

    this.notify(finalItem);
    return true;
  }

  /**
   * Batch adds multiple items.
   */
  addMany(items) {
    if (!Array.isArray(items)) return 0;
    let addedCount = 0;
    items.forEach(item => {
      if (this.add(item)) addedCount++;
    });
    return addedCount;
  }

  /**
   * Returns all items.
   */
  getAll() {
    return [...this.items];
  }

  /**
   * Returns all items ranked by priority then by publishedAt.
   */
  getRanked() {
    return [...this.items].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.publishedAt - a.publishedAt;
    });
  }

  /**
   * Filters items by source type (e.g., 'rss', 'hn').
   */
  filterBySourceType(type) {
    return this.items.filter(item => item.sourceType === type);
  }

  /**
   * Filters items by source name (e.g., 'BBC News').
   */
  filterBySourceName(name) {
    return this.items.filter(item => item.sourceName === name);
  }

  /**
   * Subscribe to new items.
   */
  onNew(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  notify(item) {
    this.listeners.forEach(fn => {
      try { fn(item); } catch (e) { /* silent fail */ }
    });
  }
}

module.exports = { Store };
