'use strict';
const express              = require('express');
const router               = express.Router();
const fs                   = require('fs');
const crypto               = require('crypto');
const path                 = require('path');
const adminAuth            = require('../middleware/adminAuth');
const { FACES_FILE, DATA_DIR } = require('../config/constants');
const { ADMINS, sessions } = require('../state');

const FACE_MATCH_THRESHOLD = 0.4;

function readLocalFaces() {
  try {
    const data = JSON.parse(fs.readFileSync(FACES_FILE, 'utf8'));
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }
}

function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function matchFaceLocally(descriptor) {
  let best = { name: null, distance: Infinity };
  for (const user of readLocalFaces()) {
    const distance = euclideanDistance(descriptor, user.descriptor);
    if (distance < best.distance) best = { name: user.name, distance };
  }
  if (best.name && best.distance < FACE_MATCH_THRESHOLD) return best.name;
  return null;
}



function createAdminSession(req, res, username) {
  const sessionId = crypto.randomBytes(32).toString('hex');
  sessions[sessionId] = { username, loginAt: new Date() };
  const secureFlag = req.secure ? '; Secure' : '';
  res.setHeader('Set-Cookie', `adminSession=${sessionId}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict${secureFlag}`);
  res.json({ success: true, redirect: '/admin/dashboard' });
}

// ─── POST /api/face/register ──────────────────────────────────────────────────
router.post('/api/face/register', async (req, res) => {
  const { name, descriptor } = req.body;
  if (!name || !descriptor || !Array.isArray(descriptor))
    return res.status(400).json({ error: 'Name and descriptor array required' });



  try {
    const data      = JSON.parse(fs.readFileSync(FACES_FILE, 'utf8'));
    const faceEntry = { name, descriptor, registeredAt: new Date().toISOString() };
    const existing  = data.users.findIndex(u => u.name === name);
    if (existing !== -1) data.users[existing] = faceEntry;
    else data.users.push(faceEntry);
    fs.writeFileSync(FACES_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, message: `Face registered for ${name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save face data' });
  }
});

// ─── GET /api/face/descriptors ────────────────────────────────────────────────
router.get('/api/face/descriptors', async (req, res) => {


  res.json(readLocalFaces());
});

// ─── POST /api/face/attendance ────────────────────────────────────────────────
router.post('/api/face/attendance', (req, res) => {
  const { name, action } = req.body;
  const file = path.join(DATA_DIR, 'attendance.json');
  let log = [];
  if (fs.existsSync(file)) {
    try { log = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  }
  log.push({ name, action: action || 'login', timestamp: new Date().toISOString() });
  if (log.length > 500) log.shift();
  fs.writeFileSync(file, JSON.stringify(log, null, 2));
  res.json({ success: true });
});

// ─── DELETE /api/face/user/:name ─────────────────────────────────────────────
router.delete('/api/face/user/:name', adminAuth, async (req, res) => {
  const { name } = req.params;
  try {


    const data = JSON.parse(fs.readFileSync(FACES_FILE, 'utf8'));
    data.users = data.users.filter(u => u.name !== name);
    fs.writeFileSync(FACES_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── POST /api/face/admin-login ───────────────────────────────────────────────
router.post('/api/face/admin-login', async (req, res) => {
  const { username, descriptor } = req.body;
  let verifiedUsername = null;

  if (descriptor && Array.isArray(descriptor)) {
    verifiedUsername = matchFaceLocally(descriptor);
    if (!verifiedUsername) {
      return res.status(401).json({ error: 'Face not recognized. Register your face first or use password login.' });
    }
  } else if (username) {
    verifiedUsername = username;
  }

  if (!verifiedUsername) return res.status(400).json({ error: 'Username or Face descriptor required' });

  const isValid = ADMINS.some(a => a.username === verifiedUsername);
  if (!isValid) return res.status(401).json({ error: `User "${verifiedUsername}" is not registered` });

  createAdminSession(req, res, verifiedUsername);
});

module.exports = router;
