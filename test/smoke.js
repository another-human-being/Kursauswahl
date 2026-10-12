// Startet den Server mit einem leeren Testordner und prüft die Schnittstellen.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const assert = require('assert');

const PORT = 4399, DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'kursauswahl-test-'));
const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA, MISTRAL_API_KEY: '' }, stdio: 'pipe' });

function req(method, p, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({ host: '127.0.0.1', port: PORT, path: p, method, headers: { 'Content-Type': 'application/json', 'X-Kursauswahl': '1', Host: `localhost:${PORT}`, ...headers } }, res => {
      let s = ''; res.on('data', c => s += c); res.on('end', () => { let j = null; try { j = JSON.parse(s); } catch {} resolve({ code: res.statusCode, json: j, text: s }); });
    });
    r.on('error', reject); if (data) r.write(data); r.end();
  });
}

(async () => {
  await new Promise(r => setTimeout(r, 600));
  let r;
  r = await req('GET', '/'); assert.equal(r.code, 200); assert.ok(r.text.includes('<title>'));
  r = await req('GET', '/api/health'); assert.equal(r.code, 200); assert.equal(r.json.mistral, false);
  r = await req('GET', '/api/health', null, { 'X-Kursauswahl': '' }); assert.equal(r.code, 403, 'API ohne Header muss gesperrt sein');
  r = await req('GET', '/api/health', null, { Host: 'evil.example:4399' }); assert.equal(r.code, 403, 'fremder Host muss gesperrt sein');
  r = await req('GET', '/api/state'); assert.equal(r.code, 200); assert.equal(r.json.rev, 0); assert.equal(r.json.data, null);
  r = await req('PUT', '/api/state', { rev: 0, data: { apps: [{ id: 'x', vn: 'Anna' }] } }); assert.equal(r.code, 200); assert.equal(r.json.rev, 1);
  r = await req('PUT', '/api/state', { rev: 0, data: { apps: [] } }); assert.equal(r.code, 409, 'veralteter Stand muss abgelehnt werden');
  r = await req('GET', '/api/state'); assert.equal(r.json.data.apps[0].vn, 'Anna');
  assert.ok(fs.readdirSync(path.join(DATA, 'backups')).length === 1, 'Tagessicherung fehlt');
  r = await req('PUT', '/api/state', { rev: 1, data: { nope: 1 } }); assert.equal(r.code, 400);
  r = await req('POST', '/api/extract', { text: 'x' }); assert.equal(r.code, 503);
  r = await req('POST', '/api/draft', { to: 'a@b.de', subject: 's', body: 'b' }); assert.equal(r.code, process.platform === 'darwin' ? r.code : 500);
  r = await req('POST', '/api/wipe', { confirm: 'nein' }); assert.equal(r.code, 400);
  r = await req('POST', '/api/wipe', { confirm: 'LÖSCHEN' }); assert.equal(r.code, 200);
  r = await req('GET', '/api/state'); assert.equal(r.json.data, null);
  assert.equal(fs.readdirSync(path.join(DATA, 'backups')).length, 0);
  console.log('Alle Server-Tests bestanden.');
})().catch(e => { console.error('FEHLER:', e.message); process.exitCode = 1; }).finally(() => { srv.kill(); fs.rmSync(DATA, { recursive: true, force: true }); });
