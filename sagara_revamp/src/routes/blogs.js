'use strict';
const express        = require('express');
const router         = express.Router();
const fs             = require('fs');
const adminAuth      = require('../middleware/adminAuth');
const { createAuditLog } = require('../helpers/audit');
const { BLOGS_FILE } = require('../config/constants');
const pool           = require('../config/database');

// ─── GET /api/blogs ───────────────────────────────────────────────────────────
router.get('/api/blogs', (req, res) => {
  try {
    const blogs = JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'));
    const lang  = req.query.lang || 'en';
    res.json(blogs.map(b => ({
      id: b.id,
      title:    lang === 'id' && b.title_id ? b.title_id : b.title,
      excerpt:  b.excerpt,
      content:  b.content,
      author:   b.author,
      date:     b.date,
      category: b.category,
      image:    b.image,
      readTime: b.readTime,
    })));
  } catch { res.json([]); }
});

// ─── GET /api/blogs/:id ───────────────────────────────────────────────────────
router.get('/api/blogs/:id', (req, res) => {
  try {
    const blogs = JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'));
    const blog  = blogs.find(b => b.id == req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    const lang = req.query.lang || 'en';
    res.json({ ...blog, title: lang === 'id' && blog.title_id ? blog.title_id : blog.title });
  } catch (err) { res.status(500).json({ error: 'Failed to load blog' }); }
});

// ─── Admin Blog CRUD ──────────────────────────────────────────────────────────
router.get('/api/admin/blogs', adminAuth, (req, res) => {
  try { res.json(JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'))); } catch { res.json([]); }
});

router.post('/api/admin/blogs', adminAuth, async (req, res) => {
  try {
    const { title, title_id, content, excerpt, author, category, image, readTime } = req.body;
    if (!title || !content || !image)
      return res.status(400).json({ error: 'Title, Content, and Image are required' });

    const blogs   = JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'));
    const newBlog = {
      id:       Date.now(),
      title,
      title_id: title_id || title,
      content,
      excerpt:  excerpt || content.substring(0, 150),
      author:   author  || 'Sagara Team',
      date:     new Date().toISOString(),
      category: category || 'General',
      image,
      readTime: readTime || '5 min read',
    };
    blogs.push(newBlog);
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2));

    // Non-blocking Postgres sync
    pool.query("SELECT to_regclass('public.blog_posts')").then(chk => {
      if (chk.rows[0].to_regclass) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        pool.query(
          `INSERT INTO blog_posts (id,author_id,category_id,title,slug,content,image,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [newBlog.id % 2147483647, '00000000-0000-0000-0000-000000000000', 1,
           newBlog.title, slug, newBlog.content, newBlog.image, new Date(newBlog.date)]
        ).catch(e => console.error('[Blog] Postgres sync error:', e.message));
      }
    }).catch(() => {});

    await createAuditLog(req.sessionUser, 'SAVE_BLOG', `Menerbitkan artikel: ${newBlog.title}`, req);
    res.json({ success: true, blog: newBlog });
  } catch (err) {
    console.error('[Blog] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/api/admin/blogs/:id', adminAuth, async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const { title, title_id, content, excerpt, author, category, image, readTime } = req.body;

    const blogs = JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'));
    const idx   = blogs.findIndex(b => b.id === blogId);
    if (idx === -1) return res.status(404).json({ error: 'Blog post not found' });

    blogs[idx] = {
      ...blogs[idx],
      ...(title    !== undefined && { title }),
      ...(title_id !== undefined && { title_id }),
      ...(content  !== undefined && { content }),
      ...(excerpt  !== undefined && { excerpt }),
      ...(author   !== undefined && { author }),
      ...(category !== undefined && { category }),
      ...(image    !== undefined && { image }),
      ...(readTime !== undefined && { readTime }),
    };
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2));

    pool.query("SELECT to_regclass('public.blog_posts')").then(chk => {
      if (chk.rows[0].to_regclass) {
        const b    = blogs[idx];
        const slug = b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        pool.query(
          `UPDATE blog_posts SET title=$1,slug=$2,content=$3,image=$4 WHERE id=$5`,
          [b.title, slug, b.content, b.image, blogId % 2147483647]
        ).catch(e => console.error('[Blog] Postgres update error:', e.message));
      }
    }).catch(() => {});

    await createAuditLog(req.sessionUser, 'SAVE_BLOG', `Mengubah artikel: ${blogs[idx].title}`, req);
    res.json({ success: true, blog: blogs[idx] });
  } catch (err) {
    console.error('[Blog] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/api/admin/blogs/:id', adminAuth, async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    let blogs    = JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf8'));
    const filtered = blogs.filter(b => b.id !== blogId);
    if (filtered.length === blogs.length) return res.status(404).json({ error: 'Blog post not found' });

    fs.writeFileSync(BLOGS_FILE, JSON.stringify(filtered, null, 2));

    pool.query("SELECT to_regclass('public.blog_posts')").then(chk => {
      if (chk.rows[0].to_regclass)
        pool.query(`DELETE FROM blog_posts WHERE id=$1`, [blogId % 2147483647])
            .catch(e => console.error('[Blog] Postgres delete error:', e.message));
    }).catch(() => {});

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (err) {
    console.error('[Blog] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

module.exports = router;
