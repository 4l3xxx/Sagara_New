'use strict';
const express              = require('express');
const router               = express.Router();
const fs                   = require('fs');
const adminAuth            = require('../middleware/adminAuth');
const { createAuditLog }   = require('../helpers/audit');
const { PORTFOLIOS_FILE }  = require('../config/constants');
const pool                 = require('../config/database');

const pgTableExists = async () => {
  const r = await pool.query(`SELECT to_regclass('public.portfolio_items')`);
  return !!r.rows[0].to_regclass;
};

const toTechArray = (val) =>
  Array.isArray(val) ? val : (val ? val.split(',').map(t => t.trim()).filter(Boolean) : []);

// ─── GET /api/portfolio ───────────────────────────────────────────────────────
router.get('/api/portfolio', (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(PORTFOLIOS_FILE, 'utf8'))); } catch { res.json([]); }
});

// ─── Admin Portfolio CRUD ─────────────────────────────────────────────────────
router.get('/api/admin/portfolio', adminAuth, (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(PORTFOLIOS_FILE, 'utf8'))); } catch { res.json([]); }
});

router.post('/api/admin/portfolio', adminAuth, async (req, res) => {
  try {
    const {
      industry, industryKey, impact, impactId, title, titleId,
      description, descriptionId, fullDescription, fullDescriptionId,
      technologies, timeline, testimonial, testimonialId, author, image,
    } = req.body;

    if (!title || !titleId || !industry || !industryKey || !image)
      return res.status(400).json({ error: 'Title, Industry, and Image are required' });

    const portfolios = JSON.parse(fs.readFileSync(PORTFOLIOS_FILE, 'utf8'));
    const entry = {
      id: Date.now(),
      industry, industryKey,
      impact:            impact           || '',
      impactId:          impactId         || '',
      title, titleId,
      description:       description      || '',
      descriptionId:     descriptionId    || '',
      fullDescription:   fullDescription  || '',
      fullDescriptionId: fullDescriptionId || '',
      technologies:      toTechArray(technologies),
      timeline:          timeline     || '',
      testimonial:       testimonial   || '',
      testimonialId:     testimonialId || '',
      author:            author        || '',
      image,
    };
    portfolios.push(entry);
    fs.writeFileSync(PORTFOLIOS_FILE, JSON.stringify(portfolios, null, 2));

    if (await pgTableExists().catch(() => false)) {
      pool.query(
        `INSERT INTO portfolio_items
           (id,title_en,title_id,subtitle_en,subtitle_id,industry,
            description_en,description_id,impact_en,impact_id,image_url,case_study_url,is_featured,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [entry.id % 2147483647, entry.title, entry.titleId, entry.description, entry.descriptionId,
         entry.industry, entry.fullDescription, entry.fullDescriptionId, entry.impact, entry.impactId,
         entry.image, null, true, new Date()]
      ).catch(e => console.error('[Portfolio] Postgres create error:', e.message));
    }

    await createAuditLog(req.sessionUser, 'SAVE_PORTFOLIO', `Menyimpan portofolio: ${entry.title}`, req);
    res.json({ success: true, portfolio: entry });
  } catch (err) {
    console.error('[Portfolio] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
});

router.put('/api/admin/portfolio/:id', adminAuth, async (req, res) => {
  try {
    const portfolioId = parseInt(req.params.id);
    const portfolios  = JSON.parse(fs.readFileSync(PORTFOLIOS_FILE, 'utf8'));
    const idx         = portfolios.findIndex(p => p.id === portfolioId);
    if (idx === -1) return res.status(404).json({ error: 'Portfolio item not found' });

    const orig = portfolios[idx];
    const body = req.body;
    portfolios[idx] = {
      ...orig,
      ...(body.industry           !== undefined && { industry:           body.industry }),
      ...(body.industryKey        !== undefined && { industryKey:        body.industryKey }),
      ...(body.impact             !== undefined && { impact:             body.impact }),
      ...(body.impactId           !== undefined && { impactId:           body.impactId }),
      ...(body.title              !== undefined && { title:              body.title }),
      ...(body.titleId            !== undefined && { titleId:            body.titleId }),
      ...(body.description        !== undefined && { description:        body.description }),
      ...(body.descriptionId      !== undefined && { descriptionId:      body.descriptionId }),
      ...(body.fullDescription    !== undefined && { fullDescription:    body.fullDescription }),
      ...(body.fullDescriptionId  !== undefined && { fullDescriptionId:  body.fullDescriptionId }),
      ...(body.technologies       !== undefined && { technologies:       toTechArray(body.technologies) }),
      ...(body.timeline           !== undefined && { timeline:           body.timeline }),
      ...(body.testimonial        !== undefined && { testimonial:        body.testimonial }),
      ...(body.testimonialId      !== undefined && { testimonialId:      body.testimonialId }),
      ...(body.author             !== undefined && { author:             body.author }),
      ...(body.image              !== undefined && { image:              body.image }),
    };
    fs.writeFileSync(PORTFOLIOS_FILE, JSON.stringify(portfolios, null, 2));

    if (await pgTableExists().catch(() => false)) {
      const p = portfolios[idx];
      pool.query(
        `UPDATE portfolio_items
         SET title_en=$1,title_id=$2,subtitle_en=$3,subtitle_id=$4,industry=$5,
             description_en=$6,description_id=$7,impact_en=$8,impact_id=$9,image_url=$10
         WHERE id=$11`,
        [p.title, p.titleId, p.description, p.descriptionId, p.industry,
         p.fullDescription, p.fullDescriptionId, p.impact, p.impactId,
         p.image, portfolioId % 2147483647]
      ).catch(e => console.error('[Portfolio] Postgres update error:', e.message));
    }

    await createAuditLog(req.sessionUser, 'SAVE_PORTFOLIO', `Mengubah portofolio: ${portfolios[idx].title}`, req);
    res.json({ success: true, portfolio: portfolios[idx] });
  } catch (err) {
    console.error('[Portfolio] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update portfolio item' });
  }
});

router.delete('/api/admin/portfolio/:id', adminAuth, async (req, res) => {
  try {
    const portfolioId = parseInt(req.params.id);
    let portfolios    = JSON.parse(fs.readFileSync(PORTFOLIOS_FILE, 'utf8'));
    const filtered    = portfolios.filter(p => p.id !== portfolioId);
    if (filtered.length === portfolios.length) return res.status(404).json({ error: 'Portfolio item not found' });

    fs.writeFileSync(PORTFOLIOS_FILE, JSON.stringify(filtered, null, 2));

    if (await pgTableExists().catch(() => false))
      pool.query(`DELETE FROM portfolio_items WHERE id=$1`, [portfolioId % 2147483647])
          .catch(e => console.error('[Portfolio] Postgres delete error:', e.message));

    res.json({ success: true, message: 'Portfolio item deleted successfully' });
  } catch (err) {
    console.error('[Portfolio] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
});

module.exports = router;
