function createCard(job) {
  const card = document.createElement('div');
  card.className = 'job-card';
  card.dataset.id = job.id;

  const salaryText = formatSalary(job.salary_min, job.salary_max, job.salary_per);
  const hoursText = job.hours_per_week ? `${Math.round(job.hours_per_week)} uur/pw` : null;
  const remoteBadge = job.remote_option ? `<span class="badge badge-${job.remote_option}">${remoteLabel(job.remote_option)}</span>` : '';
  const scoreBadge = job.score >= 40 ? `<span class="badge badge-hot">hot</span>` : '';

  card.innerHTML = `
    <div class="card-header">
      <div class="card-badges">${remoteBadge}${scoreBadge}</div>
      <div class="card-source">${escapeHtml(job.source)}</div>
    </div>
    <h2 class="card-title">${escapeHtml(job.title)}</h2>
    <div class="card-company">${escapeHtml(job.company || 'Onbekend')}</div>
    <div class="card-location">${escapeHtml(job.location || 'Hoogeveen')}</div>
    <div class="card-meta">
      ${salaryText ? `<span class="meta-item">${salaryText}</span>` : ''}
      ${hoursText ? `<span class="meta-item">${hoursText}</span>` : ''}
      ${job.contract_type ? `<span class="meta-item">${escapeHtml(job.contract_type)}</span>` : ''}
    </div>
    <div class="card-desc">${escapeHtml(truncate(job.description, 180))}</div>
    ${job.tags && job.tags.length > 0 ? `<div class="card-tags">${job.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    ${job.source_url ? `<a href="${escapeHtml(job.source_url)}" target="_blank" rel="noopener" class="card-link">Bekijk origineel →</a>` : ''}
  `;

  return card;
}

function formatSalary(min, max, per) {
  if (min == null && max == null) return null;
  const perLabel = per === 'hour' ? '/uur' : per === 'month' ? '/maand' : per === 'year' ? '/jaar' : '';
  if (min != null && max != null) {
    return `€${min.toFixed(2)} – €${max.toFixed(2)}${perLabel}`;
  }
  if (min != null) return `vanaf €${min.toFixed(2)}${perLabel}`;
  return `tot €${max.toFixed(2)}${perLabel}`;
}

function remoteLabel(option) {
  if (option === 'remote') return '🏠 Remote';
  if (option === 'hybrid') return '🔀 Hybride';
  return '📍 Op locatie';
}

function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showEmptyState(container, message) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">📭</div>
      <p>${message}</p>
    </div>
  `;
}
