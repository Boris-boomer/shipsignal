CREATE TABLE IF NOT EXISTS data_sources (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('bilibili', 'kuaishou', 'weibo')),
    label TEXT NOT NULL,
    client_id TEXT,
    client_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at INTEGER,
    scopes TEXT NOT NULL DEFAULT '[]',
    user_openid TEXT,
    user_name TEXT,
    user_avatar TEXT,
    status TEXT NOT NULL DEFAULT 'disconnected'
        CHECK (status IN ('disconnected', 'connected', 'expired', 'error')),
    last_sync_at TEXT,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_data_sources_provider
    ON data_sources(provider);