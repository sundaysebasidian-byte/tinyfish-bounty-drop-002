PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS pages (id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL, monitor_id TEXT UNIQUE, schedule TEXT NOT NULL, created_at TEXT NOT NULL, expires_at TEXT, public INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'creating', ip_hash TEXT, verified_at TEXT, fast_until TEXT);
CREATE TABLE IF NOT EXISTS checks (run_id TEXT PRIMARY KEY, page_id TEXT NOT NULL REFERENCES pages(id), captured_at TEXT NOT NULL, changed INTEGER NOT NULL, source TEXT NOT NULL, error TEXT, noise_only INTEGER NOT NULL DEFAULT 0, noise_count INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS snapshots (id TEXT PRIMARY KEY, page_id TEXT NOT NULL REFERENCES pages(id), run_id TEXT UNIQUE NOT NULL, captured_at TEXT NOT NULL, final_url TEXT NOT NULL, title TEXT NOT NULL, raw_text TEXT NOT NULL, text TEXT NOT NULL, text_sha TEXT NOT NULL, shot_sha TEXT, chain_shot_sha TEXT, link TEXT NOT NULL, shot_status TEXT NOT NULL, shot_at TEXT, late INTEGER NOT NULL DEFAULT 0, noise_count INTEGER NOT NULL DEFAULT 0, shot_truncated INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS snapshots_page ON snapshots(page_id,captured_at);
CREATE INDEX IF NOT EXISTS checks_page ON checks(page_id,captured_at);
CREATE TABLE IF NOT EXISTS costs (id TEXT PRIMARY KEY, at TEXT NOT NULL, primitive TEXT NOT NULL, estimate REAL NOT NULL, detail TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL, message TEXT NOT NULL);
