/**
 * AlertsEngine v1
 * Evaluates scored canonical items against deterministic rules.
 */
class AlertsEngine {
  constructor(rules = []) {
    this.rules = rules;
  }

  /**
   * Evaluates an item against all rules.
   * Returns an array of rule IDs that matched.
   * @param {Object} item - Scored canonical item
   * @returns {Array<string>} List of matched rule IDs
   */
  evaluate(item) {
    const matches = [];
    for (const rule of this.rules) {
      if (this.checkRule(rule, item)) {
        matches.push(rule.id || 'unnamed-rule');
      }
    }
    return matches;
  }

  /**
   * Checks if an item satisfies a single rule's criteria.
   * All provided criteria in a rule must be met (AND logic).
   */
  checkRule(rule, item) {
    // 1. Priority threshold
    if (rule.minPriority !== undefined && item.priority < rule.minPriority) {
      return false;
    }

    // 2. Keyword match (at least one keyword in the list must match)
    if (rule.keywords && Array.isArray(rule.keywords) && rule.keywords.length > 0) {
      const content = `${item.title} ${item.body}`.toLowerCase();
      const hasKeyword = rule.keywords.some(kw => content.includes(kw.toLowerCase()));
      if (!hasKeyword) return false;
    }

    // 3. Source Type match
    if (rule.sourceTypes && Array.isArray(rule.sourceTypes) && rule.sourceTypes.length > 0) {
      if (!rule.sourceTypes.includes(item.sourceType)) return false;
    }

    // 4. Source Name match
    if (rule.sourceNames && Array.isArray(rule.sourceNames) && rule.sourceNames.length > 0) {
      if (!rule.sourceNames.includes(item.sourceName)) return false;
    }

    // If no criteria were specified, we don't trigger by default
    const hasCriteria = rule.minPriority !== undefined || 
                        (rule.keywords && rule.keywords.length > 0) ||
                        (rule.sourceTypes && rule.sourceTypes.length > 0) ||
                        (rule.sourceNames && rule.sourceNames.length > 0);

    return hasCriteria;
  }
}

module.exports = { AlertsEngine };
