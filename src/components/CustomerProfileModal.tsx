import React, { useState } from 'react';
import { X, User, Mail, Check, Shield } from 'lucide-react';
import { saveCustomerProfile } from '../lib/pwa.js';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  initialName: string;
  initialEmail: string;
  onSave: (name: string, email: string) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  customerId,
  initialName,
  initialEmail,
  onSave,
}) => {
  const [name, setName] = useState(initialName || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomerProfile(name, email);
    onSave(name, email);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/60">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white font-display">Customer Identity</h3>
            <p className="text-xs text-slate-400">Used by AI and Care Specialists for tailored help</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Your Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Zaid Khan"
                required
                className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address (Optional)</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. zaid@example.com"
                className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
            <span className="font-mono text-slate-300 block mb-0.5">Session ID: {customerId}</span>
            Your chat history and order context are securely preserved for your browser.
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Details</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
