// Lokaler Testserver: bildet Vercel nach (public/ + api/*.js). Nur für Entwicklung.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = Number(process.env.PORT || 4400);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  req.query = Object.fromEntries(url.searchParams);
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(o)); };
  res.send = b => res.end(b);
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^\w-]/g, '');
    const file = path.join(__dirname, 'api', name + '.js');
    if (!name || name.startsWith('_') || !fs.existsSync(file)) return res.status(404).json({ error: 'not found' });
    const chunks = []; for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    return require(file)(req, res);
  }
  const f = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
  const p = path.join(__dirname, 'public', path.normalize(f).replace(/^(\.\.[/\\])+/, ''));
  if (!fs.existsSync(p)) return res.status(404).send('not found');
  res.setHeader('Content-Type', p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream');
  res.end(fs.readFileSync(p));
});
server.listen(PORT, () => console.log(`dev: http://localhost:${PORT}`));
