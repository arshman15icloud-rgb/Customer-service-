import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.loginAdmin(password);
      if (res.success) {
        sessionStorage.setItem('vertex_admin_authenticated', 'true');
        onSuccess();
        onClose();
      } else {
        setError(res.error || 'Invalid password. (Default is admin123)');
      }
    } catch (err: any) {
      setError('Authentication failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-display">Vertex Admin Portal</h3>
            <p className="text-xs text-slate-400">Authenticated management console</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Admin Password
            </label>
            <input
              id="input-admin-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Admin password..."
              autoFocus
              className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 px-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Default password: <code className="text-indigo-300 font-mono">admin123</code> (can be changed inside portal)
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            id="btn-admin-login-submit"
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-950/50 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Access Management Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
