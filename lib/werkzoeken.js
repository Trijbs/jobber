const cheerio = require('cheerio');

const BASE_URL = 'https://www.werkzoeken.nl';

async function searchJobs({ query = 'bezorger', location = 'hoogeveen', page = 1 } = {}) {
  const searchUrl = `${BASE_URL}/vacatures?q=${encodeURIComponent(query)}&locatie=${encodeURIComponent(location)}&page=${page}`;

  const res = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html',
      'Accept-Language': 'nl-NL,nl;q=0.9',
    },
  });

  if (!res.ok) {
    throw new Error(`Werkzoeken error ${res.status}: ${await res.text()}`);
  }

  const html = await res.text();
  return parseJobListings(html);
}

function parseJobListings(html) {
  const $ = cheerio.load(html);
  const jobs = [];

  $('article.job, div.job-item, div.vacature, [data-job], .search-result').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h2 a, h3 a, .job-title a, .vacature-title a').first();
    const titleText = title.text().trim();
    const link = title.attr('href');

    if (!titleText) return;

    const company = $el.find('.company, .bedrijf, .employer').first().text().trim() || null;
    const loc = $el.find('.location, .locatie, .plaats').first().text().trim() || null;
    const desc = $el.find('.description, .omschrijving, .summary, p').first().text().trim() || null;
    const salaryText = $el.find('.salary, .salaris, .loon').first().text().trim();
    const contractText = $el.find('.contract, .dienstverband, .type').first().text().trim();

    const sourceId = link ? link.match(/\/(\d+)/)?.[1] || `wz-${Date.now()}-${jobs.length}` : `wz-${Date.now()}-${jobs.length}`;
    const sourceUrl = link?.startsWith('http') ? link : link ? `${BASE_URL}${link}` : null;

    jobs.push({
      source: 'werkzoeken',
      source_id: sourceId,
      source_url: sourceUrl,
      title: titleText,
      company,
      location: loc || 'Hoogeveen',
      description: desc,
      salary_min: parseSalaryMin(salaryText),
      salary_max: parseSalaryMax(salaryText),
      salary_per: detectSalaryPer(salaryText),
      hours_per_week: extractHours(desc),
      contract_type: contractText || null,
      remote_option: detectRemote(desc, titleText),
      category: null,
      tags: extractTags(titleText, desc),
      requirements: [],
      flexibility_notes: null,
      scraped_at: new Date().toISOString(),
    });
  });

  return jobs;
}

function parseSalaryMin(text) {
  if (!text) return null;
  const match = text.match(/€\s*(\d+[.,]?\d*)/);
  return match ? parseFloat(match[1].replace(',', '.')) : null;
}

function parseSalaryMax(text) {
  if (!text) return null;
  const matches = text.match(/€\s*(\d+[.,]?\d*)\s*[-–]\s*€?\s*(\d+[.,]?\d*)/);
  return matches ? parseFloat(matches[2].replace(',', '.')) : null;
}

function detectSalaryPer(text) {
  if (!text) return 'hour';
  const lower = text.toLowerCase();
  if (lower.includes('uur') || lower.includes('per uur')) return 'hour';
  if (lower.includes('maand') || lower.includes('per maand')) return 'month';
  if (lower.includes('jaar') || lower.includes('per jaar')) return 'year';
  return 'hour';
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

function extractTags(title, description) {
  const tags = [];
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  const keywords = ['bezorger', 'chauffeur', 'pakket', 'post', 'magazijn', 'logistiek', 'schoonmaak', 'horeca', 'retail', 'parttime', 'bijbaan'];
  for (const kw of keywords) {
    if (text.includes(kw)) tags.push(kw);
  }
  return [...new Set(tags)];
}

module.exports = { searchJobs };
