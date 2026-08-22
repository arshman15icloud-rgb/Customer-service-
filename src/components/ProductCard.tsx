import React from 'react';
import { Product } from '../types';
import { ExternalLink, ShoppingBag, Eye, Check, Flame } from 'lucide-react';
import { VertexSparkleIcon } from './VertexSparkleIcon';

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onAskAi?: (product: Product) => void;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAskAi,
  compact = false,
}) => {
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <div
      id={`product-card-${product.id}`}
      className={`group relative flex flex-col rounded-2xl bg-[#1e1f20] border border-[#282a2c] hover:border-[#3c4043] overflow-hidden shadow-lg transition-all duration-300 ${
        compact ? 'w-64 shrink-0' : 'w-full'
      }`}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/4.5] w-full overflow-hidden bg-[#131314]">
        <img
          src={product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80'}
          alt={product.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#131314]/85 backdrop-blur-md text-[#c4c7c5] border border-white/10">
            {product.category}
          </span>
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-[#D96570] text-white shadow-sm">
              <Flame className="w-3 h-3" />
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Stock status badge */}
        <div className="absolute bottom-2.5 left-2.5 pointer-events-none">
          {product.inStock ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-950/90 text-rose-400 border border-rose-800/60 backdrop-blur-md">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 gap-2">
        <h4 className="font-medium text-sm text-[#e3e3e3] line-clamp-2 leading-snug group-hover:text-[#a8c7fa] transition-colors">
          {product.title}
        </h4>

        {/* Price Row */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-base sm:text-lg font-bold text-white tracking-tight">
            Rs. {(product.salePrice || product.price).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[#9aa0a6] line-through">
              Rs. {product.price.toLocaleString()}
            </span>
          )}
        </div>

        {/* Sizes Pills */}
        {Array.isArray(product.sizes) && product.sizes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 my-1">
            <span className="text-[11px] text-[#9aa0a6] mr-1">Sizes:</span>
            {product.sizes.slice(0, 4).map(size => (
              <span
                key={size}
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#282a2c] text-[#c4c7c5] border border-[#3c4043]"
              >
                {size}
              </span>
            ))}
            {product.sizes.length > 4 && (
              <span className="text-[10px] text-[#9aa0a6]">+{product.sizes.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-[#282a2c]">
          <button
            id={`btn-view-${product.id}`}
            type="button"
            onClick={() => onViewDetails?.(product)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-[#282a2c] hover:bg-[#333538] text-[#e3e3e3] border border-[#3c4043] transition-all active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-[#9aa0a6]" />
            <span>Details</span>
          </button>

          <a
            id={`btn-buy-${product.id}`}
            href={product.productUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-[#4285F4] to-[#6366F1] hover:opacity-90 text-white shadow-md transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </a>
        </div>

        {onAskAi && (
          <button
            id={`btn-askai-${product.id}`}
            type="button"
            onClick={() => onAskAi(product)}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-full text-[11px] font-medium text-[#a8c7fa] hover:text-white hover:bg-[#282a2c] transition-colors"
          >
            <VertexSparkleIcon className="w-3 h-3" size={12} />
            <span>Ask Vertex AI about fit</span>
          </button>
        )}
      </div>
    </div>
  );
};

