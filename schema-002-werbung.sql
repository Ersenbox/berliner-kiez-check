-- KiezCheck Erweiterung 002: Sponsoren, Abos, Gutscheine, Jobs, Werbeanfragen
-- Nur Ergänzungen – bestehende Tabellen und Daten bleiben unverändert.

ALTER TABLE listings ADD COLUMN plan TEXT NOT NULL DEFAULT 's';      -- s | m | l
ALTER TABLE listings ADD COLUMN stripe_sub TEXT;                     -- Stripe-Abo-ID
ALTER TABLE listings ADD COLUMN whatsapp TEXT;
ALTER TABLE listings ADD COLUMN coupon_code TEXT;
ALTER TABLE listings ADD COLUMN coupon_text TEXT;
ALTER TABLE listings ADD COLUMN coupon_until TEXT;                   -- YYYY-MM-DD

CREATE TABLE IF NOT EXISTS sponsors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,                       -- /assets/sponsors/x.webp oder /img/s/x.webp
  headline_de TEXT, headline_tr TEXT, headline_en TEXT,
  cta_de TEXT, cta_tr TEXT, cta_en TEXT,
  link_web TEXT, link_wa TEXT, link_tel TEXT, link_ig TEXT,
  places TEXT NOT NULL DEFAULT 'slider,native',  -- slider,native,after_submit,quiz
  kieze TEXT NOT NULL DEFAULT '',   -- leer = ganz Berlin
  cats TEXT NOT NULL DEFAULT '',    -- leer = alle Kategorien
  priority INTEGER NOT NULL DEFAULT 0,
  own INTEGER NOT NULL DEFAULT 0,   -- 1 = Eigenwerbung
  plan TEXT,                        -- intro19 | 49 | 69 | 89 | own (Notiz)
  contact TEXT,                     -- interne Notiz: Ansprechpartner
  start_at INTEGER NOT NULL DEFAULT 0,
  end_at INTEGER NOT NULL DEFAULT 0,  -- 0 = unbegrenzt
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sponsor_stats (
  sponsor_id TEXT NOT NULL,
  day TEXT NOT NULL,                -- YYYY-MM-DD
  imp INTEGER NOT NULL DEFAULT 0,
  clk INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (sponsor_id, day)
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  kiez TEXT NOT NULL,
  jobtype TEXT NOT NULL,            -- vollzeit | teilzeit | minijob | ausbildung
  salary TEXT,
  languages TEXT,
  description TEXT,
  whatsapp TEXT,
  phone TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  mod_note TEXT,
  urgent_until INTEGER NOT NULL DEFAULT 0,
  edit_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_pub ON jobs(status, kiez, expires_at);

CREATE TABLE IF NOT EXISTS ad_requests (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  person TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  size TEXT,                        -- s | m | l | banner
  message TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
