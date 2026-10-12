// Erzeugt einen neuen Teamlink. Alle bisherigen Links werden sofort ungültig.
'use strict';
const { sb, send, guard, handler, sha256, newToken } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST' });
  const token = await guard(req, res); if (!token) return;
  const fresh = newToken();
  await sb('rpc/rotate_token', { method: 'POST', token, body: { new_hash: sha256(fresh), new_label: `erneuert ${new Date().toISOString().slice(0, 10)}` } });
  send(res, 200, { token: fresh });
});
