const { Given, When, Then, Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('playwright');
const parse        = require('csv-parse/sync').parse;
const fs           = require('fs');
const path         = require('path');
const WebTablesPage= require('../pages/WebTablesPage');
const UserData     = require('../models/UserData');

setDefaultTimeout(60000);
const SCREENSHOT_DIR = path.join('test-results', 'ui-test-results', 'screenShots');
const VIDEO_DIR      = path.join('test-results', 'ui-test-results', 'videos');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(VIDEO_DIR))      fs.mkdirSync(VIDEO_DIR,      { recursive: true });

Before(async function () {
  const isHeadless = process.env.HEADLESS !== 'false';
  this.browser = await chromium.launch({ headless: isHeadless });
  this.context = await this.browser.newContext({
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } }
  });

  this.page = await this.context.newPage();
  this.webTables = new WebTablesPage(this.page);
});

After(async function (scenario) {
  // close page & context to finalize video
  await this.page.close();
  await this.context.close();

  // fetch and attach video
  const videoPath = await this.page.video().path();
  if (this.attach) {
    const videoFile = fs.readFileSync(videoPath);
    this.attach(videoFile, 'video/webm');
  }

  await this.browser.close();
});

async function saveScreenshot(page, name, attach) {
  const ts   = Date.now();
  const file = path.join(SCREENSHOT_DIR, `${name}-${ts}.png`);
  await page.screenshot({ path: file, fullPage: true });
  if (attach) attach(fs.readFileSync(file), 'image/png');
}

// --- Navigation & headers ---
Given('User navigate to {string}', async function (_) {
  await this.webTables.navigate();
  await saveScreenshot(this.page, 'navigate', this.attach);
});

Then('User should see the user list table with headers:', async function (dataTable) {
  const expected = dataTable.raw().flat();
  const actual   = await this.webTables.getHeaderList();
  if (expected.length !== actual.length || expected.some((h,i) => h !== actual[i])) {
    throw new Error(`Headers mismatch\nE: ${expected}\nA: ${actual}`);
  }
  await saveScreenshot(this.page, 'headers', this.attach);
});

// --- Generic click step ---
When('User click {string}', async function (buttonText) {
  await this.webTables.clickAddUser();
  const safeText = buttonText.replace(/\W+/g, '_');
  await saveScreenshot(this.page, `click_${safeText}`, this.attach);
});

// --- Inline DataTable users ---
When('User add a user with data:', async function (dataTable) {
  for (const row of dataTable.hashes()) {
    const uniqueName = `${row.userName}_${Date.now()}`;
    const user = new UserData({
      firstName:   row.firstName,
      lastName:    row.lastName,
      username:    uniqueName,
      password:    row.password,
      company:     row.customer,
      role:        row.role,
      email:       row.email,
      mobilePhone: row.cellPhone
    });
    this.latestUser = user;
    await this.webTables.addUser(user);
    await saveScreenshot(this.page, `addUser_${uniqueName}`, this.attach);
  }
});

Then('User should see the user {string} in the user list with details:', async function (username, dataTable) {
  if (!await this.webTables.isUserPresent(username)) {
    throw new Error(`User not found: ${username}`);
  }
  await saveScreenshot(this.page, `verify_${username}`, this.attach);
});

// --- CSV-driven user ---
Given('User load user data from CSV file {string} row {int}', async function (fileName, rowIndex) {
  const csv     = fs.readFileSync(`./UI_Tests/testdata/${fileName}`, 'utf-8');
  const records = parse(csv, { columns: true });
  const row     = records[rowIndex];
  this.latestUser = new UserData({
    firstName:   row.FirstName,
    lastName:    row.LastName,
    username:    `${row.Username}_${Date.now()}`,
    password:    row.Password,
    company:     row.Company,
    role:        row.Role,
    email:       row.Email,
    mobilePhone: row.CellPhone
  });
  await saveScreenshot(this.page, `loadCSV_${rowIndex}`, this.attach);
});

When('User add the latest user', async function () {
  await this.webTables.clickAddUser();
  await this.webTables.addUser(this.latestUser);
  await saveScreenshot(this.page, `addLatest_${this.latestUser.username}`, this.attach);
});

Then('User should see the latest user in the user list', async function () {
  if (!await this.webTables.isUserPresent(this.latestUser.username)) {
    throw new Error(`Latest user not found: ${this.latestUser.username}`);
  }
  await saveScreenshot(this.page, `verifyLatest_${this.latestUser.username}`, this.attach);
});