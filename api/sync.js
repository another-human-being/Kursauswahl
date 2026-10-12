// Liefert alles, was sich seit einer Revision geändert hat (alle Kurse).
'use strict';
const { sb, send, guard, handler } = require('./_lib');

module.exports = handler(async (req, res) => {
  const token = await guard(req, res); if (!token) return;
  const since = Math.max(0, parseInt(req.query.since, 10) || 0);
  const q = `rev=gt.${since}&order=rev.asc`;
  const [apps, courses, photos, files, helper, jobs] = await Promise.all([
    sb(`apps?select=id,data,deleted,rev&${q}&limit=5000`, { token }),
    sb(`course_settings?select=course,data,rev&${q}`, { token }),
    sb(`photos?select=app_id,mime,rev&${q}&limit=5000`, { token }),
    sb(`files?select=id,app_id,kind,name,size,meta,deleted,rev&${q}&limit=5000`, { token }),
    sb('helper_status?select=last_seen', { token }),
    sb('draft_jobs?select=id,app_id,status,error,created_at&or=(status.eq.offen,status.eq.fehler)&order=id.asc&limit=500', { token }),
  ]);
  let rev = since;
  for (const r of [...apps, ...courses, ...photos, ...files]) if (r.rev > rev) rev = r.rev;
  send(res, 200, {
    rev,
    apps,
    courses,
    photos: photos.map(p => ({ id: p.app_id, rev: p.rev, has: !!p.mime })),
    files,
    helperSeen: helper[0] && helper[0].last_seen,
    jobs,
    now: new Date().toISOString(),
  });
});
