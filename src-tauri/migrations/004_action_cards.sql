-- v1.1 引导层：行动卡片 + 信号模式快照

CREATE TABLE IF NOT EXISTS action_cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  card_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  draft TEXT,
  source_signals TEXT DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','done','skipped','replaced')),
  created_at TEXT NOT NULL,
  acted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS signal_patterns (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  computed_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX IF NOT EXISTS idx_action_cards_project
  ON action_cards(project_id, status);

CREATE INDEX IF NOT EXISTS idx_signal_patterns_project
  ON signal_patterns(project_id, pattern_type);