const { searchJobs: searchAdzuna } = require('../../lib/adzuna');
const { searchJobs: searchWerkzoeken } = require('../../lib/werkzoeken');
const { scoreJob } = require('../../lib/scorer');
const { upsertJobs, getPreferences } = require('../../lib/supabase');

module.exports = async function handler(req, res) {
  // Allow manual trigger (POST/GET) and Vercel cron (GET with cron header)
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isManual = req.method === 'POST' || req.method === 'GET';

  if (!isVercelCron && !isManual) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const preferences = await getPreferences();
    const searchTerms = preferences.search_terms || ['bezorger', 'chauffeur', 'pakketbezorger'];
    const location = preferences.location || 'hoogeveen';
    const radius = preferences.radius_km || 15;

    const allJobs = [];
    const errors = [];

    // --- Adzuna ---
    for (const term of searchTerms) {
      try {
        const adzunaJobs = await searchAdzuna({
          what: term,
          where: location,
          radius,
          maxDaysOld: 7,
          resultsPerPage: 50,
        });
        allJobs.push(...adzunaJobs);
      } catch (err) {
        errors.push({ source: 'adzuna', term, error: err.message });
      }
    }

    // --- Werkzoeken ---
    for (const term of searchTerms) {
      try {
        const wzJobs = await searchWerkzoeken({
          query: term,
          location,
        });
        allJobs.push(...wzJobs);
      } catch (err) {
        errors.push({ source: 'werkzoeken', term, error: err.message });
      }
    }

    // Deduplicate by source + source_id
    const seen = new Set();
    const uniqueJobs = [];
    for (const job of allJobs) {
      const key = `${job.source}:${job.source_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    // Score each job
    const scoredJobs = uniqueJobs.map((job) => ({
      ...job,
      score: 0, // will be set below
    }));

    for (const job of scoredJobs) {
      job.score = await scoreJob(job, preferences);
    }

    // Upsert to Supabase
    let upserted = [];
    if (scoredJobs.length > 0) {
      upserted = await upsertJobs(scoredJobs);
    }

    return res.status(200).json({
      success: true,
      scraped: allJobs.length,
      unique: uniqueJobs.length,
      stored: upserted.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Scrape error:', err);
    return res.status(500).json({ error: err.message });
  }
};
