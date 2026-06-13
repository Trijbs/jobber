const { getPreferences, updatePreference } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const prefs = await getPreferences();
      return res.status(200).json(prefs);
    } catch (err) {
      console.error('GET /api/preferences error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { key, value } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({ error: 'key and value required' });
      }

      const result = await updatePreference(key, value);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('PUT /api/preferences error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
