import React, { useState, useEffect, useRef } from 'react';
import { Message, Conversation, Product, WebsiteSettings, AISettings } from '../types';
import { api } from '../lib/api';
import { ProductCard } from './ProductCard';
import { VertexSparkleIcon } from './VertexSparkleIcon';
import {
  Send,
  Sparkles,
  User,
  Shield,
  Headphones,
  AlertCircle,
  RefreshCw,
  Plus,
  CheckCheck,
  Check,
  Zap,
  ArrowRight,
  Info,
  Clock,
  Mic,
  MicOff,
  Copy,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Shirt,
  Truck,
  ShieldAlert,
  HelpCircle,
  Flame,
  Layers
} from 'lucide-react';

interface CustomerChatProps {
  customerId: string;
  customerName: string;
  customerEmail: string;
  websiteSettings: WebsiteSettings;
  aiSettings: AISettings;
  onViewProductDetails: (product: Product) => void;
}

export const CustomerChat: React.FC<CustomerChatProps> = ({
  customerId,
  customerName,
  customerEmail,
  websiteSettings,
  aiSettings,
  onViewProductDetails,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  // Interactive feature states
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [showPromptsDrawer, setShowPromptsDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Gemini Style Category Prompt Cards
  const geminiPromptCards = [
    {
      icon: Shirt,
      color: 'text-[#78D9EC]',
      bg: 'bg-[#78D9EC]/10',
      border: 'border-[#78D9EC]/20',
      title: 'Explore Anime Streetwear',
      description: 'Spider-Man, Toji Fushiguro & Sukuna 280 GSM heavy-knit tees',
      prompt: 'Tell me about your latest anime streetwear drops, GSM fabric quality, and current prices in PKR.',
    },
    {
      icon: Truck,
      color: 'text-[#4285F4]',
      bg: 'bg-[#4285F4]/10',
      border: 'border-[#4285F4]/20',
      title: 'Delivery & Shipping Times',
      description: '24–48 hrs in Lahore, 2–3 days to Karachi, Islamabad & nationwide',
      prompt: 'What are your delivery times to Lahore, Karachi, and Islamabad? Do you offer Free Shipping?',
    },
    {
      icon: ShieldAlert,
      color: 'text-[#D96570]',
      bg: 'bg-[#D96570]/10',
      border: 'border-[#D96570]/20',
      title: 'Damaged Item Replacement',
      description: '100% free reverse pickup & instant replacement on transit defects',
      prompt: 'What is your policy if an item arrives damaged or incorrect? How does the free replacement work?',
    },
    {
      icon: Layers,
      color: 'text-[#9B72CB]',
      bg: 'bg-[#9B72CB]/10',
      border: 'border-[#9B72CB]/20',
      title: 'Tatami Embroidery Specs',
      description: '100,000+ precision needle stitches and garment washing care',
      prompt: 'How is the Tatami embroidery done and how should I wash Vertex Lab oversized garments to maintain embroidery quality?',
    },
  ];

  const quickPrompts = [
    'Tell me about Spider-Man & Toji embroidered tees',
    'What is your delivery time to Lahore / Karachi?',
    'What is your damaged item replacement policy?',
    'Show items under Rs. 3,000',
    'What fabric GSM and embroidery techniques are used?',
    'Do you provide Free Shipping on orders over Rs. 4,999?',
    'I want to speak with a human agent',
  ];

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load conversation & messages
  const loadChat = async () => {
    try {
      setErrorText(null);
      const convs = await api.getConversations('all', customerId);
      const myConv = convs.find(c => c.customerId === customerId);

      if (myConv) {
        setConversation(myConv);
        const data = await api.getConversation(myConv.id);
        setMessages(data.messages);
      } else {
        setConversation(null);
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    loadChat();
  }, [customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is supported in modern Chrome, Edge, and Safari browsers.');
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
        setIsRecording(false);
      }
    }
  };

  // Periodic polling for human responses / real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (conversation?.id) {
        try {
          const data = await api.getConversation(conversation.id);
          if (data.messages && data.messages.length !== messages.length) {
            setMessages(data.messages);
            setConversation(data.conversation);
          } else if (data.conversation && data.conversation.status !== conversation.status) {
            setConversation(data.conversation);
          }
        } catch (e) {
          // Ignore poll errors
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [conversation?.id, messages.length, conversation?.status]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    setErrorText(null);

    // Optimistic customer message
    const tempCustomerMsg: Message = {
      id: 'temp-' + Date.now(),
      conversationId: conversation?.id || 'pending',
      sender: 'customer',
      content: text,
      timestamp: new Date().toISOString(),
      read: true,
      status: 'sending',
      senderName: customerName || 'You',
    };

    setMessages(prev => [...prev, tempCustomerMsg]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await api.sendMessage({
        customerId,
        customerName: customerName || 'Guest Customer',
        email: customerEmail,
        message: text,
        conversationId: conversation?.id,
      });

      if (response && response.conversation) {
        setConversation(response.conversation);
      }

      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempCustomerMsg.id);
        const newMessages = [...withoutTemp];
        if (response.customerMessage) {
          newMessages.push(response.customerMessage);
        } else {
          newMessages.push({ ...tempCustomerMsg, status: 'sent' });
        }
        if (response.aiMessage) {
          newMessages.push(response.aiMessage);
        }
        return newMessages;
      });
    } catch (err: any) {
      console.error('Error sending message:', err);
      setErrorText(err?.message || 'We encountered an issue processing your request. Please try again or reach out on WhatsApp.');
      setMessages(prev =>
        prev.map(m => (m.id === tempCustomerMsg.id ? { ...m, status: 'sent' } : m))
      );
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleStartNewChat = () => {
    localStorage.removeItem('vertex_care_customer_id');
    window.location.reload();
  };

  const handleAskProductQuestion = (product: Product) => {
    handleSendMessage(`Tell me more about the ${product.title}. What sizes are in stock and what GSM fabric is used?`);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap(prev => ({
      ...prev,
      [msgId]: prev[msgId] === type ? undefined : type,
    } as any));
  };

  const firstName = (customerName && customerName !== 'Guest Customer' ? customerName.split(' ')[0] : 'there');

  return (
    <div id="customer-chat-container" className="flex flex-col h-[calc(100vh-6.5rem)] sm:h-[calc(100vh-7.5rem)] max-w-4xl mx-auto w-full rounded-3xl bg-[#131314] border border-[#282a2c] shadow-2xl overflow-hidden relative">
      
      {/* Top Status Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#1e1f20]/90 border-b border-[#282a2c] backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-[#131314] border border-[#333538] flex items-center justify-center shadow-inner">
              {conversation?.status === 'human' ? (
                <Headphones className="w-4 h-4 text-[#78D9EC]" />
              ) : (
                <VertexSparkleIcon className="w-4 h-4" animated={true} />
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1e1f20] ${
                conversation?.status === 'human'
                  ? 'bg-emerald-400'
                  : conversation?.status === 'waiting_for_human'
                  ? 'bg-amber-400'
                  : 'bg-[#4285F4]'
              }`}
            ></span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-xs sm:text-sm text-[#e3e3e3] tracking-tight">
                {conversation?.status === 'human'
                  ? conversation.assignedAgent || 'Human Care Specialist'
                  : 'Vertex AI Concierge'}
              </h3>
              {conversation?.status === 'human' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                  Live Agent
                </span>
              ) : conversation?.status === 'waiting_for_human' ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                  Forwarded
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#282a2c] text-[#a8c7fa] border border-[#444746]">
                  Gemini 3.7 Flash
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9aa0a6]">
              {websiteSettings.supportAvailability || 'Instant AI replies • 24/7 Support'}
            </p>
          </div>
        </div>

        {/* Conversation Header Controls */}
        <div className="flex items-center gap-2">
          {conversation?.status === 'waiting_for_human' && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-amber-950/40 text-amber-300 border border-amber-800/50">
              <Clock className="w-3 h-3" />
              <span>Forwarded</span>
            </div>
          )}

          <button
            id="btn-new-chat"
            type="button"
            onClick={handleStartNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#282a2c] hover:bg-[#333538] text-[#c4c7c5] hover:text-white border border-[#3c4043] transition-all active:scale-95 shadow-sm"
            title="Start New Clean Conversation"
          >
            <Plus className="w-3.5 h-3.5 text-[#a8c7fa]" />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </div>
      </div>

      {/* Escalation Notification Banner */}
      {conversation?.status === 'waiting_for_human' && (
        <div className="px-4 sm:px-6 py-2.5 bg-amber-950/30 border-b border-amber-800/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Your inquiry has been escalated to a Vertex Lab team specialist. We will reply directly in this chat.
            </span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-7 bg-gemini-ambient">
        {/* Gemini Style Empty Greeting Screen */}
        {messages.length === 0 && (
          <div className="py-6 sm:py-10 max-w-2xl mx-auto flex flex-col justify-center animate-fadeIn">
            {/* Gemini Hero Greeting */}
            <div className="mb-6 sm:mb-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1e1f20] border border-[#333538] text-[#a8c7fa] text-xs font-medium mb-3">
                <VertexSparkleIcon className="w-3.5 h-3.5" size={14} />
                <span>Vertex Lab AI Experience</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
                <span className="gemini-gradient-text">Hello, {firstName}</span>
              </h2>
              <p className="text-base sm:text-xl font-normal text-[#9aa0a6] mt-1.5">
                How can I assist your streetwear journey today?
              </p>
            </div>

            {/* Gemini Suggestion Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {geminiPromptCards.map((card, idx) => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(card.prompt)}
                    className="flex flex-col text-left p-4 rounded-2xl bg-[#1e1f20] hover:bg-[#282a2c] border border-[#282a2c] hover:border-[#3c4043] transition-all group active:scale-[0.99] shadow-md relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`w-8 h-8 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center ${card.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#5f6368] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-[#e3e3e3] group-hover:text-[#a8c7fa] transition-colors line-clamp-1">
                      {card.title}
                    </span>
                    <span className="text-[11px] text-[#9aa0a6] mt-1 line-clamp-2 leading-relaxed">
                      {card.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Render Message List */}
        {messages.map((msg, index) => {
          const isCustomer = msg.sender === 'customer';
          const isSystem = msg.sender === 'system';

          if (isSystem) {
            return (
              <div key={msg.id || index} className="flex justify-center my-3">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-medium bg-[#1e1f20] text-[#9aa0a6] border border-[#333538]">
                  {msg.content}
                </span>
              </div>
            );
          }

          if (isCustomer) {
            // Customer message: Clean right-aligned pill
            return (
              <div
                key={msg.id || index}
                className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[75%] ml-auto"
              >
                <div className="bg-[#282a2c] text-[#e3e3e3] px-4 py-3 rounded-3xl rounded-tr-sm border border-[#3c4043] text-sm leading-relaxed shadow-md">
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#9aa0a6]">
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {msg.status === 'sending' ? (
                      <span className="text-xs">• Sending</span>
                    ) : msg.read ? (
                      <CheckCheck className="w-3 h-3 text-[#a8c7fa]" />
                    ) : (
                      <Check className="w-3 h-3 text-[#9aa0a6]" />
                    )}
                  </div>
                </div>
              </div>
            );
          }

          // AI / Agent Response: Clean Google Gemini conversational block
          const isCopied = copiedMessageId === msg.id;
          const isSpeaking = speakingMessageId === msg.id;
          const feedback = feedbackMap[msg.id];

          return (
            <div
              key={msg.id || index}
              className="flex items-start gap-3 sm:gap-4 max-w-full text-left animate-fadeIn"
            >
              {/* Gemini Star Avatar */}
              <div className="w-8 h-8 rounded-2xl bg-[#1e1f20] border border-[#333538] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                {msg.sender === 'human' ? (
                  <Headphones className="w-4 h-4 text-[#78D9EC]" />
                ) : (
                  <VertexSparkleIcon className="w-4 h-4" size={16} />
                )}
              </div>

              {/* Response Body */}
              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-white">
                    {msg.sender === 'human' ? msg.senderName || 'Vertex Specialist' : 'Vertex AI'}
                  </span>
                  <span className="text-[10px] text-[#9aa0a6]">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Markdown text styling */}
                <div className="text-sm sm:text-base text-[#e3e3e3] leading-relaxed whitespace-pre-wrap font-normal">
                  {msg.content}
                </div>

                {/* Interactive Product Carousel (if attached) */}
                {msg.products && msg.products.length > 0 && (
                  <div className="w-full pt-2">
                    <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-[#a8c7fa]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Streetwear Articles</span>
                    </div>

                    <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                      {msg.products.map(product => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          compact={true}
                          onViewDetails={onViewProductDetails}
                          onAskAi={handleAskProductQuestion}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Gemini Action Footer Tools */}
                <div className="flex items-center gap-1 pt-1.5 text-[#9aa0a6]">
                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyMessage(msg.id, msg.content)}
                    className="p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                    title="Copy to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Text-To-Speech Listen */}
                  <button
                    type="button"
                    onClick={() => handleSpeakMessage(msg.id, msg.content)}
                    className={`p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ${
                      isSpeaking ? 'text-[#78D9EC] bg-[#282a2c]' : ''
                    }`}
                    title={isSpeaking ? 'Stop listening' : 'Listen to response'}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Thumbs Up */}
                  <button
                    type="button"
                    onClick={() => handleFeedback(msg.id, 'up')}
                    className={`p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ${
                      feedback === 'up' ? 'text-[#4285F4] bg-[#282a2c]' : ''
                    }`}
                    title="Good response"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Thumbs Down */}
                  <button
                    type="button"
                    onClick={() => handleFeedback(msg.id, 'down')}
                    className={`p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ${
                      feedback === 'down' ? 'text-[#D96570] bg-[#282a2c]' : ''
                    }`}
                    title="Bad response"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Re-ask / Re-prompt */}
                  <button
                    type="button"
                    onClick={() => handleSendMessage(`Can you elaborate more on this?`)}
                    className="p-1.5 rounded-lg hover:bg-[#282a2c] hover:text-white transition-colors ml-1"
                    title="Ask follow-up"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Gemini Typing / Thinking State */}
        {isTyping && (
          <div className="flex items-start gap-3 sm:gap-4 max-w-full text-left animate-fadeIn">
            <div className="w-8 h-8 rounded-2xl bg-[#1e1f20] border border-[#333538] flex items-center justify-center shrink-0 mt-0.5 shadow-md">
              <VertexSparkleIcon className="w-4 h-4" animated={true} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Vertex AI</span>
                <span className="text-[10px] text-[#a8c7fa] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4] animate-ping"></span>
                  <span>Thinking...</span>
                </span>
              </div>
              <div className="flex items-center gap-2 py-1.5 px-3 rounded-2xl bg-[#1e1f20] border border-[#282a2c] text-xs text-[#9aa0a6]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4285F4] animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-[#9B72CB] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#D96570] animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span>Retrieving streetwear inventory & care specifications...</span>
              </div>
            </div>
          </div>
        )}

        {errorText && (
          <div className="p-3 rounded-2xl bg-[#3c1e22]/50 border border-[#D96570]/40 text-xs text-[#f28b82] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D96570] shrink-0" />
            <span>{errorText}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Gemini Quick Ask Drawer (Toggleable Chips) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-[#131314] border-t border-[#282a2c] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-semibold text-[#9aa0a6] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#a8c7fa]" />
            Suggestions:
          </span>
          {quickPrompts.slice(0, 5).map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1 rounded-full text-[11px] font-medium bg-[#1e1f20] hover:bg-[#282a2c] text-[#c4c7c5] hover:text-white border border-[#333538] hover:border-[#444746] transition-all active:scale-95"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Iconic Google Gemini Floating Input Bar */}
      <div className="p-3 sm:p-4 bg-[#131314] border-t border-[#282a2c] shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-[#1e1f20] focus-within:bg-[#232527] rounded-3xl border border-[#333538] focus-within:border-[#4285F4]/70 focus-within:ring-2 focus-within:ring-[#4285F4]/20 transition-all p-1.5 sm:p-2 shadow-lg"
        >
          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            className={`p-2 sm:p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-[#9aa0a6] hover:text-white hover:bg-[#282a2c]'
            }`}
            title={isRecording ? 'Listening... click to stop' : 'Voice search (English / Urdu)'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#a8c7fa]" />}
          </button>

          {/* Text Input */}
          <input
            id="input-customer-chat"
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            placeholder={
              isRecording
                ? 'Listening... speak now...'
                : 'Ask Vertex AI anything about drops, sizes, delivery time, or care...'
            }
            disabled={isLoading}
            className="flex-1 bg-transparent text-[#e3e3e3] placeholder:text-[#5f6368] px-2 sm:px-3 py-2 text-xs sm:text-sm focus:outline-none"
          />

          {/* Gemini Send Button */}
          <button
            id="btn-send-message"
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-2xl font-semibold text-xs transition-all shrink-0 gap-1.5 ${
              inputMessage.trim() && !isLoading
                ? 'bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#6366F1] text-white shadow-md shadow-[#4285F4]/20 hover:opacity-95 active:scale-95'
                : 'bg-[#282a2c] text-[#5f6368] cursor-not-allowed opacity-50'
            }`}
          >
            <VertexSparkleIcon className="w-4 h-4" size={16} />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>

        {/* Disclaimer Footnote */}
        <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-[#9aa0a6]">
          <span>Vertex AI Concierge delivers bespoke streetwear guidance. 100% free replacement on damaged items.</span>
          <span className="hidden sm:inline">Vertex Neural Engine</span>
        </div>
      </div>
    </div>
  );
};
