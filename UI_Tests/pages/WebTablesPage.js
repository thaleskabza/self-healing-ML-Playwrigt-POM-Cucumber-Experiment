
// UI_Tests/pages/WebTablesPage.js
const BasePage = require('../framework/pages/BasePage');

class WebTablesPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = 'https://www.way2automation.com/angularjs-protractor/webtables/';
  }

  // --- static locators map for healing ---
  static locators = {
    addUserButton: [
      'button.btn-link.pull-right[ng-click="pop()"]', // More specific CSS
      'button:has-text("Add User")', // Text-based fallback
      'getByRole-button-Add User', // Role-based fallback
      'button[type="add"][ng-click="pop()"]' // Specific attribute combination
    ],
    firstName: [
      'input[name="FirstName"]',
      'input[placeholder="First Name"]',
      'input[ng-model="FirstName"]'
    ],
    lastName: [
      'input[name="LastName"]',
      'input[placeholder="Last Name"]',
      'input[ng-model="LastName"]'
    ],
    userName: [
      'input[name="UserName"]',
      'input[placeholder="User Name"]',
      'input[ng-model="UserName"]'
    ],
    password: [
      'input[name="Password"]',
      'input[placeholder="Password"]',
      'input[ng-model="Password"]'
    ],
    email: [
      'input[name="Email"]',
      'input[placeholder="Email"]',
      'input[ng-model="Email"]'
    ],
    mobilePhone: [
      'input[name="Mobilephone"]',
      'input[placeholder="Mobile Phone"]',
      'input[ng-model="Mobilephone"]'
    ],
    saveBtn: [
      'button:has-text("Save")',
      'button[type="submit"]',
      'getByRole-button-Save'
    ],
    headers: [
      'thead tr.smart-table-header-row th span.header-content',
      '.smart-table-header th span'
    ],
    companyRadio: [
      (company) => `input[value="${company}"]`,
      (company) => `label:has-text("${company}") input`
    ],
    roleDropdown: [
      'select[name="RoleId"]',
      'select[ng-model="RoleId"]'
    ]
  };

   // --- Navigation ---
  async navigate() {
    await this.page.goto(this.url);
    try {
      const btn = await this.$('addUserButton');
      await btn.waitFor({ state: 'visible', timeout: 10000 });
    } catch (error) {
      console.error('Failed to locate Add User button:', error);
      throw error;
    }
  }

  // --- Open the Add‑User modal, waiting for any old backdrop to clear ---
  async clickAddUser() {
    await this.page.locator('.modal-backdrop')
      .waitFor({ state: 'detached', timeout: 3000 })
      .catch(() => {});
    await (await this.$('addUserButton')).click();
    await (await this.$('firstName')).waitFor({ state: 'visible' });
  }

  // --- Fill and save the user form, then wait for modal to close ---
  async addUser(user) {
    await (await this.$('firstName')).fill(user.firstName);
    await (await this.$('lastName')).fill(user.lastName);
    await (await this.$('userName')).fill(user.username);
    await (await this.$('password')).fill(user.password);

    // Handle company radio - using dynamic locator resolution
    const companyLocator = await this.resolveDynamicLocator('companyRadio', user.company);
    await companyLocator.check();

    // Handle role dropdown
    const roleDropdown = await this.$('roleDropdown');
    await roleDropdown.selectOption({ label: user.role });

    await (await this.$('email')).fill(user.email);
    await (await this.$('mobilePhone')).fill(user.mobilePhone);

    await (await this.$('saveBtn')).click();

    // wait for modal (and backdrop) to fully go away
    await (await this.$('firstName')).waitFor({ state: 'detached' });
    await (await this.$('addUserButton')).waitFor({ state: 'visible' });
  }

  // --- Helpers ---
  async getHeaderList() {
    const headers = await this.$('headers');
    return headers.allTextContents();
  }

  async isUserPresent(username) {
    return (await this.page
      .locator(`table.smart-table td:has-text("${username}")`)
      .count()) > 0;
  }

  // Helper for dynamic locators (like company radio buttons)
  async resolveDynamicLocator(elementKey, dynamicValue) {
    const pageName = this.constructor.name;
    const candidates = this.constructor.locators[elementKey];
    
    if (!candidates) {
      throw new Error(`No candidates declared for ${pageName}.${elementKey}`);
    }

    // Resolve dynamic selectors
    const resolvedCandidates = candidates.map(template => {
      if (typeof template === 'function') {
        return template(dynamicValue);
      }
      return template;
    });

    // Use LocatorService to resolve the best option
    const selector = await LocatorService.resolveDynamic(pageName, elementKey, resolvedCandidates, this.page);
    return this.page.locator(selector);
  }
}

module.exports = WebTablesPage;