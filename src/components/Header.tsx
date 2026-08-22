import React from 'react';
import { HelpCircle, Bell, Download, Shield, MessageSquare, Megaphone, User, Sparkles, ChevronDown } from 'lucide-react';
import { WebsiteSettings } from '../types';
import { VertexSparkleIcon } from './VertexSparkleIcon';

interface HeaderProps {
  activeTab: 'chat' | 'faqs' | 'announcements';
  setActiveTab: (tab: 'chat' | 'faqs' | 'announcements') => void;
  websiteSettings: WebsiteSettings;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  isInstallable: boolean;
  onInstallApp: () => void;
  customerName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  websiteSettings,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenAdmin,
  onOpenProfile,
  isInstallable,
  onInstallApp,
  customerName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#131314]/90 backdrop-blur-2xl border-b border-[#282a2c]/80 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* Brand Logo & Model Pill */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#1e1f20] border border-[#333538] flex items-center justify-center shadow-md group-hover:border-[#4285F4]/60 transition-all">
                <VertexSparkleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" animated={true} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-display font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-[#a8c7fa] transition-colors">
                    {websiteSettings.brandName || 'VERTEX LAB'}
                  </span>
                  {/* AI Concierge Badge */}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1e1f20] text-[#a8c7fa] border border-[#333538]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-pulse"></span>
                    <span>AI Concierge</span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-normal text-[#9aa0a6] flex items-center gap-1">
                  <span>Intelligent Streetwear Care</span>
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1e1f20] p-1 rounded-full border border-[#333538] shadow-inner">
            <button
              id="nav-tab-chat"
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#282a2c] text-[#e3e3e3] border border-[#444746] shadow-sm'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c]/50'
              }`}
            >
              <VertexSparkleIcon className="w-3.5 h-3.5" size={14} />
              <span>AI Chat</span>
            </button>

            <button
              id="nav-tab-faqs"
              type="button"
              onClick={() => setActiveTab('faqs')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'faqs'
                  ? 'bg-[#282a2c] text-[#e3e3e3] border border-[#444746] shadow-sm'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c]/50'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#a8c7fa]" />
              <span>FAQs & Policies</span>
            </button>

            <button
              id="nav-tab-announcements"
              type="button"
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'announcements'
                  ? 'bg-[#282a2c] text-[#e3e3e3] border border-[#444746] shadow-sm'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3] hover:bg-[#282a2c]/50'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-[#c5b4e3]" />
              <span>Drops & Noticeboard</span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Install PWA Button */}
            {isInstallable && (
              <button
                id="btn-install-pwa"
                type="button"
                onClick={onInstallApp}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1e1f20] hover:bg-[#282a2c] text-[#a8c7fa] border border-[#333538] shadow-sm transition-all active:scale-95"
                title="Install Progressive Web App"
              >
                <Download className="w-3.5 h-3.5 text-[#78D9EC]" />
                <span>Install</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              id="btn-open-notifications"
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 sm:p-2.5 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333538] transition-all active:scale-95 shadow-sm"
              title="Announcements & Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-[#131314] animate-ping"></span>
              )}
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-[#131314]"></span>
              )}
            </button>

            {/* Customer Profile / Sign In Trigger */}
            <button
              id="btn-customer-profile"
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333538] hover:border-[#8ab4f8]/50 transition-all active:scale-95 shadow-sm"
              title="Customer Account & Order Tracking"
            >
              <div className="w-5 h-5 rounded-full bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#a8c7fa] text-[10px] font-bold">
                {customerName && customerName !== 'Guest Customer' && customerName !== 'Guest'
                  ? customerName.charAt(0).toUpperCase()
                  : <User className="w-3 h-3" />}
              </div>
              <span className="text-xs font-medium max-w-[110px] truncate">
                {customerName && customerName !== 'Guest Customer' && customerName !== 'Guest'
                  ? customerName
                  : 'Sign In'}
              </span>
            </button>

            {/* Admin Dashboard Switch */}
            <button
              id="btn-open-admin-portal"
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-[#1e1f20] hover:bg-[#282a2c] text-[#e3e3e3] border border-[#333538] hover:border-[#444746] shadow-sm transition-all active:scale-95"
              title="Protected Admin Dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-[#9B72CB]" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Streamlined Gemini Pills) */}
        <div className="grid grid-cols-3 md:hidden py-1.5 border-t border-[#282a2c] gap-1 text-center">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'chat'
                ? 'bg-[#282a2c] text-[#a8c7fa] font-semibold border border-[#444746]'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <VertexSparkleIcon className="w-3.5 h-3.5" size={14} />
            <span>AI Care</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('faqs')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'faqs'
                ? 'bg-[#282a2c] text-[#a8c7fa] font-semibold border border-[#444746]'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQs & Policy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium py-1.5 px-2 rounded-xl transition-all ${
              activeTab === 'announcements'
                ? 'bg-[#282a2c] text-[#a8c7fa] font-semibold border border-[#444746]'
                : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Drops</span>
          </button>
        </div>
      </div>
    </header>
  );
};

