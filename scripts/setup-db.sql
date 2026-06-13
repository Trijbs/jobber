-- Jobber Database Schema for Supabase
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  source_id TEXT,
  source_url TEXT,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  description TEXT,
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_per TEXT DEFAULT 'hour',
  hours_per_week DECIMAL(5,2),
  contract_type TEXT,
  remote_option TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  flexibility_notes TEXT,
  score INTEGER DEFAULT 0,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS job_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('saved', 'dismissed', 'applied')),
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped ON jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_job ON job_decisions(job_id);
CREATE INDEX IF NOT EXISTS idx_decisions_type ON job_decisions(decision);

-- Insert default preferences
INSERT INTO preferences (key, value) VALUES
  ('search_terms', '["bezorger", "chauffeur", "pakketbezorger", "postbezorger", "magazijn", "logistiek"]'::jsonb),
  ('location', '"hoogeveen"'::jsonb),
  ('radius_km', '15'::jsonb),
  ('min_hourly_rate', '6.00'::jsonb),
  ('remote_preference', '["remote", "hybrid"]'::jsonb),
  ('exclude_keywords', '["fulltime", "40 uur"]'::jsonb),
  ('availability', '{"weekdays_after": "15:00", "weekends": true, "evenings": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
