// UI_Tests/framework/services/MlScorer.js
const stringSimilarity = require('string-similarity');

class MlScorer {
  /**
   * @param {string[]} candidates — CSS/XPath strings
   * @param {{selector:string,confidence:number}[]} history
   * @returns {Promise<{selector:string,confidence:number}[]>}
   */
  static async score(candidates, history) {
    const lastSelector = history.slice(-1)[0]?.selector || '';
    return candidates.map((sel, idx) => {
      // feature 1: string similarity vs last known good
      const sim = stringSimilarity.compareTwoStrings(sel, lastSelector);
      // feature 2: position bias (earlier candidates get slight bump)
      const posScore = 1 / (1 + idx);
      // combine
      const confidence = Math.min(1, 0.6 * sim + 0.4 * posScore);
      return { selector: sel, confidence };
    });
  }
}

module.exports = MlScorer;
