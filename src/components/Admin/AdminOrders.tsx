import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product } from '../../types';
import { api } from '../../lib/api';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Truck,
  CheckCircle2,
  Clock,
  Scissors,
  XCircle,
  Phone,
  MapPin,
  X,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  pending: {
    label: 'Order Confirmed',
    bg: 'bg-amber-950/60',
    text: 'text-amber-300',
    border: 'border-amber-800/70',
    icon: Clock,
  },
  processing: {
    label: 'Processing & Cutting',
    bg: 'bg-blue-950/60',
    text: 'text-blue-300',
    border: 'border-blue-800/70',
    icon: RefreshCw,
  },
  in_embroidery: {
    label: 'In Tatami Embroidery',
    bg: 'bg-purple-950/60',
    text: 'text-purple-300',
    border: 'border-purple-800/70',
    icon: Scissors,
  },
  shipped: {
    label: 'Dispatched / In Transit',
    bg: 'bg-indigo-950/60',
    text: 'text-indigo-300',
    border: 'border-indigo-800/70',
    icon: Truck,
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    bg: 'bg-cyan-950/60',
    text: 'text-cyan-300',
    border: 'border-cyan-800/70',
    icon: Truck,
  },
  delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-300',
    border: 'border-emerald-800/70',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-950/60',
    text: 'text-rose-300',
    border: 'border-rose-800/70',
    icon: XCircle,
  },
};

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders(selectedStatus, search);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const prods = await api.getProducts('All', '', true);
      setProducts(prods);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadOrders();
    loadProducts();
  }, [selectedStatus, search]);

  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setActionSuccess(`Order status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      setTimeout(() => setActionSuccess(null), 2500);
      await loadOrders();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder || !editingOrder.customerName) return;

    try {
      // Calculate total price if not explicit
      const calculatedTotal =
        editingOrder.items && editingOrder.items.length > 0
          ? editingOrder.items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0)
          : editingOrder.totalPrice || 3499;

      await api.saveOrder({
        ...editingOrder,
        totalPrice: editingOrder.totalPrice || calculatedTotal,
        items: editingOrder.items && editingOrder.items.length > 0 ? editingOrder.items : [
          {
            title: 'Custom Vertex Apparel Item',
            quantity: 1,
            price: calculatedTotal,
          }
        ],
      });

      setIsModalOpen(false);
      setEditingOrder(null);
      setActionSuccess('Order saved successfully! Grounded in AI customer tracking.');
      setTimeout(() => setActionSuccess(null), 3000);
      await loadOrders();
    } catch (err) {
      console.error('Failed to save order:', err);
    }
  };

  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (!window.confirm(`Are you sure you want to delete Order ${orderNumber}?`)) return;
    try {
      await api.deleteOrder(id);
      setActionSuccess(`Order ${orderNumber} deleted`);
      setTimeout(() => setActionSuccess(null), 2500);
      await loadOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewOrderModal = () => {
    const defaultProduct = products[0] || {
      id: 'prod-custom',
      title: 'Spider-Man: Brand New Day Embroidered Heavyweight Tee',
      price: 3499,
    };

    setEditingOrder({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      shippingAddress: '',
      city: 'Lahore',
      items: [
        {
          productId: defaultProduct.id,
          title: defaultProduct.title,
          size: 'L',
          quantity: 1,
          price: defaultProduct.salePrice || defaultProduct.price,
        },
      ],
      totalPrice: defaultProduct.salePrice || defaultProduct.price,
      status: 'pending',
      paymentMethod: 'cod',
      courier: 'PostEx',
      trackingNumber: `PX-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Order received and confirmed with customer.',
    });
    setIsModalOpen(true);
  };

  const addItemToEditingOrder = () => {
    if (!editingOrder) return;
    const defaultProduct = products[0] || {
      id: 'prod-custom',
      title: 'Custom Apparel Item',
      price: 3499,
    };

    const currentItems = editingOrder.items || [];
    const newItems = [
      ...currentItems,
      {
        productId: defaultProduct.id,
        title: defaultProduct.title,
        size: 'L',
        quantity: 1,
        price: defaultProduct.salePrice || defaultProduct.price,
      },
    ];

    const newTotal = newItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
    setEditingOrder({
      ...editingOrder,
      items: newItems,
      totalPrice: newTotal,
    });
  };

  const removeItemFromEditingOrder = (idx: number) => {
    if (!editingOrder || !editingOrder.items) return;
    const newItems = editingOrder.items.filter((_, i) => i !== idx);
    const newTotal = newItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
    setEditingOrder({
      ...editingOrder,
      items: newItems,
      totalPrice: newTotal,
    });
  };

  // Stats calculation
  const totalOrdersCount = orders.length;
  const inProductionCount = orders.filter(o => o.status === 'in_embroidery' || o.status === 'processing').length;
  const dispatchedCount = orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/60">
              Fulfillment & Dispatch
            </span>
            <span className="text-xs text-slate-400">Total: {totalOrdersCount} orders</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-display">Orders Management</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Add customer orders and manage fulfillment statuses. When customers ask about their order, the AI asks for their name and provides instant live status tracking.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewOrderModal}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Order</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">All Active Orders</p>
          <p className="text-2xl font-bold text-white mt-1 font-display">{totalOrdersCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-900/40">
          <p className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">In Embroidery</p>
          <p className="text-2xl font-bold text-purple-300 mt-1 font-display">{inProductionCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-900/40">
          <p className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">In Transit / Out</p>
          <p className="text-2xl font-bold text-indigo-300 mt-1 font-display">{dispatchedCount}</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/40">
          <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Delivered</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1 font-display">{deliveredCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, order #VL-1001, city, or item..."
            className="w-full bg-slate-950 text-slate-100 pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'pending', label: 'Confirmed' },
            { id: 'in_embroidery', label: 'In Embroidery' },
            { id: 'shipped', label: 'In Transit' },
            { id: 'out_for_delivery', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
          ].map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                selectedStatus === st.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Order ID & Date</th>
                <th className="py-3.5 px-4 font-semibold">Customer & Delivery</th>
                <th className="py-3.5 px-4 font-semibold">Items Ordered</th>
                <th className="py-3.5 px-4 font-semibold">Total (PKR)</th>
                <th className="py-3.5 px-4 font-semibold">Current Status</th>
                <th className="py-3.5 px-4 font-semibold">Courier & Tracking</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading orders database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300">No orders found matching your search</p>
                    <p className="text-[11px] text-slate-500 mt-1">Click "Add New Order" above to create an order.</p>
                  </td>
                </tr>
              ) : (
                orders.map(order => {
                  const statusInfo = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: 'bg-slate-800',
                    text: 'text-slate-300',
                    border: 'border-slate-700',
                    icon: Package,
                  };
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Order Number & Date */}
                      <td className="py-4 px-4 font-medium text-white">
                        <div className="font-bold text-indigo-300">{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{order.customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{order.customerPhone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 max-w-[200px] truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{order.shippingAddress}, {order.city}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <div className="space-y-1">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-200">
                              <span className="font-medium">• {it.title}</span>
                              <span className="text-[10px] text-slate-400 ml-1">
                                (Qty: {it.quantity}{it.size ? `, Size: ${it.size}` : ''})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-4 px-4 font-bold text-white">
                        <div>Rs. {order.totalPrice.toLocaleString()}</div>
                        <div className="text-[10px] font-semibold text-emerald-400 uppercase">
                          {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid'}
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-4 px-4">
                        <div className="space-y-1.5">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            <span>{statusInfo.label}</span>
                          </div>

                          <div>
                            <select
                              value={order.status}
                              onChange={e => handleQuickStatusChange(order.id, e.target.value as OrderStatus)}
                              className="bg-slate-950 text-slate-300 text-[10px] py-1 px-2 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="pending">Confirmed</option>
                              <option value="processing">Processing & Cutting</option>
                              <option value="in_embroidery">In Tatami Embroidery</option>
                              <option value="shipped">Dispatched / In Transit</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Courier & Tracking */}
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-semibold">{order.courier || 'PostEx'}</div>
                        <div className="text-[10px] font-mono text-indigo-400 mt-0.5">
                          {order.trackingNumber || 'Pending'}
                        </div>
                        {order.notes && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[160px] truncate" title={order.notes}>
                            "{order.notes}"
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOrder(order);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                            title="Edit Order"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-all"
                            title="Delete Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Order Modal */}
      {isModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingOrder(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Package className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {editingOrder.id ? `Edit Order (${editingOrder.orderNumber})` : 'Create New Customer Order'}
                </h3>
                <p className="text-xs text-slate-400">
                  This order is instantly searchable by the Vertex AI Concierge when customers inquire about their parcel status.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
              {/* Customer Information */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <span>Customer Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      value={editingOrder.customerName || ''}
                      onChange={e => setEditingOrder({ ...editingOrder, customerName: e.target.value })}
                      placeholder="e.g. Ali Khan"
                      required
                      className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={editingOrder.customerPhone || ''}
                      onChange={e => setEditingOrder({ ...editingOrder, customerPhone: e.target.value })}
                      placeholder="+92 300 1234567"
                      required
                      className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-300 mb-1">Delivery Address *</label>
                    <input
                      type="text"
                      value={editingOrder.shippingAddress || ''}
                      onChange={e => setEditingOrder({ ...editingOrder, shippingAddress: e.target.value })}
                      placeholder="House 42-B, Sector G-13/4"
                      required
                      className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">City *</label>
                    <input
                      type="text"
                      value={editingOrder.city || 'Lahore'}
                      onChange={e => setEditingOrder({ ...editingOrder, city: e.target.value })}
                      placeholder="Lahore / Karachi / Islamabad"
                      required
                      className="w-full bg-slate-900 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <h4 className="font-bold text-slate-200 text-xs">Ordered Apparel Items</h4>
                  <button
                    type="button"
                    onClick={addItemToEditingOrder}
                    className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingOrder.items || []).map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Item #{idx + 1}</span>
                        {(editingOrder.items?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemFromEditingOrder(idx)}
                            className="text-rose-400 hover:text-rose-300 text-[10px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Item Title / Catalog Pick</label>
                          <select
                            value={item.productId || ''}
                            onChange={e => {
                              const found = products.find(p => p.id === e.target.value);
                              const updatedItems = [...(editingOrder.items || [])];
                              if (found) {
                                updatedItems[idx] = {
                                  ...updatedItems[idx],
                                  productId: found.id,
                                  title: found.title,
                                  price: found.salePrice || found.price,
                                };
                              } else {
                                updatedItems[idx] = {
                                  ...updatedItems[idx],
                                  productId: e.target.value,
                                };
                              }
                              setEditingOrder({ ...editingOrder, items: updatedItems });
                            }}
                            className="w-full bg-slate-950 text-slate-200 p-2 rounded-lg border border-slate-800 text-[11px]"
                          >
                            <option value="">Custom Title Below</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.title} (Rs. {(p.salePrice || p.price).toLocaleString()})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Custom / Exact Item Title</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => {
                              const updatedItems = [...(editingOrder.items || [])];
                              updatedItems[idx].title = e.target.value;
                              setEditingOrder({ ...editingOrder, items: updatedItems });
                            }}
                            required
                            placeholder="Spider-Man Brand New Day Embroidered Tee"
                            className="w-full bg-slate-950 text-slate-100 p-2 rounded-lg border border-slate-800 text-[11px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Size</label>
                          <select
                            value={item.size || 'L'}
                            onChange={e => {
                              const updatedItems = [...(editingOrder.items || [])];
                              updatedItems[idx].size = e.target.value;
                              setEditingOrder({ ...editingOrder, items: updatedItems });
                            }}
                            className="w-full bg-slate-950 text-slate-200 p-2 rounded-lg border border-slate-800 text-[11px]"
                          >
                            <option value="S">S (Small)</option>
                            <option value="M">M (Medium)</option>
                            <option value="L">L (Large)</option>
                            <option value="XL">XL (Extra Large)</option>
                            <option value="XXL">XXL (2XL)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={e => {
                              const updatedItems = [...(editingOrder.items || [])];
                              updatedItems[idx].quantity = Number(e.target.value) || 1;
                              const newTotal = updatedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
                              setEditingOrder({ ...editingOrder, items: updatedItems, totalPrice: newTotal });
                            }}
                            className="w-full bg-slate-950 text-slate-100 p-2 rounded-lg border border-slate-800 text-[11px]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Unit Price (PKR)</label>
                          <input
                            type="number"
                            value={item.price || 3499}
                            onChange={e => {
                              const updatedItems = [...(editingOrder.items || [])];
                              updatedItems[idx].price = Number(e.target.value) || 0;
                              const newTotal = updatedItems.reduce((acc, it) => acc + (it.price || 0) * (it.quantity || 1), 0);
                              setEditingOrder({ ...editingOrder, items: updatedItems, totalPrice: newTotal });
                            }}
                            className="w-full bg-slate-950 text-slate-100 p-2 rounded-lg border border-slate-800 text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status, Price, Courier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Order Status</label>
                  <select
                    value={editingOrder.status || 'pending'}
                    onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value as OrderStatus })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  >
                    <option value="pending">Order Confirmed</option>
                    <option value="processing">Processing & Cutting</option>
                    <option value="in_embroidery">In Tatami Embroidery</option>
                    <option value="shipped">Dispatched / In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Total Price (PKR)</label>
                  <input
                    type="number"
                    value={editingOrder.totalPrice || ''}
                    onChange={e => setEditingOrder({ ...editingOrder, totalPrice: Number(e.target.value) })}
                    placeholder="3499"
                    required
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={editingOrder.paymentMethod || 'cod'}
                    onChange={e => setEditingOrder({ ...editingOrder, paymentMethod: e.target.value as 'cod' | 'card' | 'bank_transfer' })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="card">Prepaid (Credit/Debit Card)</option>
                    <option value="bank_transfer">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Courier Partner</label>
                  <select
                    value={editingOrder.courier || 'PostEx'}
                    onChange={e => setEditingOrder({ ...editingOrder, courier: e.target.value })}
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PostEx">PostEx (Standard Nationwide)</option>
                    <option value="TCS Express">TCS Express</option>
                    <option value="Trax Courier">Trax Courier</option>
                    <option value="Leopards">Leopards Courier</option>
                    <option value="Call Courier">Call Courier</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={editingOrder.trackingNumber || ''}
                    onChange={e => setEditingOrder({ ...editingOrder, trackingNumber: e.target.value })}
                    placeholder="PX-982104"
                    className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Production & Fulfillment Notes (Shared with AI)</label>
                <textarea
                  rows={2}
                  value={editingOrder.notes || ''}
                  onChange={e => setEditingOrder({ ...editingOrder, notes: e.target.value })}
                  placeholder="e.g. 90,000 stitches tatami embroidery completed in Lahore studio. Dispatched via PostEx."
                  className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingOrder(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-950/50"
                >
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
