'use strict';
const fs            = require('fs');
const { CHATS_FILE } = require('../config/constants');

/**
 * Appends a chat exchange to the rolling log (max 1000 entries).
 * Non-blocking — errors are only logged, never thrown.
 */
function saveChat(userMessage, botResponse) {
  try {
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    chats.push({
      id:          Date.now(),
      userMessage: userMessage  || '',
      botResponse: botResponse  || '',
      timestamp:   new Date().toISOString(),
    });
    if (chats.length > 1000) chats.shift();
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
  } catch (err) {
    console.error('[Chat] saveChat error:', err.message);
  }
}

module.exports = { saveChat };
