-- RLS Policies for Jobber
-- Run this in Supabase SQL Editor AFTER the schema

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;

-- Jobs: anon can read all, service_role can write
CREATE POLICY "anon_read_jobs" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "service_write_jobs" ON jobs
  FOR ALL USING (auth.role() = 'service_role');

-- Job decisions: anon can read and write
CREATE POLICY "anon_read_decisions" ON job_decisions
  FOR SELECT USING (true);

CREATE POLICY "anon_write_decisions" ON job_decisions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_decisions" ON job_decisions
  FOR UPDATE USING (true);

CREATE POLICY "anon_delete_decisions" ON job_decisions
  FOR DELETE USING (true);

-- Preferences: anon can read and write
CREATE POLICY "anon_read_preferences" ON preferences
  FOR SELECT USING (true);

CREATE POLICY "anon_write_preferences" ON preferences
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon_update_preferences" ON preferences
  FOR UPDATE USING (true);

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
