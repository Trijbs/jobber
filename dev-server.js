const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

require('dotenv').config();

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const API_DIR = path.join(__dirname, 'api');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

async function loadHandler(apiPath) {
  const filePath = path.join(API_DIR, apiPath + '.js');
  if (!fs.existsSync(filePath)) return null;
  delete require.cache[require.resolve(filePath)];
  return require(filePath);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // API routes
  if (pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api/', '').replace(/\/$/, '') || 'index';

    // Try exact match first, then directory/index
    let handler = await loadHandler(apiPath);
    if (!handler) handler = await loadHandler(apiPath + '/index');

    if (handler) {
      req.query = parsed.query;
      req.body = await parseBody(req);
      res.status = (code) => { res.statusCode = code; return res; };
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
      try {
        await handler(req, res);
      } catch (err) {
        console.error(`API error [${pathname}]:`, err);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  // Static files
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const ext = path.extname(filePath);
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  const content = fs.readFileSync(filePath);
  res.setHeader('Content-Type', mime);
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`\n  Jobber dev server running at http://localhost:${PORT}\n`);
  console.log(`  API: http://localhost:${PORT}/api/preferences`);
  console.log(`  UI:  http://localhost:${PORT}\n`);
});
