// UI_Tests/framework/pages/BasePage.js
const LocatorService = require('../services/LocatorService');//UI_Tests/framework/services/LocatorService.js

class BasePage {
  /**
   * @param {import('playwright').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Resolves a logical element via self-healing and returns a Playwright Locator
   * @param {string} elementKey
   */
  async $(elementKey) {
    // page.constructor.name must match file name (e.g. WebTablesPage)
    const pageName = this.constructor.name;
    const selector = await LocatorService.resolve(pageName, elementKey, this.page);
    return this.page.locator(selector);
  }
}

module.exports = BasePage;
