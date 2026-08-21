import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, Customer, Product } from '../../types';
import { api } from '../../lib/api';
import {
  MessageSquare,
  Search,
  User,
  Sparkles,
  Headphones,
  CheckCircle,
  Clock,
  Send,
  RefreshCw,
  Tag,
  AlertTriangle,
  ShoppingBag,
  Plus,
  Shield,
  ArrowRight
} from 'lucide-react';

export const AdminInbox: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [agentName, setAgentName] = useState('Senior Care Agent');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations(filterStatus, searchQuery);
      const safeData = Array.isArray(data) ? data : [];
      setConversations(safeData);
      if (!selectedConvId && safeData.length > 0) {
        setSelectedConvId(safeData[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveConversation = async (id: string) => {
    try {
      const data = await api.getConversation(id);
      if (data) {
        setActiveConv(data.conversation || null);
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setCustomer(data.customer || null);
      }
    } catch (err) {
      console.error('Error loading active conversation:', err);
      setMessages([]);
    }
  };

  useEffect(() => {
    loadConversations();
    api
      .getProducts()
      .then(p => setProducts(Array.isArray(p) ? p : []))
      .catch(console.error);
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    if (selectedConvId) {
      loadActiveConversation(selectedConvId);
    }
  }, [selectedConvId]);

  // Periodic poll for active conversation & list
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConvId) {
        loadActiveConversation(selectedConvId);
      }
      api
        .getConversations(filterStatus, searchQuery)
        .then(c => setConversations(Array.isArray(c) ? c : []))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConvId, filterStatus, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTakeover = async () => {
    if (!selectedConvId) return;
    try {
      await api.takeOverConversation(selectedConvId, agentName);
      await loadActiveConversation(selectedConvId);
      await loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnToAi = async () => {
    if (!selectedConvId) return;
    try {
      await api.returnToAi(selectedConvId);
      await loadActiveConversation(selectedConvId);
      await loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId || !replyText.trim() || sending) return;

    setSending(true);
    try {
      await api.replyToConversation(selectedConvId, replyText.trim(), selectedProductIds, agentName);
      setReplyText('');
      setSelectedProductIds([]);
      setShowProductPicker(false);
      await loadActiveConversation(selectedConvId);
      await loadConversations();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedConvId) return;
    try {
      await api.updateConversation(selectedConvId, { status: 'resolved' });
      await loadActiveConversation(selectedConvId);
      await loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePriority = async (priority: 'low' | 'normal' | 'high' | 'urgent') => {
    if (!selectedConvId) return;
    try {
      await api.updateConversation(selectedConvId, { priority });
      await loadActiveConversation(selectedConvId);
      await loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="admin-inbox" className="flex flex-col lg:flex-row h-[calc(100vh-12rem)] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
      {/* 1. Left List: Conversations Directory */}
      <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950/60 shrink-0">
        {/* Search & Filter bar */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search customer, message..."
              className="w-full bg-slate-900 text-slate-100 placeholder:text-slate-500 pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {['all', 'waiting_for_human', 'human', 'ai', 'resolved'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading inbox...</div>
          ) : !Array.isArray(conversations) || conversations.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 px-4">
              No conversations found under this filter.
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = selectedConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-3.5 text-left flex flex-col gap-1.5 transition-all ${
                    isSelected ? 'bg-indigo-950/40 border-l-4 border-indigo-500' : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white truncate max-w-[130px]">
                      {conv.customerName || 'Guest Customer'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(conv.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 leading-snug">
                    {conv.lastMessage || 'Started conversation'}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    {conv.status === 'human' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Live Agent
                      </span>
                    )}
                    {conv.status === 'waiting_for_human' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                        Escalated
                      </span>
                    )}
                    {conv.status === 'ai' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        AI Active
                      </span>
                    )}
                    {conv.status === 'resolved' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Resolved
                      </span>
                    )}

                    {conv.priority === 'urgent' && (
                      <span className="text-[9px] font-bold text-rose-400 uppercase">Urgent</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Middle Panel: Live Chat Transcript & Actions */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900">
        {activeConv ? (
          <>
            {/* Conversation Header & Mode Switcher */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-800/60 flex items-center justify-center font-bold text-sm">
                  {activeConv.customerName ? activeConv.customerName.charAt(0).toUpperCase() : 'C'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{activeConv.customerName}</h3>
                    <span className="text-xs text-slate-400 font-mono">({activeConv.customerId})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Status:</span>
                    <span className="font-semibold text-slate-200 capitalize">
                      {activeConv.status.replace(/_/g, ' ')}
                    </span>
                    {activeConv.assignedAgent && (
                      <span>• Handled by: {activeConv.assignedAgent}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hybrid Mode Toggle Buttons */}
              <div className="flex items-center gap-2">
                {activeConv.status === 'human' ? (
                  <button
                    type="button"
                    onClick={handleReturnToAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Return to AI</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTakeover}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50 transition-all active:scale-95"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Take Over Chat</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResolve}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                  title="Mark Resolved"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-grid-subtle">
              {(Array.isArray(messages) ? messages : []).map((msg, i) => {
                const isCustomer = msg.sender === 'customer';
                const isSystem = msg.sender === 'system';

                if (isSystem) {
                  return (
                    <div key={msg.id || i} className="flex justify-center my-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id || i}
                    className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 mb-1">
                      <span className="font-semibold text-slate-300">
                        {isCustomer
                          ? activeConv?.customerName || 'Customer'
                          : msg.sender === 'human'
                          ? `Agent (${msg.senderName || 'Staff'})`
                          : 'Vertex AI Model'}
                      </span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                        isCustomer
                          ? 'bg-slate-800 text-slate-100 border border-slate-700/70'
                          : msg.sender === 'human'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                          : 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Product mentions */}
                      {Array.isArray(msg.productIds) && msg.productIds.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-[11px] flex flex-wrap gap-1">
                          <span className="font-semibold">Attached Products:</span>
                          {msg.productIds.map(pid => (
                            <span key={pid} className="font-mono bg-black/20 px-1 rounded">
                              {pid}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Product Attachment Picker Modal/Drawer */}
            {showProductPicker && (
              <div className="p-3 bg-slate-950 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Attach Product Card to Reply:</span>
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto">
                  {Array.isArray(products) &&
                    products.map(p => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                            } else {
                              setSelectedProductIds(prev => [...prev, p.id]);
                            }
                          }}
                          className={`p-2 rounded-xl text-left text-xs border transition-all ${
                            isSelected
                              ? 'bg-indigo-950 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-300'
                          }`}
                        >
                        <p className="font-semibold truncate">{p.title}</p>
                        <p className="text-[10px] text-indigo-400">Rs. {p.price}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reply Input Box */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800">
              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowProductPicker(!showProductPicker)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    selectedProductIds.length > 0
                      ? 'bg-indigo-950 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Attach Product to reply"
                >
                  <ShoppingBag className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={
                    activeConv.status === 'human'
                      ? 'Type human agent response (AI is paused)...'
                      : 'Type reply (will post as Human Agent)...'
                  }
                  className="flex-1 bg-slate-900 text-slate-100 placeholder:text-slate-500 px-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Reply</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            <h4 className="font-semibold text-slate-300">No conversation selected</h4>
            <p className="text-xs text-slate-500 mt-1">Select a customer thread from the left to view messages.</p>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar: Customer Profile & Order Context */}
      {activeConv && (
        <div className="hidden xl:flex w-72 border-l border-slate-800 flex-col bg-slate-950/60 p-4 shrink-0 overflow-y-auto space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <User className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">Customer Card</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Name:</span>
              <span className="font-semibold text-white">{activeConv.customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Customer ID:</span>
              <span className="font-mono text-indigo-300 text-[11px]">{activeConv.customerId}</span>
            </div>
            {customer?.email && (
              <div>
                <span className="text-slate-400 block text-[11px]">Email:</span>
                <span className="text-slate-200">{customer.email}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[11px]">Priority:</span>
              <div className="flex items-center gap-1 mt-1">
                {(['low', 'normal', 'high', 'urgent'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleUpdatePriority(p)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                      activeConv.priority === p
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Canned Macros */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick Agent Macros
            </span>
            <button
              type="button"
              onClick={() => setReplyText('Hello! I am a live care specialist at Vertex Lab. How may I assist you with your order?')}
              className="w-full text-left p-2 rounded-xl text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            >
              "Hello, live care agent here..."
            </button>
            <button
              type="button"
              onClick={() => setReplyText('Could you please share your 5-digit Order ID so I can track the dispatch status for you?')}
              className="w-full text-left p-2 rounded-xl text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            >
              "Please share your 5-digit Order ID..."
            </button>
            <button
              type="button"
              onClick={() => setReplyText('We have initiated a replacement exchange for your size. You will receive tracking details via SMS.')}
              className="w-full text-left p-2 rounded-xl text-[11px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            >
              "Exchange initiated for your size..."
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
