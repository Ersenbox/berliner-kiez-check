-- Berliner Kiez-Check D1 Schema
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kiez TEXT NOT NULL,
  category TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL,
  lng REAL,
  desc_de TEXT,
  desc_tr TEXT,
  desc_en TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  hours TEXT,
  email TEXT NOT NULL,
  photo_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  mod_note TEXT,                            -- KI-Prüfnotiz für Admin
  featured_until INTEGER NOT NULL DEFAULT 0,-- ms timestamp, bezahlte Hervorhebung
  edit_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_pub ON listings(status, kiez, category);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,          -- Stripe Checkout Session ID
  listing_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,      -- Cent
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate (
  ip TEXT NOT NULL,             -- gehashte IP (DSGVO)
  ts INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate ON rate(ip, ts);
