CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  summary TEXT,
  score REAL DEFAULT 0,
  matched_keywords TEXT DEFAULT '[]',
  fetched_at TEXT NOT NULL,
  read_at TEXT,
  starred INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_feeds_fetched ON feeds(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeds_source ON feeds(source);

CREATE TABLE IF NOT EXISTS feed_keywords (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, keyword)
);