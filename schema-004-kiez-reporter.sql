-- Kiez-Reporter: Beiträge von Nutzern (September 2026)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kiez TEXT,
  video_url TEXT DEFAULT '',
  photos TEXT DEFAULT '[]',
  author TEXT DEFAULT '',
  email TEXT,
  status TEXT DEFAULT 'pending',
  mod_note TEXT DEFAULT '',
  created_at INTEGER,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
