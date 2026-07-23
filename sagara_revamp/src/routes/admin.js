'use strict';
const express            = require('express');
const router             = express.Router();
const path               = require('path');
const fs                 = require('fs');
const crypto             = require('crypto');
const bcrypt              = require('bcrypt');
const speakeasy          = require('speakeasy');
const QRCode             = require('qrcode');
const multer             = require('multer');
const adminAuth          = require('../middleware/adminAuth');
const loginLimiter       = require('../middleware/loginLimiter');
const twoFaLimiter       = require('../middleware/twoFaLimiter');
const { createAuditLog, getUserRole } = require('../helpers/audit');
const { logLoginAttempt } = require('../helpers/loginLog');
const { sessions, twoFASecrets, ADMINS } = require('../state');
const { CHATS_FILE, CONTENT_FILE } = require('../config/constants');

// ─── Multer (image upload) ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `upload-${suffix}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const ok = /jpeg|jpg|png|webp|gif/.test(file.mimetype) && /jpeg|jpg|png|webp|gif/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only images allowed (jpg, jpeg, png, webp, gif)!'), ok);
  },
});

// ─── Static admin panel ───────────────────────────────────────────────────────
router.use('/admin', express.static(path.join(__dirname, '../../admin')));

// ─── GET /admin/login ────────────────────────────────────────────────────────
router.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../admin/login.html'));
});

// ─── POST /admin/login ───────────────────────────────────────────────────────
router.post('/admin/login', loginLimiter, async (req, res) => {
  const { username, password, redirectTo } = req.body;
  const ip = req?.headers?.['x-forwarded-for'] || req?.ip || req?.connection?.remoteAddress || '';

  let matchedAdmin = null;
  for (const admin of ADMINS) {
    if (admin.username !== username) continue;
    if (await bcrypt.compare(password || '', admin.passwordHash)) {
      matchedAdmin = admin;
      break;
    }
  }

  if (matchedAdmin) {
    logLoginAttempt({ username, success: true, ip });
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions[sessionId] = { username, loginAt: new Date() };
    const secureFlag = req.secure ? '; Secure' : '';
    res.setHeader('Set-Cookie', `adminSession=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${secureFlag}`);
    return res.redirect(redirectTo === 'homepage' ? '/' : '/admin/dashboard');
  }

  logLoginAttempt({ username, success: false, ip });
  res.status(401).send(`<script>alert('Username atau password salah!');window.location='/admin/login';</script>`);
});

// ─── GET /admin ───────────────────────────────────────────────────────────────
router.get('/admin', (req, res) => {
  const cookie    = req.headers.cookie || '';
  const sessionId = cookie.match(/adminSession=([^;]+)/)?.[1];
  res.redirect(sessionId && sessions[sessionId] ? '/admin/dashboard' : '/admin/login');
});

// ─── GET /admin/dashboard ─────────────────────────────────────────────────────
router.get('/admin/dashboard', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '../../admin/dashboard.html'));
});

// ─── GET /admin/logout ────────────────────────────────────────────────────────
router.get('/admin/logout', (req, res) => {
  const sessionId = (req.headers.cookie || '').match(/adminSession=([^;]+)/)?.[1];
  if (sessionId) delete sessions[sessionId];
  res.setHeader('Set-Cookie', 'adminSession=; Max-Age=0; Path=/; HttpOnly');
  res.redirect('/admin/login');
});

// ─── GET /api/admin/me ────────────────────────────────────────────────────────
router.get('/api/admin/me', adminAuth, async (req, res) => {
  const role = await getUserRole(req.sessionUser);
  res.json({ username: req.sessionUser, role });
});

// ─── GET /api/admin/stats ────────────────────────────────────────────────────
router.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    res.json({
      totalChats:     chats.length,
      todayChats:     chats.filter(c => c.timestamp.startsWith(today)).length,
      lastChat:       chats[chats.length - 1] || null,
      systemUptime:   process.uptime(),
      hasApiKey:      !!process.env.GROQ_API_KEY,
    });
  } catch (err) { res.status(500).json({ error: 'Failed to load stats' }); }
});

// ─── GET /api/admin/chats ────────────────────────────────────────────────────
router.get('/api/admin/chats', adminAuth, (req, res) => {
  try {
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    const limit = parseInt(req.query.limit) || 50;
    res.json(chats.slice(-limit).reverse());
  } catch { res.status(500).json({ error: 'Failed to load chats' }); }
});

// ─── DELETE /api/admin/chats ──────────────────────────────────────────────────
router.delete('/api/admin/chats', adminAuth, (req, res) => {
  try { fs.writeFileSync(CHATS_FILE, JSON.stringify([])); res.json({ success: true }); }
  catch { res.status(500).json({ error: 'Failed to clear chats' }); }
});

router.delete('/api/admin/chats/:id', adminAuth, (req, res) => {
  try {
    const id    = parseInt(req.params.id);
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE, 'utf8'));
    const next  = chats.filter(c => c.id !== id);
    if (next.length === chats.length) return res.status(404).json({ error: 'Chat not found' });
    fs.writeFileSync(CHATS_FILE, JSON.stringify(next, null, 2));
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete chat' }); }
});

// ─── Content management ───────────────────────────────────────────────────────
router.get('/api/admin/content', adminAuth, (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'))); }
  catch { res.status(500).json({ error: 'Failed to load content' }); }
});

router.post('/api/admin/content', adminAuth, async (req, res) => {
  try {
    const content = { ...req.body, lastUpdated: new Date().toISOString() };
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
    await createAuditLog(req.sessionUser, 'EDIT_HOMEPAGE', 'Mengubah teks Hero Title / Subtitle pada halaman utama', req);
    res.json({ success: true, content });
  } catch { res.status(500).json({ error: 'Failed to save content' }); }
});

// ─── Image upload ─────────────────────────────────────────────────────────────
router.post('/api/admin/upload', adminAuth, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) return res.status(400).json({ error: `Multer error: ${err.message}` });
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Please upload an image file.' });
    res.json({ success: true, url: `/uploads/${req.file.filename}` });
  });
});

// ─── 2FA ──────────────────────────────────────────────────────────────────────
router.post('/api/2fa/generate', adminAuth, (req, res) => {
  const secret = speakeasy.generateSecret({ name: `Sagara Admin (${req.sessionUser})` });
  twoFASecrets[req.sessionUser] = secret.base32;
  QRCode.toDataURL(secret.otpauth_url, (err, qrCode) => {
    if (err) return res.status(500).json({ error: 'Failed to generate QR code' });
    res.json({ qrCode, secret: secret.base32 });
  });
});

router.post('/api/2fa/verify', adminAuth, twoFaLimiter, (req, res) => {
  const { username, token } = req.body;
  const secret = twoFASecrets[username];
  if (!secret) return res.status(404).json({ error: '2FA not set up for this user' });

  const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  return res.status(verified ? 200 : 401).json({ verified });
});

router.post('/api/admin/translate', adminAuth, async (req, res) => {
  const { text, sourceLang, targetLang } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       'llama-3.3-70b-versatile',
        max_tokens:  1024,
        temperature: 0.1,
        messages: [
          {
            role:    'system',
            content: `You are a professional translator. Translate the user's text from ${sourceLang === 'id' ? 'Indonesian' : 'English'} to ${targetLang === 'id' ? 'Indonesian' : 'English'}. Output ONLY the raw translated text, do not add quotes, preamble, notes or explanation.`,
          },
          { role: 'user', content: text },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Groq translation error' });

    const translatedText = data?.choices?.[0]?.message?.content?.trim();
    if (!translatedText) return res.status(500).json({ error: 'Invalid response from translation API' });

    return res.json({ translatedText });
  } catch (err) {
    console.error('Translation error:', err.message);
    return res.status(500).json({ error: 'Translation failed' });
  }
});

module.exports = router;
