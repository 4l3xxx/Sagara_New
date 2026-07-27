'use strict';
const fs = require('fs');
const { TOXIC_LOG_FILE } = require('../config/constants');

function logToxicAttempt({ source, field, text, category, label, score, ip }) {
  try {
    if (!fs.existsSync(TOXIC_LOG_FILE)) fs.writeFileSync(TOXIC_LOG_FILE, JSON.stringify([]));

    const log = {
      id:            Date.now(),
      timestamp:     new Date().toISOString(),
      source,
      field:         field || null,
      text_preview:  (text || '').substring(0, 200),
      category,
      label,
      score,
      ip_address:    ip || '',
    };

    let logs = JSON.parse(fs.readFileSync(TOXIC_LOG_FILE, 'utf8'));
    logs.unshift(log);
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    fs.writeFileSync(TOXIC_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('[ToxicLog] write error:', err.message);
  }
}

module.exports = { logToxicAttempt };
