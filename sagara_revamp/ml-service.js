// ============================================
// ML SERVICE - Sentiment Analysis & Classification
// VERSION 2.0 - COMPLETE WITH SPAM DETECTION
// ============================================

class MLService {
    // ============================================
    // ============================================
    // 2. USER CLASSIFICATION
    // ============================================
    classifyUser(data) {
        const { companySize, industry, serviceType, message } = data;
        
        if (serviceType === 'Government Solutions' || industry === 'government') {
            return { 
                type: 'GOVERNMENT', 
                priority: 'HIGH', 
                color: '#f59e0b',
                description: 'Sektor Pemerintahan',
                icon: '🏛️'
            };
        }
        
        if (companySize && companySize < 50) {
            return { 
                type: 'UMKM', 
                priority: 'MEDIUM', 
                color: '#10b981',
                description: 'Usaha Mikro Kecil Menengah',
                icon: '🏪'
            };
        }
        
        const lowerMessage = (message || '').toLowerCase();
        if (lowerMessage.includes('enterprise') || lowerMessage.includes('korporasi') || lowerMessage.includes('perusahaan besar')) {
            return { 
                type: 'CORPORATE', 
                priority: 'HIGH', 
                color: '#137fec',
                description: 'Perusahaan Korporasi',
                icon: '🏢'
            };
        }
        
        return { 
            type: 'GENERAL', 
            priority: 'LOW', 
            color: '#94a3b8',
            description: 'Kategori Umum',
            icon: '📋'
        };
    }
    
    // ============================================
    // 3. MATCH SCORE CALCULATION
    // ============================================
    calculateMatchScore(userData, serviceData) {
        let score = 0;
        let maxScore = 0;
        
        maxScore += 30;
        
        if (userData.industry && serviceData.targetIndustry) {
            if (userData.industry === serviceData.targetIndustry) {
                score += 25;
            }
            maxScore += 25;
        } else {
            maxScore += 25;
        }
        
        if (userData.companySize && serviceData.minCompanySize) {
            if (userData.companySize >= serviceData.minCompanySize) {
                score += 25;
            }
            maxScore += 25;
        } else {
            maxScore += 25;
        }
        
        if (userData.urgency === 'high') {
            score += 20;
        }
        maxScore += 20;
        
        if (maxScore === 0) return 50;
        return Math.round((score / maxScore) * 100);
    }
    
    // ============================================
    // 4. LEAD SCORE GENERATION
    // ============================================
    generateLeadScore(formData) {
        let score = 0.5;
        
        if (formData.companySize && formData.companySize > 100) {
            score += 0.15;
        } else if (formData.companySize && formData.companySize > 20) {
            score += 0.05;
        }
        
        const premiumServices = ['Custom Software Development', 'Cloud Infrastructure & Migration', 'Cybersecurity Audit'];
        if (premiumServices.includes(formData.service_type)) {
            score += 0.1;
        }
        
        if (formData.message && formData.message.length > 200) {
            score += 0.05;
        }
        
        return Math.min(score, 1.0);
    }
    
    // ============================================
    // 5. PRIORITY SCORE
    // ============================================
    calculatePriorityScore(consultation) {
        let priority = 0;
        
        priority += (consultation.lead_score || 0.5) * 40;
        
        if (consultation.status === 'New') {
            priority += 20;
        }
        
        const createdDate = new Date(consultation.created_at);
        const daysOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld > 3) {
            priority += 20;
        } else if (daysOld > 1) {
            priority += 10;
        }
        
        if (consultation.nlp_category === 'CORPORATE' || consultation.nlp_category === 'GOVERNMENT') {
            priority += 20;
        } else if (consultation.nlp_category === 'UMKM') {
            priority += 10;
        }
        
        return Math.min(Math.round(priority), 100);
    }
    
    // ============================================
    // 6. EXPORT TO CSV
    // ============================================
    exportToCSV(data, filename = 'consultations_export.csv') {
        const headers = ['ID', 'Full Name', 'Email', 'Service Type', 'Category', 'Lead Score', 'Priority Score', 'Status', 'Created At'];
        
        const rows = data.map(item => [
            item.id,
            item.full_name,
            item.business_email,
            item.service_type,
            item.nlp_category || 'General',
            item.lead_score || 0.5,
            this.calculatePriorityScore(item),
            item.status || 'New',
            item.created_at
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        return {
            success: true,
            csv: csvContent,
            filename: filename,
            rowCount: data.length
        };
    }
    
    // ============================================
    // 7. WORD CLOUD GENERATION
    // ============================================
    generateWordCloud(texts) {
        const stopWords = ['yang', 'dan', 'di', 'dari', 'ke', 'dengan', 'untuk', 'pada', 'adalah', 'ini', 'itu', 'saya', 'kamu', 'kami', 'mereka', 'akan', 'telah', 'bisa', 'dapat', 'atau', 'juga', 'sangat', 'lebih', 'sudah', 'jika', 'maka', 'karena', 'tetapi', 'namun', 'sehingga', 'terima', 'kasih', 'halo', 'hai'];
        
        const words = {};
        
        texts.forEach(text => {
            const lowerText = text.toLowerCase();
            const cleanText = lowerText.replace(/[.,!?;:()"'\-]/g, '');
            const wordArray = cleanText.split(' ');
            
            wordArray.forEach(word => {
                if (word.length > 3 && !stopWords.includes(word) && !/^\d+$/.test(word)) {
                    words[word] = (words[word] || 0) + 1;
                }
            });
        });
        
        const sortedWords = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 30);
        
        const wordCloudData = sortedWords.map(([text, weight], index) => ({
            text: text,
            weight: weight,
            size: Math.min(40, 12 + (weight / sortedWords[0][1]) * 28)
        }));
        
        return {
            success: true,
            totalWords: Object.keys(words).length,
            topWords: sortedWords.slice(0, 10),
            wordCloudData: wordCloudData
        };
    }
    
    // ============================================
    // 8. TREND ANALYSIS
    // ============================================
    analyzeTrend(consultations) {
        const monthly = {};
        const monthlyByCategory = {};
        
        consultations.forEach(c => {
            const month = c.created_at ? c.created_at.substring(0, 7) : 'unknown';
            monthly[month] = (monthly[month] || 0) + 1;
            
            const category = c.nlp_category || 'General';
            if (!monthlyByCategory[month]) monthlyByCategory[month] = {};
            monthlyByCategory[month][category] = (monthlyByCategory[month][category] || 0) + 1;
        });
        
        const months = Object.keys(monthly).sort();
        const growthRates = [];
        for (let i = 1; i < months.length; i++) {
            const prev = monthly[months[i-1]];
            const curr = monthly[months[i]];
            const growth = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
            growthRates.push({
                from: months[i-1],
                to: months[i],
                growth: Math.round(growth)
            });
        }
        
        let predictedNext = null;
        if (months.length >= 2) {
            const values = months.map(m => monthly[m]);
            const avgGrowth = growthRates.reduce((sum, g) => sum + g.growth, 0) / growthRates.length;
            const lastValue = values[values.length - 1];
            predictedNext = Math.round(lastValue * (1 + avgGrowth / 100));
        }
        
        return {
            success: true,
            monthlyData: monthly,
            monthlyByCategory: monthlyByCategory,
            growthRates: growthRates,
            totalMonths: months.length,
            averagePerMonth: Math.round(Object.values(monthly).reduce((a, b) => a + b, 0) / months.length),
            predictedNextMonth: predictedNext,
            bestMonth: Object.entries(monthly).sort((a, b) => b[1] - a[1])[0] || null
        };
    }
    
    // ============================================
    // 9. RECOMMENDATION ENGINE
    // ============================================
    generateRecommendations(consultation) {
        const recommendations = [];
        const serviceType = consultation.service_type;
        const category = consultation.nlp_category;
        
        if (serviceType === 'Custom Software Development' || serviceType === 'Digital transformation / custom software') {
            recommendations.push({
                type: 'service',
                title: 'Dedicated Development Team',
                description: 'Sediakan tim developer khusus untuk project jangka panjang'
            });
            recommendations.push({
                type: 'service',
                title: 'Code Review & Optimization',
                description: 'Audit kode untuk memastikan best practices'
            });
        }
        
        if (serviceType === 'Cloud Infrastructure & Migration') {
            recommendations.push({
                type: 'service',
                title: 'Cloud Cost Optimization',
                description: 'Analisis dan optimasi biaya cloud infrastructure'
            });
            recommendations.push({
                type: 'service',
                title: 'Disaster Recovery Plan',
                description: 'Implementasi backup dan recovery strategy'
            });
        }
        
        if (serviceType === 'Cybersecurity Audit') {
            recommendations.push({
                type: 'service',
                title: 'Security Awareness Training',
                description: 'Pelatihan keamanan untuk karyawan'
            });
            recommendations.push({
                type: 'service',
                title: 'Penetration Testing',
                description: 'Pengujian keamanan sistem secara berkala'
            });
        }
        
        if (category === 'GOVERNMENT') {
            recommendations.push({
                type: 'compliance',
                title: 'Regulatory Compliance Check',
                description: 'Pastikan solusi memenuhi regulasi pemerintah'
            });
        }
        
        if (category === 'CORPORATE') {
            recommendations.push({
                type: 'enterprise',
                title: 'Enterprise SLA',
                description: 'Service Level Agreement untuk dukungan 24/7'
            });
        }
        
        if (category === 'UMKM') {
            recommendations.push({
                type: 'growth',
                title: 'Starter Package',
                description: 'Paket awal dengan harga terjangkau untuk UMKM'
            });
        }
        
        return {
            success: true,
            recommendations: recommendations,
            count: recommendations.length
        };
    }
    
    // ============================================
    // 10. SUMMARY REPORT
    // ============================================
    generateSummaryReport(consultations) {
        const total = consultations.length;
        const categories = {};
        const statuses = {};
        let totalLeadScore = 0;
        
        consultations.forEach(c => {
            const cat = c.nlp_category || 'General';
            categories[cat] = (categories[cat] || 0) + 1;
            
            const stat = c.status || 'New';
            statuses[stat] = (statuses[stat] || 0) + 1;
            
            totalLeadScore += (c.lead_score || 0.5);
        });
        
        const averageLeadScore = total > 0 ? Math.round((totalLeadScore / total) * 100) : 0;
        const closedCount = statuses['Closed'] || 0;
        const conversionRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;
        
        return {
            success: true,
            summary: {
                totalConsultations: total,
                averageLeadScore: averageLeadScore,
                conversionRate: conversionRate,
                categories: categories,
                statuses: statuses
            },
            topCategory: Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || null
        };
    }
}

// ============================================
// AI SPAM DETECTION ENGINE
// ============================================

const spamKeywords = {
    high: [
        'viagra', 'casino', 'poker', 'lottery', 'winner', 'prize', 'bitcoin',
        'crypto', 'binary options', 'forex', 'loan', 'credit card', 'mortgage',
        'weight loss', 'xxx', 'adult', 'porn', 'gambling', 'slot machine',
        'free money', 'no cost', 'cheap', 'discount', 'offer'
    ],
    medium: [
        'click here', 'subscribe now', 'limited time', 'guaranteed', 'cash',
        'refinance', 'investment', 'profit', 'earn money', 'work from home'
    ],
    low: [
        'urgent', 'important', 'dear sir', 'hello sir', 'enquiry', 'inquiry',
        'pls', 'kindly', 'asap', 'immediately', 'application', 'register'
    ]
};

const spamPatterns = [
    /http[s]?:\/\/[^\s]+/g,
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    /(\d{10,})/g,
    /[!@#$%^&*(){}\[\]]{5,}/g,
    /(.)\1{5,}/g
];

class SpamDetectionService {
    detectSpam(text) {
        const result = {
            isSpam: false,
            score: 0,
            reasons: [],
            confidence: 'low'
        };
        
        if (!text || text.length === 0) {
            result.isSpam = true;
            result.reasons.push('Empty message');
            result.score = 100;
            return result;
        }
        
        const lowerText = text.toLowerCase();
        let totalScore = 0;
        
        // Check spam keywords
        for (const keyword of spamKeywords.high) {
            if (lowerText.includes(keyword)) {
                totalScore += 15;
                result.reasons.push(`Contains spam keyword: "${keyword}"`);
            }
        }
        
        for (const keyword of spamKeywords.medium) {
            if (lowerText.includes(keyword)) {
                totalScore += 8;
                result.reasons.push(`Contains suspicious phrase: "${keyword}"`);
            }
        }
        
        for (const keyword of spamKeywords.low) {
            if (lowerText.includes(keyword)) {
                totalScore += 3;
            }
        }
        
        // Check patterns
        for (const pattern of spamPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                if (pattern.toString().includes('http')) {
                    totalScore += matches.length * 10;
                    if (matches.length > 0) result.reasons.push(`Contains ${matches.length} URL(s)`);
                }
                if (pattern.toString().includes('@')) {
                    totalScore += matches.length * 8;
                    if (matches.length > 0) result.reasons.push(`Contains ${matches.length} email address(es)`);
                }
                if (pattern.toString().includes('[!@#$%')) {
                    if (matches[0]?.length > 5) {
                        totalScore += 10;
                        result.reasons.push('Excessive special characters');
                    }
                }
                if (pattern.toString().includes('(.)\\1{5,}')) {
                    if (matches) {
                        totalScore += 8;
                        result.reasons.push('Contains repeated characters');
                    }
                }
            }
        }
        
        // Check length
        if (text.length < 20) {
            totalScore += 15;
            result.reasons.push('Message too short (possible spam)');
        } else if (text.length > 2000) {
            totalScore += 10;
            result.reasons.push('Excessively long message');
        }
        
        // Check uppercase
        const uppercaseCount = (text.match(/[A-Z]/g) || []).length;
        const uppercaseRatio = text.length > 0 ? uppercaseCount / text.length : 0;
        if (uppercaseRatio > 0.5) {
            totalScore += 15;
            result.reasons.push('Excessive uppercase text');
        } else if (uppercaseRatio > 0.3) {
            totalScore += 8;
            result.reasons.push('High amount of uppercase text');
        }
        
        result.score = Math.min(Math.round(totalScore), 100);
        
        if (result.score >= 60) {
            result.isSpam = true;
            result.confidence = result.score >= 80 ? 'high' : 'medium';
        } else if (result.score >= 30) {
            result.isSpam = false;
            result.confidence = 'medium';
            result.reasons.push('Suspicious content, needs review');
        }
        
        return result;
    }
    
    quickCheck(text) {
        const result = this.detectSpam(text);
        return {
            isSpam: result.isSpam,
            score: result.score,
            confidence: result.confidence
        };
    }
    
    getSpamStats(spamLogs) {
        const stats = {
            total: spamLogs.length,
            highConfidence: 0,
            mediumConfidence: 0,
            lowConfidence: 0,
            averageScore: 0
        };
        
        let totalScore = 0;
        
        for (const log of spamLogs) {
            totalScore += log.spam_score || 0;
            if (log.confidence === 'high') stats.highConfidence++;
            else if (log.confidence === 'medium') stats.mediumConfidence++;
            else stats.lowConfidence++;
        }
        
        stats.averageScore = spamLogs.length > 0 ? Math.round(totalScore / spamLogs.length) : 0;
        
        return stats;
    }
}

// ============================================
// EXPORT ALL SERVICES
// ============================================

const mlServiceInstance = new MLService();
const spamDetectionInstance = new SpamDetectionService();

module.exports = {
    // MLService methods
    classifyUser: mlServiceInstance.classifyUser.bind(mlServiceInstance),
    calculateMatchScore: mlServiceInstance.calculateMatchScore.bind(mlServiceInstance),
    generateLeadScore: mlServiceInstance.generateLeadScore.bind(mlServiceInstance),
    calculatePriorityScore: mlServiceInstance.calculatePriorityScore.bind(mlServiceInstance),
    exportToCSV: mlServiceInstance.exportToCSV.bind(mlServiceInstance),
    generateWordCloud: mlServiceInstance.generateWordCloud.bind(mlServiceInstance),
    analyzeTrend: mlServiceInstance.analyzeTrend.bind(mlServiceInstance),
    generateRecommendations: mlServiceInstance.generateRecommendations.bind(mlServiceInstance),
    generateSummaryReport: mlServiceInstance.generateSummaryReport.bind(mlServiceInstance),
    
    // SpamDetection methods
    spamDetection: {
        detectSpam: spamDetectionInstance.detectSpam.bind(spamDetectionInstance),
        quickCheck: spamDetectionInstance.quickCheck.bind(spamDetectionInstance),
        getSpamStats: spamDetectionInstance.getSpamStats.bind(spamDetectionInstance)
    }
};