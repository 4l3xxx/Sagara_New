'use strict';
/**
 * Ensures every JSON data file exists with valid seed data.
 * Called once at startup — safe to call repeatedly.
 */
const fs = require('fs');
const {
  CHATS_FILE, CONTENT_FILE, CONSULTATIONS_FILE,
  FACES_FILE, BLOGS_FILE, JOBS_FILE, PORTFOLIOS_FILE, SPAM_LOG_FILE,
} = require('../config/constants');

const seeds = {
  [CHATS_FILE]:         () => [],
  [CONSULTATIONS_FILE]: () => [],
  [FACES_FILE]:         () => ({ users: [] }),
  [SPAM_LOG_FILE]:      () => [],
  [PORTFOLIOS_FILE]:    () => [],

  [CONTENT_FILE]: () => ({
    heroTitle:    'IT Solutions Built for Corporate Innovation',
    heroSubtitle: 'Empowering your vision with top-tier talent and streamlined consulting.',
    lastUpdated:  new Date().toISOString(),
  }),

  [BLOGS_FILE]: () => ([
    {
      id: 1, title: 'Getting Started with Digital Transformation',
      title_id: 'Memulai Transformasi Digital',
      content: 'Digital transformation is no longer optional for businesses that want to stay competitive...',
      excerpt: 'Learn the fundamentals of digital transformation and how Sagara can help your business thrive.',
      author: 'Sagara Team', date: new Date().toISOString(),
      category: 'Digital Transformation',
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format',
      readTime: '5 min read',
    },
    {
      id: 2, title: 'The Future of Cloud Computing',
      title_id: 'Masa Depan Cloud Computing',
      content: 'Cloud computing has revolutionized how businesses operate...',
      excerpt: 'Explore emerging trends in cloud computing and how they can benefit your organization.',
      author: 'Sagara Team', date: new Date().toISOString(),
      category: 'Cloud Computing',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format',
      readTime: '4 min read',
    },
  ]),

  [JOBS_FILE]: () => ([
    {
      id: 1, title: 'Senior Full Stack Developer',
      location: 'Jakarta, Indonesia', type: 'Full-time',
      salary: 'IDR 15-25 Million', experience: 'Min. 3 years',
      description: 'We are looking for a Senior Full Stack Developer to join our growing team...',
      requirements: ['React/Node.js experience', 'Database management', 'Team collaboration'],
      created_at: new Date().toISOString(), is_active: true,
    },
  ]),
};

function initDataFiles() {
  let created = 0;
  for (const [file, seedFn] of Object.entries(seeds)) {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(seedFn(), null, 2));
      created++;
    }
  }
  console.log(`[Init] Data files verified (${created} created).`);
}

module.exports = { initDataFiles };
