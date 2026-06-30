import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Recycle,
  Search,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  Download
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const CollectedWastePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [wasteProducts, setWasteProducts] = useState(() => {
    const saved = localStorage.getItem('rts_waste_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('rts_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(wasteProducts.length === 0 || transactions.length === 0);
  
  // Stock Adjustment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustment, setAdjustment] = useState({ type: 'add', quantity: 0, reason: '' });
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWasteProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`);
      // Filter for category === 'waste'
      const wasteItems = data.filter(p => p.category === 'waste');
      setWasteProducts(wasteItems);
      localStorage.setItem('rts_waste_products', JSON.stringify(wasteItems));
    } catch (error) {
      console.error('Error fetching waste products:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTransactions(data);
      localStorage.setItem('rts_transactions', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchWasteProducts(), fetchTransactions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user.token]);

  const handleAdjustStock = async () => {
    if (!selectedProduct) return;
    try {
      const newStock = adjustment.type === 'add'
        ? selectedProduct.stock + adjustment.quantity
        : selectedProduct.stock - adjustment.quantity;

      await axios.put(`${API_URL}/api/products/${selectedProduct._id}`,
        { stock: newStock },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setShowModal(false);
      fetchWasteProducts();
      setAdjustment({ type: 'add', quantity: 0, reason: '' });
    } catch (error) {
      alert(t('errorUpdatingStock'));
    }
  };

  // Compile individual waste items bought from transactions
  const wasteCollections = [];
  transactions.forEach(tx => {
    tx.items.forEach(item => {
      if (item.type === 'bought') {
        wasteCollections.push({
          id: `${tx._id}-${item.productId}-${item.productName}`,
          date: tx.date || tx.createdAt,
          invoiceId: tx.invoiceId || tx._id.slice(-6).toUpperCase(),
          customerName: tx.customerName,
          customerPhone: tx.customerPhone || t('noPhone'),
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subTotal: item.subTotal,
          storeName: tx.storeId?.name || 'Main Unit'
        });
      }
    });
  });

  // Filter collections based on search
  const filteredCollections = wasteCollections.filter(col => {
    const query = searchQuery.toLowerCase();
    return (
      col.customerName.toLowerCase().includes(query) ||
      col.productName.toLowerCase().includes(query) ||
      col.invoiceId.toLowerCase().includes(query)
    );
  });

  // KPI Calculations
  const totalStockKg = wasteProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockWasteItems = wasteProducts.filter(p => p.stock < 50);
  const totalWasteBoughtValue = wasteCollections.reduce((sum, col) => sum + col.subTotal, 0);

  const handleExportCSV = () => {
    if (filteredCollections.length === 0) return alert(t('noDataToExport'));

    const headers = ['Date', 'Invoice ID', 'Customer', 'Phone', 'Waste Product', 'Quantity (KG)', 'Rate/KG (₹)', 'Total (₹)', 'Store'];
    const rows = filteredCollections.map(col => [
      new Date(col.date).toLocaleDateString(),
      col.invoiceId,
      col.customerName,
      col.customerPhone,
      col.productName,
      col.quantity,
      col.unitPrice,
      col.subTotal,
      col.storeName
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Waste_Collections_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-4 md:px-10 py-6 md:py-8 space-y-6 md:space-y-8 transition-colors duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            {t('collectedWaste')}
          </h2>
          <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 md:mt-2 font-medium">
            {t('collectedWasteDesc')}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all hover:bg-slate-50 hover:text-red-500 shadow-sm"
        >
          <Download size={16} />
          <span>{t('exportReport')}</span>
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Stock */}
        <div className="glass-card p-6 bg-white border-white/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('totalWasteStock')}</p>
            <h3 className="text-3xl font-black text-slate-900">{totalStockKg.toLocaleString()} {t('kg')}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">{t('inStock')}</p>
          </div>
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
            <Recycle size={28} />
          </div>
        </div>

        {/* Total Cost / Value */}
        <div className="glass-card p-6 bg-white border-white/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('totalScrapBuy')}</p>
            <h3 className="text-3xl font-black text-slate-900">₹{totalWasteBoughtValue.toLocaleString()}</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">{t('live')}</p>
          </div>
          <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
            <Layers size={28} />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="glass-card p-6 bg-white border-white/5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('lowWasteStock')}</p>
            <h3 className={`text-3xl font-black ${lowStockWasteItems.length > 0 ? 'text-amber-500' : 'text-slate-900'}`}>
              {lowStockWasteItems.length} {t('item')}
            </h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">{"Threshold < 50 kg"}</p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${lowStockWasteItems.length > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle size={28} />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Stock (Top or Left) and History (Bottom or Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Top: Waste Stock Levels & Quick Action */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 bg-white border-white/5 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-6 tracking-tight flex items-center space-x-2">
              <Recycle size={20} className="text-emerald-500" />
              <span>{t('currentWasteStock')}</span>
            </h3>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-slate-400 text-sm font-semibold">{t('loading')}</div>
              ) : wasteProducts.length === 0 ? (
                <div className="text-slate-400 text-sm">{t('noProductsAdded')}</div>
              ) : (
                wasteProducts.map(p => (
                  <div key={p._id} className="p-4 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        {t('ratePerKg')}: ₹{p.price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`text-sm font-black ${p.stock < 50 ? 'text-amber-500' : 'text-slate-900'}`}>
                          {p.stock} {p.unit || t('kg')}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">
                          {p.stock < 50 ? t('lowStock') : t('inStock')}
                        </p>
                      </div>
                      <button
                        onClick={() => { setSelectedProduct(p); setShowModal(true); }}
                        className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-100"
                        title={t('quickAdjustment')}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right/Bottom: Waste Collection Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6 bg-white border-white/5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <FileText size={20} className="text-red-500" />
                <span>{t('wasteCollectionHistory')}</span>
              </h3>
              
              <div className="relative group w-full md:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500" size={16} />
                <input
                  type="text"
                  placeholder={t('searchProduct')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 text-xs font-medium transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-8 text-center text-slate-400 text-sm font-semibold">{t('loading')}</div>
              ) : filteredCollections.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm font-semibold">{t('noWasteCollected')}</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('collectionDate')}</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('customerName')}</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('productName')}</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('quantity')}</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('price')}</th>
                      <th className="py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCollections.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-xs font-bold text-slate-500">
                          {new Date(col.date).toLocaleDateString()}
                          <span className="block text-[9px] text-slate-400 font-medium">
                            {new Date(col.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-4">
                          <p className="text-xs font-black text-slate-900">{col.customerName}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{col.customerPhone}</p>
                        </td>
                        <td className="py-4">
                          <p className="text-xs font-black text-slate-900">{col.productName}</p>
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                            ID: {col.invoiceId}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-black text-slate-900 text-right">
                          {col.quantity.toLocaleString()} {t('kg')}
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-500 text-right">
                          ₹{col.unitPrice}
                        </td>
                        <td className="py-4 text-xs font-black text-emerald-600 text-right">
                          ₹{col.subTotal.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('searchProduct')}</label>
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('quantityKg')}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                    value={adjustment.quantity || ''}
                    onChange={(e) => setAdjustment({...adjustment, quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('notes')}</label>
                <textarea
                  placeholder={t('reasonAdjustment')}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold h-24"
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment({...adjustment, reason: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-100 transition-colors">{t('cancel')}</button>
                <button onClick={handleAdjustStock} className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20 transition-all active:scale-95">{t('applyAdjustment')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectedWastePage;
