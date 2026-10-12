// Mail-Helfer: holt Mail-Aufträge aus der Kursauswahl und legt sie als Entwürfe in Apple Mail an.
// Läuft auf dem Mac, solange das Fenster offen ist. Keine Abhängigkeiten, Node 18 oder neuer.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const DIR = __dirname;
const ENV = path.join(DIR, '.env');
const SCRIPT = path.join(DIR, 'mail-draft.applescript');
const INTERVAL = 5000;

function readEnv() {
  const o = {};
  if (fs.existsSync(ENV)) for (const l of fs.readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) o[m[1]] = m[2];
  }
  return o;
}
const env = readEnv();
const BASE = (env.KURSAUSWAHL_URL || '').replace(/\/+$/, '');
const TOKEN = env.TEAM_TOKEN || '';
if (!BASE || !TOKEN) { console.error('\n  Kein Teamlink eingetragen. Mail-Helfer.command neu starten.\n'); process.exit(1); }

const log = m => console.log(`  ${new Date().toLocaleTimeString('de-DE')}  ${m}`);

async function api(method, body) {
  const r = await fetch(`${BASE}/api/drafts`, {
    method, headers: { 'Content-Type': 'application/json', 'X-Team-Token': TOKEN },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000),
  });
  if (r.status === 401) { const e = new Error('Teamlink ungültig'); e.auth = true; throw e; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Server antwortet mit ${r.status}`);
  return j;
}

function draft(job) {
  return new Promise((resolve, reject) => {
    execFile('osascript', [SCRIPT, job.to_addr, job.subject || '', job.body || '', job.sender || ''], { timeout: 30000 }, (err, _o, stderr) => {
      if (!err) return resolve();
      const msg = String(stderr || err.message);
      if (/-1743|not allowed|nicht erlaubt/i.test(msg)) return reject(new Error('macOS erlaubt den Zugriff auf Mail nicht. Systemeinstellungen › Datenschutz & Sicherheit › Automation › Terminal: „Mail" aktivieren.'));
      if (/-1728|sender/i.test(msg) && job.sender) return reject(new Error(`Absender ${job.sender} ist in Apple Mail nicht eingerichtet.`));
      reject(new Error(msg.trim().slice(0, 300)));
    });
  });
}

let online = null;
async function tick() {
  try {
    const { jobs } = await api('GET');
    if (online !== true) { log('Verbunden. Warte auf Aufträge …'); online = true; }
    for (const job of jobs) {
      try { await draft(job); await api('PATCH', { id: job.id, ok: true }); log(`Entwurf angelegt: ${job.to_addr}`); }
      catch (e) { await api('PATCH', { id: job.id, ok: false, error: e.message }).catch(() => {}); log(`Fehler bei ${job.to_addr}: ${e.message}`); }
    }
  } catch (e) {
    if (e.auth) { console.error('\n  Der Teamlink ist ungültig (vermutlich erneuert). Datei .env im Ordner Mail-Helfer löschen und neu starten.\n'); process.exit(1); }
    if (online !== false) { log(`Keine Verbindung: ${e.message}. Versuche es weiter …`); online = false; }
  }
  setTimeout(tick, INTERVAL);
}

console.log(`\n  Mail-Helfer für ${BASE}\n  Fenster offen lassen, solange Entwürfe angelegt werden sollen. Beenden: Fenster schließen.\n`);
tick();
