import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Building, Check, Package, Sparkles, LogOut, RefreshCw } from 'lucide-react';
import { UserAccount, Order } from '../types';
import { api } from '../lib/api';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUpdateUser: (user: UserAccount) => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onLogout,
  onSwitchAccount,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
      setCity(currentUser.city || 'Lahore');
      setPostalCode(currentUser.postalCode || '');

      // Load user orders
      setIsLoadingOrders(true);
      api.getUserOrders({
        id: currentUser.id,
        email: currentUser.email,
        phone: currentUser.phone,
        name: currentUser.name,
      })
        .then(res => setOrders(res || []))
        .catch(console.error)
        .finally(() => setIsLoadingOrders(false));
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const res = await api.updateUserProfile({
        id: currentUser.id,
        name,
        email,
        phone,
        address,
        city,
        postalCode,
      });
      if (res.user) {
        onUpdateUser(res.user);
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onClose();
        }, 800);
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#1e1f20] border border-[#3c4043] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Top Glow Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8ab4f8] via-[#c58af9] to-[#81c995]" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-[#9aa0a6] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          {/* User Header */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8ab4f8]/20 to-[#c58af9]/20 border border-[#8ab4f8]/40 flex items-center justify-center text-[#8ab4f8] font-bold text-lg">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white font-display">{currentUser?.name || 'Customer Profile'}</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#8ab4f8]/10 text-[#8ab4f8] border border-[#8ab4f8]/30 text-[10px] font-semibold">
                  Verified Account
                </span>
              </div>
              <p className="text-xs text-[#9aa0a6]">{currentUser?.email} • {currentUser?.city || 'Pakistan'}</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-[#131314] p-1 rounded-xl mb-5 border border-[#2f3336]">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#282a2c] text-white shadow-sm font-bold border border-[#444746]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#8ab4f8]" />
              Profile & Delivery Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#282a2c] text-white shadow-sm font-bold border border-[#444746]'
                  : 'text-[#9aa0a6] hover:text-[#e3e3e3]'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-[#c58af9]" />
              My Orders ({orders.length})
            </button>
          </div>

          {activeTab === 'profile' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full bg-[#131314] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#131314] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Phone (WhatsApp)</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-[#131314] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">City</label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full bg-[#131314] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Shipping & Delivery Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="House / Street, Phase / Sector"
                    className="w-full bg-[#131314] text-white pl-10 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#131314] border border-[#2f3336] text-[11px] text-[#9aa0a6] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8ab4f8] shrink-0" />
                <span>
                  When you ask the AI concierge about your parcels, it automatically uses your account name (<strong>{name || 'You'}</strong>) to look up live status.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#041e49] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-[#041e49]" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchAccount();
                  }}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#282a2c] hover:bg-[#333538] text-[#e3e3e3] border border-[#444746] transition-all"
                >
                  Switch User
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {isLoadingOrders ? (
                <div className="p-8 text-center text-xs text-[#9aa0a6]">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#8ab4f8]" />
                  Loading your orders...
                </div>
              ) : orders.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#131314] border border-[#2f3336] text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 text-[#5f6368]" />
                  <p className="text-xs font-bold text-white mb-1">No Orders Found</p>
                  <p className="text-[11px] text-[#9aa0a6]">
                    You haven't placed an order under this account yet. Ask our AI for streetwear recommendations!
                  </p>
                </div>
              ) : (
                orders.map(order => (
                  <div
                    key={order.id}
                    className="p-3.5 rounded-2xl bg-[#131314] border border-[#2f3336] hover:border-[#444746] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#8ab4f8] font-mono">{order.orderNumber}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#282a2c] text-[10px] font-bold text-[#c58af9] border border-[#444746] uppercase">
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="text-xs text-[#e3e3e3]">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="text-white truncate max-w-[200px]">{it.title} ({it.size || 'M'})</span>
                          <span className="text-[#9aa0a6]">x{it.quantity} • Rs. {it.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-[#282a2c] flex items-center justify-between text-[10px] text-[#9aa0a6]">
                      <span>Courier: {order.courier || 'PostEx'} ({order.trackingNumber || 'Pending'})</span>
                      <span className="font-bold text-white">Rs. {order.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}

              <div className="pt-3 border-t border-[#2f3336] flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs font-medium text-white"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
