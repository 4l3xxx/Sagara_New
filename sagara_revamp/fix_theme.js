const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const themeScript = `
    <!-- Theme Script -->
    <script>
        function initTheme() {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
            }
        }
        function toggleTheme() {
            const isDark = document.documentElement.classList.contains('dark');
            if (isDark) {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
                localStorage.setItem('theme', 'dark');
            }
            updateThemeIcon();
        }
        function updateThemeIcon() {
            const icons = document.querySelectorAll('.theme-icon-display');
            const isDark = document.documentElement.classList.contains('dark');
            icons.forEach(icon => {
                icon.textContent = isDark ? 'light_mode' : 'dark_mode';
            });
        }
        initTheme();
        document.addEventListener('DOMContentLoaded', updateThemeIcon);
    </script>
</head>`;

const themeButton = `
                        <!-- Theme Toggle Button -->
                        <button onclick="toggleTheme()" class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors mr-2">
                            <span class="material-symbols-outlined text-[18px] theme-icon-display">dark_mode</span>
                        </button>
                        <div class="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-5 mr-1">`;

const mobileThemeButton = `
                        <!-- Theme Toggle Button (Mobile) -->
                        <button onclick="toggleTheme()" class="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mr-2">
                            <span class="material-symbols-outlined text-[18px] theme-icon-display">dark_mode</span>
                        </button>
                        <div class="flex items-center gap-2">`;

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  if (!content.includes('initTheme()')) {
      content = content.replace(/<\/head>/, themeScript);
      changed = true;
  }
  
  if (!content.includes('toggleTheme()')) {
      content = content.replace(/<div class="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-5 mr-1">/g, themeButton);
      // for mobile nav, we need to be careful to not replace all <div class="flex items-center gap-2">
      // let's only replace the one right before the mobile menu button
      content = content.replace(/<div class="flex items-center gap-2">\s*<button onclick="switchLanguage\('id'\)"\s*class="font-bold text-xs text-slate-500 hover:text-primary"\s*id="btn-id-mobile">ID<\/button>/g, mobileThemeButton + '\n                            <button onclick="switchLanguage(\'id\')" class="font-bold text-xs text-slate-500 hover:text-primary" id="btn-id-mobile">ID</button>');
      changed = true;
  }
  
  if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully wrote ' + f);
  }
});
