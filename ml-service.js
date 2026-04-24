// ============================================
// ML SERVICE - Sentiment Analysis & Classification
// VERSION 2.0 - COMPLETE
// ============================================

class MLService {
    // ============================================
    // 1. SENTIMENT ANALYSIS
    // ============================================
    analyzeSentiment(text) {
        const positiveWords = ['bagus', 'hebat', 'keren', 'puas', 'suka', 'mantap', 'terima kasih', 'thanks', 'good', 'great', 'awesome', 'love', 'excellent', 'perfect', 'best'];
        const negativeWords = ['jelek', 'buruk', 'kecewa', 'error', 'lambat', 'gagal', 'bug', 'parah', 'kesal', 'bad', 'terrible', 'worst', 'poor', 'hate'];
        
        let score = 0;
        const lowerText = text.toLowerCase();
        
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) score++;
        });
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) score--;
        });
        
        if (score > 1) return { sentiment: 'positive', score, emoji: '😊', label: 'Positif' };
        if (score < 0) return { sentiment: 'negative', score, emoji: '😞', label: 'Negatif' };
        return { sentiment: 'neutral', score, emoji: '😐', label: 'Netral' };
    }
    
    // ============================================
    // 2. USER CLASSIFICATION
    // ============================================
    classifyUser(data) {
        const { companySize, budget, industry, serviceType, message } = data;
        
        // Deteksi dari service type
        if (serviceType === 'Government Solutions' || industry === 'government') {
            return { 
                type: 'GOVERNMENT', 
                priority: 'HIGH', 
                color: '#f59e0b',
                description: 'Sektor Pemerintahan',
                icon: '🏛️'
            };
        }
        
        // Deteksi dari budget dan company size
        if ((companySize && companySize < 50) || (budget && budget < 50000000)) {
            return { 
                type: 'UMKM', 
                priority: 'MEDIUM', 
                color: '#10b981',
                description: 'Usaha Mikro Kecil Menengah',
                icon: '🏪'
            };
        }
        
        // Deteksi dari message content
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
        
        // Default ke GENERAL jika tidak ada indikator spesifik
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
        
        // Budget match (30%)
        if (userData.budget && serviceData.minBudget) {
            if (userData.budget >= serviceData.minBudget) {
                score += 30;
            }
            maxScore += 30;
        } else {
            maxScore += 30;
        }
        
        // Industry match (25%)
        if (userData.industry && serviceData.targetIndustry) {
            if (userData.industry === serviceData.targetIndustry) {
                score += 25;
            }
            maxScore += 25;
        } else {
            maxScore += 25;
        }
        
        // Company size match (25%)
        if (userData.companySize && serviceData.minCompanySize) {
            if (userData.companySize >= serviceData.minCompanySize) {
                score += 25;
            }
            maxScore += 25;
        } else {
            maxScore += 25;
        }
        
        // Need urgency (20%)
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
        let score = 0.5; // base score
        
        // Budget tinggi -> score naik
        if (formData.budget && formData.budget > 100000000) {
            score += 0.2;
        } else if (formData.budget && formData.budget > 50000000) {
            score += 0.1;
        }
        
        // Company size besar -> score naik
        if (formData.companySize && formData.companySize > 100) {
            score += 0.15;
        } else if (formData.companySize && formData.companySize > 20) {
            score += 0.05;
        }
        
        // Service type premium -> score naik
        const premiumServices = ['IT outsourcing', 'Digital transformation / custom software', 'Mobile app development'];
        if (premiumServices.includes(formData.service_type)) {
            score += 0.1;
        }
        
        // Message length -> indikasi seriousness
        if (formData.message && formData.message.length > 200) {
            score += 0.05;
        }
        
        // Sentiment positive -> score naik dikit
        if (formData.sentiment === 'positive') {
            score += 0.05;
        }
        
        return Math.min(score, 1.0);
    }
    
    // ============================================
    // 5. PRIORITY SCORE (Urgensi penanganan)
    // ============================================
    calculatePriorityScore(consultation) {
        let priority = 0;
        
        // Lead score tinggi -> priority tinggi (40%)
        priority += (consultation.lead_score || 0.5) * 40;
        
        // Status masih New -> priority tinggi (20%)
        if (consultation.status === 'New') {
            priority += 20;
        }
        
        // Sudah lebih dari 3 hari -> priority naik (20%)
        const createdDate = new Date(consultation.created_at);
        const daysOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld > 3) {
            priority += 20;
        } else if (daysOld > 1) {
            priority += 10;
        }
        
        // Corporate/Government -> priority naik (20%)
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
        const headers = ['ID', 'Full Name', 'Email', 'Service Type', 'Category', 'Lead Score', 'Priority Score', 'Sentiment', 'Status', 'Created At'];
        
        const rows = data.map(item => [
            item.id,
            item.full_name,
            item.business_email,
            item.service_type,
            item.nlp_category || 'General',
            item.lead_score || 0.5,
            this.calculatePriorityScore(item),
            item.sentiment || 'neutral',
            item.status || 'New',
            item.created_at
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        // Return sebagai blob untuk download
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
            // Hapus tanda baca dan split
            const cleanText = lowerText.replace(/[.,!?;:()"'\-]/g, '');
            const wordArray = cleanText.split(' ');
            
            wordArray.forEach(word => {
                // Filter kata pendek, stop words, dan angka
                if (word.length > 3 && !stopWords.includes(word) && !/^\d+$/.test(word)) {
                    words[word] = (words[word] || 0) + 1;
                }
            });
        });
        
        // Sort by frequency dan ambil top 30
        const sortedWords = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 30);
        
        // Format untuk word cloud library
        const wordCloudData = sortedWords.map(([text, weight]) => ({
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
    // 8. TREND ANALYSIS (Bulanan)
    // ============================================
    analyzeTrend(consultations) {
        const monthly = {};
        const monthlyByCategory = {};
        const monthlyBySentiment = {};
        
        consultations.forEach(c => {
            const month = c.created_at ? c.created_at.substring(0, 7) : 'unknown';
            
            // Total per bulan
            monthly[month] = (monthly[month] || 0) + 1;
            
            // Per kategori
            const category = c.nlp_category || 'General';
            if (!monthlyByCategory[month]) monthlyByCategory[month] = {};
            monthlyByCategory[month][category] = (monthlyByCategory[month][category] || 0) + 1;
            
            // Per sentimen
            const sentiment = c.sentiment || 'neutral';
            if (!monthlyBySentiment[month]) monthlyBySentiment[month] = {};
            monthlyBySentiment[month][sentiment] = (monthlyBySentiment[month][sentiment] || 0) + 1;
        });
        
        // Hitung growth rate
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
        
        // Prediksi next month (simple linear regression)
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
            monthlyBySentiment: monthlyBySentiment,
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
        
        // Rekomendasi berdasarkan service type
        if (serviceType === 'Digital transformation / custom software' || serviceType === 'Web development' || serviceType === 'Mobile app development') {
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
        
        if (serviceType === 'IT outsourcing') {
            recommendations.push({
                type: 'service',
                title: 'Enterprise SLA',
                description: 'Service Level Agreement untuk dukungan 24/7'
            });
            recommendations.push({
                type: 'service',
                title: 'Tech Talent Pipeline',
                description: 'Penyediaan talenta IT berkelanjutan sesuai kebutuhan'
            });
        }
        
        if (serviceType === 'UI/UX design') {
            recommendations.push({
                type: 'service',
                title: 'User Research & Testing',
                description: 'Validasi desain dengan pengguna nyata'
            });
            recommendations.push({
                type: 'service',
                title: 'Design System Creation',
                description: 'Pembuatan standar UI komponen untuk konsistensi'
            });
        }
        
        // Rekomendasi berdasarkan kategori
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
        const sentiments = {};
        const statuses = {};
        let totalLeadScore = 0;
        
        consultations.forEach(c => {
            // Kategori
            const cat = c.nlp_category || 'General';
            categories[cat] = (categories[cat] || 0) + 1;
            
            // Sentimen
            const sent = c.sentiment || 'neutral';
            sentiments[sent] = (sentiments[sent] || 0) + 1;
            
            // Status
            const stat = c.status || 'New';
            statuses[stat] = (statuses[stat] || 0) + 1;
            
            // Lead score
            totalLeadScore += (c.lead_score || 0.5);
        });
        
        const averageLeadScore = total > 0 ? Math.round((totalLeadScore / total) * 100) : 0;
        
        // Hitung conversion rate (Closed / Total)
        const closedCount = statuses['Closed'] || 0;
        const conversionRate = total > 0 ? Math.round((closedCount / total) * 100) : 0;
        
        return {
            success: true,
            summary: {
                totalConsultations: total,
                averageLeadScore: averageLeadScore,
                conversionRate: conversionRate,
                categories: categories,
                sentiments: sentiments,
                statuses: statuses
            },
            topCategory: Object.entries(categories).sort((a, b) => b[1] - a[1])[0] || null,
            dominantSentiment: Object.entries(sentiments).sort((a, b) => b[1] - a[1])[0] || null
        };
    }
}

module.exports = new MLService();