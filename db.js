const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./shop.db");

// Initialize tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      qty INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(item_id) REFERENCES items(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // seed items ONLY if empty
  db.get("SELECT COUNT(*) AS c FROM items", (err, row) => {
    if (err) {
      console.error("Seed check error:", err);
      return;
    }

    if (row.c === 0) {
      const stmt = db.prepare("INSERT INTO items(name, price) VALUES (?, ?)");
      [
        ["pdeu", 100000],
        ["awt notes", 1000],
        ["awt project", 10000],
        ["awt experiments", 10000],
      ].forEach(([n, p]) => stmt.run(n, p));
      stmt.finalize();
    }
  });
});

module.exports = db;
