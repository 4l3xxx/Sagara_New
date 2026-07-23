'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// ML SERVICE — Sentiment · Classification · Lead Score · Spam Detection
// Moved from root ml-service.js — canonical location is now src/services/
// ─────────────────────────────────────────────────────────────────────────────

class MLService {
  analyzeSentiment(text) {
    const pos = ['bagus','hebat','keren','puas','suka','mantap','terima kasih','thanks','good','great','awesome','love','excellent','perfect','best'];
    const neg = ['jelek','buruk','kecewa','error','lambat','gagal','bug','parah','kesal','bad','terrible','worst','poor','hate'];
    let score = 0;
    const lower = text.toLowerCase();
    pos.forEach(w => { if (lower.includes(w)) score++; });
    neg.forEach(w => { if (lower.includes(w)) score--; });
    if (score > 1) return { sentiment: 'positive', score, emoji: '😊', label: 'Positif' };
    if (score < 0) return { sentiment: 'negative', score, emoji: '😞', label: 'Negatif' };
    return { sentiment: 'neutral', score, emoji: '😐', label: 'Netral' };
  }

  async classifyUser({ companySize, budget, industry, serviceType, message }) {
    const lower = (message || '').toLowerCase();
    
    // 1. CEK EKSTREM / KEYWORD EKSPLISIT LEBIH DULU
    if (
      serviceType === 'Government Solutions' || 
      industry === 'government' ||
      lower.includes('tata kota') ||
      lower.includes('pemerintah') ||
      lower.includes('dinas') ||
      lower.includes('kementerian') ||
      lower.includes('pemda') ||
      lower.includes('bumn') ||
      lower.includes('instansi') ||
      lower.includes('layanan publik') ||
      lower.includes('lelang')
    ) {
      return { type: 'GOVERNMENT', priority: 'HIGH', color: '#f59e0b', description: 'Sektor Pemerintahan', icon: '🏛️' };
    }

    if (lower.includes('enterprise') || lower.includes('korporasi') || lower.includes('perusahaan besar')) {
      return { type: 'CORPORATE', priority: 'HIGH', color: '#137fec', description: 'Perusahaan Korporasi', icon: '🏢' };
    }

    // Cegah pesan sangat pendek/tidak jelas seperti "p", "halo", "test" diklasifikasikan spesifik
    if (lower.length < 5 || ['halo', 'hello', 'test', 'ping', 'p'].includes(lower.trim())) {
      return { type: 'GENERAL', priority: 'LOW', color: '#94a3b8', description: 'Kategori Umum', icon: '📁' };
    }

    const parsedSize = parseInt(companySize);
    const parsedBudget = parseInt(budget);
    
    if ((parsedSize > 0 && parsedSize < 50) || (parsedBudget > 0 && parsedBudget < 50000000)) {
      return { type: 'UMKM', priority: 'MEDIUM', color: '#10b981', description: 'Usaha Mikro Kecil Menengah', icon: '🏪' };
    }

    // 2. JIKA TIDAK ADA KEYWORD, TANYA KE PYTHON NLP MODEL
    let mlCategory = null;
    try {
      const nlpUrl = process.env.NLP_API_URL || 'http://nlp-service:5000';
      const response = await fetch(`${nlpUrl}/api/nlp/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message || '', service: serviceType || '' })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.category) mlCategory = data.category.toUpperCase();
      }
    } catch (error) {
      console.error('[ML Service] Gagal menghubungi Python API:', error.message);
    }

    // 3. KEMBALIKAN HASIL PREDIKSI PYTHON (JIKA ADA)
    if (mlCategory === 'GOVERNMENT') {
      return { type: 'GOVERNMENT', priority: 'HIGH', color: '#f59e0b', description: 'Sektor Pemerintahan', icon: '🏛️' };
    }
    if (mlCategory === 'SME') {
      return { type: 'UMKM', priority: 'MEDIUM', color: '#10b981', description: 'Usaha Mikro Kecil Menengah', icon: '🏪' };
    }
    if (mlCategory === 'CORPORATE') {
      return { type: 'CORPORATE', priority: 'HIGH', color: '#137fec', description: 'Perusahaan Korporasi', icon: '🏢' };
    }

    // 4. FALLBACK UMUM
    return { type: 'GENERAL', priority: 'LOW', color: '#94a3b8', description: 'Kategori Umum', icon: '📁' };
  }

  calculateMatchScore(userData, serviceData) {
    let score = 0, maxScore = 0;
    if (userData.budget && serviceData.minBudget)       { if (userData.budget >= serviceData.minBudget) score += 30; maxScore += 30; } else maxScore += 30;
    if (userData.industry && serviceData.targetIndustry){ if (userData.industry === serviceData.targetIndustry) score += 25; maxScore += 25; } else maxScore += 25;
    if (userData.companySize && serviceData.minCompanySize){ if (userData.companySize >= serviceData.minCompanySize) score += 25; maxScore += 25; } else maxScore += 25;
    if (userData.urgency === 'high') score += 20; maxScore += 20;
    return maxScore === 0 ? 50 : Math.round((score / maxScore) * 100);
  }

  generateLeadScore({ budget, company_size, service_type, message, sentiment }) {
    let score = 0.5;

    // Budget signals seriousness
    if (budget && budget > 100000000)     score += 0.2;
    else if (budget && budget > 50000000) score += 0.1;

    // Company size signals deal size
    if (company_size && company_size > 100)     score += 0.15;
    else if (company_size && company_size > 20) score += 0.05;

    // Premium service types (exact strings from the consultation form)
    const premiumServices = [
      'IT outsourcing',
      'Digital transformation / custom software',
      'Mobile app development',
    ];
    if (premiumServices.includes(service_type)) score += 0.1;

    // Message length signals engagement
    if (message && message.length > 200) score += 0.05;

    // Positive sentiment signals intent
    if (sentiment === 'positive') score += 0.05;

    return Math.min(score, 1.0);
  }

  calculatePriorityScore(c) {
    let p = (c.lead_score || 0.5) * 40;
    if (c.status === 'New') p += 20;
    const days = (Date.now() - new Date(c.created_at).getTime()) / 86400000;
    if (days > 3) p += 20; else if (days > 1) p += 10;
    if (['CORPORATE','GOVERNMENT'].includes(c.nlp_category)) p += 20;
    else if (c.nlp_category === 'UMKM') p += 10;
    return Math.min(Math.round(p), 100);
  }

  exportToCSV(data, filename = 'consultations_export.csv') {
    const headers = ['ID','Full Name','Email','Service Type','Category','Lead Score','Priority Score','Sentiment','Status','Created At'];
    const rows = data.map(item => [
      item.id, item.full_name, item.business_email, item.service_type,
      item.nlp_category || 'General', item.lead_score || 0.5,
      this.calculatePriorityScore(item), item.sentiment || 'neutral',
      item.status || 'New', item.created_at,
    ]);
    return { success: true, csv: [headers, ...rows].map(r => r.join(',')).join('\n'), filename, rowCount: data.length };
  }

  generateWordCloud(texts) {
    const stops = ['yang','dan','di','dari','ke','dengan','untuk','pada','adalah','ini','itu','saya','kamu','kami','mereka','akan','telah','bisa','dapat','atau','juga','sangat','lebih','sudah','jika','maka','karena','tetapi','namun','sehingga','terima','kasih','halo','hai'];
    const words = {};
    texts.forEach(text => {
      text.toLowerCase().replace(/[.,!?;:()"'\-]/g, '').split(' ').forEach(w => {
        if (w.length > 3 && !stops.includes(w) && !/^\d+$/.test(w)) words[w] = (words[w] || 0) + 1;
      });
    });
    const sorted = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 30);
    return {
      success: true,
      totalWords: Object.keys(words).length,
      topWords: sorted.slice(0, 10),
      wordCloudData: sorted.map(([text, weight]) => ({ text, weight, size: Math.min(40, 12 + (weight / (sorted[0]?.[1] || 1)) * 28) })),
    };
  }

  analyzeTrend(consultations) {
    const monthly = {}, byCategory = {}, bySentiment = {};
    consultations.forEach(c => {
      const m = (c.created_at || '').substring(0, 7) || 'unknown';
      monthly[m] = (monthly[m] || 0) + 1;
      const cat = c.nlp_category || 'General';
      byCategory[m] = byCategory[m] || {};
      byCategory[m][cat] = (byCategory[m][cat] || 0) + 1;
      const sent = c.sentiment || 'neutral';
      bySentiment[m] = bySentiment[m] || {};
      bySentiment[m][sent] = (bySentiment[m][sent] || 0) + 1;
    });
    const months = Object.keys(monthly).sort();
    const growthRates = [];
    for (let i = 1; i < months.length; i++) {
      const prev = monthly[months[i-1]], curr = monthly[months[i]];
      growthRates.push({ from: months[i-1], to: months[i], growth: Math.round(prev > 0 ? ((curr - prev) / prev) * 100 : 0) });
    }
    const vals = months.map(m => monthly[m]);
    const avgGrowth = growthRates.length ? growthRates.reduce((s, g) => s + g.growth, 0) / growthRates.length : 0;
    return {
      success: true, monthlyData: monthly,
      monthlyByCategory: byCategory, monthlyBySentiment: bySentiment,
      growthRates,
      totalMonths: months.length,
      averagePerMonth: Math.round(vals.reduce((a, b) => a + b, 0) / (vals.length || 1)),
      predictedNextMonth: vals.length >= 2 ? Math.round(vals[vals.length - 1] * (1 + avgGrowth / 100)) : null,
      bestMonth: Object.entries(monthly).sort((a, b) => b[1] - a[1])[0] || null,
    };
  }

  generateRecommendations(consultation) {
    const recs = [];
    const { service_type: st, nlp_category: cat } = consultation;

    // ── Service-type recommendations (strings match the actual form) ──────────
    if (['Digital transformation / custom software', 'Web development', 'Mobile app development'].includes(st)) {
      recs.push({ type: 'service', title: 'Dedicated Development Team',  description: 'Sediakan tim developer khusus untuk project jangka panjang' });
      recs.push({ type: 'service', title: 'Code Review & Optimization',  description: 'Audit kode untuk memastikan best practices dan keamanan' });
    }

    if (st === 'IT outsourcing') {
      recs.push({ type: 'service', title: 'Enterprise SLA',          description: 'Service Level Agreement untuk dukungan 24/7' });
      recs.push({ type: 'service', title: 'Tech Talent Pipeline',    description: 'Penyediaan talenta IT berkelanjutan sesuai kebutuhan' });
    }

    if (st === 'UI/UX design') {
      recs.push({ type: 'service', title: 'User Research & Testing', description: 'Validasi desain dengan pengguna nyata sebelum development' });
      recs.push({ type: 'service', title: 'Design System Creation',  description: 'Pembuatan standar UI komponen untuk konsistensi brand' });
    }

    if (st === 'Cloud Infrastructure & Migration') {
      recs.push({ type: 'service', title: 'Cloud Cost Optimization', description: 'Analisis dan optimasi biaya cloud infrastructure' });
      recs.push({ type: 'service', title: 'Disaster Recovery Plan',  description: 'Implementasi backup dan recovery strategy' });
    }

    if (st === 'Cybersecurity Audit') {
      recs.push({ type: 'service', title: 'Security Awareness Training', description: 'Pelatihan keamanan untuk seluruh karyawan' });
      recs.push({ type: 'service', title: 'Penetration Testing',         description: 'Pengujian keamanan sistem secara berkala' });
    }

    // ── Category recommendations ──────────────────────────────────────────────
    if (cat === 'GOVERNMENT') recs.push({ type: 'compliance', title: 'Regulatory Compliance Check', description: 'Pastikan solusi memenuhi regulasi dan standar pemerintah' });
    if (cat === 'CORPORATE')  recs.push({ type: 'enterprise', title: 'Enterprise SLA',              description: 'Service Level Agreement untuk dukungan korporat 24/7' });
    if (cat === 'UMKM')       recs.push({ type: 'growth',    title: 'Starter Package',              description: 'Paket awal dengan harga terjangkau khusus UMKM' });

    return { success: true, recommendations: recs, count: recs.length };
  }

  generateSummaryReport(consultations) {
    const categories = {}, sentiments = {}, statuses = {};
    let totalLead = 0;
    consultations.forEach(c => {
      const cat  = c.nlp_category || 'General';
      const sent = c.sentiment    || 'neutral';
      const stat = c.status       || 'New';
      categories[cat]  = (categories[cat]  || 0) + 1;
      sentiments[sent] = (sentiments[sent] || 0) + 1;
      statuses[stat]   = (statuses[stat]   || 0) + 1;
      totalLead += (c.lead_score || 0.5);
    });
    const total = consultations.length;
    return {
      success: true,
      summary: {
        totalConsultations: total,
        averageLeadScore:   total > 0 ? Math.round((totalLead / total) * 100) : 0,
        conversionRate:     total > 0 ? Math.round(((statuses['Closed'] || 0) / total) * 100) : 0,
        categories, sentiments, statuses,
      },
      topCategory:       Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || null,
      dominantSentiment: Object.entries(sentiments).sort((a, b) => b[1] - a[1])[0] || null,
    };
  }
}

// ─── Spam Detection ────────────────────────────────────────────────────────────
const spamKeywords = {
  high:   ['viagra','casino','poker','lottery','winner','prize','bitcoin','crypto','binary options','forex','loan','credit card','mortgage','weight loss','xxx','adult','porn','gambling','slot machine','free money','no cost','cheap','discount','offer'],
  medium: ['click here','subscribe now','limited time','guaranteed','cash','refinance','investment','profit','earn money','work from home'],
  low:    ['urgent','important','dear sir','hello sir','enquiry','inquiry','pls','kindly','asap','immediately','application','register'],
};
const spamPatterns = [
  /https?:\/\/[^\s]+/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /[!@#$%^&*(){}\[\]]{5,}/g,
  /(.)\1{5,}/g,
];

class SpamDetectionService {
  detectSpam(text) {
    const result = { isSpam: false, score: 0, reasons: [], confidence: 'low' };
    if (!text || text.length === 0) { result.isSpam = true; result.reasons.push('Empty message'); result.score = 100; return result; }

    const lower = text.toLowerCase();
    let total = 0;

    spamKeywords.high.forEach(kw => { if (lower.includes(kw)) { total += 15; result.reasons.push(`Spam keyword: "${kw}"`); } });
    spamKeywords.medium.forEach(kw => { if (lower.includes(kw)) { total += 8;  result.reasons.push(`Suspicious phrase: "${kw}"`); } });
    spamKeywords.low.forEach(kw => { if (lower.includes(kw)) total += 3; });

    spamPatterns.forEach((pat, i) => {
      const matches = text.match(pat);
      if (matches) {
        if (i === 0) { total += matches.length * 10; if (matches.length) result.reasons.push(`Contains ${matches.length} URL(s)`); }
        if (i === 1) { total += matches.length * 8;  if (matches.length) result.reasons.push(`Contains ${matches.length} email(s)`); }
        if (i === 2) { total += 10; result.reasons.push('Excessive special characters'); }
        if (i === 3) { total += 8;  result.reasons.push('Repeated characters'); }
      }
    });

    if (text.length < 20)   { total += 15; result.reasons.push('Message too short'); }
    else if (text.length > 2000) { total += 10; result.reasons.push('Message excessively long'); }

    const upRatio = (text.match(/[A-Z]/g) || []).length / (text.length || 1);
    if (upRatio > 0.5) { total += 15; result.reasons.push('Excessive uppercase'); }
    else if (upRatio > 0.3) { total += 8; result.reasons.push('High uppercase ratio'); }

    result.score = Math.min(Math.round(total), 100);
    if (result.score >= 60) { result.isSpam = true; result.confidence = result.score >= 80 ? 'high' : 'medium'; }
    else if (result.score >= 30) { result.confidence = 'medium'; result.reasons.push('Suspicious — needs review'); }
    return result;
  }

  quickCheck(text) {
    const { isSpam, score, confidence } = this.detectSpam(text);
    return { isSpam, score, confidence };
  }

  getSpamStats(logs) {
    let high = 0, medium = 0, totalScore = 0;
    logs.forEach(l => { totalScore += l.spam_score || 0; if (l.confidence === 'high') high++; else if (l.confidence === 'medium') medium++; });
    return { total: logs.length, highConfidence: high, mediumConfidence: medium, lowConfidence: logs.length - high - medium, averageScore: logs.length ? Math.round(totalScore / logs.length) : 0 };
  }
}

const ml   = new MLService();
const spam = new SpamDetectionService();

module.exports = {
  analyzeSentiment:       ml.analyzeSentiment.bind(ml),
  classifyUser:           ml.classifyUser.bind(ml),
  calculateMatchScore:    ml.calculateMatchScore.bind(ml),
  generateLeadScore:      ml.generateLeadScore.bind(ml),
  calculatePriorityScore: ml.calculatePriorityScore.bind(ml),
  exportToCSV:            ml.exportToCSV.bind(ml),
  generateWordCloud:      ml.generateWordCloud.bind(ml),
  analyzeTrend:           ml.analyzeTrend.bind(ml),
  generateRecommendations: ml.generateRecommendations.bind(ml),
  generateSummaryReport:  ml.generateSummaryReport.bind(ml),
  spamDetection: {
    detectSpam:   spam.detectSpam.bind(spam),
    quickCheck:   spam.quickCheck.bind(spam),
    getSpamStats: spam.getSpamStats.bind(spam),
  },
};
