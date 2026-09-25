-- Kiez-Stories (September 2026) – nur neue Tabelle, bestehende Daten bleiben unverändert
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  kiez TEXT NOT NULL,
  headline TEXT NOT NULL,
  sub TEXT DEFAULT '',
  bg TEXT DEFAULT 'blau',
  lang TEXT DEFAULT 'de',
  i18n TEXT DEFAULT '{}',
  media_key TEXT DEFAULT '',
  media_type TEXT DEFAULT '',
  poster_key TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  wa TEXT DEFAULT '',
  source TEXT DEFAULT '',
  author TEXT DEFAULT '',
  email TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  ad INTEGER DEFAULT 0,
  sponsor TEXT DEFAULT '',
  event_date TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  mod_note TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  approved_at INTEGER DEFAULT 0,
  expires_at INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_stories_live ON stories(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_email ON stories(email, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_ip ON stories(ip, created_at);
