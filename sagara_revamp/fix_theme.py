import os
import re

dir_path = os.path.join(os.getcwd(), 'public')
html_files = [f for f in os.listdir(dir_path) if f.endswith('.html')]

theme_btn_desktop = """
                        <!-- Theme Toggle Button -->
                        <button onclick="toggleTheme()" class="theme-toggle-btn flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors mr-2">
                            <span class="material-symbols-outlined text-[18px] theme-icon-display">dark_mode</span>
                        </button>
                        <div class="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-5 mr-1">"""

theme_btn_mobile = """
                        <!-- Theme Toggle Button (Mobile) -->
                        <button onclick="toggleTheme()" class="theme-toggle-btn flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors mr-2">
                            <span class="material-symbols-outlined text-[18px] theme-icon-display">dark_mode</span>
                        </button>
                        <div class="flex items-center gap-2">"""

for file in html_files:
    file_path = os.path.join(dir_path, file)
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    changed = False

    if 'theme-toggle-btn' not in content:
        # We replace the exact string that is there.
        # Sometimes there's whitespace differences, so let's use regex
        
        # Desktop
        content = re.sub(r'<div\s+class="flex\s+items-center\s+gap-2\s+border-r\s+border-slate-200\s+dark:border-slate-700\s+pr-5\s+mr-1">', theme_btn_desktop, content)
        
        # Mobile
        # The mobile menu wrapper is typically:
        # <div class="md:hidden flex items-center gap-4">
        #    <div class="flex items-center gap-2">
        # Let's replace the first '<div class="flex items-center gap-2">' AFTER '<div class="md:hidden'
        
        def replace_mobile(match):
            return match.group(1) + theme_btn_mobile
            
        content = re.sub(r'(<div\s+class="md:hidden\s+flex\s+items-center\s+gap-4">\s*)<div\s+class="flex\s+items-center\s+gap-2">', replace_mobile, content)
        
        changed = True

    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
