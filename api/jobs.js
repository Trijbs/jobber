const { getJobs, getStats } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { decision = 'new', limit = 50, offset = 0 } = req.query;

    const [jobs, stats] = await Promise.all([
      getJobs({ decision, limit: Number(limit), offset: Number(offset) }),
      getStats(),
    ]);

    return res.status(200).json({ jobs, stats });
  } catch (err) {
    console.error('GET /api/jobs error:', err);
    return res.status(500).json({ error: err.message });
  }
};
