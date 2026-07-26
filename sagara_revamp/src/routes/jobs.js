'use strict';
const express       = require('express');
const router        = express.Router();
const fs            = require('fs');
const adminAuth     = require('../middleware/adminAuth');
const emailService  = require('../services/emailService');
const multer        = require('multer');
const { JOBS_FILE } = require('../config/constants');
const pool          = require('../config/database');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

const pgTableExists = async () => {
  const r = await pool.query(`SELECT to_regclass('public.jobs')`);
  return !!r.rows[0].to_regclass;
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
router.get('/api/jobs', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8')).reverse()); } catch { res.json([]); }
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────────
router.get('/api/jobs/:id', (req, res) => {
  try {
    const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    res.json(jobs.find(j => j.id == req.params.id) || null);
  } catch (err) { res.status(500).json({ error: 'Failed to load job' }); }
});

const uploadMiddleware = upload.single('portfolio_file');

// ─── POST /api/jobs/apply ────────────────────────────────────────────────────────────
router.post('/api/jobs/apply', (req, res, next) => {
  uploadMiddleware(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds the 20MB limit.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'An unknown error occurred during file upload.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { jobId, jobTitle, name, email, phone, portfolio } = req.body;
    const file = req.file;

    if (!jobTitle || !name || !email) {
      return res.status(400).json({ error: 'Name, email, and job title are required' });
    }
    
    if (!portfolio && !file) {
      return res.status(400).json({ error: 'Please provide either a portfolio link or upload a file' });
    }

    const emailHtml = `
      <h2>New Job Application: ${jobTitle}</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || '-'}</p>
      <p><strong>Portfolio/CV Link:</strong> ${portfolio ? `<a href="${portfolio}">${portfolio}</a>` : 'Attached as file'}</p>
    `;

    const attachments = [];
    if (file) {
      attachments.push({
        filename: file.originalname,
        content: file.buffer
      });
    }

    // Send email asynchronously without waiting
    emailService.sendEmail({
      to: 'consulsagara@gmail.com',
      subject: `New Application for ${jobTitle} - ${name}`,
      text: `New Job Application: ${jobTitle}\\nName: ${name}\\nEmail: ${email}\\nPhone: ${phone}\\nPortfolio: ${portfolio || 'Attached'}`,
      html: emailHtml,
      attachments
    });

    res.json({ success: true, message: 'Application sent successfully' });
  } catch (err) {
    console.error('[Jobs] Apply error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin Jobs CRUD ──────────────────────────────────────────────────────────
router.post('/api/admin/jobs', adminAuth, async (req, res) => {
  try {
    const { title, location, type, salary, experience, description, requirements, is_active } = req.body;
    if (!title || !location || !type || !salary || !experience || !description || !requirements)
      return res.status(400).json({ error: 'All fields are required' });

    const jobs   = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    const newJob = {
      id:           Date.now(),
      title, location, type, salary, experience, description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split('\n').map(r => r.trim()).filter(Boolean),
      created_at:   new Date().toISOString(),
      is_active:    is_active === undefined ? true : !!is_active,
    };
    jobs.push(newJob);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));

    if (await pgTableExists().catch(() => false)) {
      pool.query(
        `INSERT INTO jobs (id,title,location,type,salary,experience,description,requirements,created_at,is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [newJob.id.toString(), newJob.title, newJob.location, newJob.type, newJob.salary,
         newJob.experience, newJob.description, JSON.stringify(newJob.requirements), newJob.created_at, newJob.is_active]
      ).catch(e => console.error('[Jobs] Postgres create error:', e.message));
    }

    res.json({ success: true, job: newJob });
  } catch (err) {
    console.error('[Jobs] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create job position' });
  }
});

router.put('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    const { title, location, type, salary, experience, description, requirements, is_active } = req.body;

    const jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    const idx  = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) return res.status(404).json({ error: 'Job position not found' });

    const orig = jobs[idx];
    const reqs = requirements
      ? (Array.isArray(requirements) ? requirements : requirements.split('\n').map(r => r.trim()).filter(Boolean))
      : orig.requirements;

    jobs[idx] = {
      ...orig,
      title:       title       || orig.title,
      location:    location    || orig.location,
      type:        type        || orig.type,
      salary:      salary      || orig.salary,
      experience:  experience  || orig.experience,
      description: description || orig.description,
      requirements: reqs,
      is_active:   is_active === undefined ? orig.is_active : !!is_active,
      updated_at:  new Date().toISOString(),
    };
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));

    if (await pgTableExists().catch(() => false)) {
      const j = jobs[idx];
      pool.query(
        `UPDATE jobs SET title=$1,location=$2,type=$3,salary=$4,experience=$5,description=$6,requirements=$7,is_active=$8,updated_at=$9 WHERE id=$10`,
        [j.title, j.location, j.type, j.salary, j.experience, j.description,
         JSON.stringify(j.requirements), j.is_active, j.updated_at, jobId.toString()]
      ).catch(e => console.error('[Jobs] Postgres update error:', e.message));
    }

    res.json({ success: true, job: jobs[idx] });
  } catch (err) {
    console.error('[Jobs] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update job position' });
  }
});

router.delete('/api/admin/jobs/:id', adminAuth, async (req, res) => {
  try {
    const jobId = parseInt(req.params.id);
    let jobs    = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf8'));
    const filtered = jobs.filter(j => j.id !== jobId);
    if (filtered.length === jobs.length) return res.status(404).json({ error: 'Job position not found' });

    fs.writeFileSync(JOBS_FILE, JSON.stringify(filtered, null, 2));

    if (await pgTableExists().catch(() => false))
      pool.query(`DELETE FROM jobs WHERE id=$1`, [jobId.toString()])
          .catch(e => console.error('[Jobs] Postgres delete error:', e.message));

    res.json({ success: true, message: 'Job position deleted successfully' });
  } catch (err) {
    console.error('[Jobs] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete job position' });
  }
});

module.exports = router;
