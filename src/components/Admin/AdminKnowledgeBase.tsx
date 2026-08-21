import React, { useState, useEffect } from 'react';
import { KnowledgeDoc } from '../../types.js';
import { api } from '../../lib/api.js';
import { BookOpen, Plus, Edit2, FileText, Check, X, Sparkles } from 'lucide-react';

export const AdminKnowledgeBase: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDoc, setEditingDoc] = useState<Partial<KnowledgeDoc> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadDocs = async () => {
    try {
      setLoading(true);
      const data = await api.getKnowledgeDocs();
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editingDoc.title || !editingDoc.content) return;

    try {
      await api.saveKnowledgeDoc(editingDoc);
      setIsModalOpen(false);
      setEditingDoc(null);
      await loadDocs();
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
              AI Grounding Memory
            </span>
            <span className="text-xs text-slate-400">{docs.length} Documents</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Brand Knowledge Base</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            In-depth documentation on fabric specifications (450 GSM), sizing charts, wash guidelines, and escalation workflows.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingDoc({
              title: '',
              category: 'Textile & Fabrics',
              content: '',
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Knowledge Doc</span>
        </button>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 col-span-2">Loading knowledge base...</div>
        ) : docs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-900 rounded-3xl border border-slate-800 col-span-2">
            No knowledge base documents configured.
          </div>
        ) : (
          docs.map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                    {doc.category}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{doc.title}</h3>
                <div className="text-xs text-slate-300 font-mono leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  {doc.content}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Synced to Gemini Model
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setEditingDoc(doc);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Doc</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingDoc(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-4">
              {editingDoc.id ? 'Edit Knowledge Document' : 'Create Knowledge Document'}
            </h3>

            <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Document Title</label>
                <input
                  type="text"
                  value={editingDoc.title || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  placeholder="e.g. 450 GSM Heavyweight Terry Specifications"
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={editingDoc.category || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value })}
                  placeholder="e.g. Sizing & Fit, Textile Specs, Shipping Logistics"
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Content (AI will use this verbatim to answer complex questions)
                </label>
                <textarea
                  rows={8}
                  value={editingDoc.content || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, content: e.target.value })}
                  placeholder="Detailed guidelines, chest inches measurements, wash instructions..."
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDoc(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Knowledge Doc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
