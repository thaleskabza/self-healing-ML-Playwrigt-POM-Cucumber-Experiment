// UI_Tests/framework/services/LocatorService.js
const HistoryStore  = require('./HistoryStore');
const MlScorer      = require('./MlScorer');
const VisualEmbedder = require('./VisualEmbedder');

class LocatorService {
  /**
   * @param {string} pageName — name of the PageObject class
   * @param {string} elementKey — logical name defined in locators map
   * @param {import('playwright').Page} page
   */
  static async resolve(pageName, elementKey, page) {
    // get candidate list from the PageObject’s static locators map
    const pageClass = require(`../../pages/${pageName}`);
    const candidates = pageClass.locators[elementKey];
    if (!candidates) {
      throw new Error(`No candidates declared for ${pageName}.${elementKey}`);
    }

    // 1. fetch history
    const history = HistoryStore.get(pageName, elementKey);

    // 2. ML score
    let scored = await MlScorer.score(candidates, history);

    // 3. Visual boost
    scored = await VisualEmbedder.refine(scored, page);

    // 4. choose best
    const best = scored.reduce((p, c) => (c.confidence > p.confidence ? c : p), scored[0]);

    // 5. record
    HistoryStore.record(pageName, elementKey, best.selector, best.confidence);

    // 6. fallback
    if (best.confidence < 0.5) {
      console.warn(`[Self-Heal] Low confidence (${best.confidence.toFixed(2)}) for ${pageName}.${elementKey}`);
    }

    return best.selector;
  }
}

module.exports = LocatorService;
