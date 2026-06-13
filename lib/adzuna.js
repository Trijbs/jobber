const APP_ID = process.env.ADZUNA_APP_ID;
const API_KEY = process.env.ADZUNA_API_KEY;
const BASE_URL = 'https://api.adzuna.com/v1/api/jobs/nl';

async function searchJobs({ what, where = 'hoogeveen', radius = 15, maxDaysOld = 7, page = 1, resultsPerPage = 50 }) {
  if (!APP_ID || !API_KEY) {
    throw new Error('Missing ADZUNA_APP_ID or ADZUNA_API_KEY');
  }

  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: API_KEY,
    what,
    where,
    radius: String(radius),
    max_days_old: String(maxDaysOld),
    results_per_page: String(resultsPerPage),
    sort_by: 'date',
    lang: 'nl',
  });

  const url = `${BASE_URL}/search/${page}?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Adzuna API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return (data.results || []).map(normalizeJob);
}

function normalizeJob(raw) {
  const salary = raw.salary || {};
  return {
    source: 'adzuna',
    source_id: String(raw.id),
    source_url: raw.redirect_url || `https://www.adzuna.nl/details/${raw.id}`,
    title: raw.title || 'Untitled',
    company: raw.company?.display_name || null,
    location: raw.location?.display_name || null,
    description: raw.description || null,
    salary_min: salary.min != null ? Number(salary.min) : null,
    salary_max: salary.max != null ? Number(salary.max) : null,
    salary_per: salary.per || 'hour',
    hours_per_week: extractHours(raw.description),
    contract_type: raw.contract_type || null,
    remote_option: detectRemote(raw.description, raw.title),
    category: raw.category?.label || null,
    tags: extractTags(raw),
    requirements: [],
    flexibility_notes: null,
    scraped_at: new Date().toISOString(),
  };
}

function extractHours(text) {
  if (!text) return null;
  const match = text.match(/(\d+)[\s-]*(\d+)?\s*(uur|hours|u)\s*(per\s*week|p\/w|pw)/i);
  if (match) {
    const min = parseInt(match[1]);
    const max = match[2] ? parseInt(match[2]) : min;
    return (min + max) / 2;
  }
  const single = text.match(/(\d+)\s*(uur|hours)\s*(per\s*week|p\/w)/i);
  if (single) return parseInt(single[1]);
  return null;
}

function detectRemote(description, title) {
  const text = `${description || ''} ${title || ''}`.toLowerCase();
  if (text.includes('remote') || text.includes('thuiswerk') || text.includes('vanuit huis')) return 'remote';
  if (text.includes('hybride') || text.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

function extractTags(raw) {
  const tags = [];
  if (raw.category?.label) tags.push(raw.category.label.toLowerCase());
  if (raw.contract_type) tags.push(raw.contract_type.toLowerCase());
  const text = `${raw.title || ''} ${raw.description || ''}`.toLowerCase();
  const keywords = ['bezorger', 'chauffeur', 'pakket', 'post', 'magazijn', 'logistiek', 'schoonmaak', 'horeca', 'retail'];
  for (const kw of keywords) {
    if (text.includes(kw)) tags.push(kw);
  }
  return [...new Set(tags)];
}

module.exports = { searchJobs, normalizeJob };
