'use strict';
const fs = require('fs');
const { LOGIN_LOG_FILE } = require('../config/constants');

function logLoginAttempt({ username, success, ip }) {
  try {
    if (!fs.existsSync(LOGIN_LOG_FILE)) fs.writeFileSync(LOGIN_LOG_FILE, JSON.stringify([]));

    const log = {
      id:         Date.now(),
      timestamp:  new Date().toISOString(),
      username:   username || '',
      success:    !!success,
      ip_address: ip || '',
    };

    let logs = JSON.parse(fs.readFileSync(LOGIN_LOG_FILE, 'utf8'));
    logs.unshift(log);
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    fs.writeFileSync(LOGIN_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error('[LoginLog] write error:', err.message);
  }
}

module.exports = { logLoginAttempt };
