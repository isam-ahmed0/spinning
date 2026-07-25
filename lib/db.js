const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  constructor() {
    this.data = {};
    this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      if (fs.existsSync(DB_FILE)) {
        this.data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      }
    } catch {
      this.data = {};
    }
  }

  _save() {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('[db] Save error:', e.message);
    }
  }

  get(key, defaultVal = undefined) {
    const keys = key.split('.');
    let current = this.data;
    for (const k of keys) {
      if (current == null || typeof current !== 'object') return defaultVal;
      current = current[k];
    }
    return current !== undefined ? current : defaultVal;
  }

  set(key, value) {
    const keys = key.split('.');
    let current = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] == null || typeof current[keys[i]] !== 'object') {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    this._save();
    return value;
  }

  add(key, amount) {
    const current = this.get(key, 0);
    const newVal = (typeof current === 'number' ? current : 0) + amount;
    this.set(key, newVal);
    return newVal;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  delete(key) {
    const keys = key.split('.');
    let current = this.data;
    for (let i = 0; i < keys.length - 1; i++) {
      if (current[keys[i]] == null) return false;
      current = current[keys[i]];
    }
    const deleted = current[keys[keys.length - 1]] !== undefined;
    delete current[keys[keys.length - 1]];
    this._save();
    return deleted;
  }

  all() {
    return this.data;
  }

  clear() {
    this.data = {};
    this._save();
  }
}

class Table {
  constructor(db, name) {
    this.db = db;
    this.name = name;
    if (!this.db.has(this.name)) {
      this.db.set(this.name, []);
    }
  }

  _getRows() {
    return this.db.get(this.name, []);
  }

  _setRows(rows) {
    this.db.set(this.name, rows);
  }

  insert(row) {
    const rows = this._getRows();
    row._id = this._generateId();
    rows.push(row);
    this._setRows(rows);
    return row;
  }

  find(query = {}) {
    return this._getRows().filter(row => this._matches(row, query));
  }

  findOne(query = {}) {
    return this._getRows().find(row => this._matches(row, query)) || null;
  }

  update(query, updates) {
    const rows = this._getRows();
    let count = 0;
    for (const row of rows) {
      if (this._matches(row, query)) {
        Object.assign(row, updates);
        count++;
      }
    }
    this._setRows(rows);
    return count;
  }

  upsert(query, updates) {
    const existing = this.findOne(query);
    if (existing) {
      Object.assign(existing, updates);
      this._setRows(this._getRows());
      return existing;
    }
    return this.insert({ ...query, ...updates });
  }

  delete(query) {
    const rows = this._getRows();
    const filtered = rows.filter(row => !this._matches(row, query));
    const count = rows.length - filtered.length;
    this._setRows(filtered);
    return count;
  }

  count(query = {}) {
    if (Object.keys(query).length === 0) return this._getRows().length;
    return this.find(query).length;
  }

  _matches(row, query) {
    for (const [key, value] of Object.entries(query)) {
      if (row[key] !== value) return false;
    }
    return true;
  }

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }
}

module.exports = { Database, Table };
