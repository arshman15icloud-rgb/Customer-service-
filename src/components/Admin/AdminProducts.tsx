import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { api } from '../../lib/api';
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
  Flame,
  Image,
  Upload,
  Camera,
  FolderOpen,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

export const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Hoodies', 'T-Shirts', 'Bottoms', 'Outerwear', 'Accessories'];

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts(selectedCategory, search, true);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, search]);

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);

      try {
        const uploadRes = await api.uploadImage(base64String, file.name);
        if (uploadRes && uploadRes.imageUrl) {
          setEditingProduct(prev => ({
            ...prev,
            imageUrl: uploadRes.imageUrl,
          }));
        }
      } catch (err) {
        console.error('Failed to upload image:', err);
        // Fallback to local base64 preview
        setEditingProduct(prev => ({
          ...prev,
          imageUrl: base64String,
        }));
      } finally {
        setIsUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.title) return;

    try {
      const saved = await api.saveProduct({
        ...editingProduct,
        title: editingProduct.title.trim(),
        imageUrl: editingProduct.imageUrl?.trim() || imagePreview || '',
        productUrl: editingProduct.productUrl?.trim() || 'https://vertexlab.store/products/',
        description: editingProduct.description?.trim() || '',
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
      setImagePreview(null);
      setSaveSuccess(`"${saved.title}" updated successfully in catalog & AI assistant`);
      setTimeout(() => setSaveSuccess(null), 3000);
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
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1e1f20] to-[#131314] border border-[#3c4043] p-6 sm:p-7 rounded-3xl shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#8ab4f8]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#8ab4f8]/10 text-[#8ab4f8] border border-[#8ab4f8]/30">
                Live Catalog
              </span>
              <span className="text-xs text-[#9aa0a6]">Total: {products.length} drops</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
              Product Inventory & Gallery
            </h2>
            <p className="text-xs sm:text-sm text-[#9aa0a6] mt-1">
              Add garments from device gallery, set pricing, customize direct store URLs & manage AI grounding.
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
              setImagePreview(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#041e49] shadow-lg shadow-blue-950/40 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#1e1f20] p-3.5 rounded-2xl border border-[#3c4043]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#8ab4f8] text-[#041e49] font-bold shadow-md'
                  : 'bg-[#131314] text-[#9aa0a6] hover:text-white border border-[#2f3336]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa0a6]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search drops, GSM, fits..."
            className="w-full bg-[#131314] text-white placeholder:text-[#5f6368] pl-10 pr-4 py-2 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#9aa0a6]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#8ab4f8]" />
          Loading products from database...
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#1e1f20] border border-[#3c4043] text-center">
          <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-[#5f6368]" />
          <h3 className="text-base font-bold text-white mb-1">No Products Found</h3>
          <p className="text-xs text-[#9aa0a6] mb-4">Try altering your search filters or add a new garment.</p>
          <button
            type="button"
            onClick={() => {
              setEditingProduct({ title: '', category: 'Hoodies', price: 3499, inStock: true });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#8ab4f8] text-[#041e49] text-xs font-bold"
          >
            Add First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div
              key={product.id}
              className="group relative rounded-3xl bg-[#1e1f20] border border-[#3c4043] hover:border-[#8ab4f8]/50 p-4 transition-all duration-200 flex flex-col justify-between shadow-lg"
            >
              <div>
                {/* Product Image & Badges */}
                <div className="relative aspect-square w-full rounded-2xl bg-[#131314] overflow-hidden mb-3 border border-[#2f3336]">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5f6368]">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                      {product.category}
                    </span>
                    {product.salePrice && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/90 text-[10px] font-bold text-white flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> Sale
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStock(product)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md transition-all ${
                        product.inStock
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-rose-500/80 text-white'
                      }`}
                    >
                      {product.inStock ? 'In Stock' : 'Sold Out'}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-bold text-sm text-white mb-1 line-clamp-1">{product.title}</h3>
                <p className="text-xs text-[#9aa0a6] line-clamp-2 mb-3">{product.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-extrabold text-white">Rs. {product.price.toLocaleString()}</span>
                    {product.salePrice && (
                      <span className="text-xs text-[#9aa0a6] line-through">Rs. {product.salePrice.toLocaleString()}</span>
                    )}
                  </div>

                  <div className="text-[10px] text-[#8ab4f8] font-semibold">
                    Sizes: {Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#2f3336] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAiVisibility(product)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      product.isHiddenFromAi
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800'
                        : 'bg-[#131314] text-[#9aa0a6] border-[#3c4043] hover:text-white'
                    }`}
                    title={product.isHiddenFromAi ? 'Hidden from AI replies' : 'Visible to AI assistant'}
                  >
                    {product.isHiddenFromAi ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {product.productUrl && (
                    <a
                      href={product.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-[#131314] text-[#9aa0a6] border border-[#3c4043] hover:text-white transition-colors"
                      title="Open direct product link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(product);
                      setImagePreview(product.imageUrl || null);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs font-semibold text-white border border-[#444746] transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(product.id)}
                    className="p-1.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-800/40 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#1e1f20] border border-[#3c4043] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#8ab4f8] via-[#c58af9] to-[#81c995]" />

            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingProduct(null);
                setImagePreview(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-[#9aa0a6] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-3 rounded-2xl bg-[#8ab4f8]/10 text-[#8ab4f8] border border-[#8ab4f8]/30">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white font-display">
                    {editingProduct.id ? 'Edit Product Item' : 'Add New Streetwear Drop'}
                  </h3>
                  <p className="text-xs text-[#9aa0a6]">
                    Upload gallery photos, update URL links, pricing, and AI recommendation metadata.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Product Title *</label>
                  <input
                    type="text"
                    value={editingProduct.title || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    placeholder="e.g. Spider-Man Embroidered Hoodie (280 GSM)"
                    required
                    className="w-full bg-[#131314] text-white pl-4 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Category</label>
                    <select
                      value={editingProduct.category || 'Hoodies'}
                      onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                      className="w-full bg-[#131314] text-white p-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    >
                      <option value="Hoodies">Hoodies</option>
                      <option value="T-Shirts">T-Shirts</option>
                      <option value="Bottoms">Bottoms</option>
                      <option value="Outerwear">Outerwear</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Price (PKR) *</label>
                    <input
                      type="number"
                      value={editingProduct.price || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      placeholder="3499"
                      required
                      className="w-full bg-[#131314] text-white p-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Sale Price (Optional)</label>
                    <input
                      type="number"
                      value={editingProduct.salePrice || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, salePrice: Number(e.target.value) || undefined })}
                      placeholder="2999"
                      className="w-full bg-[#131314] text-white p-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>
                </div>

                {/* Device Gallery Upload & Image URL Section */}
                <div className="p-4 rounded-2xl bg-[#131314] border border-[#2f3336] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-[#8ab4f8]" />
                      Product Image (Device Gallery or URL)
                    </label>
                    <span className="text-[10px] text-[#9aa0a6]">JPG, PNG, WebP supported</span>
                  </div>

                  {/* Upload From Device Button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDeviceImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-white text-xs font-bold border border-[#444746] hover:border-[#8ab4f8] transition-all cursor-pointer shadow-sm"
                    >
                      {isUploadingImage ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#8ab4f8]" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-[#8ab4f8]" />
                          <span>Choose from Device Gallery</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-[#5f6368] font-medium hidden sm:inline">— OR paste image URL —</span>
                  </div>

                  <div>
                    <input
                      type="url"
                      value={editingProduct.imageUrl || ''}
                      onChange={e => {
                        setEditingProduct({ ...editingProduct, imageUrl: e.target.value });
                        setImagePreview(e.target.value);
                      }}
                      placeholder="https://images.unsplash.com/... or data:image/..."
                      className="w-full bg-[#1e1f20] text-white placeholder:text-[#5f6368] p-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                    />
                  </div>

                  {/* Preview box */}
                  {(imagePreview || editingProduct.imageUrl) && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1e1f20] border border-[#3c4043]">
                      <img
                        src={imagePreview || editingProduct.imageUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-lg object-cover border border-[#444746]"
                      />
                      <div className="text-xs">
                        <span className="text-white font-medium block">Image Selected & Ready</span>
                        <span className="text-[10px] text-[#81c995] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Will display on AI recommendation cards
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Direct Website URL *</label>
                  <input
                    type="url"
                    value={editingProduct.productUrl || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, productUrl: e.target.value })}
                    placeholder="https://vertexlab.store/products/spiderman-hoodie"
                    required
                    className="w-full bg-[#131314] text-white pl-4 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Available Sizes (Comma-separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editingProduct.sizes) ? editingProduct.sizes.join(', ') : editingProduct.sizes || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()) })}
                    placeholder="S, M, L, XL, XXL"
                    className="w-full bg-[#131314] text-white pl-4 pr-4 py-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#c4c7c5] mb-1">Description & GSM Material Info</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="280 GSM Heavyweight Terry Cotton, Japanese Tatami embroidery with 85,000+ stitch count..."
                    className="w-full bg-[#131314] text-white p-2.5 rounded-xl border border-[#3c4043] text-xs focus:outline-none focus:border-[#8ab4f8]"
                  ></textarea>
                </div>

                <div className="flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editingProduct.inStock ?? true}
                      onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                      className="rounded bg-[#131314] border-[#3c4043] text-[#8ab4f8] focus:ring-[#8ab4f8]"
                    />
                    <span className="font-semibold text-[#c4c7c5]">In Stock</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={editingProduct.isHiddenFromAi ?? false}
                      onChange={e => setEditingProduct({ ...editingProduct, isHiddenFromAi: e.target.checked })}
                      className="rounded bg-[#131314] border-[#3c4043] text-[#8ab4f8] focus:ring-[#8ab4f8]"
                    />
                    <span className="font-semibold text-[#c4c7c5]">Hide from AI Assistant</span>
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#2f3336]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingProduct(null);
                      setImagePreview(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#282a2c] hover:bg-[#333538] text-xs font-semibold text-[#9aa0a6] hover:text-white border border-[#444746]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#8ab4f8] hover:bg-[#a8c7fa] text-[#041e49] text-xs font-bold shadow-md cursor-pointer"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
