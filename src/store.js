class Store {
  constructor(maxItems) {
    this.maxItems = maxItems;
    this.items = [];
    this.seen = new Set();
    this.listeners = [];
  }

  add(item) {
    if (this.seen.has(item.id)) return false;
    this.seen.add(item.id);
    // Insert in reverse-chronological order
    const idx = this.items.findIndex(i => i.timestamp <= item.timestamp);
    if (idx === -1) {
      this.items.push(item);
    } else {
      this.items.splice(idx, 0, item);
    }
    if (this.items.length > this.maxItems) {
      const removed = this.items.pop();
      this.seen.delete(removed.id);
    }
    this.listeners.forEach(fn => fn(item));
    return true;
  }

  getAll() {
    return [...this.items];
  }

  onNew(fn) {
    this.listeners.push(fn);
  }
}

module.exports = { Store };
