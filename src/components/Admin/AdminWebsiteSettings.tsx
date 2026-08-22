import React, { useState, useEffect } from 'react';
import { WebsiteSettings } from '../../types';
import { api } from '../../lib/api';
import { Globe, Save, CheckCircle, Store, Phone, Mail, Clock } from 'lucide-react';

export const AdminWebsiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getWebsiteSettings();
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
      await api.updateWebsiteSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading website settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Brand Profile
            </span>
            <span className="text-xs text-slate-400">Vertex Lab Identity</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Website & Brand Settings</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Configure official brand assets, WhatsApp concierge numbers, welcome banners, and business hours.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Brand settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl space-y-6 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand Identity */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Store className="w-4 h-4 text-indigo-400" />
              <span>Brand Identity & Assets</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={settings.brandName}
                onChange={e => setSettings({ ...settings, brandName: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Brand Logo Image URL</label>
              <input
                type="url"
                value={settings.logoUrl}
                onChange={e => setSettings({ ...settings, logoUrl: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Main Store Website URL</label>
              <input
                type="url"
                value={settings.websiteUrl}
                onChange={e => setSettings({ ...settings, websiteUrl: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Customer Care Title</label>
              <input
                type="text"
                value={settings.customerCareTitle}
                onChange={e => setSettings({ ...settings, customerCareTitle: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Contact & Support Channels */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-slate-800">
              <Phone className="w-4 h-4 text-indigo-400" />
              <span>Contact Channels & Dispatch</span>
            </h3>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official WhatsApp Support Number</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="+92 300 1234567"
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Support Email</label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="care@vertexlab.store"
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Business & Dispatch Hours</label>
              <input
                type="text"
                value={settings.businessHours}
                onChange={e => setSettings({ ...settings, businessHours: e.target.value })}
                placeholder="Mon - Sat: 11:00 AM - 9:00 PM PKT"
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Customer Welcome Message</label>
              <textarea
                rows={3}
                value={settings.welcomeMessage}
                onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
          >
            Save Brand Details
          </button>
        </div>
      </form>
    </div>
  );
};
