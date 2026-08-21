import React, { useState } from 'react';
import { Product } from '../types.js';
import { X, ShoppingBag, Sparkles, Check, ShieldCheck, Truck, RotateCcw, ExternalLink } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAskAiWithContext?: (question: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAskAiWithContext,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!product) return null;

  const sizesList = Array.isArray(product.sizes) ? product.sizes : [];
  const currentSelectedSize = selectedSize || (sizesList.length > 0 ? sizesList[0] : 'M');
  const hasDiscount = Boolean(product.salePrice && product.salePrice < product.price);

  const handleShare = () => {
    navigator.clipboard.writeText(product.productUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAskSizing = () => {
    onClose();
    onAskAiWithContext?.(`What is the sizing recommendation and measurements for the "${product.title}"? My usual size is ${currentSelectedSize}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="product-detail-modal"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col md:flex-row rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden overflow-y-auto md:overflow-y-visible"
      >
        {/* Close Button */}
        <button
          id="btn-close-product-modal"
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Media Column */}
        <div className="w-full md:w-1/2 relative bg-slate-950 flex flex-col items-center justify-center min-h-[320px] md:min-h-[460px]">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center max-h-[460px]"
          />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            <span>SKU: {product.sku || 'VL-PROD'}</span>
            <span className="font-semibold text-indigo-400">Authentic Vertex Lab</span>
          </div>
        </div>

        {/* Product Information Column */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                {product.category}
              </span>
              {product.inStock ? (
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  In Stock ({product.stockCount || 'Ready to dispatch'})
                </span>
              ) : (
                <span className="text-xs text-rose-400 font-medium">Out of Stock</span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white font-display tracking-tight leading-tight">
              {product.title}
            </h2>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 my-3">
              <span className="text-2xl font-extrabold text-white">
                Rs. {(product.salePrice || product.price).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-500 line-through">
                  Rs. {product.price.toLocaleString()}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-900/50">
                  Save Rs. {(product.price - product.salePrice!).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed my-3">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="my-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-200">Select Size:</span>
                <button
                  type="button"
                  onClick={handleAskSizing}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Ask AI Size Advisor
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sizesList.length > 0 ? (
                  sizesList.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                        currentSelectedSize === size
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60 border border-indigo-400'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                      }`}
                    >
                      {size}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">Standard Free Size</span>
                )}
              </div>
            </div>

            {/* Quality Perks list */}
            <div className="grid grid-cols-2 gap-2 my-4 pt-4 border-t border-slate-800 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>2-4 Days Dispatch (Pakistan)</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>7-Day Hassle-Free Exchange</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Cash on Delivery Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>100% Pre-Shrunk Textile</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-4 mt-2 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <a
                id="btn-modal-buy-now"
                href={product.productUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buy on Website</span>
              </a>

              <button
                id="btn-modal-ask-ai"
                type="button"
                onClick={handleAskSizing}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Chat with AI</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="text-center text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors"
            >
              {copiedLink ? '✓ Product Link Copied!' : 'Copy Direct Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
