// Löscht alle Bewerbungen eines Kurses samt Fotos, Dokumenten und Mail-Aufträgen.
// Kurseinstellungen und Mailtexte bleiben, die Teilnehmerliste der Infoveranstaltung wird entfernt.
'use strict';
const { sb, send, guard, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
  const token = await guard(req, res); if (!token) return;
  const { confirm, course } = req.body || {};
  if (confirm !== 'LÖSCHEN') return send(res, 400, { error: 'Bestätigung fehlt' });
  if (!/^[a-z0-9_-]{1,32}$/.test(String(course || ''))) return send(res, 400, { error: 'Kurs fehlt' });
  // Bewerbungen ohne Kursangabe stammen aus der Zeit vor dem Kurs-Umschalter und gehören zur Start-up Challenge
  const filter = course === 'suc' ? 'or=(data->>course.eq.suc,data->>course.is.null)' : `data->>course=eq.${course}`;
  const apps = await sb(`apps?select=id&${filter}`, { token });
  const ids = apps.map(a => a.id);
  for (let i = 0; i < ids.length; i += 80) {
    const list = ids.slice(i, i + 80).map(encodeURIComponent).join(',');
    await sb(`draft_jobs?app_id=in.(${list})`, { method: 'DELETE', token, prefer: 'return=minimal' });
    await sb(`photos?app_id=in.(${list})`, { method: 'DELETE', token, prefer: 'return=minimal' });
    await sb(`files?app_id=in.(${list})`, { method: 'DELETE', token, prefer: 'return=minimal' });
    await sb(`apps?id=in.(${list})`, { method: 'DELETE', token, prefer: 'return=minimal' });
  }
  const cur = await sb(`course_settings?select=data&course=eq.${course}`, { token });
  const data = { ...((cur[0] && cur[0].data) || {}), epoch: new Date().toISOString() };
  delete data.infoNames;
  await sb('course_settings?on_conflict=course', { method: 'POST', token, body: [{ course, data }], prefer: 'resolution=merge-duplicates,return=minimal' });
  send(res, 200, { ok: true, deleted: ids.length });
});
