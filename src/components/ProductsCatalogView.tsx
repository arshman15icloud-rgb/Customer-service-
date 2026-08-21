import React, { useState, useEffect } from 'react';
import { Product } from '../types.js';
import { api } from '../lib/api.js';
import { ProductCard } from './ProductCard.js';
import { Search, Filter, Sparkles, RefreshCw, ShoppingBag, SlidersHorizontal } from 'lucide-react';

interface ProductsCatalogViewProps {
  onViewDetails: (product: Product) => void;
  onAskAiAboutProduct: (product: Product) => void;
}

export const ProductsCatalogView: React.FC<ProductsCatalogViewProps> = ({
  onViewDetails,
  onAskAiAboutProduct,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high'>('featured');
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  const categories = ['All', 'Hoodies', 'T-Shirts', 'Bottoms', 'Outerwear', 'Accessories'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(selectedCategory, searchQuery, false);
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Client-side filtering & sorting
  const filteredProducts = products
    .filter(p => (p.salePrice || p.price) <= maxPrice)
    .sort((a, b) => {
      const priceA = a.salePrice || a.price;
      const priceB = b.salePrice || b.price;
      if (sortBy === 'price-low') return priceA - priceB;
      if (sortBy === 'price-high') return priceB - priceA;
      return 0;
    });

  return (
    <div id="products-catalog-view" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-400 border border-indigo-800/60 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Vertex Lab Collection Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
            Architectural Apparel & Heavyweight Streetwear
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Browse our synchronized inventory with live stock status and PKR pricing. Tap any item to inspect 450 GSM fabric details or ask the AI Concierge for personalized sizing advice.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-900/80 p-3 sm:p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="input-catalog-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search hoodies, tees, cargos, SKU..."
            className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/60'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-slate-950 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading Vertex Lab catalog...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No matching products found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or selected category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewDetails}
              onAskAi={onAskAiAboutProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
