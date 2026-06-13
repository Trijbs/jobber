const app = {
  jobs: [],
  currentIndex: 0,
  view: 'stack', // 'stack', 'saved', 'filters', 'stats'
  undoStack: [],
  maxUndo: 5,
  stats: { total: 0, saved: 0, dismissed: 0, new: 0 },

  async init() {
    await this.loadJobs();
    this.renderNav();
    this.renderCurrentView();
  },

  async loadJobs() {
    try {
      const data = await fetchJobs('new');
      this.jobs = data.jobs || [];
      this.stats = data.stats || this.stats;
      this.currentIndex = 0;
    } catch (err) {
      console.error('Failed to load jobs:', err);
      this.jobs = [];
    }
  },

  renderNav() {
    const nav = document.getElementById('nav');
    nav.innerHTML = `
      <button class="nav-btn ${this.view === 'stack' ? 'active' : ''}" onclick="app.switchView('stack')">
        🃏 Nieuw <span class="nav-count">${this.stats.new}</span>
      </button>
      <button class="nav-btn ${this.view === 'saved' ? 'active' : ''}" onclick="app.switchView('saved')">
        ✅ Opgeslagen <span class="nav-count">${this.stats.saved}</span>
      </button>
      <button class="nav-btn ${this.view === 'filters' ? 'active' : ''}" onclick="app.switchView('filters')">
        ⚙️ Filters
      </button>
      <button class="nav-btn ${this.view === 'stats' ? 'active' : ''}" onclick="app.switchView('stats')">
        📊 Stats
      </button>
    `;
  },

  async switchView(view) {
    this.view = view;
    if (view === 'saved') {
      try {
        const data = await fetchJobs('saved');
        this.savedJobs = data.jobs || [];
      } catch { this.savedJobs = []; }
    }
    if (view === 'stats') {
      try {
        const data = await fetchJobs('new', 1);
        this.stats = data.stats || this.stats;
      } catch {}
    }
    this.renderNav();
    this.renderCurrentView();
  },

  renderCurrentView() {
    const main = document.getElementById('main');
    switch (this.view) {
      case 'stack': this.renderStack(main); break;
      case 'saved': this.renderSaved(main); break;
      case 'filters': this.renderFilters(main); break;
      case 'stats': this.renderStats(main); break;
    }
  },

  renderStack(container) {
    if (this.jobs.length === 0 || this.currentIndex >= this.jobs.length) {
      showEmptyState(container, 'Geen nieuwe vacatures gevonden. Probeer later opnieuw of pas je filters aan.');
      return;
    }

    const job = this.jobs[this.currentIndex];
    container.innerHTML = `
      <div class="stack-info">
        <span>${this.currentIndex + 1} / ${this.jobs.length}</span>
        <button class="btn-undo" onclick="app.undo()" ${this.undoStack.length === 0 ? 'disabled' : ''}>↩ Ongedaan maken</button>
      </div>
      <div class="card-container" id="card-container"></div>
      <div class="swipe-actions">
        <button class="btn-dismiss" onclick="app.dismiss()">❌ Afwijzen</button>
        <button class="btn-save" onclick="app.save()">✅ Opslaan</button>
      </div>
    `;

    const cardContainer = document.getElementById('card-container');
    const card = createCard(job);
    cardContainer.appendChild(card);

    this.swipeHandler = new SwipeHandler(card, {
      onSwipeLeft: () => this.dismiss(),
      onSwipeRight: () => this.save(),
      onTap: () => card.classList.toggle('expanded'),
    });
  },

  renderSaved(container) {
    if (!this.savedJobs || this.savedJobs.length === 0) {
      showEmptyState(container, 'Nog geen opgeslagen vacatures. Swipe naar rechts om op te slaan.');
      return;
    }

    container.innerHTML = `
      <h2 class="view-title">Opgeslagen vacatures</h2>
      <div class="saved-list">
        ${this.savedJobs.map(job => `
          <div class="saved-item">
            <div class="saved-info">
              <h3>${escapeHtml(job.title)}</h3>
              <p>${escapeHtml(job.company || 'Onbekend')} — ${escapeHtml(job.location || 'Hoogeveen')}</p>
              ${formatSalary(job.salary_min, job.salary_max, job.salary_per) ? `<span class="saved-salary">${formatSalary(job.salary_min, job.salary_max, job.salary_per)}</span>` : ''}
            </div>
            <div class="saved-actions">
              ${job.source_url ? `<a href="${escapeHtml(job.source_url)}" target="_blank" rel="noopener" class="btn-link">Bekijk</a>` : ''}
              <button class="btn-dismiss-sm" onclick="app.dismissSaved('${job.id}')">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async renderFilters(container) {
    let prefs = {};
    try {
      prefs = await getPreferences();
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }

    container.innerHTML = `
      <h2 class="view-title">Zoekfilters</h2>
      <div class="filters-form">
        <div class="filter-group">
          <label>Zoektermen (komma-gescheiden)</label>
          <input type="text" id="f-search" value="${(prefs.search_terms || []).join(', ')}" placeholder="bezorger, chauffeur, pakketbezorger">
        </div>
        <div class="filter-group">
          <label>Locatie</label>
          <input type="text" id="f-location" value="${prefs.location || 'hoogeveen'}">
        </div>
        <div class="filter-group">
          <label>Straal (km)</label>
          <input type="number" id="f-radius" value="${prefs.radius_km || 15}" min="1" max="100">
        </div>
        <div class="filter-group">
          <label>Minimum uurloon (€)</label>
          <input type="number" id="f-rate" value="${prefs.min_hourly_rate || 6}" min="0" step="0.50">
        </div>
        <div class="filter-group">
          <label>Uitsluitingswoorden (komma-gescheiden)</label>
          <input type="text" id="f-exclude" value="${(prefs.exclude_keywords || []).join(', ')}" placeholder="fulltime, 40 uur">
        </div>
        <button class="btn-primary" onclick="app.saveFilters()">Opslaan</button>
        <button class="btn-secondary" onclick="app.runScrape()">🔄 Nu zoeken</button>
        <div id="filter-status"></div>
      </div>
    `;
  },

  async saveFilters() {
    const status = document.getElementById('filter-status');
    try {
      const searchTerms = document.getElementById('f-search').value.split(',').map(s => s.trim()).filter(Boolean);
      const location = document.getElementById('f-location').value.trim();
      const radius = Number(document.getElementById('f-radius').value);
      const minRate = Number(document.getElementById('f-rate').value);
      const excludeKeywords = document.getElementById('f-exclude').value.split(',').map(s => s.trim()).filter(Boolean);

      await Promise.all([
        updatePreference('search_terms', searchTerms),
        updatePreference('location', location),
        updatePreference('radius_km', radius),
        updatePreference('min_hourly_rate', minRate),
        updatePreference('exclude_keywords', excludeKeywords),
      ]);

      status.textContent = 'Filters opgeslagen!';
      status.className = 'status success';
    } catch (err) {
      status.textContent = `Fout: ${err.message}`;
      status.className = 'status error';
    }
    setTimeout(() => { status.textContent = ''; status.className = ''; }, 3000);
  },

  async runScrape() {
    const status = document.getElementById('filter-status');
    status.textContent = 'Zoeken naar vacatures...';
    status.className = 'status loading';
    try {
      const result = await triggerScrape();
      status.textContent = `Gevonden: ${result.scraped} vacatures (${result.stored} opgeslagen)`;
      status.className = 'status success';
    } catch (err) {
      status.textContent = `Fout: ${err.message}`;
      status.className = 'status error';
    }
  },

  renderStats(container) {
    container.innerHTML = `
      <h2 class="view-title">Statistieken</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${this.stats.total}</div>
          <div class="stat-label">Totaal</div>
        </div>
        <div class="stat-card stat-new">
          <div class="stat-number">${this.stats.new}</div>
          <div class="stat-label">Nieuw</div>
        </div>
        <div class="stat-card stat-saved">
          <div class="stat-number">${this.stats.saved}</div>
          <div class="stat-label">Opgeslagen</div>
        </div>
        <div class="stat-card stat-dismissed">
          <div class="stat-number">${this.stats.dismissed}</div>
          <div class="stat-label">Afgewezen</div>
        </div>
      </div>
    `;
  },

  async save() {
    const job = this.jobs[this.currentIndex];
    if (!job) return;
    try {
      await decideJob(job.id, 'saved');
      this.undoStack.push({ jobId: job.id, action: 'saved' });
      if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
      this.stats.saved++;
      this.stats.new--;
    } catch (err) {
      console.error('Save failed:', err);
    }
    this.currentIndex++;
    this.renderNav();
    this.renderCurrentView();
  },

  async dismiss() {
    const job = this.jobs[this.currentIndex];
    if (!job) return;
    try {
      await decideJob(job.id, 'dismissed');
      this.undoStack.push({ jobId: job.id, action: 'dismissed' });
      if (this.undoStack.length > this.maxUndo) this.undoStack.shift();
      this.stats.dismissed++;
      this.stats.new--;
    } catch (err) {
      console.error('Dismiss failed:', err);
    }
    this.currentIndex++;
    this.renderNav();
    this.renderCurrentView();
  },

  async undo() {
    const last = this.undoStack.pop();
    if (!last) return;
    try {
      await undoDecision(last.jobId);
      if (last.action === 'saved') { this.stats.saved--; this.stats.new++; }
      if (last.action === 'dismissed') { this.stats.dismissed--; this.stats.new++; }
      if (this.currentIndex > 0) this.currentIndex--;
      this.renderNav();
      this.renderCurrentView();
    } catch (err) {
      console.error('Undo failed:', err);
    }
  },

  async dismissSaved(jobId) {
    try {
      await decideJob(jobId, 'dismissed');
      this.savedJobs = this.savedJobs.filter(j => j.id !== jobId);
      this.stats.saved--;
      this.stats.dismissed++;
      this.renderNav();
      this.renderSaved(document.getElementById('main'));
    } catch (err) {
      console.error('Dismiss saved failed:', err);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => app.init());
