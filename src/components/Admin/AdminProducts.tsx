import React, { useState, useEffect } from 'react';
import { Product } from '../../types.js';
import { api } from '../../lib/api.js';
import {
  ShoppingBag,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Flame
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const categories = ['All', 'Hoodies', 'T-Shirts', 'Bottoms', 'Outerwear', 'Accessories'];

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(selectedCategory, search, true);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, search]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.title) return;

    try {
      await api.saveProduct({
        ...editingProduct,
        sizes: typeof editingProduct.sizes === 'string'
          ? (editingProduct.sizes as string).split(',').map(s => s.trim())
          : editingProduct.sizes || ['S', 'M', 'L', 'XL'],
        price: Number(editingProduct.price) || 0,
        salePrice: editingProduct.salePrice ? Number(editingProduct.salePrice) : undefined,
        stockCount: editingProduct.stockCount ? Number(editingProduct.stockCount) : 10,
        inStock: editingProduct.inStock ?? true,
        category: editingProduct.category || 'Hoodies',
      });
      setIsModalOpen(false);
      setEditingProduct(null);
      await loadProducts();
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product from the database?')) return;
    try {
      await api.deleteProduct(id);
      await loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAiVisibility = async (product: Product) => {
    try {
      await api.saveProduct({
        ...product,
        isHiddenFromAi: !product.isHiddenFromAi,
      });
      await loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      await api.saveProduct({
        ...product,
        inStock: !product.inStock,
      });
      await loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Product Inventory
            </span>
            <span className="text-xs text-slate-400">Total: {products.length} items</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Manage Store Catalog</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Products are automatically grounded in the Gemini AI assistant and customer chat cards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingProduct({
              title: '',
              category: 'Hoodies',
              price: 3499,
              description: '',
              imageUrl: '',
              productUrl: 'https://vertexlab.store/products/',
              sizes: ['S', 'M', 'L', 'XL'],
              inStock: true,
              stockCount: 15,
              isHiddenFromAi: false,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products by name, SKU..."
            className="w-full bg-slate-950 text-slate-100 placeholder:text-slate-500 pl-10 pr-4 py-2 rounded-xl border border-slate-800 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price (PKR)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">AI Grounding</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No products found in catalog.
                  </td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=120&q=80'}
                          alt={product.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                        />
                        <div>
                          <p className="font-bold text-slate-100 text-sm">{product.title}</p>
                          <span className="text-[11px] text-slate-500 font-mono">
                            SKU: {product.sku || 'N/A'} • Source: {product.source}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">
                        Rs. {(product.salePrice || product.price).toLocaleString()}
                      </div>
                      {product.salePrice && product.salePrice < product.price && (
                        <span className="text-[10px] text-slate-500 line-through">
                          Rs. {product.price.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStock(product)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                          product.inStock
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800/70'
                            : 'bg-rose-950 text-rose-300 border-rose-800/70'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        <span>{product.inStock ? `In Stock (${product.stockCount || 10})` : 'Out of Stock'}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAiVisibility(product)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          !product.isHiddenFromAi
                            ? 'bg-indigo-950 text-indigo-300 border-indigo-800/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title="Toggle whether Gemini recommends this product"
                      >
                        {!product.isHiddenFromAi ? (
                          <>
                            <Eye className="w-3 h-3 text-indigo-400" />
                            <span>AI Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-slate-400" />
                            <span>Hidden from AI</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(product);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white font-display mb-4">
              {editingProduct.id ? 'Edit Product Details' : 'Add New Apparel Item'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Product Title</label>
                <input
                  type="text"
                  value={editingProduct.title || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  placeholder="e.g. Vertex Raw Cut Heavyweight Hoodie"
                  required
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Hoodies'}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Hoodies">Hoodies</option>
                    <option value="T-Shirts">T-Shirts</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Outerwear">Outerwear</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    value={editingProduct.price || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    placeholder="4499"
                    required
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sale Price (Optional)</label>
                  <input
                    type="number"
                    value={editingProduct.salePrice || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) || undefined })}
                    placeholder="3999"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingProduct.imageUrl || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Direct Website URL</label>
                <input
                  type="url"
                  value={editingProduct.productUrl || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, productUrl: e.target.value })}
                  placeholder="https://vertexlab.store/products/..."
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Available Sizes (Comma-separated)</label>
                <input
                  type="text"
                  value={Array.isArray(editingProduct.sizes) ? editingProduct.sizes.join(', ') : editingProduct.sizes || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()) })}
                  placeholder="S, M, L, XL, XXL"
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description & GSM Material Info</label>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="450 GSM French Terry Cotton, custom boxy fit with dropped shoulders..."
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock ?? true}
                    onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-300">In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isHiddenFromAi ?? false}
                    onChange={e => setEditingProduct({ ...editingProduct, isHiddenFromAi: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-300">Hide from AI Assistant</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
