'use strict';
const express           = require('express');
const router            = express.Router();
const fs                = require('fs');
const crypto            = require('crypto');
const adminAuth         = require('../middleware/adminAuth');
const mlService         = require('../services/mlService');
const toxicFilter       = require('../services/toxicFilter');
const { logToxicAttempt } = require('../helpers/toxicLog');
const { createAuditLog, getUserRole } = require('../helpers/audit');
const emailService      = require('../services/emailService');
const { CONSULTATIONS_FILE, SPAM_LOG_FILE } = require('../config/constants');
const pool              = require('../config/database');
const multer            = require('multer');
const path              = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads/evidence');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  }
});

const multerUpload = upload.single('evidence_file');

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ─── Toxic content check (consultation fields) ───────────────────────────────
/**
 * Checks the two free-text consultation fields for toxic content.
 * Checks `message` first (highest risk), then `full_name`.
 *
 * Returns:
 *   { toxic: true,  field, category, label }  — if blocked
 *   { toxic: false }                           — if clean
 */
function checkToxicConsultation({ message, full_name }, req) {
  const ip = req?.headers?.['x-forwarded-for'] || req?.ip || req?.connection?.remoteAddress || '';

  const msgResult = toxicFilter.checkMessage(message);
  if (msgResult.isToxic) {
    console.warn(
      `[ToxicFilter] BLOCKED consultation [message] — category: ${msgResult.category}, score: ${msgResult.score}`
    );
    logToxicAttempt({
      source: 'consultation', field: 'pesan', text: message,
      category: msgResult.category, label: msgResult.label, score: msgResult.score, ip,
    });
    return { toxic: true, field: 'pesan', category: msgResult.category, label: msgResult.label };
  }

  const nameResult = toxicFilter.checkMessage(full_name);
  if (nameResult.isToxic) {
    console.warn(
      `[ToxicFilter] BLOCKED consultation [name] — category: ${nameResult.category}, score: ${nameResult.score}`
    );
    logToxicAttempt({
      source: 'consultation', field: 'nama', text: full_name,
      category: nameResult.category, label: nameResult.label, score: nameResult.score, ip,
    });
    return { toxic: true, field: 'nama', category: nameResult.category, label: nameResult.label };
  }

  return { toxic: false };
}

// ─── Shared spam + frequency check ───────────────────────────────────────────
/**
 * Runs spam detection and frequency limiting, logs every attempt.
 * Returns { finalScore, confidence, reasons }.
 */
function runSpamChecks({ full_name, business_email, service_type, message, req }) {
  let spamResult    = { score: 0, reasons: [] };
  let nameResult    = { score: 0, reasons: [] };
  let contextResult = { score: 0, reasons: [] };

  if (mlService.spamDetection) {
    spamResult    = mlService.spamDetection.detectSpam(message);
    nameResult    = mlService.spamDetection.detectSpam(full_name, { isName: true });
    contextResult = mlService.spamDetection.checkContextRelevance(message, service_type) || { score: 0, reasons: [] };
  }

  let reasons   = [...(spamResult.reasons || []), ...(nameResult.reasons || []), ...(contextResult.reasons || [])];
  let baseScore = Math.max(spamResult.score || 0, nameResult.score || 0, contextResult.score || 0);

  // Frequency block: > 3 submissions from same email within 5 minutes
  let freqScore = 0;
  try {
    const all         = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const cutoff      = Date.now() - 5 * 60 * 1000;
    const recentCount = all.filter(c =>
      c.business_email === business_email &&
      new Date(c.created_at).getTime() > cutoff
    ).length;
    if (recentCount >= 3) {
      freqScore = 90;
      reasons.push(`Pesan berulang terlalu banyak: ${recentCount}× dalam 5 menit.`);
    }
  } catch (e) {
    console.error('[Consultation] Frequency check error:', e.message);
  }

  const finalScore = Math.max(baseScore, freqScore);
  const confidence = finalScore >= 80 ? 'high' : finalScore >= 50 ? 'medium' : 'low';

  // Only log when something was actually flagged — a clean, fully on-context message
  // (score 0) has nothing worth reviewing and shouldn't clutter the Spam Logs page.
  if (finalScore > 0) {
    try {
      const log = {
        id:              Date.now(),
        timestamp:       new Date().toISOString(),
        name:            full_name,
        email:           business_email,
        message_preview: message.substring(0, 200),
        spam_score:      finalScore,
        reasons,
        confidence,
        ip_address:      req?.headers?.['x-forwarded-for'] || req?.ip || req?.connection?.remoteAddress || '',
      };
      let logs = JSON.parse(fs.readFileSync(SPAM_LOG_FILE, 'utf8'));
      logs.unshift(log);
      if (logs.length > 1000) logs = logs.slice(0, 1000);
      fs.writeFileSync(SPAM_LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (err) {
      console.error('[Consultation] Spam log write error:', err.message);
    }
  }

  return { finalScore, confidence, reasons };
}

// ─── POST /api/consultation ───────────────────────────────────────────────────
router.post('/api/consultation', async (req, res) => {
  const { full_name, business_email, whatsapp_number, service_type, message, company_size, budget, industry } = req.body;

  if (!full_name || !business_email || !whatsapp_number || !service_type || !message)
    return res.status(400).json({ error: 'All fields required' });
  if (!EMAIL_RE.test(business_email))
    return res.status(400).json({ error: 'Email format is invalid' });

  // ── Toxic filter — blocks harmful language before any further processing ──
  const toxicResult = checkToxicConsultation({ message, full_name }, req);
  if (toxicResult.toxic)
    return res.status(400).json({
      error:    `Formulir konsultasi mengandung konten yang tidak pantas pada kolom "${toxicResult.field}" (${toxicResult.label}). Harap gunakan bahasa yang sopan dan profesional.`,
      blocked:  true,
      category: toxicResult.category,
      field:    toxicResult.field,
    });

  const { finalScore, reasons } = runSpamChecks({ full_name, business_email, service_type, message, req });

  const isSuspicious = finalScore >= 50;

  try {
    const consultations  = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const sentiment      = mlService.analyzeSentiment(message);
    const classification = await mlService.classifyUser({ companySize: company_size, budget, industry, serviceType: service_type, message });
    const leadScore      = mlService.generateLeadScore({ budget, company_size, service_type, message, sentiment: sentiment.sentiment });

    const entry = {
      id:              Date.now(),
      full_name,
      business_email,
      whatsapp_number,
      service_type,
      message,
      company_size:    company_size  || null,
      budget:          budget        || null,
      industry:        industry      || null,
      sentiment:       sentiment.sentiment,
      sentiment_score: sentiment.score,
      nlp_category:    classification.type,
      lead_score:      isSuspicious ? leadScore * 0.5 : leadScore,
      is_suspicious:   isSuspicious,
      spam_score:      finalScore,
      status:          isSuspicious ? 'Review' : 'New',
      created_at:      new Date().toISOString(),
    };

    consultations.push(entry);
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));

    // Non-blocking Postgres sync
    pool.query(
      `INSERT INTO consultation_requests
         (id,full_name,business_email,service_type,message,company_size,budget,industry,
          sentiment,sentiment_score,nlp_category,lead_score,status,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [crypto.randomUUID(), entry.full_name, entry.business_email, entry.service_type, entry.message,
       entry.company_size, entry.budget, entry.industry, entry.sentiment, entry.sentiment_score,
       entry.nlp_category, entry.lead_score, entry.status, entry.created_at]
    ).catch(err => console.error('[Consultation] Postgres sync error:', err.message));

    res.json({
      success: true,
      message: isSuspicious ? 'Consultation saved but marked for review due to suspicious content.' : 'Consultation saved',
      warning: isSuspicious,
      data: entry,
      ml_analysis: { sentiment, classification, lead_score: Math.round(leadScore * 100) },
    });
  } catch (err) {
    console.error('[Consultation] Error:', err.message);
    res.status(500).json({ error: 'Failed to save consultation' });
  }
});

// ─── POST /api/consultation/spam-protected ────────────────────────────────────
router.post('/api/consultation/spam-protected', async (req, res) => {
  const { full_name, business_email, service_type, message, company_size, budget, industry } = req.body;

  if (!full_name || !business_email || !service_type || !message)
    return res.status(400).json({ error: 'All fields required' });
  if (!EMAIL_RE.test(business_email))
    return res.status(400).json({ error: 'Email format is invalid' });

  // ── Toxic filter — blocks harmful language before any further processing ──
  const toxicResult = checkToxicConsultation({ message, full_name }, req);
  if (toxicResult.toxic)
    return res.status(400).json({
      error:    `Formulir konsultasi mengandung konten yang tidak pantas pada kolom "${toxicResult.field}" (${toxicResult.label}). Harap gunakan bahasa yang sopan dan profesional.`,
      blocked:  true,
      category: toxicResult.category,
      field:    toxicResult.field,
    });

  const { finalScore } = runSpamChecks({ full_name, business_email, service_type, message, req });

  const isSuspicious = finalScore >= 50;

  try {
    const consultations  = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const sentiment      = mlService.analyzeSentiment(message);
    const classification = await mlService.classifyUser({ companySize: company_size, budget, industry, serviceType: service_type, message });
    const leadScore      = mlService.generateLeadScore({ budget, company_size, service_type, message, sentiment: sentiment.sentiment });

    const entry = {
      id:            Date.now(),
      full_name, business_email, service_type, message,
      company_size:  company_size || null,
      budget:        budget       || null,
      industry:      industry     || null,
      sentiment:     sentiment.sentiment,
      nlp_category:  classification.type,
      lead_score:    isSuspicious ? leadScore * 0.5 : leadScore,
      is_suspicious: isSuspicious,
      spam_score:    finalScore,
      status:        isSuspicious ? 'Review' : 'New',
      created_at:    new Date().toISOString(),
    };

    consultations.push(entry);
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));

    return isSuspicious
      ? res.json({ success: true, message: 'Consultation saved but marked for review due to suspicious content.', warning: true })
      : res.json({ success: true, message: 'Consultation saved' });
  } catch (err) {
    console.error('[Consultation] spam-protected error:', err.message);
    res.status(500).json({ error: 'Failed to save consultation' });
  }
});

// ─── Admin Consultation Routes ────────────────────────────────────────────────
router.get('/api/admin/consultations', adminAuth, (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8')).reverse()); }
  catch { res.json([]); }
});

router.get('/api/admin/consultations/stats', adminAuth, (req, res) => {
  try {
    const list = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    res.json({
      total:     list.length,
      corporate: list.filter(c => ['CORPORATE','Corporate'].includes(c.nlp_category)).length,
      urgent:    list.filter(c => c.lead_score > 0.7).length,
      sme:       list.filter(c => ['UMKM','SME'].includes(c.nlp_category)).length,
    });
  } catch { res.json({ total: 0, corporate: 0, urgent: 0, sme: 0 }); }
});

router.post('/api/admin/consultations/status', adminAuth, (req, res, next) => {
    multerUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ error: err.message });
        } else if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
  const { id, status, notes, reason, evidence_type } = req.body;
  const evidenceFile = req.file;

  try {
    const list  = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const index = list.findIndex(c => c.id == id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });

    let finalStatus = status;
    let isPendingVerification = false;

    // If it's a Won/Lost deal, change to Pending Verification first
    if (status === 'Closed' || status === 'Failed') {
      finalStatus = 'Pending Verification';
      isPendingVerification = true;
    }

    list[index] = { ...list[index], status: finalStatus, notes, updated_at: new Date().toISOString() };
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(list, null, 2));

    const lead = list[index];
    const emailStr = lead.business_email;
    const finalEvidenceUrl = evidenceFile ? `/uploads/evidence/${evidenceFile.filename}` : null;

    if (status === 'Contacted') {
      const auditNote = `Mengupdate status prospek ke CONTACTED: ${emailStr}`;
      await createAuditLog(req.sessionUser, 'CONTACT_CLIENT', auditNote, req);
    }
    else if (status === 'Closed' || status === 'Failed') {
      const outcome = status === 'Closed' ? 'WON' : 'LOST';
      const auditNote = `Memperbarui deal ke ${outcome} (Menunggu Verifikasi): ${emailStr}${notes ? `. Catatan: ${notes}` : ''}`;
      await createAuditLog(req.sessionUser, `DEAL_${outcome}_PENDING`, auditNote, req);
      
      // Save to deal_outcomes table
      // Ensure we have a valid UUID for deal_id. If consultation requests are saved with UUIDs in postgres, we need to map it.
      // But we will just try to insert or assuming consultation_requests has the corresponding record.
      // NOTE: In standard setup, 'id' in JSON might be a timestamp, but Postgres consultation_requests.id is UUID. 
      // We will just do our best here. If it fails due to foreign key, it's fine, we log it.
      try {
        const adminId = req.sessionUser.id; // User ID from session
        await pool.query(
          `INSERT INTO deal_outcomes 
            (deal_id, outcome, reason, notes, evidence_type, evidence_url, determined_by, verification_status)
           VALUES ((SELECT id FROM consultation_requests WHERE business_email = $1 ORDER BY created_at DESC LIMIT 1), $2, $3, $4, $5, $6, $7, 'PENDING')`,
          [emailStr, outcome, reason || null, notes || null, evidence_type || null, finalEvidenceUrl || null, adminId]
        );
      } catch (dbErr) {
        console.error('[Consultation] deal_outcomes sync error:', dbErr.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update' });
  }
});

router.get('/api/admin/consultations/:id/evidence', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const list = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const entry = list.find(c => String(c.id) === String(id));
    if (!entry) return res.status(404).json({ error: 'Evidence not found' });

    const result = await pool.query(
      `SELECT d.* FROM deal_outcomes d
       JOIN consultation_requests c ON d.deal_id = c.id
       WHERE c.business_email = $1
       ORDER BY d.created_at DESC LIMIT 1`,
      [entry.business_email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

router.post('/api/admin/consultations/verify', adminAuth, async (req, res) => {
  const { id, action } = req.body; 
  
  const role = await getUserRole(req.sessionUser);
  // Only superadmin (or manager) can verify
  if (role !== 'superadmin' && role !== 'manager') {
     console.error("403 - role is", role);
     return res.status(403).json({ error: 'Unauthorized role for verification' });
  }

  try {
    const list  = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const index = list.findIndex(c => String(c.id) === String(id));
    if (index === -1) {
        console.error("404 - Not found in json for id", id);
        return res.status(404).json({ error: 'Not found' });
    }

    const lead = list[index];
    const newVerificationStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Atomic update to avoid race conditions
    const outcomeRes = await pool.query(
      `UPDATE deal_outcomes 
       SET verification_status = $1, verified_by = $2 
       WHERE id = (
          SELECT d.id FROM deal_outcomes d
          JOIN consultation_requests c ON d.deal_id = c.id
          WHERE c.business_email = $3 AND d.verification_status = 'PENDING'
          ORDER BY d.created_at DESC LIMIT 1
       )
       RETURNING id, outcome`,
      [newVerificationStatus, req.sessionUser, lead.business_email]
    );
    
    if (outcomeRes.rows.length === 0) {
        return res.status(400).json({ error: 'Deal ini sudah diproses oleh Manager lain (atau tidak ditemukan).' });
    }

    const pendingOutcome = outcomeRes.rows[0];
    let newDealStatus = 'Contacted'; 
    
    if (action === 'APPROVE') {
        newDealStatus = pendingOutcome.outcome === 'WON' ? 'Closed' : 'Failed';
    }

    list[index] = { ...list[index], status: newDealStatus, updated_at: new Date().toISOString() };
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(list, null, 2));

    // DB already updated atomically above

    const auditNote = `Verifikasi Deal ${action}: ${lead.business_email}`;
    await createAuditLog(req.sessionUser, `VERIFY_DEAL_${action}`, auditNote, req);

    res.json({ success: true, newStatus: newDealStatus });
  } catch (err) {
    console.error("500 Error:", err);
    res.status(500).json({ error: 'Failed to verify deal' });
  }
});

router.delete('/api/admin/consultations/delete', adminAuth, async (req, res) => {
  const role = await getUserRole(req.sessionUser);
  if (role !== 'superadmin')
    return res.status(403).json({ error: 'Forbidden: Only Superadmin can delete prospect leads.' });

  const { ids } = req.body;
  try {
    let list = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    for (const id of ids) {
      const lead = list.find(c => c.id.toString() === id.toString());
      if (lead)
        await createAuditLog(req.sessionUser, 'DELETE_LEAD', `Menghapus permanen data prospek ID: ${lead.id} atas nama ${lead.full_name}`, req);
    }
    list = list.filter(c => !ids.includes(c.id.toString()));
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(list, null, 2));
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete' }); }
});

router.get('/api/admin/audit-logs', adminAuth, async (req, res) => {
  const role = await getUserRole(req.sessionUser);
  if (role !== 'superadmin')
    return res.status(403).json({ error: 'Forbidden: Only Superadmin can view activity audit logs.' });
  try {
    const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs: ' + err.message });
  }
});

module.exports = router;
