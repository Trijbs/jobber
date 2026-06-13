const { decideJob, undoDecision } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { job_id, decision, notes } = req.body;

      if (!job_id || !decision) {
        return res.status(400).json({ error: 'job_id and decision required' });
      }

      if (!['saved', 'dismissed', 'applied'].includes(decision)) {
        return res.status(400).json({ error: 'decision must be saved, dismissed, or applied' });
      }

      const result = await decideJob(job_id, decision, notes);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('POST /api/decide error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { job_id } = req.body;

      if (!job_id) {
        return res.status(400).json({ error: 'job_id required' });
      }

      await undoDecision(job_id);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE /api/decide error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
