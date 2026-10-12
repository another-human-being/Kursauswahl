// Fotos: GET liefert das Bild, POST speichert ein (im Browser verkleinertes) Bild, DELETE entfernt es.
'use strict';
const { sb, send, guard, handler } = require('./_lib');

const ID = /^[\w-]{1,64}$/;

module.exports = handler(async (req, res) => {
  const token = await guard(req, res); if (!token) return;
  if (req.method === 'GET') {
    const id = String(req.query.id || '');
    if (!ID.test(id)) return send(res, 400, { error: 'Ungültige ID' });
    const rows = await sb(`photos?select=mime,b64&app_id=eq.${encodeURIComponent(id)}`, { token });
    if (!rows.length || !rows[0].mime) return send(res, 404, { error: 'Kein Foto' });
    res.setHeader('Content-Type', rows[0].mime);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.status(200).send(Buffer.from(rows[0].b64, 'base64'));
  }
  if (req.method === 'POST') {
    const { id, dataUrl } = req.body || {};
    if (!ID.test(String(id || ''))) return send(res, 400, { error: 'Ungültige ID' });
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
    if (!m) return send(res, 400, { error: 'Kein gültiges Bild' });
    if (m[2].length > 1500000) return send(res, 413, { error: 'Bild zu groß' });
    await sb('photos?on_conflict=app_id', { method: 'POST', token, body: [{ app_id: id, mime: m[1], b64: m[2] }], prefer: 'resolution=merge-duplicates,return=minimal' });
    return send(res, 200, { ok: true });
  }
  if (req.method === 'DELETE') {
    const id = String(req.query.id || '');
    if (!ID.test(id)) return send(res, 400, { error: 'Ungültige ID' });
    await sb('photos?on_conflict=app_id', { method: 'POST', token, body: [{ app_id: id, mime: '', b64: '' }], prefer: 'resolution=merge-duplicates,return=minimal' });
    return send(res, 200, { ok: true });
  }
  send(res, 405, { error: 'Methode nicht erlaubt' });
});
