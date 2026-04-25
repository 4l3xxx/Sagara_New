// Blog JavaScript
async function loadBlogs() {
    try {
        const response = await fetch('/api/blogs');
        const blogs = await response.json();
        const container = document.getElementById('blogGrid');
        
        let blogData = blogs;
        if (blogs && !Array.isArray(blogs) && blogs.value && Array.isArray(blogs.value)) {
            blogData = blogs.value;
        }

        if (!Array.isArray(blogData) || blogData.length === 0) {
            container.innerHTML = '<div class="text-center py-20 col-span-3">No blog posts yet. Check back soon!</div>';
            return;
        }
        
        container.innerHTML = blogData.map(blog => `
            <div class="blog-card bg-white dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 cursor-pointer" onclick="window.location.href='/blog-detail.html?id=${blog.id}'">
                <img src="${blog.image || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format'}" alt="${blog.title}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <div class="flex items-center gap-2 text-xs text-primary mb-3">
                        <span class="material-symbols-outlined text-sm">schedule</span> ${blog.date ? new Date(blog.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                    </div>
                    <h3 class="text-xl font-bold mb-2 hover:text-primary transition-colors">${blog.title || 'Untitled Article'}</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-3">${blog.excerpt || (blog.content ? blog.content.substring(0, 150) : 'Click to read more')}...</p>
                    <div class="mt-4 flex items-center justify-between">
                        <span class="text-xs text-slate-400">By ${blog.author || 'Sagara Team'}</span>
                        <span class="text-primary text-sm font-medium">Read more →</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading blogs:', error);
        document.getElementById('blogGrid').innerHTML = '<div class="text-center py-20 col-span-3 text-red-500">Error loading articles. Please try again later.</div>';
    }
}

document.addEventListener('DOMContentLoaded', loadBlogs);