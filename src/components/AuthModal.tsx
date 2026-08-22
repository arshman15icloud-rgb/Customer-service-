import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, Building, Sparkles, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserAccount } from '../types';
import { api } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
  mustAuthenticate?: boolean;
}

const PRESET_DEMO_USERS = [
  {
    name: 'Arshman',
    email: 'arshman15icloud@gmail.com',
    password: 'password123',
    city: 'Lahore',
    badge: 'Order #VL-1002 (In Embroidery)',
  },
  {
    name: 'Ali Khan',
    email: 'ali.khan@gmail.com',
    password: 'password123',
    city: 'Islamabad',
    badge: 'Order #VL-1001 (Dispatched)',
  },
  {
    name: 'Zain Ahmed',
    email: 'zain.ahmed@yahoo.com',
    password: 'password123',
    city: 'Karachi',
    badge: 'Order #VL-1003 (Out for Delivery)',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  mustAuthenticate = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [postalCode, setPostalCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.loginUser(email.trim(), password.trim() || 'password123');
        if (res.user) {
          setSuccessMsg(`Welcome back, ${res.user.name}!`);
          setTimeout(() => {
            onSuccess(res.user);
            onClose();
          }, 600);
        }
      } else {
        if (!name.trim()) {
          setError('Please provide your Full Name');
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          setError('Please provide your Email Address');
          setIsLoading(false);
          return;
        }

        const res = await api.registerUser({
          name: name.trim(),
          email: email.trim(),
          password: password.trim() || 'password123',
          phone: phone.trim() || '+92 300 0000000',
          address: address.trim() || 'Pakistan',
          city: city.trim() || 'Lahore',
          postalCode: postalCode.trim() || '54000',
        });

        if (res.user) {
          setSuccessMsg(`Account created for ${res.user.name}!`);
          setTimeout(() => {
            onSuccess(res.user);
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = async (demo: typeof PRESET_DEMO_USERS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.loginUser(demo.email, demo.password);
      if (res.user) {
        setSuccessMsg(`Logged in as ${res.user.name}!`);
        setTimeout(() => {
          onSuccess(res.user);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to login with demo user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#1e1f20] border border-[#3c4043] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Glow Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#4285F4] via-[#A142F4] to-[#34A853]" />

        {!mustAuthenticate && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-[#9aa0a6] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 sm:p-8">
          {/* Brand & Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4285F4]/20 to-[#A142F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#8ab4f8]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e3e3e3] font-display tracking-tight">
                {mode === 'login' ? 'Sign In to Vertex Lab' : 'Create Customer Account'}
              </h2>
              <p className="text-xs text-[#9aa0a6]">
                {mode === 'login'
                  ? 'Access your orders, track parcels, and chat with AI Concierge'
                  : 'Enter your delivery details for seamless order tracking'}
              </p>
            </div>
          </div>

          {/* Quick Demo Selector */}
          <div className="mb-6 bg-[#131314] p-3 rounded-2xl border border-[#2f3336]">
            <span className="text-[10px] font-bold text-[#8ab4f8] uppercase tracking-wider block mb-2 px-1">
              ⚡ Quick 1-Click Sign-In
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PRESET_DEMO_USERS.map(demo => (
                <button
                  key={demo.email}
                  type="button"
                  onClick={() => handleQuickDemoSelect(demo)}
                  className="flex flex-col items-start p-2.5 rounded-xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#3c4043] hover:border-[#8ab4f8]/50 text-left transition-all group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white group-hover:text-[#8ab4f8]">{demo.name}</span>
                    <span className="text-[9px] text-[#9aa0a6]">{demo.city}</span>
                  </div>
                  <span className="text-[9px] text-[#c58af9] mt-0.5 truncate max-w-full">{demo.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#131314] p-1 rounded-xl mb-6 border border-[#2f3336]">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[#282a2c] text-white shadow-sm font-bold border border-[#444746]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              Sign In (Existing User)
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[#282a2c] text-white shadow-sm font-bold border border-[#444746]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              Create Account (New User)
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Arshman Khan"
                    className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. arshman15icloud@gmail.com"
                  className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password (e.g. password123)"
                  className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Phone (WhatsApp) *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+92 321 1234567"
                        className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1">City *</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Lahore, Karachi, Islamabad..."
                        className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Delivery Address *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="House/Street, Phase/Sector/Area"
                      className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 rounded-xl text-xs sm:text-sm font-bold bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#041e49] shadow-lg shadow-blue-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#041e49] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In & Continue' : 'Register Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#2f3336] flex items-center justify-between text-[11px] text-[#9aa0a6]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#81c995]" />
              Secure 256-bit session
            </span>
            <span className="text-[#c4c7c5]">Vertex Lab Streetwear</span>
          </div>
        </div>
      </div>
    </div>
  );
};
