// Speichert geänderte Bewerbungen und Kurseinstellungen.
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
  const cs = b.courseSettings;
  if (cs && typeof cs === 'object') {
    if (!/^[a-z0-9_-]{1,32}$/.test(String(cs.course || '')) || !cs.data || typeof cs.data !== 'object') return send(res, 400, { error: 'Ungültige Kurseinstellungen' });
    await sb('course_settings?on_conflict=course', { method: 'POST', token, body: [{ course: cs.course, data: cs.data }], prefer: 'resolution=merge-duplicates,return=minimal' });
  }
  send(res, 200, { ok: true });
});
