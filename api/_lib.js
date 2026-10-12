// Gemeinsame Helfer für alle Server-Funktionen.
// Die Datenbank prüft jeden Zugriff selbst (Row Level Security mit dem Team-Token),
// der Server reicht den Token nur durch und hält selbst keine Datenbank-Rechte.
'use strict';
const crypto = require('crypto');

const SB_URL = process.env.SUPABASE_URL || 'https://kjfzkjzflgnbechxjswl.supabase.co';
const SB_KEY = process.env.SUPABASE_KEY || 'sb_publishable_OhdvWGJaRSBt3bcfU213cw_jl3h5Ual';
const VERSION = process.env.APP_VERSION || require('../version.json').version;

function getToken(req) {
  const t = req.headers['x-team-token'];
  return typeof t === 'string' && t.length >= 32 && t.length <= 200 && /^[A-Za-z0-9_-]+$/.test(t) ? t : null;
}

async function sb(path, { method = 'GET', token, body, prefer } = {}) {
  const headers = { apikey: SB_KEY, 'Content-Type': 'application/json' };
  if (token) headers['x-team-token'] = token;
  if (prefer) headers.Prefer = prefer;
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  const txt = await r.text();
  let j = null;
  try { j = txt ? JSON.parse(txt) : null; } catch { j = null; }
  if (!r.ok) {
    const e = new Error((j && j.message) || `Datenbank antwortet mit ${r.status}`);
    e.status = r.status === 401 || r.status === 403 ? 401 : 502;
    throw e;
  }
  return j;
}

function send(res, code, obj) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(code).json(obj);
}

// Liefert den Token, wenn er gültig ist; sonst antwortet direkt mit 401.
async function guard(req, res) {
  const t = getToken(req);
  if (!t) { send(res, 401, { error: 'Kein Zugang. Bitte den Teamlink öffnen.' }); return null; }
  try {
    const ok = await sb('rpc/is_team', { method: 'POST', token: t, body: {} });
    if (ok !== true) { send(res, 401, { error: 'Teamlink ungültig oder abgelaufen.' }); return null; }
    return t;
  } catch (e) {
    send(res, 502, { error: e.message }); return null;
  }
}

function handler(fn) {
  return async (req, res) => {
    try { await fn(req, res); }
    catch (e) { console.error(e); send(res, e.status || 500, { error: e.message || 'Fehler' }); }
  };
}

const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const newToken = () => crypto.randomBytes(32).toString('base64url');

module.exports = { sb, send, guard, handler, getToken, sha256, newToken, VERSION };
