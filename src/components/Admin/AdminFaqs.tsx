import React, { useState, useEffect } from 'react';
import { FAQ } from '../../types.js';
import { api } from '../../lib/api.js';
import { HelpCircle, Plus, Edit2, Trash2, Check, X, Search, Eye, EyeOff } from 'lucide-react';

export const AdminFaqs: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      const data = await api.getFaqs();
      setFaqs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq || !editingFaq.question || !editingFaq.answer) return;

    try {
      await api.saveFaq({
        ...editingFaq,
        category: editingFaq.category || 'General',
        isActive: editingFaq.isActive ?? true,
      });
      setIsModalOpen(false);
      setEditingFaq(null);
      await loadFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await api.deleteFaq(id);
      await loadFaqs();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFaqs = faqs.filter(
    f =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Customer Policies
            </span>
            <span className="text-xs text-slate-400">Total: {faqs.length} FAQs</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Manage FAQs & Quick Answers</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            AI Customer Care references these answers directly when customers ask policy questions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingFaq({
              question: '',
              answer: '',
              category: 'Delivery',
              isActive: true,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add FAQ Entry</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search FAQs by question, category, answer text..."
          className="w-full bg-slate-900 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* FAQs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading FAQs...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 bg-slate-900 rounded-3xl border border-slate-800">
            No FAQs found matching your query.
          </div>
        ) : (
          filteredFaqs.map(faq => (
            <div
              key={faq.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-indigo-300 border border-slate-700">
                    {faq.category}
                  </span>
                  <h4 className="font-bold text-sm text-white">{faq.question}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingFaq(faq);
                    setIsModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFaq(faq.id)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingFaq(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-4">
              {editingFaq.id ? 'Edit FAQ Entry' : 'Create New FAQ'}
            </h3>

            <form onSubmit={handleSaveFaq} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={editingFaq.category || ''}
                  onChange={e => setEditingFaq({ ...editingFaq, category: e.target.value })}
                  placeholder="e.g. Delivery, Sizing, Return, Payment"
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Question (What customers ask)</label>
                <input
                  type="text"
                  value={editingFaq.question || ''}
                  onChange={e => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  placeholder="e.g. What are delivery charges across Pakistan?"
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Official Accurate Answer</label>
                <textarea
                  rows={4}
                  value={editingFaq.answer || ''}
                  onChange={e => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  placeholder="Standard shipping is Rs. 200 nationwide. Orders above Rs. 4,999 get free shipping."
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingFaq(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
