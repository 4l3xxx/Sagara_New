import re
import os

filepath = r"d:\DOWNLOAD\sagara_revamp (2)\sagara_revamp\admin\dashboard.html"

with open(filepath, 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Material Symbols and Tailwind Config to Head
head_injection = """
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#137fec',
                        secondary: '#10b981',
                        sidebar: '#0f172a',
                        surface: '#ffffff',
                    },
                    fontFamily: {
                        sans: ['Outfit', 'Inter', 'sans-serif'],
                    }
                }
            }
        }
    </script>
"""
html = re.sub(r'<script src="https://cdn\.tailwindcss\.com"></script>\s*<link href="https://fonts\.googleapis\.com/css2\?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">', head_injection.strip(), html)


# 2. Update style
style_replacement = """
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background: #f8fafc; /* slate-50 */
        }
        
        /* Professional Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .sidebar-item {
            transition: all 0.3s ease;
            cursor: pointer;
            border-radius: 8px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 12px;
            color: #94a3b8; /* slate-400 */
        }

        .sidebar-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #f8fafc;
            transform: translateX(4px);
        }

        .sidebar-item.active {
            background: rgba(19, 127, 236, 0.15);
            color: #38bdf8; /* sky-400 */
            border-left: 3px solid #38bdf8;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }

        .card-hover {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid rgba(226, 232, 240, 0.8);
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
        }

        .card-hover:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.05);
            border-color: rgba(19, 127, 236, 0.3);
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
"""
html = re.sub(r'<style>.*?(?=\.loading {)', style_replacement.strip() + "\n\n        ", html, flags=re.DOTALL)


# 3. Replace Sidebar
sidebar_original = r'<!-- Sidebar -->.*?</aside>'
sidebar_new = """<!-- Sidebar -->
        <aside class="w-64 bg-sidebar text-slate-300 shadow-2xl fixed h-full overflow-y-auto z-50 flex flex-col">
            <div class="p-6 border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <img src="/assets/images/sagara_tech_logo.jpg" alt="Sagara Logo" class="w-9 h-9 rounded-xl shadow-lg border border-slate-700 object-cover hidden md:block" onerror="this.style.display='none'">
                    <div class="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-slate-700 md:hidden">
                        <span class="text-white font-bold text-lg">S</span>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold text-white tracking-wide">Sagara</h1>
                        <p class="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">Admin Portal</p>
                    </div>
                </div>
            </div>
            
            <nav class="p-4 flex-1">
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Main Menu</div>
                
                <div class="sidebar-item active p-3" data-section="dashboard">
                    <span class="material-symbols-outlined text-[20px]">dashboard</span>
                    <span class="font-medium text-sm">Dashboard</span>
                </div>
                <div class="sidebar-item p-3" data-section="chats">
                    <span class="material-symbols-outlined text-[20px]">forum</span>
                    <span class="font-medium text-sm">Chat History</span>
                </div>
                <div class="sidebar-item p-3" data-section="content">
                    <span class="material-symbols-outlined text-[20px]">edit_document</span>
                    <span class="font-medium text-sm">Edit Content</span>
                </div>
                <div class="sidebar-item p-3" data-section="consultations">
                    <span class="material-symbols-outlined text-[20px]">mail</span>
                    <span class="font-medium text-sm">Consultations</span>
                </div>
                <div class="sidebar-item p-3" data-section="analytics">
                    <span class="material-symbols-outlined text-[20px]">monitoring</span>
                    <span class="font-medium text-sm">Analytics</span>
                </div>
                
                <div class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-6 mb-3 px-3">System</div>
                <div class="sidebar-item p-3" data-section="settings">
                    <span class="material-symbols-outlined text-[20px]">settings</span>
                    <span class="font-medium text-sm">Settings</span>
                </div>
            </nav>
            
            <div class="p-4 border-t border-slate-800">
                <div class="sidebar-item p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10" data-section="logout" id="logoutBtn">
                    <span class="material-symbols-outlined text-[20px]">logout</span>
                    <span class="font-medium text-sm">Sign Out</span>
                </div>
                <div class="mt-4 text-center">
                    <p class="text-[10px] text-slate-500 uppercase tracking-widest">Sagara v1.0 &copy; 2024</p>
                </div>
            </div>
        </aside>"""
html = re.sub(sidebar_original, sidebar_new, html, flags=re.DOTALL)


# 4. Replace Dashboard Stats Section
dashboard_stats_original = r'<div class="mb-8">.*?<div class="bg-white rounded-xl shadow-sm border">'
dashboard_stats_new = """<div class="mb-8 flex justify-between items-end">
                        <div>
                            <h2 class="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h2>
                            <p class="text-slate-500 mt-1 font-medium">Welcome back, here's what's happening today.</p>
                        </div>
                        <div class="hidden sm:block">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wide">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                Live System
                            </span>
                        </div>
                    </div>

                    <!-- Premium Stats Cards -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <!-- Card 1 -->
                        <div class="bg-white rounded-2xl p-6 card-hover relative overflow-hidden group">
                            <div class="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <span class="material-symbols-outlined text-[80px] text-primary">forum</span>
                            </div>
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-primary border border-blue-100">
                                    <span class="material-symbols-outlined text-[24px]">chat_bubble</span>
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Chats</h3>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <div class="text-4xl font-black text-slate-800" id="totalChats">-</div>
                                <div class="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">All Time</div>
                            </div>
                        </div>

                        <!-- Card 2 -->
                        <div class="bg-white rounded-2xl p-6 card-hover relative overflow-hidden group">
                            <div class="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <span class="material-symbols-outlined text-[80px] text-emerald-500">calendar_today</span>
                            </div>
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                                    <span class="material-symbols-outlined text-[24px]">today</span>
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today's Chats</h3>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <div class="text-4xl font-black text-slate-800" id="todayChats">-</div>
                                <div class="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    <span class="material-symbols-outlined text-[14px]">trending_up</span> +12%
                                </div>
                            </div>
                        </div>

                        <!-- Card 3 -->
                        <div class="bg-white rounded-2xl p-6 card-hover relative overflow-hidden group">
                            <div class="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <span class="material-symbols-outlined text-[80px] text-purple-500">timer</span>
                            </div>
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                                    <span class="material-symbols-outlined text-[24px]">schedule</span>
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">Uptime</h3>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <div class="text-4xl font-black text-slate-800" id="uptime">-</div>
                                <div class="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Active</div>
                            </div>
                        </div>

                        <!-- Card 4 -->
                        <div class="bg-white rounded-2xl p-6 card-hover relative overflow-hidden group">
                            <div class="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                                <span class="material-symbols-outlined text-[80px] text-amber-500">memory</span>
                            </div>
                            <div class="flex items-center gap-4 mb-4">
                                <div class="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                    <span class="material-symbols-outlined text-[24px]">api</span>
                                </div>
                                <div>
                                    <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wider">API Status</h3>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <div class="text-2xl font-black text-slate-800" id="apiStatus">-</div>
                                <div class="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Groq API</div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">"""
html = re.sub(dashboard_stats_original, dashboard_stats_new, html, flags=re.DOTALL)


# Write it back
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(html)

print("Dashboard updated successfully!")
