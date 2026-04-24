// Careers JavaScript
async function loadJobs() {
    try {
        const response = await fetch('/api/jobs');
        const jobs = await response.json();
        const container = document.getElementById('jobsGrid');
        
        if (!jobs || jobs.length === 0) {
            container.innerHTML = '<div class="text-center py-20 col-span-3">No open positions at the moment. Check back soon!</div>';
            return;
        }
        
        container.innerHTML = jobs.map(job => `
            <div class="job-card bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 cursor-pointer" onclick="window.location.href='/job-detail.html?id=${job.id}'">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h3 class="text-xl font-bold mb-1 hover:text-primary transition-colors">${job.title}</h3>
                        <p class="text-slate-500 dark:text-slate-400 text-sm">${job.location || 'Remote / Jakarta'}</p>
                    </div>
                    <span class="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">${job.type || 'Full-time'}</span>
                </div>
                <p class="text-slate-500 dark:text-slate-400 text-sm mb-4 line-clamp-2">${job.description?.substring(0, 120)}...</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-slate-400">💰 ${job.salary || 'Competitive'}</span>
                    <span class="text-primary text-sm font-medium">Apply now →</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsGrid').innerHTML = '<div class="text-center py-20 col-span-3 text-red-500">Error loading jobs. Please try again later.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadJobs);