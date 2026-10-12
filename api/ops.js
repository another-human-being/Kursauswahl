// Speichert geänderte Bewerbungen und Einstellungen.
'use strict';
const { sb, send, guard, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
  const token = await guard(req, res); if (!token) return;
  const b = req.body || {};
  const apps = Array.isArray(b.apps) ? b.apps : [];
  if (apps.length > 200) return send(res, 400, { error: 'Zu viele Änderungen auf einmal' });
  const rows = [];
  for (const a of apps) {
    if (!a || typeof a.id !== 'string' || !/^[\w-]{1,64}$/.test(a.id)) return send(res, 400, { error: 'Ungültige ID' });
    rows.push({ id: a.id, data: a.deleted ? {} : (a.data && typeof a.data === 'object' ? a.data : {}), deleted: !!a.deleted });
  }
  if (rows.length) await sb('apps?on_conflict=id', { method: 'POST', token, body: rows, prefer: 'resolution=merge-duplicates,return=minimal' });
  if (b.settings && typeof b.settings === 'object') {
    await sb('settings?on_conflict=id', { method: 'POST', token, body: [{ id: 1, data: b.settings }], prefer: 'resolution=merge-duplicates,return=minimal' });
  }
  send(res, 200, { ok: true });
});
