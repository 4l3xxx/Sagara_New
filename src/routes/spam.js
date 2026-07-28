'use strict';
const express        = require('express');
const router         = express.Router();
const fs             = require('fs');
const adminAuth      = require('../middleware/adminAuth');
const mlService      = require('../services/mlService');
const { SPAM_LOG_FILE, TOXIC_LOG_FILE } = require('../config/constants');

// ─── POST /api/spam/check ─────────────────────────────────────────────────────
router.post('/api/spam/check', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  if (!mlService.spamDetection)
    return res.json({ isSpam: false, score: 0, confidence: 'low' });

  res.json(mlService.spamDetection.quickCheck(text));
});

// ─── GET /api/admin/spam-logs ─────────────────────────────────────────────────
router.get('/api/admin/spam-logs', adminAuth, (req, res) => {
  try {
    if (!fs.existsSync(SPAM_LOG_FILE))
      fs.writeFileSync(SPAM_LOG_FILE, JSON.stringify([]));

    const logs  = JSON.parse(fs.readFileSync(SPAM_LOG_FILE, 'utf8'));
    const limit = parseInt(req.query.limit) || 100;
    const slice = logs.slice(0, limit);

    let high = 0, medium = 0, totalScore = 0;
    slice.forEach(l => {
      totalScore += l.spam_score || 0;
      if (l.confidence === 'high')   high++;
      else if (l.confidence === 'medium') medium++;
    });

    res.json({
      logs: slice,
      stats: {
        total:            slice.length,
        highConfidence:   high,
        mediumConfidence: medium,
        averageScore:     slice.length > 0 ? Math.round(totalScore / slice.length) : 0,
      },
    });
  } catch (err) {
    console.error('[Spam] Log read error:', err.message);
    res.status(500).json({ error: 'Failed to load spam logs' });
  }
});

// ─── GET /api/admin/toxic-logs ────────────────────────────────────────────────
router.get('/api/admin/toxic-logs', adminAuth, (req, res) => {
  try {
    if (!fs.existsSync(TOXIC_LOG_FILE))
      fs.writeFileSync(TOXIC_LOG_FILE, JSON.stringify([]));

    const logs  = JSON.parse(fs.readFileSync(TOXIC_LOG_FILE, 'utf8'));
    const limit = parseInt(req.query.limit) || 100;
    const slice = logs.slice(0, limit);

    const byCategory = {};
    slice.forEach(l => {
      byCategory[l.category] = (byCategory[l.category] || 0) + 1;
    });

    res.json({
      logs: slice,
      stats: {
        total:      slice.length,
        byCategory,
      },
    });
  } catch (err) {
    console.error('[ToxicLog] Read error:', err.message);
    res.status(500).json({ error: 'Failed to load toxic logs' });
  }
});

module.exports = router;
