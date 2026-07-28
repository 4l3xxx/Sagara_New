'use strict';
const express            = require('express');
const router             = express.Router();
const { SYSTEM_PROMPT }  = require('../config/sagara');
const { saveChat }       = require('../helpers/chat');
const toxicFilter        = require('../services/toxicFilter');
const mlService          = require('../services/mlService');
const chatLimiter        = require('../middleware/chatLimiter');
const { logToxicAttempt } = require('../helpers/toxicLog');
const { franc }           = require('franc');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const lastUserContent = (messages) =>
  messages[messages.length - 1]?.content || '';

function detectLang(text) {
  const lang = franc(text, { minLength: 1 });
  return lang === 'ind' ? 'id' : 'en';
}

// ─── Middleware: Toxic Guard ──────────────────────────────────────────────────
/**
 * Runs before any message is forwarded to Groq.
 * Blocks requests whose latest user message is flagged as toxic.
 */
function toxicGuard(req, res, next) {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) return next();

  const text   = lastUserContent(messages);
  const result = toxicFilter.checkMessage(text);

  if (result.isToxic) {
    console.warn(`[ToxicFilter] BLOCKED — category: ${result.category}, score: ${result.score}`);
    logToxicAttempt({
      source:   'chat',
      text:     text,
      category: result.category,
      label:    result.label,
      score:    result.score,
      ip:       req?.headers?.['x-forwarded-for'] || req?.ip || req?.connection?.remoteAddress || '',
    });
    const lang     = detectLang(text);
    const errorMsg = lang === 'id'
      ? `Maaf, pesan kamu mengandung konten yang tidak pantas (${result.label}). Harap gunakan bahasa yang sopan dan profesional.`
      : `Sorry, your message contains inappropriate content. Please use respectful and professional language.`;
    return res.status(400).json({
      error:    errorMsg,
      blocked:  true,
      category: result.category,
      label:    result.label,
    });
  }
  next();
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────
router.post('/api/chat', toxicGuard, chatLimiter, async (req, res) => {
  const { messages, language } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Field "messages" harus berupa array.' });
  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi di .env' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model:      'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages:   [{ role: 'system', content: SYSTEM_PROMPT + `\n\nIMPORTANT: You must reply in ${language === 'id' ? 'Indonesian' : 'English'} regardless of the language used by the user.` }, ...messages],
      }),
    });

    const data = await response.json();
    if (!response.ok)
      return res.status(response.status).json({ error: data?.error?.message || 'Groq API error.' });

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Respons API tidak valid.' });

    saveChat(lastUserContent(messages), reply);
    return res.json({ reply, usage: data.usage });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── POST /api/chat/stream ────────────────────────────────────────────────────
router.post('/api/chat/stream', toxicGuard, chatLimiter, async (req, res) => {
  const { messages, language } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Field "messages" harus berupa array.' });
  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi.' });

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  let fullResponse = '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model:      'llama-3.3-70b-versatile',
        max_tokens: 1024,
        stream:     true,
        messages:   [{ role: 'system', content: SYSTEM_PROMPT + `\n\nIMPORTANT: You must reply in ${language === 'id' ? 'Indonesian' : 'English'} regardless of the language used by the user.` }, ...messages],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      res.write(`data: ${JSON.stringify({ error: err?.error?.message || 'API error' })}\n\n`);
      return res.end();
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { res.write('data: [DONE]\n\n'); continue; }
        try {
          const event = JSON.parse(raw);
          const text  = event?.choices?.[0]?.delta?.content;
          if (text) { fullResponse += text; res.write(`data: ${JSON.stringify({ text })}\n\n`); }
        } catch (_) {}
      }
    }

    saveChat(lastUserContent(messages), fullResponse);
    res.end();
  } catch (err) {
    console.error('[Chat/Stream] Error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Streaming gagal.' })}\n\n`);
    res.end();
  }
});

// ─── POST /api/chat/sentiment ─────────────────────────────────────────────────
router.post('/api/chat/sentiment', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  res.json(mlService.analyzeSentiment(text));
});

module.exports = router;
