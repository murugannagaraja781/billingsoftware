import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Package,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit3,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  X,
  Minus
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const InventoryPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: 0, reason: '' });
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'new',
    price: 0,
    unit: 'kg',
    description: '',
    stock: 0
  });

  useEffect(() => {
    fetchProducts();
  }, [user.token]);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/products');
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    try {
      const newStock = adjustment.type === 'add'
        ? selectedProduct.stock + adjustment.quantity
        : selectedProduct.stock - adjustment.quantity;

      await axios.put(`http://localhost:5001/api/products/${selectedProduct._id}`,
        { stock: newStock },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setShowModal(false);
      fetchProducts();
      setAdjustment({ type: 'add', quantity: 0, reason: '' });
    } catch (error) {
      alert('Error updating stock');
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await axios.post('http://localhost:5001/api/products', productForm, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      } else {
        await axios.put(`http://localhost:5001/api/products/${selectedProduct._id}`, productForm, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }
      setShowProductModal(false);
      fetchProducts();
      setProductForm({ name: '', category: 'new', price: 0, unit: 'kg', description: '', stock: 0 });
    } catch (error) {
      alert('Error saving product');
    }
  };

  const openEditModal = (p) => {
    setSelectedProduct(p);
    setProductForm({
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      description: p.description || '',
      stock: p.stock
    });
    setModalMode('edit');
    setShowProductModal(true);
  };

  const openCreateModal = () => {
    setProductForm({ name: '', category: 'new', price: 0, unit: 'kg', description: '', stock: 0 });
    setModalMode('create');
    setShowProductModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-10 py-8 space-y-8 transition-colors duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('manageInventory')}</h2>
          <p className="text-[var(--text-secondary)] mt-2 font-medium">{t('inventoryDesc')}</p>
        </div>
        <div className="flex space-x-3">
            <button
                onClick={() => { setModalMode('create'); setShowProductModal(true); }}
                className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
            >
                <Plus size={18} />
                <span>{t('addNewProduct')}</span>
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500" size={18} />
            <input
                type="text"
                placeholder={t('searchAnalytics')}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 text-sm font-medium transition-all shadow-sm"
            />
        </div>
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 md:pb-0">
            {['all', 'new', 'waste'].map((cat) => (
                <button
                    key={cat}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        cat === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                >
                    {t(cat === 'all' ? 'allCategories' : (cat === 'new' ? 'sellProduct' : 'buyScrap'))}
                </button>
            ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
            { label: 'Total Stock Value', value: '₹1,24,500', icon: TrendingUp, color: 'red' },
            { label: 'Low Stock Items', value: '24 Items', icon: TrendingDown, color: 'amber' },
            { label: 'Total Categories', value: '12 Classes', icon: Package, color: 'emerald' },
            { label: 'Active Orders', value: '18 In-Transit', icon: ChevronRight, color: 'purple' },
        ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 border border-slate-200 rounded-3xl flex items-center justify-between shadow-sm">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl font-black text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500`}>
                    <stat.icon size={20} />
                </div>
            </div>
        ))}
      </div>

      {/* Product List */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div className="flex space-x-6">
                <button className="text-[11px] font-black text-red-600 uppercase tracking-widest border-b-2 border-red-600 pb-1">All Products</button>
                <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">New Only</button>
                <button className="text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors">Scrap Only</button>
            </div>
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={14} />
                <input
                    type="text"
                    placeholder="Search product name..."
                    className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-red-500/30 w-64 shadow-sm"
                />
            </div>
        </div>
        <table className="w-full text-left">
            <thead>
            <tr className="bg-slate-50">
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('productName')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('category')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('stock')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('price')}</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('actions')}</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${p.category === 'new' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {p.name[0]}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-slate-900 leading-none">{p.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">SKU: PC-{p._id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-8 py-6">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${p.category === 'new' ? 'bg-blue-600/10 text-blue-600' : 'bg-emerald-600/10 text-emerald-600'}`}>
                    {t(p.category === 'new' ? 'sellProduct' : 'buyScrap')}
                  </span>
                </td>
                        <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className={`text-xs font-black ${p.stock < 10 ? 'text-rose-500' : 'text-slate-900'}`}>{p.stock.toLocaleString()} {p.unit}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{p.stock < 10 ? t('lowStock') : t('inStock')}</span>
                  </div>
                </td>
                        <td className="px-8 py-6">
                            <p className="text-sm font-black text-slate-900">₹{p.price} <span className="text-[10px] font-bold text-slate-400">/ {p.unit}</span></p>
                        </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => { setSelectedProduct(p); setShowModal(true); }}
                                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:border-red-500/40 transition-all shadow-sm"
                                    title="Quick Stock Adjustment"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={() => openEditModal(p)}
                                    className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                                    title="Edit Product"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-white rounded-3xl p-10 relative shadow-2xl border border-slate-200">
                <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{t('stockAdjustment')}</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">{t('adjustmentDesc')}</p>

                <div className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Product</label>
                        <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold">{selectedProduct?.name}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('adjustmentType')}</label>
                <div className="flex space-x-3">
                    <button
                        type="button"
                        onClick={() => setAdjustment({...adjustment, type: 'add'})}
                        className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl border-2 transition-all font-bold ${
                            adjustment.type === 'add' ? 'bg-emerald-600/10 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                    >
                        <TrendingUp size={18} />
                        <span>{t('addStock')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setAdjustment({...adjustment, type: 'remove'})}
                        className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl border-2 transition-all font-bold ${
                            adjustment.type === 'remove' ? 'bg-rose-600/10 border-rose-500 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                        }`}
                    >
                        <TrendingDown size={18} />
                        <span>{t('removeStock')}</span>
                    </button>
                </div>
              </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity (KG)</label>
                            <input
                                type="number"
                                placeholder="0.00"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                                value={adjustment.quantity}
                                onChange={(e) => setAdjustment({...adjustment, quantity: parseFloat(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes</label>
                         <textarea
                            placeholder="Reason for adjustment..."
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold h-24"
                            value={adjustment.reason}
                            onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                         />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={() => setShowModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-100 transition-colors">Cancel</button>
                        <button onClick={handleAdjustStock} className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20 transition-all active:scale-95">Apply Adjustment</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-10 relative shadow-2xl border border-slate-200 my-auto">
                <button onClick={() => setShowProductModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
                    {modalMode === 'create' ? t('addNewProduct') : 'Edit Product'}
                </h3>
                <p className="text-slate-500 text-sm font-medium mb-8 tracking-tight">Configure details for industrial polymers or recycled scrap.</p>

                <form onSubmit={handleProductSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('productName')}</label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Polypropylene Pellets"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                                value={productForm.name}
                                onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('category')}</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold appearance-none cursor-pointer"
                    value={productForm.category}
                    onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  >
                    <option value="new">{t('sellProduct')}</option>
                    <option value="waste">{t('buyScrap')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('marketPrice')}</label>
                  <input
                    required
                    type="number"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('unitMeasure')}</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold appearance-none cursor-pointer"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="ton">Tons (ton)</option>
                  </select>
                </div>
              </div>

              {modalMode === 'create' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('initialStock')}</label>
                  <input
                    type="number"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: parseInt(e.target.value)})}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('productDescLabel')}</label>
                <textarea
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-medium h-24 resize-none"
                    placeholder={t('descriptionPlaceholder')}
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button type="button" onClick={() => setShowProductModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-100 transition-colors">{t('cancel')}</button>
                <button type="submit" className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20">
                  {modalMode === 'create' ? t('addItem') : t('saveChanges')}
                </button>
              </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
