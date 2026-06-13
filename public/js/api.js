const API_BASE = '/api';

async function fetchJobs(decision = 'new', limit = 50, offset = 0) {
  const res = await fetch(`${API_BASE}/jobs?decision=${decision}&limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.statusText}`);
  return res.json();
}

async function decideJob(jobId, decision, notes = null) {
  const res = await fetch(`${API_BASE}/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, decision, notes }),
  });
  if (!res.ok) throw new Error(`Failed to decide: ${res.statusText}`);
  return res.json();
}

async function undoDecision(jobId) {
  const res = await fetch(`${API_BASE}/decide`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId }),
  });
  if (!res.ok) throw new Error(`Failed to undo: ${res.statusText}`);
  return res.json();
}

async function getPreferences() {
  const res = await fetch(`${API_BASE}/preferences`);
  if (!res.ok) throw new Error(`Failed to fetch preferences: ${res.statusText}`);
  return res.json();
}

async function updatePreference(key, value) {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) throw new Error(`Failed to update preference: ${res.statusText}`);
  return res.json();
}

async function triggerScrape() {
  const res = await fetch(`${API_BASE}/cron/scrape`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to trigger scrape: ${res.statusText}`);
  return res.json();
}
