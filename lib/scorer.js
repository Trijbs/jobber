async function scoreJob(job, preferences) {
  let score = 0;

  // Base score for being active and recent
  score += 10;

  // Salary scoring
  if (job.salary_min != null) {
    const minRate = preferences.min_hourly_rate || 6;
    if (job.salary_per === 'hour') {
      if (job.salary_min >= minRate) score += 20;
      if (job.salary_min >= minRate * 1.5) score += 10;
    }
  }

  // Remote preference
  const remotePrefs = preferences.remote_preference || ['remote', 'hybrid'];
  if (job.remote_option && remotePrefs.includes(job.remote_option)) {
    score += 15;
  }

  // Hours scoring (prefer part-time)
  if (job.hours_per_week != null) {
    if (job.hours_per_week >= 8 && job.hours_per_week <= 32) score += 15;
    if (job.hours_per_week > 32) score -= 10;
  }

  // Contract type
  if (job.contract_type) {
    const ct = job.contract_type.toLowerCase();
    if (ct.includes('parttime') || ct.includes('part-time') || ct.includes('tijdelijk')) score += 10;
    if (ct.includes('fulltime') || ct.includes('full-time')) score -= 15;
  }

  // Search term relevance
  const searchTerms = preferences.search_terms || [];
  const titleLower = (job.title || '').toLowerCase();
  const descLower = (job.description || '').toLowerCase();
  for (const term of searchTerms) {
    if (titleLower.includes(term.toLowerCase())) score += 25;
    else if (descLower.includes(term.toLowerCase())) score += 10;
  }

  // Exclude keywords penalty
  const excludeKeywords = preferences.exclude_keywords || [];
  for (const kw of excludeKeywords) {
    if (titleLower.includes(kw.toLowerCase()) || descLower.includes(kw.toLowerCase())) {
      score -= 30;
    }
  }

  // Location bonus
  const location = (job.location || '').toLowerCase();
  if (location.includes('hoogeveen')) score += 20;
  else if (location.includes('drenthe')) score += 10;

  // Tag bonus
  const tags = job.tags || [];
  const preferredTags = ['bezorger', 'chauffeur', 'pakket', 'post', 'magazijn', 'logistiek'];
  for (const tag of tags) {
    if (preferredTags.includes(tag)) score += 5;
  }

  return Math.max(0, score);
}

module.exports = { scoreJob };
