import React, { useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  RefreshCw,
  HelpCircle,
  BookOpen,
  Megaphone,
  Send,
  Users,
  Sparkles,
  Store,
  Shield,
  ArrowLeft,
  LogOut,
  Bell
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard.js';
import { AdminInbox } from './AdminInbox.js';
import { AdminProducts } from './AdminProducts.js';
import { AdminProductSync } from './AdminProductSync.js';
import { AdminFaqs } from './AdminFaqs.js';
import { AdminKnowledgeBase } from './AdminKnowledgeBase.js';
import { AdminAnnouncements } from './AdminAnnouncements.js';
import { AdminBroadcasts } from './AdminBroadcasts.js';
import { AdminCustomers } from './AdminCustomers.js';
import { AdminAiSettings } from './AdminAiSettings.js';
import { AdminWebsiteSettings } from './AdminWebsiteSettings.js';
import { AdminSecurity } from './AdminSecurity.js';

interface AdminLayoutProps {
  onBackToStore: () => void;
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToStore, onLogout }) => {
  const [activeNav, setActiveNav] = useState<string>('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard & Stats', icon: LayoutDashboard },
    { id: 'inbox', label: 'Live Inbox & Escalations', icon: MessageSquare, badge: 'Live' },
    { id: 'products', label: 'Product Inventory', icon: ShoppingBag },
    { id: 'sync', label: 'Website Product Sync', icon: RefreshCw },
    { id: 'faqs', label: 'FAQs & Policies', icon: HelpCircle },
    { id: 'knowledge', label: 'Brand Knowledge Base', icon: BookOpen },
    { id: 'announcements', label: 'Drops & Noticeboard', icon: Megaphone },
    { id: 'broadcasts', label: 'Push Broadcasts', icon: Send },
    { id: 'customers', label: 'Customer Directory', icon: Users },
    { id: 'ai', label: 'AI Assistant Settings', icon: Sparkles },
    { id: 'settings', label: 'Website & Brand Info', icon: Store },
    { id: 'security', label: 'Portal Security', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row text-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold font-display shadow-md shadow-indigo-950/60">
              V
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white font-display">VERTEX LAB</h1>
              <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Admin Console</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToStore}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
            title="Return to Public Customer View"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User / Return */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <button
            type="button"
            onClick={onBackToStore}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-indigo-400" />
            <span>Customer Website</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock Admin Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Section:</span>
            <span className="text-xs font-bold text-white capitalize">
              {activeNav.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToStore}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all"
            >
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>View Customer App</span>
            </button>
          </div>
        </header>

        {/* Dynamic Section Render */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeNav === 'dashboard' && <AdminDashboard onNavigate={setActiveNav} />}
          {activeNav === 'inbox' && <AdminInbox />}
          {activeNav === 'products' && <AdminProducts />}
          {activeNav === 'sync' && <AdminProductSync />}
          {activeNav === 'faqs' && <AdminFaqs />}
          {activeNav === 'knowledge' && <AdminKnowledgeBase />}
          {activeNav === 'announcements' && <AdminAnnouncements />}
          {activeNav === 'broadcasts' && <AdminBroadcasts />}
          {activeNav === 'customers' && <AdminCustomers />}
          {activeNav === 'ai' && <AdminAiSettings />}
          {activeNav === 'settings' && <AdminWebsiteSettings />}
          {activeNav === 'security' && <AdminSecurity />}
        </div>
      </main>
    </div>
  );
};
