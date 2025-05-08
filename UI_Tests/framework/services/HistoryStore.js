// UI_Tests/framework/services/HistoryStore.js
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../data/locatorHistory.json');

class HistoryStore {
  static _load() {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
      return {};
    }
  }

  static get(pageName, elementName) {
    const db = this._load();
    return (db[pageName] && db[pageName][elementName]) || [];
  }

  static record(pageName, elementName, selector, confidence) {
    const db = this._load();
    db[pageName] = db[pageName] || {};
    db[pageName][elementName] = db[pageName][elementName] || [];
    db[pageName][elementName].push({
      selector, confidence, timestamp: Date.now(),
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  }
}

module.exports = HistoryStore;
