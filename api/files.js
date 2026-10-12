// Dokumente (PDFs) zu Bewerbungen: POST speichert, GET liefert zur Ansicht, DELETE entfernt.
'use strict';
const { sb, send, guard, handler } = require('./_lib');

const ID = /^[\w-]{1,64}$/;
const KINDS = ['motivation', 'empfehlung', 'lebenslauf', 'zeugnis', 'sonstiges'];

module.exports = handler(async (req, res) => {
  const token = await guard(req, res); if (!token) return;

  if (req.method === 'GET') {
    const id = String(req.query.id || '');
    if (!ID.test(id)) return send(res, 400, { error: 'Ungültige ID' });
    const rows = await sb(`files?select=name,mime,b64&id=eq.${encodeURIComponent(id)}&deleted=eq.false`, { token });
    if (!rows.length || !rows[0].b64) return send(res, 404, { error: 'Dokument nicht gefunden' });
    res.setHeader('Content-Type', rows[0].mime || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(rows[0].name || 'dokument.pdf')}`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).send(Buffer.from(rows[0].b64, 'base64'));
  }

  if (req.method === 'POST') {
    const { id, app_id, name, b64, kind } = req.body || {};
    if (!ID.test(String(id || '')) || !ID.test(String(app_id || ''))) return send(res, 400, { error: 'Ungültige ID' });
    if (typeof b64 !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(b64)) return send(res, 400, { error: 'Keine gültige Datei' });
    if (b64.length > 4300000) return send(res, 413, { error: 'PDF zu groß (max. ca. 3 MB)' });
    const head = Buffer.from(b64.slice(0, 16), 'base64').toString('latin1');
    if (!head.startsWith('%PDF')) return send(res, 400, { error: 'Datei ist kein PDF' });
    await sb('files?on_conflict=id', {
      method: 'POST', token, prefer: 'resolution=merge-duplicates,return=minimal',
      body: [{ id, app_id, name: String(name || 'dokument.pdf').slice(0, 200), mime: 'application/pdf', size: Math.round(b64.length * 0.75), b64, kind: KINDS.includes(kind) ? kind : 'sonstiges', deleted: false }],
    });
    return send(res, 200, { ok: true });
  }

  if (req.method === 'PATCH') {
    const { id, kind, meta } = req.body || {};
    if (!ID.test(String(id || ''))) return send(res, 400, { error: 'Ungültige ID' });
    const patch = {};
    if (KINDS.includes(kind)) patch.kind = kind;
    if (meta && typeof meta === 'object') patch.meta = meta;
    await sb(`files?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', token, body: patch, prefer: 'return=minimal' });
    return send(res, 200, { ok: true });
  }

  if (req.method === 'DELETE') {
    const id = String(req.query.id || '');
    if (!ID.test(id)) return send(res, 400, { error: 'Ungültige ID' });
    await sb(`files?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', token, body: { deleted: true, b64: '', meta: {} }, prefer: 'return=minimal' });
    return send(res, 200, { ok: true });
  }

  send(res, 405, { error: 'Methode nicht erlaubt' });
});
