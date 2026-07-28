'use strict';
const express        = require('express');
const router         = express.Router();
const fs             = require('fs');
const { sessions }   = require('../state');
const { CHATS_FILE } = require('../config/constants');

router.get('/api/health', (req, res) => {
  let chatsCount = 0;
  try { chatsCount = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8')).length; } catch {}
  res.json({
    status:         'ok',
    provider:       'Groq',
    hasApiKey:      !!process.env.GROQ_API_KEY,
    chatsCount,
    activeSessions: Object.keys(sessions).length,
    uptime:         Math.floor(process.uptime()),
  });
});

module.exports = router;
