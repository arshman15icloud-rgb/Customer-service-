import React, { useState, useEffect, useRef } from 'react';
import { Message, Conversation, Product, WebsiteSettings, AISettings, UserAccount } from '../types';
import { api } from '../lib/api';
import { VertexSparkleIcon } from './VertexSparkleIcon';
import { ProductCard } from './ProductCard';
import {
  Send,
  Plus,
  ArrowRight,
  Mic,
  MicOff,
  Copy,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shirt,
  Truck,
  ShieldAlert,
  Layers,
  Menu,
  MessageSquare,
  Shield,
  Check,
  X,
  Sparkles,
  HeartHandshake,
  UserCheck
} from 'lucide-react';

interface VertexChatAppProps {
  customerId: string;
  customerName: string;
  customerEmail: string;
  currentUser?: UserAccount | null;
  websiteSettings: WebsiteSettings;
  aiSettings: AISettings;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onViewProductDetails: (product: Product) => void;
}

export const VertexChatApp: React.FC<VertexChatAppProps> = ({
  customerId,
  customerName,
  customerEmail,
  currentUser,
  websiteSettings,
  aiSettings,
  onOpenAdmin,
  onOpenProfile,
  onViewProductDetails,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Left Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [conversationsList, setConversationsList] = useState<Conversation[]>([]);

  // Message interaction states
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Curated suggestion prompts
  const suggestionPrompts = [
    {
      icon: Truck,
      title: 'Track Order & Status',
      desc: 'Check live Tatami embroidery, packaging & courier tracking for your parcel',
      prompt: 'Can you check my order status? I would like to track my order.',
    },
    {
      icon: Shirt,
      title: 'Anime Drops & Fabric Specs',
      desc: 'Spider-Man, Toji & Sukuna 240–280 GSM heavyweight streetwear',
      prompt: 'Show me your latest anime streetwear drops, available sizes, and fabric GSM specifications.',
    },
    {
      icon: Layers,
      title: 'Japanese Tatami Embroidery',
      desc: '85,000+ stitch count craftsmanship & garment care details',
      prompt: 'Tell me about the Japanese Tatami embroidery details on Vertex Lab apparel and how to care for it.',
    },
    {
      icon: HeartHandshake,
      title: 'Brand Story & Lahore Studio',
      desc: 'Independent design collective & Lab11 studio craftsmanship',
      prompt: 'Who is the brand owner of Vertex Lab and what is the story behind your Lahore design studio?',
    },
  ];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 50);
  };

  // Load chat history
  const loadChat = async () => {
    try {
      const convs = await api.getConversations('all', customerId);
      const safeConvs = Array.isArray(convs) ? convs : [];
      setConversationsList(safeConvs);
      const myConv = safeConvs.find(c => c && c.customerId === customerId);

      if (myConv) {
        setConversation(myConv);
        const full = await api.getConversation(myConv.id);
        setMessages(full && Array.isArray(full.messages) ? full.messages : []);
      } else {
        setConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
      setConversationsList([]);
      setMessages([]);
    }
  };

  useEffect(() => {
    loadChat();
  }, [customerId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isTyping]);

  // Voice recording setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Failed to start voice recognition:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversationId: conversation?.id || '',
      sender: 'customer',
      content: text,
      timestamp: new Date().toISOString(),
      read: true,
    };

    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await api.sendMessage({
        customerId,
        message: text,
        customerName: currentUser?.name || customerName,
        email: currentUser?.email || customerEmail,
        conversationId: conversation?.id,
        user: currentUser,
      });

      if (response && response.conversation) {
        setConversation(response.conversation);
      }

      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
        const newMessages = [...withoutTemp];
        if (response.customerMessage) {
          newMessages.push(response.customerMessage);
        } else {
          newMessages.push({ ...tempUserMsg, read: true });
        }
        if (response.aiMessage) {
          newMessages.push(response.aiMessage);
        }
        return newMessages;
      });

      api.getConversations('all', customerId).then(setConversationsList).catch(() => {});
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleStartNewChat = () => {
    localStorage.removeItem('vertex_care_customer_id');
    window.location.reload();
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown for speech
    const cleanText = text.replace(/[*_#`~]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const firstName = customerName && customerName !== 'Guest Customer' ? customerName.split(' ')[0] : 'there';

  // Helper for bold text and formatting
  const renderTextWithMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <React.Fragment key={lineIdx}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
          {lineIdx < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] font-sans antialiased overflow-hidden select-text">
      
      {/* Left Sidebar (Collapsible) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#1e1f20] border-r border-[#282a2c] transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#282a2c]">
          <div className="flex items-center gap-2.5">
            <VertexSparkleIcon className="w-6 h-6" animated={true} />
            <span className="font-semibold text-base tracking-tight text-white font-display">
              {websiteSettings.brandName || 'Vertex Lab'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[#9aa0a6] hover:text-white hover:bg-[#282a2c]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 py-3">
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-xs font-semibold bg-[#282a2c] hover:bg-[#333538] text-[#e3e3e3] border border-[#3c4043] transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#a8c7fa]" />
            <span>New conversation</span>
          </button>
        </div>

        {/* Recent Conversations */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 no-scrollbar">
          <div className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider px-2 mb-2">
            Recent Conversations
          </div>
          {!Array.isArray(conversationsList) || conversationsList.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#5f6368]">
              No past conversations yet
            </div>
          ) : (
            conversationsList.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] cursor-pointer transition-colors group"
                onClick={() => setIsSidebarOpen(false)}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#9aa0a6] group-hover:text-[#a8c7fa] shrink-0" />
                <span className="truncate flex-1">
                  {c.lastMessage || 'Streetwear inquiry'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#282a2c] space-y-1">
          <button
            type="button"
            onClick={onOpenProfile}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center text-[#a8c7fa] text-[10px] font-bold">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate flex-1 text-left">{customerName || 'Profile & Identity'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-[#c4c7c5] hover:text-white hover:bg-[#282a2c] transition-colors"
          >
            <Shield className="w-4 h-4 text-[#9B72CB]" />
            <span>Admin Portal</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#131314] relative">
        
        {/* Top App Bar */}
        <header className="flex items-center justify-between px-3 sm:px-6 h-14 bg-[#131314] border-b border-[#282a2c]/80 shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-full text-[#9aa0a6] hover:text-white hover:bg-[#1e1f20]"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Brand Title Badge */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-white font-display">
                {websiteSettings.brandName}
              </span>
              <span className="text-[10px] text-[#a8c7fa] bg-[#1e1f20] px-2 py-0.5 rounded-full border border-[#282a2c]">
                Lab11 AI Concierge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-full bg-[#1e1f20] hover:bg-[#282a2c] border border-[#333538] flex items-center justify-center text-[#a8c7fa] text-xs font-bold shadow-sm transition-all"
              title="Customer Profile"
            >
              {firstName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        {/* Chat Scroll View */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-7 bg-gemini-ambient flex flex-col">
          {messages.length === 0 ? (
            <div className="my-auto max-w-2xl mx-auto w-full py-6 text-left animate-fadeIn">
              {/* Welcome Headline */}
              <div className="mb-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1e1f20] border border-[#333538] text-[#a8c7fa] text-xs font-medium mb-4">
                  <VertexSparkleIcon className="w-3.5 h-3.5" size={14} />
                  <span>Vertex Lab AI Concierge</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display text-white">
                  <span className="gemini-gradient-text">Hello, {firstName}</span>
                </h1>
                <p className="text-base sm:text-xl font-normal text-[#9aa0a6] mt-2">
                  How can I assist you with anime streetwear drops, sizing, Pakistan delivery, or tatami embroidery?
                </p>
              </div>

              {/* 4 Suggestion Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {suggestionPrompts.map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(card.prompt)}
                      className="flex flex-col text-left p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#3c4043] transition-all group active:scale-[0.99] shadow-md relative"
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className="w-8 h-8 rounded-xl bg-[#282a2c] group-hover:bg-[#333538] flex items-center justify-center text-[#a8c7fa]">
                          <Icon className="w-4 h-4" />
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#5f6368] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-[#e3e3e3] group-hover:text-[#a8c7fa] transition-colors">
                        {card.title}
                      </span>
                      <span className="text-[11px] text-[#9aa0a6] mt-1 line-clamp-2 leading-relaxed">
                        {card.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-7 pb-4">
              {(Array.isArray(messages) ? messages : []).map((msg, index) => {
                const isCustomer = msg.sender === 'customer';
                const isCopied = copiedMessageId === msg.id;
                const isSpeaking = speakingMessageId === msg.id;
                const feedback = feedbackMap[msg.id];

                if (isCustomer) {
                  return (
                    <div key={msg.id || index} className="flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-[#282a2c] text-[#f1f3f4] px-4 py-3 rounded-3xl rounded-tr-sm border border-[#3c4043] text-sm sm:text-base leading-relaxed shadow-sm">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || index} className="flex items-start gap-3 sm:gap-4 max-w-full text-left animate-fadeIn">
                    <div className="w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-md bg-[#1e1f20] border border-[#333538] text-[#a8c7fa]">
                      <VertexSparkleIcon className="w-4 h-4" size={16} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                      {msg.senderName && (
                        <div className="text-[11px] font-semibold tracking-wide uppercase text-[#9aa0a6]">
                          {msg.senderName}
                        </div>
                      )}

                      {/* Crisp Formatted Message Content */}
                      <div className="w-full text-sm sm:text-base text-[#f1f3f4] leading-relaxed whitespace-pre-wrap font-normal">
                        {renderTextWithMarkdown(msg.content)}
                      </div>

                      {/* Embedded Recommended Products */}
                      {Array.isArray(msg.products) && msg.products.length > 0 && (
                        <div className="w-full pt-2">
                          <div className="flex sm:grid sm:grid-cols-2 gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {msg.products.map(product => (
                              <ProductCard
                                key={product.id}
                                product={product}
                                compact={true}
                                onViewDetails={onViewProductDetails}
                                onAskAi={p => handleSendMessage(`Tell me more about ${p.title}`)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Action Bar */}
                      <div className="flex items-center gap-1 pt-1 text-[#9aa0a6]">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors"
                          title="Copy response"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSpeakMessage(msg.id, msg.content)}
                          className={`p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ${
                            isSpeaking ? 'text-[#78D9EC] bg-[#282a2c]' : ''
                          }`}
                          title="Listen to response"
                        >
                          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setFeedbackMap(prev => ({ ...prev, [msg.id]: prev[msg.id] === 'up' ? undefined : 'up' } as any))}
                          className={`p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ${
                            feedback === 'up' ? 'text-[#4285F4] bg-[#282a2c]' : ''
                          }`}
                          title="Good response"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setFeedbackMap(prev => ({ ...prev, [msg.id]: prev[msg.id] === 'down' ? undefined : 'down' } as any))}
                          className={`p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ${
                            feedback === 'down' ? 'text-[#D96570] bg-[#282a2c]' : ''
                          }`}
                          title="Bad response"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendMessage(`Can you explain further in detail?`)}
                          className="p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ml-1"
                          title="Elaborate"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing / Thinking Indicator */}
              {isTyping && (
                <div className="flex items-start gap-3 sm:gap-4 max-w-full text-left animate-fadeIn">
                  <div className="w-8 h-8 rounded-2xl bg-[#1e1f20] border border-[#333538] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                    <VertexSparkleIcon className="w-4 h-4" animated={true} />
                  </div>
                  <div className="flex items-center gap-2 py-2 px-3.5 rounded-2xl bg-[#1e1f20] border border-[#282a2c] text-xs text-[#9aa0a6]">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4285F4] animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-[#9B72CB] animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-[#D96570] animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span>Vertex Assistant is crafting reply...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating Prompt Input Box */}
        <div className="p-3 sm:p-5 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent shrink-0">
          <div className="max-w-3xl mx-auto w-full">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-[#1e1f20] focus-within:bg-[#232527] rounded-3xl border border-[#333538] focus-within:border-[#4285F4]/70 focus-within:ring-2 focus-within:ring-[#4285F4]/20 transition-all p-1.5 sm:p-2 shadow-xl"
            >
              {/* Browse stock button */}
              <button
                type="button"
                onClick={() => handleSendMessage('Show me all available streetwear products in stock')}
                className="p-2 sm:p-2.5 rounded-full text-[#9aa0a6] hover:text-white hover:bg-[#282a2c] transition-colors shrink-0"
                title="Browse stock"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Chat Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isRecording
                    ? 'Listening to your voice...'
                    : 'Ask Vertex AI anything (drops, sizing, fabric GSM, shipping)...'
                }
                className="flex-1 bg-transparent text-[#e3e3e3] placeholder:text-[#5f6368] px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none resize-none max-h-32"
              />

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`p-2 sm:p-2.5 rounded-full transition-all shrink-0 ${
                  isRecording ? 'bg-rose-500 text-white animate-pulse' : 'text-[#9aa0a6] hover:text-white hover:bg-[#282a2c]'
                }`}
                title={isRecording ? 'Stop listening' : 'Voice input'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#a8c7fa]" />}
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className={`p-2 sm:p-2.5 rounded-2xl transition-all shrink-0 ml-1 ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-[#e3e3e3] text-[#131314] hover:bg-white active:scale-95 shadow-md'
                    : 'text-[#5f6368] opacity-40 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center text-[11px] text-[#5f6368] mt-2">
              Vertex Lab Studio Lahore • 240–280 GSM Heavyweight Streetwear • 100% Free Damaged Item Replacement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
