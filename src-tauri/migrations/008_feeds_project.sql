ALTER TABLE feeds ADD COLUMN project_id TEXT;

CREATE INDEX IF NOT EXISTS idx_feeds_project
  ON feeds(project_id, score DESC, fetched_at DESC);