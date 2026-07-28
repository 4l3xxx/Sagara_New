// Careers JavaScript
async function loadJobs() {
    try {
        const lang = localStorage.getItem('language') || 'en';
        const response = await fetch('/api/jobs');
        const jobs = await response.json();
        const container = document.getElementById('jobsGrid');
        if (!container) return;
        
        let jobData = jobs;
        if (jobs && !Array.isArray(jobs) && jobs.value && Array.isArray(jobs.value)) {
            jobData = jobs.value;
        }

        if (!Array.isArray(jobData) || jobData.length === 0) {
            container.innerHTML = lang === 'en' ? 
                '<div class="text-center py-20 col-span-3">No open positions at the moment. Check back soon!</div>' :
                '<div class="text-center py-20 col-span-3">Belum ada lowongan pekerjaan saat ini. Silakan periksa kembali nanti!</div>';
            return;
        }

        // Filter out inactive jobs for the public careers page
        jobData = jobData.filter(job => job.is_active !== false);

        if (jobData.length === 0) {
            container.innerHTML = lang === 'en' ?
                '<div class="text-center py-20 col-span-3">No open positions at the moment. Check back soon!</div>' :
                '<div class="text-center py-20 col-span-3">Belum ada lowongan pekerjaan saat ini. Silakan periksa kembali nanti!</div>';
            return;
        }
        
        container.innerHTML = jobData.map(job => {
            let salary = job.salary || (lang === 'en' ? 'Competitive' : 'Kompetitif');
            if (lang === 'id' && typeof salary === 'string') {
                salary = salary.replace(/Million/g, 'Juta').replace(/Competitive/g, 'Kompetitif');
            }
            
            const applyText = lang === 'en' ? 'Apply now →' : 'Lamar sekarang →';
            
            // Translate job type if needed (Full-time -> Penuh waktu / Freelance -> Freelance)
            let type = job.type || 'Full-time';
            if (lang === 'id') {
                if (type === 'Full-time') type = 'Penuh Waktu';
                else if (type === 'Part-time') type = 'Paruh Waktu';
            }
            
            // Translate experience if needed (Min. 5 years -> Min. 5 tahun)
            let exp = job.experience || '';
            if (lang === 'id' && typeof exp === 'string') {
                exp = exp.replace(/years/g, 'tahun').replace(/Min\./g, 'Min.');
            }

            const title = job.title || 'Position';
            const location = job.location || 'Jakarta, Indonesia';
            const desc = job.description ? job.description.substring(0, 120) : '';

            return `
                <div class="job-card bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 cursor-pointer" onclick="window.location.href='/job-detail.html?id=${job.id}'">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-xl font-bold mb-1 hover:text-primary transition-colors">${title}</h3>
                            <p class="text-slate-500 dark:text-slate-400 text-sm">${location}</p>
                        </div>
                        <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">${type}</span>
                    </div>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">${desc}...</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-slate-400">💰 ${salary} ${exp ? '· ' + exp : ''}</span>
                        <span class="text-primary text-sm font-medium">${applyText}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading jobs:', error);
        const lang = localStorage.getItem('language') || 'en';
        const errorContainer = document.getElementById('jobsGrid');
        if (errorContainer) {
            errorContainer.innerHTML = lang === 'en' ?
                '<div class="text-center py-20 col-span-3 text-red-500">Error loading jobs. Please try again later.</div>' :
                '<div class="text-center py-20 col-span-3 text-red-500">Gagal memuat lowongan pekerjaan. Silakan coba lagi nanti.</div>';
        }
    }
}