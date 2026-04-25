// ============================================
// DEPENDENCIES & ENV
// ============================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Pool } = require('pg');

// ============================================
// DATABASE CONNECTION (Postgres/Supabase)
// ============================================
const pool = new Pool({
  connectionString: "postgres://postgres:alex12345@localhost:5432/sagara_revamp"
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});


// ============================================
// IMPORT ML SERVICE
// ============================================
const mlService = require('./ml-service');

// ============================================
// ADMIN CREDENTIALS
// ============================================
const ADMINS = [
  { username: process.env.ADMIN_1_USER, password: process.env.ADMIN_1_PASS },
  { username: process.env.ADMIN_2_USER, password: process.env.ADMIN_2_PASS },
  { username: process.env.ADMIN_3_USER, password: process.env.ADMIN_3_PASS },
].filter(a => a.username && a.password);

// ============================================
// EXPRESS APP SETUP
// ============================================
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// SESSION STORAGE (in-memory)
// ============================================
const sessions = {};
const twoFASecrets = {};

// ============================================
// DATA FOLDER & FILE SETUP
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const CONSULTATIONS_FILE = path.join(DATA_DIR, 'consultations.json');
const FACES_FILE = path.join(DATA_DIR, 'faces.json');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');

// Buat folder dan file jika belum ada
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CHATS_FILE)) fs.writeFileSync(CHATS_FILE, JSON.stringify([]));
if (!fs.existsSync(CONTENT_FILE)) fs.writeFileSync(CONTENT_FILE, JSON.stringify({
  heroTitle: 'IT Solutions Built for Corporate Innovation',
  heroSubtitle: 'Empowering your vision with top-tier talent and streamlined consulting.',
  lastUpdated: new Date().toISOString()
}));
if (!fs.existsSync(CONSULTATIONS_FILE)) fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify([]));
if (!fs.existsSync(FACES_FILE)) fs.writeFileSync(FACES_FILE, JSON.stringify({ users: [] }));

// ============================================
// BLOG DATA INITIALIZATION
// ============================================
if (!fs.existsSync(BLOGS_FILE)) {
    fs.writeFileSync(BLOGS_FILE, JSON.stringify([
        {
            id: 1,
            title: "Getting Started with Digital Transformation",
            title_id: "Memulai Transformasi Digital",
            content: "Digital transformation is no longer optional for businesses that want to stay competitive. It involves integrating digital technology into all areas of business, fundamentally changing how you operate and deliver value to customers.\n\nAt Sagara, we've helped over 50 enterprises successfully navigate their digital transformation journey.",
            excerpt: "Learn the fundamentals of digital transformation and how Sagara can help your business thrive in the digital age.",
            author: "Sagara Team",
            date: new Date().toISOString(),
            category: "Digital Transformation",
            image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format",
            readTime: "5 min read"
        },
        {
            id: 2,
            title: "The Future of Cloud Computing",
            title_id: "Masa Depan Cloud Computing",
            content: "Cloud computing has revolutionized how businesses operate, and the future holds even more exciting possibilities. Edge computing, serverless architecture, and multi-cloud strategies are becoming mainstream.",
            excerpt: "Explore emerging trends in cloud computing and how they can benefit your organization.",
            author: "Sagara Team",
            date: new Date().toISOString(),
            category: "Cloud Computing",
            image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format",
            readTime: "4 min read"
        }
    ], null, 2));
}

// ============================================
// JOBS DATA INITIALIZATION
// ============================================
if (!fs.existsSync(JOBS_FILE)) {
    fs.writeFileSync(JOBS_FILE, JSON.stringify([
        {
            id: 1,
            title: "Senior Full Stack Developer",
            location: "Jakarta, Indonesia",
            type: "Full-time",
            salary: "IDR 15-25 Million",
            experience: "Min. 3 years",
            description: "We are looking for a Senior Full Stack Developer to join our growing team. You will be responsible for designing, developing, and maintaining web applications for our enterprise clients.",
            requirements: ["React/Node.js experience", "Database management", "Team collaboration"],
            created_at: new Date().toISOString(),
            is_active: true
        }
    ], null, 2));
}

// ============================================
// LOAD SAGARA KNOWLEDGE DATA (RAG)
// ============================================
const SAGARA_KNOWLEDGE_FILE = path.join(DATA_DIR, 'sagara-knowledge.json');

const defaultSagaraData = {
    company: {
        name: "Sagara",
        founded: 2019,
        vision: "Menjadi perusahaan konsultan IT terkemuka di Asia Tenggara",
        mission: "Memberikan solusi IT inovatif untuk transformasi digital"
    },
    services: [
        { name: "IT Consulting", description: "Konsultasi strategi digital untuk perusahaan" },
        { name: "Custom Software Development", description: "Pengembangan aplikasi custom sesuai kebutuhan" },
        { name: "Cloud Infrastructure & Migration", description: "Implementasi dan migrasi infrastruktur cloud" },
        { name: "Cybersecurity Audit", description: "Audit keamanan sistem dan data" },
        { name: "Government Solutions", description: "Solusi IT khusus untuk sektor pemerintahan" }
    ],
    clients: ["Bank Mandiri", "Telkom Indonesia", "Gojek", "Tokopedia", "Pemerintah DKI Jakarta"],
    achievements: [
        "Top IT Consultant 2023",
        "Best Digital Transformation Partner",
        "ISO 27001 Certified",
        "Microsoft Gold Partner"
    ]
};

let sagaraData;
if (!fs.existsSync(SAGARA_KNOWLEDGE_FILE)) {
    fs.writeFileSync(SAGARA_KNOWLEDGE_FILE, JSON.stringify(defaultSagaraData, null, 2));
    sagaraData = defaultSagaraData;
} else {
    try {
        sagaraData = JSON.parse(fs.readFileSync(SAGARA_KNOWLEDGE_FILE));
    } catch (err) {
        console.error('Error loading sagara-knowledge.json, using default data');
        sagaraData = defaultSagaraData;
    }
}

// ============================================
// SYSTEM PROMPT (RAG)
// ============================================
const SYSTEM_PROMPT = `Kamu adalah Sagara AI Assistant. Berikut adalah data resmi perusahaan Sagara:

DATA PERUSAHAAN:
- Nama: ${sagaraData.company.name}
- Didirikan: ${sagaraData.company.founded}
- Visi: ${sagaraData.company.vision}
- Misi: ${sagaraData.company.mission}

LAYANAN:
${sagaraData.services.map(s => `- ${s.name}: ${s.description}`).join('\n')}

KLIEN: ${sagaraData.clients.join(', ')}

PENCAPAIAN: ${sagaraData.achievements.join(', ')}

Gunakan data ini untuk menjawab pertanyaan tentang Sagara. Jika ditanya di luar data, jawab dengan sopan bahwa kamu hanya bisa menjawab tentang Sagara.

Gaya komunikasimu:
- Santai, natural, dan hangat — seperti teman pintar yang enak diajak ngobrol
- Jawaban langsung ke poin, tidak bertele-tele
- Bahasa Indonesia yang enak dibaca, boleh campur Inggris kalau natural
- Gunakan contoh konkret dan analogi untuk hal yang kompleks

Yang TIDAK boleh kamu lakukan:
1. Menjawab permintaan konten seksual, erotis, atau pornografi
2. Membuat konten yang melibatkan eksploitasi anak
3. Membuat konten hate speech yang menyerang kelompok tertentu`;

// ============================================
// HELPER FUNCTIONS
// ============================================
function saveChat(userMessage, botResponse) {
  try {
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE));
    chats.push({
      id: Date.now(),
      userMessage: userMessage || '',
      botResponse: botResponse || '',
      timestamp: new Date().toISOString()
    });
    if (chats.length > 1000) chats.shift();
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2));
  } catch (err) {
    console.error('Error saving chat:', err);
  }
}

function adminAuth(req, res, next) {
  const cookie = req.headers.cookie;
  const sessionId = cookie?.match(/adminSession=([^;]+)/)?.[1];
  
  if (sessionId && sessions[sessionId]) {
    req.sessionUser = sessions[sessionId].username;
    return next();
  }
  
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  return res.redirect('/admin/login');
}

// ============================================
// CHAT API
// ============================================
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Field "messages" harus berupa array.' });
  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi di .env' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data?.error?.message || 'Groq API error.' });

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Respons API tidak valid.' });
    
    const userMessage = messages[messages.length - 1]?.content || '';
    saveChat(userMessage, reply);
    
    return res.json({ reply, usage: data.usage });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return res.status(400).json({ error: 'Field "messages" harus berupa array.' });
  if (!process.env.GROQ_API_KEY)
    return res.status(500).json({ error: 'GROQ_API_KEY belum dikonfigurasi.' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullResponse = '';

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      res.write(`data: ${JSON.stringify({ error: err?.error?.message || 'API error' })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
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
        if (raw === '[DONE]') { 
          res.write('data: [DONE]\n\n'); 
          continue; 
        }
        try {
          const event = JSON.parse(raw);
          const text = event?.choices?.[0]?.delta?.content;
          if (text) {
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        } catch (_) {}
      }
    }
    
    const userMessage = messages[messages.length - 1]?.content || '';
    saveChat(userMessage, fullResponse);
    res.end();

  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: 'Streaming gagal.' })}\n\n`);
    res.end();
  }
});

// ============================================
// CHAT SENTIMENT ANALYSIS
// ============================================
app.post('/api/chat/sentiment', (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Text required' });
    }
    const sentiment = mlService.analyzeSentiment(text);
    res.json(sentiment);
});

// ============================================
// BLOG API
// ============================================
app.get('/api/blogs', (req, res) => {
    try {
        const blogs = JSON.parse(fs.readFileSync(BLOGS_FILE));
        const lang = req.query.lang || 'en';
        
        const processedBlogs = blogs.map(blog => ({
            id: blog.id,
            title: lang === 'id' && blog.title_id ? blog.title_id : blog.title,
            excerpt: blog.excerpt,
            content: blog.content,
            author: blog.author,
            date: blog.date,
            category: blog.category,
            image: blog.image,
            readTime: blog.readTime
        }));
        
        res.json(processedBlogs);
    } catch (err) {
        console.error('Error loading blogs:', err);
        res.json([]);
    }
});

app.get('/api/blogs/:id', (req, res) => {
    try {
        const blogs = JSON.parse(fs.readFileSync(BLOGS_FILE));
        const blog = blogs.find(b => b.id == req.params.id);
        const lang = req.query.lang || 'en';
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        
        const processedBlog = {
            id: blog.id,
            title: lang === 'id' && blog.title_id ? blog.title_id : blog.title,
            content: blog.content,
            author: blog.author,
            date: blog.date,
            category: blog.category,
            image: blog.image,
            readTime: blog.readTime
        };
        
        res.json(processedBlog);
    } catch (err) {
        console.error('Error loading blog:', err);
        res.status(500).json({ error: 'Failed to load blog' });
    }
});

// ============================================
// CONSULTATION API
// ============================================
app.post('/api/consultation', async (req, res) => {
    const { full_name, business_email, service_type, message } = req.body;
    
    if (!full_name || !business_email || !service_type || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // 1. Save to JSON File
        const consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE));
        const newEntry = {
            id: Date.now(),
            full_name,
            business_email,
            service_type,
            message,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        consultations.push(newEntry);
        fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));

        // 2. Save to Postgres (Optional but good if DB is running)
        try {
            await pool.query(
                'INSERT INTO consultations (full_name, business_email, service_type, message, status) VALUES ($1, $2, $3, $4, $5)',
                [full_name, business_email, service_type, message, 'pending']
            );
        } catch (dbErr) {
            console.error('⚠️ DB Save skipped or failed, but file saved:', dbErr.message);
        }

        res.json({ success: true, message: 'Consultation request saved successfully' });
    } catch (err) {
        console.error('Error saving consultation:', err);
        res.status(500).json({ error: 'Failed to process consultation request' });
    }
});

// ============================================
// JOBS API
// ============================================
app.get('/api/jobs', (req, res) => {
    try {
        const jobs = JSON.parse(fs.readFileSync(JOBS_FILE));
        res.json(jobs);
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/jobs/:id', (req, res) => {
    try {
        const jobs = JSON.parse(fs.readFileSync(JOBS_FILE));
        const job = jobs.find(j => j.id == req.params.id);
        res.json(job || null);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load job' });
    }
});

// ============================================
// FACE RECOGNITION API
// ============================================
app.post('/api/face/register', (req, res) => {
  const { name, descriptor } = req.body;
  
  if (!name || !descriptor || !Array.isArray(descriptor)) {
    return res.status(400).json({ error: 'Name and descriptor array required' });
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(FACES_FILE));
    const existingIndex = data.users.findIndex(u => u.name === name);
    const faceData = {
      name: name,
      descriptor: descriptor,
      registeredAt: new Date().toISOString()
    };
    
    if (existingIndex !== -1) {
      data.users[existingIndex] = faceData;
    } else {
      data.users.push(faceData);
    }
    
    fs.writeFileSync(FACES_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, message: `Face registered for ${name}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save face data' });
  }
});

app.get('/api/face/descriptors', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(FACES_FILE));
    res.json(data.users);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/face/attendance', (req, res) => {
  const { name, action } = req.body;
  const attendanceFile = path.join(DATA_DIR, 'attendance.json');
  let attendance = [];
  if (fs.existsSync(attendanceFile)) {
    attendance = JSON.parse(fs.readFileSync(attendanceFile));
  }
  
  attendance.push({
    name,
    action: action || 'login',
    timestamp: new Date().toISOString()
  });
  
  if (attendance.length > 500) attendance.shift();
  fs.writeFileSync(attendanceFile, JSON.stringify(attendance, null, 2));
  res.json({ success: true });
});

app.delete('/api/face/user/:name', adminAuth, (req, res) => {
  const { name } = req.params;
  try {
    const data = JSON.parse(fs.readFileSync(FACES_FILE));
    data.users = data.users.filter(u => u.name !== name);
    fs.writeFileSync(FACES_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ============================================
// CONSULTATION API (WITH ML SERVICE)
// ============================================
app.get('/api/admin/consultations', adminAuth, (req, res) => {
    try {
        const consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE));
        res.json(consultations.reverse());
    } catch (err) {
        res.json([]);
    }
});

app.get('/api/admin/consultations/stats', adminAuth, (req, res) => {
    try {
        const consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE));
        const total = consultations.length;
        const corporate = consultations.filter(c => c.nlp_category === 'CORPORATE' || c.nlp_category === 'Corporate').length;
        const urgent = consultations.filter(c => c.lead_score > 0.7).length;
        res.json({ total, corporate, urgent, sme: consultations.filter(c => c.nlp_category === 'UMKM' || c.nlp_category === 'SME').length });
    } catch (err) {
        res.json({ total: 0, corporate: 0, urgent: 0, sme: 0 });
    }
});

app.post('/api/admin/consultations/status', adminAuth, (req, res) => {
    const { id, status, notes } = req.body;
    try {
        let consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE));
        const index = consultations.findIndex(c => c.id == id);
        if (index !== -1) {
            consultations[index].status = status;
            consultations[index].notes = notes;
            consultations[index].updated_at = new Date().toISOString();
            fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

app.delete('/api/admin/consultations/delete', adminAuth, (req, res) => {
    const { ids } = req.body;
    try {
        let consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE));
        consultations = consultations.filter(c => !ids.includes(c.id.toString()));
        fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

app.post('/api/consultation', async (req, res) => {
    const { full_name, business_email, service_type, message, company_size, budget, industry } = req.body;
    
    if (!full_name || !business_email || !service_type || !message) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(business_email)) {
        return res.status(400).json({ error: 'Email must be @gmail.com' });
    }
    
    try {
        let consultations = JSON.parse(fs.readFileSync(CONSULTATIONS_FILE));
        
        const sentiment = mlService.analyzeSentiment(message);
        const userData = { companySize: company_size, budget, industry, serviceType: service_type, message };
        const classification = mlService.classifyUser(userData);
        const leadScore = mlService.generateLeadScore({ budget, company_size, service_type, message });
        
        console.log(`📊 Sentiment: ${sentiment.sentiment} ${sentiment.emoji}`);
        console.log(`🏷️ Classification: ${classification.type}`);
        console.log(`🎯 Lead Score: ${Math.round(leadScore * 100)}%`);
        
        const newConsultation = {
            id: Date.now(),
            full_name,
            business_email,
            service_type,
            message,
            company_size: company_size || null,
            budget: budget || null,
            industry: industry || null,
            sentiment: sentiment.sentiment,
            sentiment_score: sentiment.score,
            nlp_category: classification.type,
            lead_score: leadScore,
            status: 'New',
            created_at: new Date().toISOString()
        };
        
        consultations.push(newConsultation);
        fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));

        // SAVE TO POSTGRES
        try {
            const query = `
                INSERT INTO consultation_requests (
                    id, full_name, business_email, service_type, message, 
                    company_size, budget, industry, sentiment, 
                    sentiment_score, nlp_category, lead_score, status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `;
            const values = [
                require('crypto').randomUUID(),
                newConsultation.full_name,
                newConsultation.business_email,
                newConsultation.service_type,
                newConsultation.message,
                newConsultation.company_size,
                newConsultation.budget,
                newConsultation.industry,
                newConsultation.sentiment,
                newConsultation.sentiment_score,
                newConsultation.nlp_category,
                newConsultation.lead_score,
                newConsultation.status,
                newConsultation.created_at
            ];
            await pool.query(query, values);
            console.log('✅ Consultation saved to Postgres');
        } catch (dbErr) {
            console.error('❌ Error saving to Postgres:', dbErr);
            // We still return success because it's saved in JSON
        }
        
        res.json({ 
            success: true, 
            message: 'Consultation saved', 
            data: newConsultation,
            ml_analysis: {
                sentiment: sentiment,
                classification: classification,
                lead_score: Math.round(leadScore * 100)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save consultation' });
    }
});

// ============================================
// ADMIN API ROUTES
// ============================================
app.get('/api/admin/stats', adminAuth, (req, res) => {
  try {
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE));
    const today = new Date().toISOString().split('T')[0];
    const todayChats = chats.filter(c => c.timestamp.startsWith(today));
    
    res.json({
      totalChats: chats.length,
      todayChats: todayChats.length,
      lastChat: chats[chats.length - 1] || null,
      systemUptime: process.uptime(),
      hasApiKey: !!process.env.GROQ_API_KEY
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.get('/api/admin/chats', adminAuth, (req, res) => {
  try {
    const chats = JSON.parse(fs.readFileSync(CHATS_FILE));
    const limit = parseInt(req.query.limit) || 50;
    res.json(chats.slice(-limit).reverse());
  } catch (err) {
    res.status(500).json({ error: 'Failed to load chats' });
  }
});

app.delete('/api/admin/chats', adminAuth, (req, res) => {
  try {
    fs.writeFileSync(CHATS_FILE, JSON.stringify([]));
    res.json({ success: true, message: 'All chats cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear chats' });
  }
});

app.delete('/api/admin/chats/:id', adminAuth, (req, res) => {
    try {
        const chatId = parseInt(req.params.id);
        const chats = JSON.parse(fs.readFileSync(CHATS_FILE));
        const filteredChats = chats.filter(chat => chat.id !== chatId);
        
        if (filteredChats.length === chats.length) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        
        fs.writeFileSync(CHATS_FILE, JSON.stringify(filteredChats, null, 2));
        res.json({ success: true, message: 'Chat deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete chat' });
    }
});

app.get('/api/admin/content', adminAuth, (req, res) => {
  try {
    const content = JSON.parse(fs.readFileSync(CONTENT_FILE));
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load content' });
  }
});

app.post('/api/admin/content', adminAuth, (req, res) => {
  try {
    const newContent = { 
      ...req.body, 
      lastUpdated: new Date().toISOString() 
    };
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(newContent, null, 2));
    res.json({ success: true, content: newContent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// ============================================
// 2FA API
// ============================================
app.post('/api/2fa/generate', adminAuth, (req, res) => {
    const secret = speakeasy.generateSecret({
        name: `Sagara Admin (${req.sessionUser})`
    });
    
    twoFASecrets[req.sessionUser] = secret.base32;
    
    QRCode.toDataURL(secret.otpauth_url, (err, qrCode) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to generate QR code' });
        }
        res.json({ qrCode, secret: secret.base32 });
    });
});

app.post('/api/2fa/verify', (req, res) => {
    const { username, token } = req.body;
    const secret = twoFASecrets[username];
    
    if (!secret) {
        return res.status(404).json({ error: '2FA not set up for this user' });
    }
    
    const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: 1
    });
    
    res.json({ verified });
});

// ============================================
// ADMIN FRONTEND ROUTES
// ============================================
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'login.html'));
});

app.post('/admin/login', (req, res) => {
  const { username, password, redirectTo } = req.body;
  
  const isValid = ADMINS.some(admin => admin.username === username && admin.password === password);
  
  if (isValid) {
    const sessionId = Date.now() + '-' + Math.random().toString(36).substring(2);
    sessions[sessionId] = { username, loginAt: new Date() };
    
    res.setHeader('Set-Cookie', `adminSession=${sessionId}; HttpOnly; Path=/; Max-Age=86400`);
    
    const target = redirectTo === 'homepage' ? '/' : '/admin/dashboard';
    res.redirect(target);
  } else {
    res.send(`
      <script>
        alert('Username atau password salah!');
        window.location='/admin/login';
      </script>
    `);
  }
});

app.post('/api/face/admin-login', (req, res) => {
  const { username } = req.body;
  
  const isValid = ADMINS.some(admin => admin.username === username);
  
  if (isValid) {
    const sessionId = Date.now() + '-' + Math.random().toString(36).substring(2);
    sessions[sessionId] = { username, loginAt: new Date() };
    
    res.setHeader('Set-Cookie', `adminSession=${sessionId}; HttpOnly; Path=/; Max-Age=86400`);
    res.json({ success: true, redirect: '/admin/dashboard' });
  } else {
    res.status(401).json({ error: 'User not found in admin list' });
  }
});

app.get('/admin/dashboard', adminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  const cookie = req.headers.cookie;
  const sessionId = cookie?.match(/adminSession=([^;]+)/)?.[1];
  
  if (sessionId && sessions[sessionId]) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

app.get('/admin/logout', (req, res) => {
  const cookie = req.headers.cookie;
  const sessionId = cookie?.match(/adminSession=([^;]+)/)?.[1];
  
  if (sessionId) {
    delete sessions[sessionId];
  }
  
  res.setHeader('Set-Cookie', 'adminSession=; Max-Age=0; Path=/; HttpOnly');
  res.redirect('/admin/login');
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    provider: 'Groq', 
    hasApiKey: !!process.env.GROQ_API_KEY,
    chatsCount: JSON.parse(fs.readFileSync(CHATS_FILE)).length,
    activeSessions: Object.keys(sessions).length
  });
});

// ============================================
// SERVE FRONTEND (catch all)
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 SERVER BERHASIL DIJALANKAN!`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📍 Website Utama    : http://localhost:${PORT}`);
  console.log(`🤖 Sagara AI Chatbot: http://localhost:${PORT}`);
  console.log(`👑 Admin Login      : http://localhost:${PORT}/admin/login`);
  console.log(`📋 Admin Dashboard  : http://localhost:${PORT}/admin/dashboard`);
  console.log(`📝 Blog Page        : http://localhost:${PORT}/blog.html`);
  console.log(`💼 Careers Page     : http://localhost:${PORT}/careers.html`);
  console.log(`${'='.repeat(50)}`);
  console.log(`🔑 AKUN LOGIN ADMIN:`);
  ADMINS.forEach(admin => {
    console.log(`   → ${admin.username} / ${admin.password}`);
  });
  console.log(`${'='.repeat(50)}`);
  console.log(`📊 Groq API Key     : ${process.env.GROQ_API_KEY ? '✅ OK' : '❌ Missing'}`);
  console.log(`💾 Data folder      : ${DATA_DIR}`);
  console.log(`📁 Sagara Knowledge : ${SAGARA_KNOWLEDGE_FILE}`);
  console.log(`${'='.repeat(50)}`);
  console.log(`🧠 ML Service       : ✅ Active (Sentiment + Classification)`);
  console.log(`🔐 2FA Service      : ✅ Active`);
  console.log(`📝 Blog API         : ✅ Active`);
  console.log(`💼 Jobs API         : ✅ Active`);
  console.log(`${'='.repeat(50)}\n`);
});