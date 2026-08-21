import React, { useState, useEffect } from 'react';
import { BroadcastNotification, Customer } from '../../types';
import { api } from '../../lib/api';
import { Send, Users, Bell, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const AdminBroadcasts: React.FC = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'selected_customers'>('all');
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [actionUrl, setActionUrl] = useState('https://vertexlab.store');
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const loadData = async () => {
    try {
      const [bcasts, custs] = await Promise.all([api.getBroadcasts(), api.getCustomers()]);
      setBroadcasts(Array.isArray(bcasts) ? bcasts : []);
      setCustomers(Array.isArray(custs) ? custs : []);
    } catch (err) {
      console.error(err);
      setBroadcasts([]);
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSending(true);
    try {
      await api.sendBroadcast({
        title,
        message,
        targetType,
        recipientIds: selectedCustomerIds,
        actionUrl,
      });
      setTitle('');
      setMessage('');
      setSelectedCustomerIds([]);
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Push Broadcast Center
            </span>
            <span className="text-xs text-slate-400">{customers.length} Registered Customers</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Customer Broadcast Dispatcher</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Send immediate PWA push alerts and in-app notifications directly to customer devices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Form */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Send className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Compose Broadcast Message</h3>
          </div>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Broadcast Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 🔥 Flash Drop: 450 GSM Raw Cut Hoodies Restocked"
                required
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Audience</label>
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as any)}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Active Customers ({customers.length})</option>
                <option value="selected_customers">Selected Specific Customers</option>
              </select>
            </div>

            {targetType === 'selected_customers' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Select Recipients</label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {customers.map(c => {
                    const isSelected = selectedCustomerIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 p-1 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedCustomerIds(prev => [...prev, c.id]);
                            } else {
                              setSelectedCustomerIds(prev => prev.filter(id => id !== c.id));
                            }
                          }}
                        />
                        <span>{c.name} ({c.id})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Message Body</label>
              <textarea
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Enter alert message that will pop up on customer phones and notification drawer..."
                required
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              ></textarea>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Action URL (Optional)</label>
              <input
                type="url"
                value={actionUrl}
                onChange={e => setActionUrl(e.target.value)}
                placeholder="https://vertexlab.store"
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {sentSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Broadcast dispatched successfully to customer devices!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !title || !message}
              className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Sending Broadcast...' : 'Dispatch Broadcast'}</span>
            </button>
          </form>
        </div>

        {/* Historic Broadcasts Log */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Bell className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Sent Broadcast History</h3>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto">
            {broadcasts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No broadcasts sent yet.</div>
            ) : (
              broadcasts.map(b => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-indigo-400">Sent to {b.totalRecipients} customer(s)</span>
                    <span>{new Date(b.sentAt).toLocaleString()}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{b.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{b.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
