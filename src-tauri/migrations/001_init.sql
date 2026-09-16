PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    mode TEXT NOT NULL CHECK (mode IN ('validate_first', 'build_first', 'portfolio')),
    entry TEXT CHECK (entry IN ('A', 'B', 'C')),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN (
        'planning', 'building', 'launched', 'converting',
        'archived', 'frozen', 'active'
    )),
    project_type TEXT CHECK (project_type IN ('learning', 'validation', 'asset')),
    completion_criteria TEXT,
    archive_reason TEXT,
    build_hours REAL DEFAULT 0,
    distribution_hours REAL DEFAULT 0,
    mode_data TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS signals (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    data TEXT NOT NULL DEFAULT '{}',
    source TEXT,
    source_verifiability TEXT CHECK (source_verifiability IN ('high', 'medium', 'low')),
    anomaly_flags TEXT NOT NULL DEFAULT '[]',
    suggested_confidence TEXT CHECK (suggested_confidence IN ('high', 'medium', 'low')),
    developer_confidence TEXT CHECK (developer_confidence IN ('high', 'medium', 'low', 'ignored')),
    override_reason TEXT,
    decision_impact TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_project
    ON signals(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS conversions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_segment TEXT,
    monetization_form TEXT,
    amount REAL,
    currency TEXT DEFAULT 'USD',
    recurring INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversions_project
    ON conversions(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    lesson_type TEXT CHECK (lesson_type IN ('validated', 'invalidated', 'discovered')),
    description TEXT NOT NULL,
    applicable_to TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lessons_project
    ON lessons(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS decision_logs (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    signal_id TEXT REFERENCES signals(id) ON DELETE SET NULL,
    decision TEXT NOT NULL,
    basis TEXT,
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    outcome TEXT CHECK (outcome IN ('pending', 'confirmed', 'reversed')) DEFAULT 'pending',
    created_at TEXT NOT NULL,
    reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_decisions_project
    ON decision_logs(project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_interactions (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    purpose TEXT,
    prompt TEXT,
    response TEXT,
    model TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS licenses (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);