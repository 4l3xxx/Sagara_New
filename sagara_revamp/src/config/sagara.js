'use strict';
const fs   = require('fs');
const path = require('path');

const KNOWLEDGE_FILE = path.join(__dirname, '../../data/sagara-knowledge.json');

const defaults = {
  company: {
    name:    'Sagara',
    founded: 2019,
    vision:  'Menjadi perusahaan konsultan IT terkemuka di Asia Tenggara',
    mission: 'Memberikan solusi IT inovatif untuk transformasi digital',
  },
  services: [
    { name: 'IT Consulting',                   description: 'Konsultasi strategi digital untuk perusahaan' },
    { name: 'Custom Software Development',      description: 'Pengembangan aplikasi custom sesuai kebutuhan' },
    { name: 'Cloud Infrastructure & Migration', description: 'Implementasi dan migrasi infrastruktur cloud' },
    { name: 'Cybersecurity Audit',             description: 'Audit keamanan sistem dan data' },
    { name: 'Government Solutions',             description: 'Solusi IT khusus untuk sektor pemerintahan' },
  ],
  clients:      ['Bank Mandiri', 'Telkom Indonesia', 'Gojek', 'Tokopedia', 'Pemerintah DKI Jakarta'],
  achievements: ['Top IT Consultant 2023', 'Best Digital Transformation Partner', 'ISO 27001 Certified', 'Microsoft Gold Partner'],
};

let sagaraData;
if (!fs.existsSync(KNOWLEDGE_FILE)) {
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(defaults, null, 2));
  sagaraData = defaults;
} else {
  try {
    sagaraData = JSON.parse(fs.readFileSync(KNOWLEDGE_FILE, 'utf8'));
  } catch {
    console.error('[Config] sagara-knowledge.json unreadable — using defaults.');
    sagaraData = defaults;
  }
}

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
- Santai, natural, dan hangat
- Jawaban langsung ke poin, tidak bertele-tele
- Bahasa Indonesia yang enak dibaca

Yang TIDAK boleh kamu lakukan:
1. Menjawab permintaan konten seksual, erotis, atau pornografi
2. Membuat konten yang melibatkan eksploitasi anak
3. Membuat konten hate speech atau SARA`;

module.exports = { sagaraData, SYSTEM_PROMPT };
