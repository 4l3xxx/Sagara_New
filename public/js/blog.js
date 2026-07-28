// Blog JavaScript
async function loadBlogs() {
    try {
        const lang = localStorage.getItem('language') || 'en';
        const response = await fetch(`/api/blogs?lang=${lang}`);
        const blogs = await response.json();
        const container = document.getElementById('blogGrid');
        if (!container) return;
        
        let blogData = blogs;
        if (blogs && !Array.isArray(blogs) && blogs.value && Array.isArray(blogs.value)) {
            blogData = blogs.value;
        }

        if (!Array.isArray(blogData) || blogData.length === 0) {
            container.innerHTML = lang === 'en' ? 
                '<div class="text-center py-20 col-span-3">No blog posts yet. Check back soon!</div>' :
                '<div class="text-center py-20 col-span-3">Belum ada artikel blog. Silakan periksa kembali nanti!</div>';
            return;
        }
        
        container.innerHTML = blogData.map(blog => {
            const author = blog.author || 'Sagara Team';
            const dateStr = blog.date ? new Date(blog.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : (lang === 'en' ? 'Recently' : 'Baru-baru ini');
            const authorPrefix = lang === 'en' ? 'By' : 'Oleh';
            const readMore = lang === 'en' ? 'Read more →' : 'Selengkapnya →';
            const defaultExcerpt = lang === 'en' ? 'Click to read more' : 'Klik untuk membaca lebih lanjut';
            const excerpt = blog.excerpt || (blog.content ? blog.content.substring(0, 150) : defaultExcerpt);
            
            return `
                <div class="blog-card bg-white dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 cursor-pointer" onclick="window.location.href='/blog-detail.html?id=${blog.id}'">
                    <img src="${blog.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format'}" alt="${blog.title}" class="w-full h-48 object-cover">
                    <div class="p-6">
                        <div class="flex items-center gap-2 text-xs text-primary mb-3">
                            <span class="material-symbols-outlined text-sm">schedule</span> ${dateStr}
                        </div>
                        <h3 class="text-xl font-bold mb-2 hover:text-primary transition-colors">${blog.title || (lang === 'en' ? 'Untitled Article' : 'Artikel Tanpa Judul')}</h3>
                        <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-3">${excerpt}...</p>
                        <div class="mt-4 flex items-center justify-between">
                            <span class="text-xs text-slate-400">${authorPrefix} ${author}</span>
                            <span class="text-primary text-sm font-medium">${readMore}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading blogs:', error);
        const lang = localStorage.getItem('language') || 'en';
        const errorContainer = document.getElementById('blogGrid');
        if (errorContainer) {
            errorContainer.innerHTML = lang === 'en' ?
                '<div class="text-center py-20 col-span-3 text-red-500">Error loading articles. Please try again later.</div>' :
                '<div class="text-center py-20 col-span-3 text-red-500">Gagal memuat artikel. Silakan coba lagi nanti.</div>';
        }
    }
}