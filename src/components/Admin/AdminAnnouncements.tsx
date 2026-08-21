import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types';
import { api } from '../../lib/api';
import { Megaphone, Plus, Edit2, Trash2, X, Check, Flame, Sparkles } from 'lucide-react';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAnn, setEditingAnn] = useState<Partial<Announcement> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await api.getAnnouncements(false);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnn || !editingAnn.title || !editingAnn.content) return;

    try {
      await api.saveAnnouncement({
        ...editingAnn,
        type: editingAnn.type || 'drop',
        isActive: editingAnn.isActive ?? true,
      });
      setIsModalOpen(false);
      setEditingAnn(null);
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Customer Noticeboard
            </span>
            <span className="text-xs text-slate-400">{announcements.length} Announcements</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Manage Drops & Promotions</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Published announcements appear in the customer website Drops tab and notification drawer.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingAnn({
              title: '',
              content: '',
              type: 'drop',
              isActive: true,
              actionText: 'View Collection',
              actionUrl: 'https://vertexlab.store',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
            No announcements created yet.
          </div>
        ) : (
          announcements.map(ann => (
            <div
              key={ann.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                    {ann.type}
                  </span>
                  <h4 className="font-bold text-sm text-white">{ann.title}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnn(ann);
                    setIsModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && editingAnn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingAnn(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-4">
              {editingAnn.id ? 'Edit Announcement' : 'Publish New Announcement'}
            </h3>

            <form onSubmit={handleSaveAnnouncement} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editingAnn.title || ''}
                  onChange={e => setEditingAnn({ ...editingAnn, title: e.target.value })}
                  placeholder="e.g. Winter 2026 Architectural Drop Is Live"
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Type</label>
                <select
                  value={editingAnn.type || 'drop'}
                  onChange={e => setEditingAnn({ ...editingAnn, type: e.target.value as any })}
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="drop">Collection Drop</option>
                  <option value="promotion">Promo / Discount</option>
                  <option value="notice">Service Notice</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={editingAnn.content || ''}
                  onChange={e => setEditingAnn({ ...editingAnn, content: e.target.value })}
                  placeholder="Announcement description and details..."
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Button Text (Optional)</label>
                  <input
                    type="text"
                    value={editingAnn.actionText || ''}
                    onChange={e => setEditingAnn({ ...editingAnn, actionText: e.target.value })}
                    placeholder="e.g. Shop Now"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Button Link URL</label>
                  <input
                    type="url"
                    value={editingAnn.actionUrl || ''}
                    onChange={e => setEditingAnn({ ...editingAnn, actionUrl: e.target.value })}
                    placeholder="https://vertexlab.store/collections/..."
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingAnn(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save & Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
