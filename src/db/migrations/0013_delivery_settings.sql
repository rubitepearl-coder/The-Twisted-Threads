CREATE TABLE IF NOT EXISTS delivery_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_name TEXT NOT NULL,
  delivery_fee REAL NOT NULL DEFAULT 0,
  in_stock INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER,
  updated_at INTEGER
);