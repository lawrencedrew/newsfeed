const { createItem } = require('../models/item');

/**
 * ScoringEngine v1
 * Calculates a deterministic priority score for canonical items.
 */
class ScoringEngine {
  constructor(config = {}) {
    this.config = {
      sourceWeights: config.sourceWeights || {},
      watchwords: config.watchwords || {}, // { word: weight }
      recencyWeight: config.recencyWeight || 1, // Points per hour of freshness
      maxAgeHours: config.maxAgeHours || 24,
      ...config
    };
  }

  /**
   * Scores an item and returns a new canonical item with updated priority.
   * @param {Object} item - Canonical item
   * @param {Date} now - Reference time for recency calculation
   * @returns {Object} Updated canonical item
   */
  score(item, now = new Date()) {
    let score = 0;

    // 1. Source Weight
    const typeWeight = this.config.sourceWeights[item.sourceType] || 0;
    const nameWeight = this.config.sourceWeights[item.sourceName] || 0;
    score += typeWeight + nameWeight;

    // 2. Keyword/Watchlist Match
    const content = `${item.title} ${item.body}`.toLowerCase();
    for (const [word, weight] of Object.entries(this.config.watchwords)) {
      if (content.includes(word.toLowerCase())) {
        score += weight;
      }
    }

    // 3. Recency Influence
    // Freshness = max(0, maxAgeHours - ageInHours) * recencyWeight
    const ageMs = Math.max(0, now - item.publishedAt);
    const ageHours = ageMs / (1000 * 60 * 60);
    const freshnessBonus = Math.max(0, this.config.maxAgeHours - ageHours) * this.config.recencyWeight;
    score += Math.floor(freshnessBonus);

    // 4. Preserve and increment existing priority
    const finalPriority = (item.priority || 0) + score;

    // Return new item (createItem freezes it)
    return createItem({
      ...item,
      priority: Math.max(0, Math.floor(finalPriority)),
      // Ensure we pass the raw payload back
      raw: item.raw
    });
  }
}

module.exports = { ScoringEngine };
