// Lädt ein Bild von einer Web-Adresse (z. B. aus LinkedIn oder der Google-Bildersuche),
// damit der Browser es verkleinern und speichern kann.
'use strict';
const net = require('net');
const { send, guard, handler } = require('./_lib');

const MAX = 6 * 1024 * 1024;

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
  if (!(await guard(req, res))) return;
  let u;
  try { u = new URL(String((req.body || {}).url || '')); } catch { return send(res, 400, { error: 'Keine gültige Adresse' }); }
  const host = u.hostname.toLowerCase();
  if (u.protocol !== 'https:' || net.isIP(host) || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || !host.includes('.')) {
    return send(res, 400, { error: 'Nur öffentliche https-Adressen' });
  }
  const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'Mozilla/5.0 Kursauswahl', Accept: 'image/*' } });
  if (!r.ok) return send(res, 400, { error: `Bild nicht abrufbar (${r.status}). Bild lieber kopieren und einfügen.` });
  const type = (r.headers.get('content-type') || '').split(';')[0].trim();
  if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type)) return send(res, 400, { error: 'Die Adresse liefert kein Bild' });
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX) return send(res, 413, { error: 'Bild zu groß' });
  send(res, 200, { dataUrl: `data:${type};base64,${buf.toString('base64')}` });
});
