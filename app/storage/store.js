const Database = require('better-sqlite3');
const { createItem } = require('../models/item');

/**
 * Persistent storage for canonical items using SQLite.
 * Satisfies the Store contract with transactional durability.
 */
class Store {
  constructor(maxItems = 500, options = {}) {
    this.maxItems = maxItems;
    this.dbPath = options.dbPath || ':memory:';
    this.db = new Database(this.dbPath);
    this.listeners = [];
    this.scorer = null;
    this.alertsEngine = null;

    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feed_items (
        id TEXT PRIMARY KEY,
        sourceType TEXT,
        sourceName TEXT,
        title TEXT,
        body TEXT,
        url TEXT,
        publishedAt TEXT,
        ingestedAt TEXT,
        priority INTEGER,
        alerts TEXT,
        symbols TEXT,
        topics TEXT,
        raw TEXT
      )
    `);
  }

  setScorer(engine) {
    this.scorer = engine;
  }

  setAlertsEngine(engine) {
    this.alertsEngine = engine;
  }

  /**
   * Adds a single item to the store.
   * Returns true if newly committed, false if duplicate or failed.
   */
  add(item) {
    if (!item.id) return false;

    // Always normalize to ensure canonical defaults (ingestedAt, etc)
    let finalItem = createItem(item);

    // Apply scoring/alerts if present
    finalItem = this.scorer ? this.scorer.score(finalItem) : finalItem;
    if (this.alertsEngine) {
      const matches = this.alertsEngine.evaluate(finalItem);
      if (matches.length > 0) {
        finalItem = createItem({ ...finalItem, alerts: matches, raw: finalItem.raw });
      }
    }

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO feed_items (
        id, sourceType, sourceName, title, body, url, 
        publishedAt, ingestedAt, priority, alerts, symbols, topics, raw
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      finalItem.id,
      finalItem.sourceType,
      finalItem.sourceName,
      finalItem.title,
      finalItem.body,
      finalItem.url,
      finalItem.publishedAt.toISOString(),
      finalItem.ingestedAt.toISOString(),
      finalItem.priority,
      JSON.stringify(finalItem.alerts),
      JSON.stringify(finalItem.symbols),
      JSON.stringify(finalItem.topics),
      JSON.stringify(finalItem.raw)
    );

    if (result.changes > 0) {
      // Basic eviction to satisfy existing contract
      const count = this.db.prepare('SELECT COUNT(*) as count FROM feed_items').get().count;
      if (count > this.maxItems) {
        const oldest = this.db.prepare('SELECT id FROM feed_items ORDER BY publishedAt ASC, id ASC LIMIT 1').get();
        this.db.prepare('DELETE FROM feed_items WHERE id = ?').run(oldest.id);
      }

      this.notify(finalItem);
      return true;
    }

    return false;
  }

  /**
   * Returns all items in reverse-chronological order.
   */
  getAll() {
    const rows = this.db.prepare('SELECT * FROM feed_items ORDER BY publishedAt DESC, id DESC').all();
    return rows.map(row => this.rowToItem(row));
  }

  /**
   * Returns all items ranked by priority.
   */
  getRanked() {
    const rows = this.db.prepare('SELECT * FROM feed_items ORDER BY priority DESC, publishedAt DESC, id DESC').all();
    return rows.map(row => this.rowToItem(row));
  }

  /**
   * Placeholder for future milestones
   */
  addMany(items) {
    let count = 0;
    for (const item of items) {
      if (this.add(item)) count++;
    }
    return count;
  }

  filterBySourceType(type) {
    const rows = this.db.prepare('SELECT * FROM feed_items WHERE sourceType = ? ORDER BY publishedAt DESC, id DESC').all(type);
    return rows.map(row => this.rowToItem(row));
  }

  filterBySourceName(name) {
    const rows = this.db.prepare('SELECT * FROM feed_items WHERE sourceName = ? ORDER BY publishedAt DESC, id DESC').all(name);
    return rows.map(row => this.rowToItem(row));
  }

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

  rowToItem(row) {
    return createItem({
      ...row,
      publishedAt: new Date(row.publishedAt),
      ingestedAt: new Date(row.ingestedAt),
      alerts: JSON.parse(row.alerts),
      symbols: JSON.parse(row.symbols),
      topics: JSON.parse(row.topics),
      raw: JSON.parse(row.raw)
    });
  }
}

module.exports = { Store };
