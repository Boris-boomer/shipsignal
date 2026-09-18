CREATE TABLE IF NOT EXISTS cold_start_attempts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  track TEXT,
  pain TEXT,
  action TEXT,
  draft TEXT,
  mood TEXT CHECK (mood IN ('confident','ok','unsure','retry') OR mood IS NULL),
  published INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_cold_start_project
  ON cold_start_attempts(project_id, created_at);