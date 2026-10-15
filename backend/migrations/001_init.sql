-- EduResearch Database Schema for PostgreSQL (Supabase)
-- Run once: psql "$DATABASE_URL" -f backend/migrations/001_init.sql

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'editor', 'viewer')),
  unit TEXT,
  token_version INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Surveys Table
CREATE TABLE IF NOT EXISTS surveys (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  questions_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Closed')),
  scale TEXT NOT NULL,
  responses_count INTEGER DEFAULT 0,
  target INTEGER NOT NULL,
  variables TEXT NOT NULL,
  questions TEXT,
  hypotheses TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);

-- 3. Responses Table
CREATE TABLE IF NOT EXISTS responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  unit TEXT NOT NULL,
  gender TEXT NOT NULL,
  time_taken TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('valid', 'invalid')),
  answers JSONB DEFAULT '{}',
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_date ON responses(date DESC);
CREATE INDEX IF NOT EXISTS idx_responses_status ON responses(status);
CREATE INDEX IF NOT EXISTS idx_responses_answers_gin ON responses USING GIN (answers);

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  size TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  color TEXT NOT NULL,
  bg TEXT NOT NULL,
  file_path TEXT,
  original_name TEXT,
  storage_path TEXT,
  storage_bucket TEXT DEFAULT 'documents',
  mime_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date DESC);

-- 5. Password Resets Table
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token_hash);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);

-- 6. Audit Logs Table (optional, for persistent audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'INFO',
  ip TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  role TEXT,
  message TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 7. Trigger for updated_at (users, surveys)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_surveys_updated_at ON surveys;
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Seed initial admin (only if table empty)
INSERT INTO users (name, email, password, role, unit)
SELECT 'Admin Tối Cao', 'admin@eduresearch.com', $1, 'admin', 'Ban Giám Đốc'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@eduresearch.com');

-- Note: Replace $1 with bcrypt hash of ADMIN_INITIAL_PASSWORD when running migration
-- Example: INSERT ... VALUES (..., '$2b$12$...', ...)