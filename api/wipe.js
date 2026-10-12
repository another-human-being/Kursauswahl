// Löscht alle Bewerbungen, Fotos und Mail-Aufträge. Einstellungen und Mailtexte bleiben.
'use strict';
const { sb, send, guard, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
  const token = await guard(req, res); if (!token) return;
  if ((req.body || {}).confirm !== 'LÖSCHEN') return send(res, 400, { error: 'Bestätigung fehlt' });
  await sb('draft_jobs?id=gt.0', { method: 'DELETE', token, prefer: 'return=minimal' });
  await sb('photos?app_id=not.is.null', { method: 'DELETE', token, prefer: 'return=minimal' });
  await sb('apps?id=not.is.null', { method: 'DELETE', token, prefer: 'return=minimal' });
  const cur = await sb('settings?select=data&id=eq.1', { token });
  const data = { ...((cur[0] && cur[0].data) || {}), epoch: new Date().toISOString() };
  delete data.infoNames; // Teilnehmerliste der Infoveranstaltung ist ebenfalls Personendaten
  await sb('settings?on_conflict=id', { method: 'POST', token, body: [{ id: 1, data }], prefer: 'resolution=merge-duplicates,return=minimal' });
  send(res, 200, { ok: true });
});
