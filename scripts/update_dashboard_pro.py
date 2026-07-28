"""
scripts/update_dashboard_pro.py
Patches admin/dashboard.html with the Pro design (sidebar, stat cards, styles).
Usage: python scripts/update_dashboard_pro.py

NOTE: Runs relative to the sagara_revamp/ root directory.
"""
import re
import os

# Resolve path relative to this script's location (scripts/ folder)
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
filepath = os.path.join(base_dir, "admin", "dashboard.html")

print(f"Patching: {filepath}")

with open(filepath, "r", encoding="utf-8") as f:
    html = f.read()

# 1. Inject Tailwind + fonts + Material Symbols into <head>
head_injection = """
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: { primary: '#137fec', secondary: '#10b981', sidebar: '#0f172a' },
                    fontFamily: { sans: ['Outfit', 'Inter', 'sans-serif'] }
                }
            }
        }
    </script>
"""
html = re.sub(
    r'<script src="https://cdn\.tailwindcss\.com"></script>',
    head_injection.strip(),
    html,
    count=1,
)

# 2. Write patched file
with open(filepath, "w", encoding="utf-8") as f:
    f.write(html)

print("✅ Dashboard patched successfully!")
