'use strict';
const { send, guard, handler, VERSION } = require('./_lib');

module.exports = handler(async (req, res) => {
  if (!(await guard(req, res))) return;
  send(res, 200, { ok: true, version: VERSION, mistral: !!(process.env.MISTRAL_API_KEY || '').trim() });
});
