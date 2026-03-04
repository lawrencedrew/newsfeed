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
    const idx = this.items.findIndex(i => i.timestamp <= item.timestamp);
    if (idx === -1) {
      this.items.push(item);
    } else {
      this.items.splice(idx, 0, item);
    }
    if (this.items.length > this.maxItems) {
      const removed = this.items.pop();
      this.seen.delete(removed.id);
      if (removed.id === item.id) return true; // evicted immediately, skip notify
    }
    this.listeners.forEach(fn => fn(item));
    return true;
  }

  getAll() {
    return [...this.items];
  }

  onNew(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}

module.exports = { Store };
