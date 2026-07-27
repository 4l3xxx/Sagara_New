'use strict';
const express = require('express');
const router = express.Router();
const fs = require('fs');
const adminAuth = require('../middleware/adminAuth');
const { LOGIN_LOG_FILE, TOXIC_LOG_FILE, SPAM_LOG_FILE } = require('../config/constants');

function readLogFile(file) {
  try {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function rangeToCutoff(range) {
  const now = Date.now();
  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.getTime();
  }
  if (range === '7d') return now - 7 * 24 * 60 * 60 * 1000;
  if (range === '30d') return now - 30 * 24 * 60 * 60 * 1000;
  return 0;
}

function bucketCountForRange(range) {
  if (range === 'today') return 24;
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 30;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildDailyBuckets(days) {
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    buckets.push({ key: dayKey(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }), loginFails: 0, toxicBlocks: 0, spamBlocks: 0 });
  }
  return buckets;
}

function buildHourlyBuckets() {
  const buckets = [];
  for (let h = 0; h < 24; h++) {
    buckets.push({ key: String(h).padStart(2, '0'), label: String(h).padStart(2, '0') + ':00', loginFails: 0, toxicBlocks: 0, spamBlocks: 0 });
  }
  return buckets;
}

function bucketKeyFor(timestamp, range) {
  const d = new Date(timestamp);
  if (range === 'today') return String(d.getHours()).padStart(2, '0');
  return dayKey(d);
}

router.get('/api/admin/security-overview', adminAuth, (req, res) => {
  try {
    const range = ['today', '7d', '30d', 'all'].includes(req.query.range) ? req.query.range : '7d';
    const cutoff = rangeToCutoff(range);

    const loginLogs = readLogFile(LOGIN_LOG_FILE).filter(l => new Date(l.timestamp).getTime() >= cutoff);
    const toxicLogs = readLogFile(TOXIC_LOG_FILE).filter(l => new Date(l.timestamp).getTime() >= cutoff);
    const spamLogs = readLogFile(SPAM_LOG_FILE).filter(l => new Date(l.timestamp).getTime() >= cutoff);

    const loginFailed = loginLogs.filter(l => !l.success).length;

    const days = range === 'today' ? 1 : bucketCountForRange(range);
    const buckets = range === 'today' ? buildHourlyBuckets() : buildDailyBuckets(days);
    const bucketMap = new Map(buckets.map(b => [b.key, b]));

    loginLogs.forEach(l => {
      if (l.success) return;
      const key = bucketKeyFor(l.timestamp, range);
      const b = bucketMap.get(key);
      if (b) b.loginFails++;
    });
    toxicLogs.forEach(l => {
      const key = bucketKeyFor(l.timestamp, range);
      const b = bucketMap.get(key);
      if (b) b.toxicBlocks++;
    });
    spamLogs.forEach(l => {
      const key = bucketKeyFor(l.timestamp, range);
      const b = bucketMap.get(key);
      if (b) b.spamBlocks++;
    });

    const events = [
      ...loginLogs.map(l => ({
        timestamp: l.timestamp,
        type: l.success ? 'login_ok' : 'login_fail',
        detail: l.username,
        ip: l.ip_address,
      })),
      ...toxicLogs.map(l => ({
        timestamp: l.timestamp,
        type: 'toxic_block',
        detail: `${l.category}, score ${l.score}`,
        ip: l.ip_address,
      })),
      ...spamLogs.map(l => ({
        timestamp: l.timestamp,
        type: 'spam_block',
        detail: `score ${l.spam_score}`,
        ip: l.ip_address,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100);

    res.json({
      range,
      cards: {
        loginAttempts: loginLogs.length,
        loginFailed,
        toxicBlocked: toxicLogs.length,
        spamBlocked: spamLogs.length,
      },
      chart: {
        labels: buckets.map(b => b.label),
        loginFails: buckets.map(b => b.loginFails),
        toxicBlocks: buckets.map(b => b.toxicBlocks),
        spamBlocks: buckets.map(b => b.spamBlocks),
      },
      events,
    });
  } catch (err) {
    console.error('[SecurityOverview] error:', err.message);
    res.status(500).json({ error: 'Failed to load security overview' });
  }
});

module.exports = router;
