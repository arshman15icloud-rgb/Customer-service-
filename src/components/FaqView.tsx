import React, { useState, useEffect } from 'react';
import { FAQ } from '../types';
import { api } from '../lib/api';
import { VertexSparkleIcon } from './VertexSparkleIcon';
import {
  HelpCircle,
  ChevronDown,
  Sparkles,
  Search,
  Truck,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shirt,
  CreditCard,
  Layers,
  ArrowRight,
  MessageSquare,
  PhoneCall,
  PackageCheck
} from 'lucide-react';

interface FaqViewProps {
  onAskAiWithQuestion: (question: string) => void;
}

export const FaqView: React.FC<FaqViewProps> = ({ onAskAiWithQuestion }) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-exchange-policy');

  // Interactive Shipping Estimator State
  const [selectedCity, setSelectedCity] = useState('Lahore');
  const [customCityInput, setCustomCityInput] = useState('');
  const [orderAmountInput, setOrderAmountInput] = useState<number>(3500);

  // Interactive Damaged Item Replacement Wizard State
  const [wizardDeliveryAge, setWizardDeliveryAge] = useState<'within_7_days' | 'over_7_days'>('within_7_days');
  const [wizardReason, setWizardReason] = useState<'defective' | 'wrong_item' | 'preference'>('defective');
  const [wizardCondition, setWizardCondition] = useState<'unworn_with_tags' | 'washed_or_worn'>('unworn_with_tags');

  const categories = [
    { label: 'All', icon: HelpCircle },
    { label: 'Damaged & Return Policy', icon: ShieldAlert },
    { label: 'Shipping & Delivery', icon: Truck },
    { label: 'Sizing & Fit', icon: Shirt },
    { label: 'Payment & Orders', icon: CreditCard },
    { label: 'Fabric & Quality', icon: Layers },
  ];

  const popularCities = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan', 'Sialkot', 'Quetta', 'Gujranwala'];

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        setLoading(true);
        const data = await api.getFaqs();
        const safeData = Array.isArray(data) ? data : [];
        setFaqs(safeData.filter(f => f && f.isActive));
      } catch (err) {
        console.error('Failed to load FAQs:', err);
        setFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    loadFaqs();
  }, []);

  const safeFaqs = Array.isArray(faqs) ? faqs : [];
  const filteredFaqs = safeFaqs.filter(faq => {
    if (!faq) return false;
    const matchesCategory =
      activeCategory === 'All' ||
      (faq.category && faq.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
      (faq.category && activeCategory.toLowerCase().includes(faq.category.toLowerCase()));

    const matchesSearch =
      !search ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase()) ||
      faq.category.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Calculate delivery estimation details
  const getCityDeliveryDetails = (city: string) => {
    const isLahore = city.toLowerCase() === 'lahore';
    const isMajor = ['karachi', 'islamabad', 'rawalpindi', 'faisalabad', 'peshawar', 'multan', 'sialkot', 'gujranwala'].includes(city.toLowerCase());

    const shippingFee = orderAmountInput >= 4999 ? 0 : 200;
    const isFreeShipping = shippingFee === 0;

    return {
      cityName: city || 'Your City',
      processingTime: '4 Working Days (Embroidery & Hand-Finishing)',
      transitTime: isLahore ? '1–2 Working Days (Next-Day Delivery Available)' : isMajor ? '2–4 Working Days' : '3–5 Working Days',
      totalEstimatedDays: isLahore ? '5–6 Working Days Total' : isMajor ? '6–8 Working Days Total' : '7–9 Working Days Total',
      courierPartner: isLahore ? 'PostEx Express (Priority Handover)' : 'PostEx & TCS Express',
      shippingFee,
      isFreeShipping,
      codAvailable: true,
    };
  };

  const activeCityDetails = getCityDeliveryDetails(customCityInput.trim() || selectedCity);

  // Calculate Damaged Item Replacement Eligibility Wizard Verdict
  const getExchangeVerdict = () => {
    if (wizardReason === 'preference') {
      return {
        status: 'not_eligible',
        title: 'No Returns for Change of Mind',
        message: 'In accordance with Vertex Lab policy, we do not accept returns or refunds for change of mind or personal preference due to our bespoke made-to-order embroidery. We replace items that arrive damaged, defective, or incorrect.',
        badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-800',
        canAutoExchange: false,
      };
    }

    if (wizardDeliveryAge === 'over_7_days') {
      return {
        status: 'expired',
        title: '7-Day Window Passed',
        message: 'Damaged or defective items must be reported within 7 calendar days of delivery with photo proof. For exceptional cases, our human concierge is happy to review your request.',
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800',
        canAutoExchange: false,
      };
    }

    if (wizardCondition === 'washed_or_worn') {
      return {
        status: 'condition_issue',
        title: 'Defects Must Be Reported Prior to Washing/Wearing',
        message: 'Garments that have been actively worn or laundered cannot be verified for transit/manufacturing defects. Please consult support if you noticed an issue prior to wash.',
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-800',
        canAutoExchange: false,
      };
    }

    return {
      status: 'free_replacement',
      title: '100% Free Replacement Approved! 🎉',
      message: 'Because your item arrived damaged or defective, you qualify for an immediate, 100% FREE replacement! We will arrange complimentary reverse courier pickup and dispatch a fresh replacement at zero cost to you.',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
      canAutoExchange: true,
    };
  };

  const exchangeVerdict = getExchangeVerdict();

  return (
    <div id="faq-view-container" className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6 sm:space-y-8">
      {/* Gemini Style Support Hero */}
      <div className="relative rounded-3xl bg-[#1e1f20] border border-[#282a2c] p-6 sm:p-10 text-center overflow-hidden shadow-2xl bg-gemini-ambient">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#282a2c] border border-[#3c4043] text-[#a8c7fa] text-xs font-semibold mb-4 shadow-sm">
            <VertexSparkleIcon className="w-3.5 h-3.5" size={14} animated={true} />
            <span>Vertex Lab Knowledge & Policy Hub</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-tight">
            <span className="gemini-gradient-text">How can we assist you today?</span>
          </h1>

          <p className="text-xs sm:text-sm text-[#9aa0a6] max-w-2xl mx-auto mt-3 leading-relaxed">
            Transparent shipping timelines across Pakistan, damaged item replacement protocols, and luxury streetwear care guidelines.
          </p>

          {/* Quick Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-8 text-left">
            <div className="p-4 rounded-2xl bg-[#131314] border border-[#282a2c] hover:border-[#4285F4]/40 shadow-md flex items-start gap-3.5 group transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#4285F4]/10 border border-[#4285F4]/30 flex items-center justify-center text-[#78D9EC] shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#a8c7fa] transition-colors">
                  Nationwide Delivery
                </h3>
                <p className="text-[11px] text-[#9aa0a6] mt-0.5 leading-snug">
                  Next-day in Lahore • 2–5 days across Pakistan via PostEx & TCS. Flat Rs. 200 fee.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#131314] border border-[#282a2c] hover:border-[#D96570]/40 shadow-md flex items-start gap-3.5 group transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#D96570]/10 border border-[#D96570]/30 flex items-center justify-center text-[#f28b82] shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#f28b82] transition-colors">
                  Damaged Item Replacement
                </h3>
                <p className="text-[11px] text-[#9aa0a6] mt-0.5 leading-snug">
                  Strict no-return policy for change of mind. 100% FREE replacement if your item arrives damaged!
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#131314] border border-[#282a2c] hover:border-[#9B72CB]/40 shadow-md flex items-start gap-3.5 group transition-all">
              <div className="w-9 h-9 rounded-xl bg-[#9B72CB]/10 border border-[#9B72CB]/30 flex items-center justify-center text-[#c5b4e3] shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white group-hover:text-[#c5b4e3] transition-colors">
                  Cash on Delivery & Cards
                </h3>
                <p className="text-[11px] text-[#9aa0a6] mt-0.5 leading-snug">
                  COD available in 200+ cities • Free delivery automatically on orders over Rs. 4,999.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tool 1: Nationwide City Delivery & Shipping Calculator */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Live City Shipping & ETA Estimator
              </h2>
              <p className="text-xs text-slate-400">
                Check exact courier transit times and shipping rates for your city
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-900/60">
            <Clock className="w-3.5 h-3.5" />
            <span>Courier Partner: PostEx & TCS</span>
          </div>
        </div>

        {/* City Selection Pills & Custom Input */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select or Type Your City in Pakistan:
            </label>
            <div className="flex flex-wrap gap-2">
              {popularCities.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    setSelectedCity(city);
                    setCustomCityInput('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    (selectedCity === city && !customCityInput)
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-950'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Or type any other city/town:
              </label>
              <input
                type="text"
                value={customCityInput}
                onChange={e => setCustomCityInput(e.target.value)}
                placeholder="e.g. Abbottabad, Bahawalpur, Sukkur..."
                className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Estimated Order Value (PKR):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={orderAmountInput}
                  onChange={e => setOrderAmountInput(Number(e.target.value))}
                  placeholder="3500"
                  step="500"
                  className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {orderAmountInput >= 4999 ? (
                    <span className="text-emerald-400 font-bold">🎉 FREE Delivery!</span>
                  ) : (
                    `Add Rs. ${4999 - orderAmountInput} for Free Shipping`
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Result Card */}
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Destination
              </span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {activeCityDetails.cityName}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Transit Timeline
              </span>
              <span className="text-xs font-semibold text-emerald-400 block mt-0.5">
                {activeCityDetails.transitTime}
              </span>
              <span className="text-[10px] text-slate-400">After 4-day embroidery QC</span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Shipping Fee
              </span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {activeCityDetails.isFreeShipping ? (
                  <span className="text-emerald-400">FREE Delivery</span>
                ) : (
                  <span>Rs. 200 Flat</span>
                )}
              </span>
              <span className="text-[10px] text-slate-400">
                {activeCityDetails.isFreeShipping ? 'Order above Rs. 4,999' : 'Free if order > Rs. 4,999'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Payment Option
              </span>
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Cash on Delivery (COD)
              </span>
              <span className="text-[10px] text-slate-400">or Online Card / Transfer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tool 2: Damaged & Defective Item Replacement Wizard */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              Damaged & Defective Item Replacement Eligibility Checker
            </h2>
            <p className="text-xs text-slate-400">
              Verify instant eligibility for 100% free replacements on damaged, defective, or incorrect items
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Question 1 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
            <label className="text-xs font-bold text-white block">
              1. When was your order delivered?
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setWizardDeliveryAge('within_7_days')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  wizardDeliveryAge === 'within_7_days'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                ✓ Within the last 7 days
              </button>
              <button
                type="button"
                onClick={() => setWizardDeliveryAge('over_7_days')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  wizardDeliveryAge === 'over_7_days'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                More than 7 days ago
              </button>
            </div>
          </div>

          {/* Question 2 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
            <label className="text-xs font-bold text-white block">
              2. What is the issue with your item?
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setWizardReason('defective')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  wizardReason === 'defective'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                ⚠️ Damaged / Defective garment (stitching/tear/stain)
              </button>
              <button
                type="button"
                onClick={() => setWizardReason('wrong_item')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  wizardReason === 'wrong_item'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                📦 Incorrect article / size shipped by warehouse
              </button>
              <button
                type="button"
                onClick={() => setWizardReason('preference')}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  wizardReason === 'preference'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🤔 Change of mind / personal preference
              </button>
            </div>
          </div>

          {/* Question 3 */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2">
            <label className="text-xs font-bold text-white block">
              3. Condition & proof available?
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setWizardCondition('unworn_with_tags')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  wizardCondition === 'unworn_with_tags'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                🏷️ Unworn with photos/video of defect
              </button>
              <button
                type="button"
                onClick={() => setWizardCondition('washed_or_worn')}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  wizardCondition === 'washed_or_worn'
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-700 font-semibold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                Worn or washed after delivery
              </button>
            </div>
          </div>
        </div>

        {/* Wizard Verdict Banner */}
        <div className={`mt-5 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${exchangeVerdict.badgeClass}`}>
          <div className="space-y-1">
            <h4 className="text-sm font-bold flex items-center gap-2">
              {exchangeVerdict.title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {exchangeVerdict.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAskAiWithQuestion(
              wizardReason === 'preference'
                ? 'What is your policy regarding returns and refunds?'
                : `My order arrived with an issue (${wizardReason === 'defective' ? 'damaged/defective' : 'incorrect item'}). I have photos. Can you arrange my free replacement?`
            )}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-100 shadow-md transition-all active:scale-95"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Report in AI Chat</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="input-faq-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions (e.g. Lahore delivery, damaged item replacement, payment, embroidery)..."
            className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setActiveCategory(cat.label)}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950 ring-1 ring-white/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQs List Accordion */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading verified policies and FAQs...</span>
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="py-14 text-center rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No matching policy or question found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Our AI Concierge has real-time access to Vertex Lab inventory and customer support data.
            </p>
            <button
              type="button"
              onClick={() => onAskAiWithQuestion(search || 'What is your shipping time and return policy?')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Vertex AI Concierge directly</span>
            </button>
          </div>
        ) : (
          filteredFaqs.map(faq => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-slate-900 border-indigo-900/80 shadow-lg'
                    : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm font-semibold text-slate-100 hover:text-indigo-300 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-indigo-400 border border-slate-800 shrink-0">
                      {faq.category}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white">{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/70 bg-slate-950/40">
                    <div className="whitespace-pre-wrap font-normal leading-relaxed text-slate-200">
                      {faq.answer}
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Official Vertex Lab Store Policy
                      </span>

                      <button
                        type="button"
                        onClick={() => onAskAiWithQuestion(`Regarding policy: "${faq.question}" - `)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 transition-all self-start sm:self-auto"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Ask AI About This</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Human Care & WhatsApp Escalation Footer Card */}
      <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xl">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <span>Still have questions about an order or fabric?</span>
          </h3>
          <p className="text-xs text-slate-400">
            Our AI Concierge replies in seconds 24/7, and human support agents are available Mon–Sat 10 AM to 9 PM PKT.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onAskAiWithQuestion('I have an inquiry about my order / size.')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950 transition-all active:scale-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open AI Chat</span>
          </button>

          <a
            href="https://wa.me/923008378391?text=Hello%20Vertex%20Lab%20Support%2C%20I%20have%20an%20inquiry%20regarding%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition-all active:scale-95"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>WhatsApp Care</span>
          </a>
        </div>
      </div>
    </div>
  );
};
