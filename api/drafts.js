// Mail-Aufträge für den Mail-Helfer auf dem Mac.
// POST: Web-App legt Aufträge an. GET: Helfer holt offene Aufträge (und meldet sich als online).
// PATCH: Helfer meldet Ergebnis; bei Erfolg wird die Bewerbung auf "entwurf" gesetzt.
'use strict';
const { sb, send, guard, handler } = require('./_lib');

const MAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

module.exports = handler(async (req, res) => {
  const token = await guard(req, res); if (!token) return;

  if (req.method === 'POST') {
    const jobs = Array.isArray((req.body || {}).jobs) ? req.body.jobs : [];
    if (!jobs.length || jobs.length > 200) return send(res, 400, { error: 'Keine oder zu viele Aufträge' });
    const rows = [];
    for (const j of jobs) {
      if (!MAIL.test(String(j.to || '')) || !/^[\w-]{1,64}$/.test(String(j.app_id || ''))) return send(res, 400, { error: `Ungültige Adresse: ${j.to}` });
      rows.push({ app_id: j.app_id, to_addr: j.to, subject: String(j.subject || '').slice(0, 500), body: String(j.body || '').slice(0, 20000), sender: String(j.sender || '').slice(0, 200) });
    }
    // Offene Aufträge für dieselben Bewerbungen ersetzen, damit nichts doppelt entsteht
    const ids = [...new Set(rows.map(r => r.app_id))].map(encodeURIComponent).join(',');
    await sb(`draft_jobs?app_id=in.(${ids})&status=in.(offen,fehler)`, { method: 'DELETE', token, prefer: 'return=minimal' });
    await sb('draft_jobs', { method: 'POST', token, body: rows, prefer: 'return=minimal' });
    return send(res, 200, { ok: true, n: rows.length });
  }

  if (req.method === 'GET') {
    await sb('helper_status?on_conflict=id', { method: 'POST', token, body: [{ id: 1, last_seen: new Date().toISOString() }], prefer: 'resolution=merge-duplicates,return=minimal' });
    const jobs = await sb('draft_jobs?select=id,app_id,to_addr,subject,body,sender&status=eq.offen&order=id.asc&limit=25', { token });
    return send(res, 200, { jobs });
  }

  if (req.method === 'PATCH') {
    const { id, ok, error } = req.body || {};
    if (!Number.isInteger(id)) return send(res, 400, { error: 'Ungültige Auftrags-ID' });
    const rows = await sb(`draft_jobs?id=eq.${id}`, {
      method: 'PATCH', token, prefer: 'return=representation',
      body: ok ? { status: 'erledigt', done_at: new Date().toISOString(), error: null } : { status: 'fehler', error: String(error || 'Fehler').slice(0, 500) },
    });
    if (ok && rows[0]) {
      const app = await sb(`apps?select=data&id=eq.${encodeURIComponent(rows[0].app_id)}`, { token });
      if (app[0] && app[0].data && app[0].data.mail !== 'versendet') {
        await sb(`apps?id=eq.${encodeURIComponent(rows[0].app_id)}`, { method: 'PATCH', token, body: { data: { ...app[0].data, mail: 'entwurf' } }, prefer: 'return=minimal' });
      }
    }
    return send(res, 200, { ok: true });
  }

  send(res, 405, { error: 'Methode nicht erlaubt' });
});
