const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function nextId(items) {
  return items.length ? Math.max(...items.map(item => Number(item.id))) + 1 : 1;
}

module.exports = { readDb, writeDb, nextId };
