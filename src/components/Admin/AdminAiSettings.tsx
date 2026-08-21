import React, { useState, useEffect } from 'react';
import { AISettings } from '../../types';
import { api } from '../../lib/api';
import { Sparkles, Save, Send, RefreshCw, CheckCircle, Bot, Sliders } from 'lucide-react';

export const AdminAiSettings: React.FC = () => {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Playground test
  const [testPrompt, setTestPrompt] = useState('kya 450 GSM hoodie available hai aur delivery kitne din me hogi?');
  const [testReply, setTestReply] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getAiSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await api.updateAiSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRunPlaygroundTest = async () => {
    if (!testPrompt.trim() || testLoading) return;
    setTestLoading(true);
    setTestReply(null);

    try {
      const res = await api.sendMessage({
        customerId: 'admin_tester_sandbox',
        customerName: 'AI Sandbox Tester',
        message: testPrompt,
      });

      if (res.aiMessage) {
        setTestReply(res.aiMessage.content);
      } else {
        setTestReply('No response generated.');
      }
    } catch (err: any) {
      setTestReply(`Test error: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading AI settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Gemini 3.7 Flash Engine
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              Direct Server Integration
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">AI Assistant Directives & Tone</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Tune system prompts, multilingual Urdu support, strict inventory grounding rules, and test responses live.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save AI Configuration'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>AI Assistant directives successfully saved and loaded into active memory.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Model Parameters & Persona</h3>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">AI Public Persona Name</label>
            <input
              type="text"
              value={settings.aiName}
              onChange={e => setSettings({ ...settings, aiName: e.target.value })}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Communication Tone</label>
              <select
                value={settings.tone}
                onChange={e => setSettings({ ...settings, tone: e.target.value as any })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="modern_minimalist">Modern Minimalist Streetwear (Recommended)</option>
                <option value="luxurious">Luxury Architectural</option>
                <option value="friendly">Friendly & Casual</option>
                <option value="formal">Formal & Polite</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Gemini Model Alias</label>
              <input
                type="text"
                disabled
                value={settings.model}
                className="w-full bg-slate-950/60 text-slate-400 p-2.5 rounded-xl border border-slate-800 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Custom Brand Directives & Instructions
            </label>
            <textarea
              rows={6}
              value={settings.systemInstructions}
              onChange={e => setSettings({ ...settings, systemInstructions: e.target.value })}
              className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
            ></textarea>
          </div>

          <div className="pt-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.multilingualUrdu}
                onChange={e => setSettings({ ...settings, multilingualUrdu: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-indigo-600"
              />
              <span className="font-semibold text-slate-200">
                Enable Multilingual Urdu & Roman Urdu Understanding
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.strictInventoryOnly}
                onChange={e => setSettings({ ...settings, strictInventoryOnly: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-indigo-600"
              />
              <span className="font-semibold text-slate-200">
                Strict Grounding (Never invent prices, sizes, or policies)
              </span>
            </label>
          </div>
        </form>

        {/* Live Testing Sandbox */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm text-white">Live Grounding Sandbox</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Send test customer queries to evaluate how the AI formats product cards and adheres to current inventory prices.
            </p>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Test Query</label>
              <textarea
                rows={3}
                value={testPrompt}
                onChange={e => setTestPrompt(e.target.value)}
                placeholder="Ask about a product or policy..."
                className="w-full bg-slate-950 text-slate-100 p-3 rounded-2xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              ></textarea>

              <button
                type="button"
                onClick={handleRunPlaygroundTest}
                disabled={testLoading || !testPrompt.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {testLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Querying Gemini 3.7 Flash...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Run Grounded AI Test</span>
                  </>
                )}
              </button>
            </div>

            {testReply && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                  AI Output Response:
                </span>
                <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">{testReply}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
