import React, { useState, useEffect } from 'react';
import { SyncStatus } from '../../types.js';
import { api } from '../../lib/api.js';
import {
  Globe,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Play,
  Clock,
  Terminal,
  Activity,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const AdminProductSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState('https://vertexlab.store');
  const [syncFrequency, setSyncFrequency] = useState<'manual' | 'hourly' | '6hours' | 'daily'>('6hours');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; message: string; details?: any } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const data = await api.getSyncStatus();
      setSyncStatus(data);
      if (data.websiteUrl) setWebsiteUrl(data.websiteUrl);
      if (data.syncFrequency) setSyncFrequency(data.syncFrequency);
      setAutoSyncEnabled(data.autoSyncEnabled);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testSyncConnection(websiteUrl);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: err.message || 'Failed to reach website',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.runProductSync(websiteUrl);
      setSyncMessage(res.message || `Sync completed successfully (${res.productsImported || 0} products updated).`);
      await loadStatus();
    } catch (err: any) {
      setSyncMessage(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api.updateSyncStatus({
        websiteUrl,
        syncFrequency,
        autoSyncEnabled,
      });
      await loadStatus();
      alert('Sync settings saved!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Scraper & Store API
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Engine Online
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Website Product Sync</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Seamlessly fetch real catalog data from your store to ensure Gemini always recommends active items with exact prices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Importing Products...' : 'Trigger Full Sync Now'}</span>
        </button>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection & Target URL Setup */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Store Source Endpoint</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Clothing Brand Website URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://vertexlab.store"
                className="flex-1 bg-slate-950 text-slate-100 placeholder:text-slate-500 px-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Supports Shopify (<code>/products.json</code>), WooCommerce REST, and automated JSON-LD HTML parsing.
            </p>
          </div>

          {/* Test connection results box */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.latencyMs > 0 && (
                <p className="text-[11px] text-slate-300">
                  Response Latency: <span className="font-mono">{testResult.latencyMs}ms</span>
                </p>
              )}
            </div>
          )}

          {/* Sync Frequency Schedule */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <h4 className="font-semibold text-xs text-slate-200">Automated Background Schedule</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Sync Frequency</label>
                <select
                  value={syncFrequency}
                  onChange={e => setSyncFrequency(e.target.value as any)}
                  className="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="manual">Manual Only</option>
                  <option value="hourly">Every 1 Hour</option>
                  <option value="6hours">Every 6 Hours (Recommended)</option>
                  <option value="daily">Daily at Midnight</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Auto Sync Status</label>
                <button
                  type="button"
                  onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition-all ${
                    autoSyncEnabled
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {autoSyncEnabled ? 'Auto-Sync Active' : 'Disabled'}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all"
            >
              Save Sync Configuration
            </button>
          </div>
        </div>

        {/* Sync Telemetry & Terminal Logs */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Sync Activity Logs</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Status: {syncStatus?.status.toUpperCase() || 'IDLE'}
              </span>
            </div>

            {syncMessage && (
              <div className="p-3 my-3 rounded-xl bg-indigo-950/40 border border-indigo-800 text-xs text-indigo-300">
                {syncMessage}
              </div>
            )}

            {/* Terminal Window */}
            <div className="mt-3 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto space-y-1.5 no-scrollbar">
              <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-900">
                [SYSTEM SYNC LOG CONSOLE]
              </div>
              {syncStatus?.logs && syncStatus.logs.length > 0 ? (
                syncStatus.logs.map((log, index) => (
                  <div key={index} className="leading-relaxed">
                    <span className="text-indigo-400 mr-1.5">›</span>
                    <span className="text-slate-300">{log}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 py-4 text-center">No recent sync events logged.</div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Last Successful Sync:</span>
            <span className="font-mono text-slate-200">
              {syncStatus?.lastSyncTime
                ? new Date(syncStatus.lastSyncTime).toLocaleString()
                : 'Initial Mock Data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
