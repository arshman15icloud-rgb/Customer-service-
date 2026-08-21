import React, { useState, useEffect } from 'react';
import { AnalyticsData, SyncStatus, AdminNotification } from '../../types';
import { api } from '../../lib/api';
import {
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (section: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, syncData, notifs] = await Promise.all([
        api.getAnalytics(),
        api.getSyncStatus(),
        api.getAdminNotifications(),
      ]);
      setAnalytics(analyticsData);
      setSyncStatus(syncData);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickSync = async () => {
    try {
      setSyncing(true);
      await api.runProductSync();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Loading Vertex Lab dashboard analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Vertex Care Hub
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              AI & Sync Engine Online
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Command Overview</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time customer care telemetry, automated Shopify/Woo sync, and Gemini-powered assistance.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            id="btn-dash-quick-sync"
            type="button"
            onClick={handleQuickSync}
            disabled={syncing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Catalog...' : 'Quick Sync Catalog'}</span>
          </button>

          <button
            id="btn-dash-open-inbox"
            type="button"
            onClick={() => onNavigate('inbox')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Live Inbox</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Conversations</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {analytics.totalConversations}
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>{analytics.activeConversations} active today</span>
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* AI Resolution Rate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">AI Resolution Rate</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {analytics.aiResolutionRate}%
            </span>
            <span className="text-[11px] text-indigo-300 mt-1 block">
              {analytics.handledByAi} handled autonomously
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Escalated to Human */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Escalated Inquiries</span>
            <span className="text-2xl font-extrabold text-amber-400 mt-1 block">
              {analytics.escalatedToHuman}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {analytics.waitingForHuman} awaiting agent reply
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Synced Products */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Active Products</span>
            <span className="text-2xl font-extrabold text-white mt-1 block">
              {analytics.totalProducts}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {syncStatus?.lastSyncTime
                ? `Last sync ${new Date(syncStatus.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Synced via Store API'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800 text-slate-300 border border-slate-700">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Urgent Escalations & Sync Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escalations / Alerts Center */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Live Escalation Queue</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('inbox')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>View Inbox</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {!Array.isArray(notifications) || notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  All customer inquiries are resolved or handled by AI. No pending escalations.
                </div>
              ) : (
                notifications.slice(0, 4).map(notif => (
                  <div
                    key={notif.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{notif.title}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono bg-amber-950 text-amber-300 border border-amber-800/60">
                          {notif.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('inbox')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 shrink-0"
                    >
                      Take Over
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Product Sync Engine Status */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Store Sync Automation</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('sync')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                <span>Sync Settings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Website:</span>
                  <span className="font-mono text-indigo-300 font-medium">
                    {syncStatus?.websiteUrl || 'https://vertexlab.store'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Sync Status:</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {syncStatus?.status ? syncStatus.status.toUpperCase() : 'IDLE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Synced Articles:</span>
                  <span className="font-bold text-white">{analytics?.totalProducts || 0} pieces</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Scheduled Frequency:</span>
                  <span className="text-slate-300 font-medium capitalize">
                    {syncStatus?.syncFrequency || 'Every 6 Hours'}
                  </span>
                </div>
              </div>

              {/* Sync Log Preview */}
              {Array.isArray(syncStatus?.logs) && syncStatus.logs.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                    Latest Sync Log:
                  </span>
                  {syncStatus.logs.slice(-2).map((log, i) => (
                    <div key={i} className="truncate text-slate-300">
                      • {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Gemini Grounding Catalog:</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              100% Up to date
            </span>
          </div>
        </div>
      </div>

      {/* Top Customer Inquiries Distribution */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <h3 className="font-bold text-base text-white mb-3">Common Customer Inquiry Categories</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.isArray(analytics?.topInquiryCategories) &&
            analytics.topInquiryCategories.map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs text-slate-400 block">{item.category}</span>
                <span className="text-xl font-bold text-white mt-1 block">{item.count}</span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, item.count * 10)}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
