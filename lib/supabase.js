const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

async function upsertJobs(jobs) {
  const { data, error } = await supabase
    .from('jobs')
    .upsert(jobs, { onConflict: 'source,source_id' })
    .select();

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);
  return data;
}

async function getJobs({ decision, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('jobs')
    .select('*, job_decisions(decision, decided_at, notes)')
    .eq('is_active', true)
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (decision === 'new') {
    query = query.is('job_decisions.id', null);
  } else if (decision === 'saved') {
    query = query.eq('job_decisions.decision', 'saved');
  } else if (decision === 'dismissed') {
    query = query.eq('job_decisions.decision', 'dismissed');
  }

  const { data, error } = await query;
  if (error) throw new Error(`Supabase query error: ${error.message}`);
  return data;
}

async function getJobById(id) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*, job_decisions(*)')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Supabase query error: ${error.message}`);
  return data;
}

async function decideJob(jobId, decision, notes = null) {
  const { data, error } = await supabase
    .from('job_decisions')
    .upsert(
      { job_id: jobId, decision, notes },
      { onConflict: 'job_id' }
    )
    .select();

  if (error) throw new Error(`Supabase decide error: ${error.message}`);
  return data;
}

async function undoDecision(jobId) {
  const { error } = await supabase
    .from('job_decisions')
    .delete()
    .eq('job_id', jobId);

  if (error) throw new Error(`Supabase undo error: ${error.message}`);
}

async function getPreferences() {
  const { data, error } = await supabase
    .from('preferences')
    .select('key, value');

  if (error) throw new Error(`Supabase preferences error: ${error.message}`);
  const prefs = {};
  for (const row of data) {
    prefs[row.key] = row.value;
  }
  return prefs;
}

async function updatePreference(key, value) {
  const { data, error } = await supabase
    .from('preferences')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select();

  if (error) throw new Error(`Supabase update pref error: ${error.message}`);
  return data;
}

async function getStats() {
  const [total, saved, dismissed] = await Promise.all([
    supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('job_decisions').select('id', { count: 'exact', head: true }).eq('decision', 'saved'),
    supabase.from('job_decisions').select('id', { count: 'exact', head: true }).eq('decision', 'dismissed'),
  ]);

  return {
    total: total.count || 0,
    saved: saved.count || 0,
    dismissed: dismissed.count || 0,
    new: (total.count || 0) - (saved.count || 0) - (dismissed.count || 0),
  };
}

module.exports = {
  supabase,
  upsertJobs,
  getJobs,
  getJobById,
  decideJob,
  undoDecision,
  getPreferences,
  updatePreference,
  getStats,
};
