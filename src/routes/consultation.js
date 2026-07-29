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
  if (finalScore >= 80)
    return res.status(400).json({ error: 'Your message has been flagged as potential spam. Please revise your message and try again.', spam_score: finalScore, reasons });

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
  if (finalScore >= 80)
    return res.status(400).json({ error: 'Your message has been flagged as potential spam. Please revise your message and try again.', spam_score: finalScore });

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

router.post('/api/admin/consultations/status', adminAuth, async (req, res) => {
  const { id, status, notes } = req.body;
  try {
    const list  = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE, 'utf8'));
    const index = list.findIndex(c => c.id == id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });

    list[index] = { ...list[index], status, notes, updated_at: new Date().toISOString() };
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(list, null, 2));

    const lead = list[index];
    const emailStr = lead.business_email;
    if (status === 'Contacted') {
      const auditNote = `Mengupdate status prospek ke CONTACTED: ${emailStr}`;
        
      await createAuditLog(req.sessionUser, 'CONTACT_CLIENT', auditNote, req);
    }
    else if (status === 'Closed')
      await createAuditLog(req.sessionUser, 'DEAL_WON', `DEAL WON: ${emailStr}${notes ? `. ${notes}` : ''}`, req);
    else if (status === 'Failed')
      await createAuditLog(req.sessionUser, 'DEAL_LOST', `DEAL LOST: ${emailStr}${notes ? `. ${notes}` : ''}`, req);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
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
