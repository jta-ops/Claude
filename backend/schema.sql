-- SchoolBlock database schema v2
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

-- ── core blocklist ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS domains (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  url          TEXT NOT NULL,
  domain       TEXT NOT NULL UNIQUE,
  category     TEXT NOT NULL CHECK(category IN ('GAMES','PORTAL','PROXY','DISGUISE','CHEATING','SOCIAL','AI','STREAMING','OTHER')),
  status       TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','removed','pending')),
  added_month  TEXT NOT NULL,
  notes        TEXT,
  ai_score     INTEGER,
  keyword_hits INTEGER DEFAULT 0,
  source       TEXT DEFAULT 'detection' CHECK(source IN ('detection','partner-school','user-report','manual','auto-detection')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  url               TEXT NOT NULL,
  domain            TEXT NOT NULL,
  submitted_at      TEXT NOT NULL DEFAULT (datetime('now')),
  status            TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','fasttrack','approved','rejected')),
  submitter_email   TEXT,
  school_id         INTEGER REFERENCES schools(id),
  fetch_status_code INTEGER,
  keyword_matches   TEXT,
  ai_score          INTEGER,
  ai_reasoning      TEXT,
  reviewed_by       INTEGER REFERENCES admins(id),
  reviewed_at       TEXT,
  UNIQUE(domain)
);

CREATE TABLE IF NOT EXISTS keywords (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  word       TEXT NOT NULL UNIQUE,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS archives (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  month         TEXT NOT NULL UNIQUE,
  snapshot_json TEXT NOT NULL,
  published_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_sessions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  token        TEXT NOT NULL UNIQUE,
  school_id    INTEGER REFERENCES schools(id),
  list_size    TEXT NOT NULL DEFAULT 'top100',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  results_json TEXT
);

-- ── owner / super-admin ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admins (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  username       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'owner' CHECK(role IN ('owner')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_login     TEXT
);

-- ── schools ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schools (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  country       TEXT,
  region        TEXT,
  student_count INTEGER,
  contact_name  TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
  approved_by   INTEGER REFERENCES admins(id),
  approved_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS school_signups (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  school_name   TEXT NOT NULL,
  country       TEXT,
  region        TEXT,
  student_count INTEGER,
  contact_name  TEXT NOT NULL,
  contact_email TEXT NOT NULL UNIQUE,
  contact_phone TEXT,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  reviewed_by   INTEGER REFERENCES admins(id),
  reviewed_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS school_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id     INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  last_login    TEXT
);

CREATE TABLE IF NOT EXISTS detection_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  domain     TEXT NOT NULL,
  alive      INTEGER NOT NULL DEFAULT 0,
  ai_score   INTEGER,
  keywords   TEXT,
  outcome    TEXT,
  ran_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── settings ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ── seeds ─────────────────────────────────────────────────────

INSERT OR IGNORE INTO settings VALUES ('ai_threshold', '70');
INSERT OR IGNORE INTO settings VALUES ('site_name', 'SchoolBlock');
INSERT OR IGNORE INTO settings VALUES ('detection_enabled', '1');
INSERT OR IGNORE INTO settings VALUES ('detection_interval_hours', '2');

INSERT OR IGNORE INTO keywords(word) VALUES
  ('unblocked'),('game'),('games'),('play'),('arcade'),
  ('roblox'),('minecraft'),('fortnite'),('slope'),('agar'),
  ('proxy'),('bypass'),('vpn'),('mirror'),('tunnel'),
  ('cheat'),('chegg'),('hack'),('answer'),('homework-help'),
  ('level'),('score'),('high-score'),('leaderboard'),
  ('free fire'),('among us'),('subway surfers'),('drift hunters'),
  ('polytrack'),('1v1'),('krunker'),('cookie clicker');

INSERT OR IGNORE INTO admins(username, password_hash, role) VALUES
  ('owner', '$2a$12$PLACEHOLDER_CHANGE_ON_FIRST_RUN_xxxxxxxxxxxxxxxxxxxx', 'owner');

-- ── indexes ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_domains_category    ON domains(category);
CREATE INDEX IF NOT EXISTS idx_domains_status      ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_added       ON domains(added_month);
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_school_users_school ON school_users(school_id);
CREATE INDEX IF NOT EXISTS idx_school_users_email  ON school_users(email);
CREATE INDEX IF NOT EXISTS idx_signups_status      ON school_signups(status);
CREATE INDEX IF NOT EXISTS idx_detection_log_ran   ON detection_log(ran_at);
