import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Trash2,
  Save,
  ShoppingCart,
  Recycle,
  UserPlus,
  History,
  FileText,
  CreditCard,
  Truck,
  ArrowRight,
  Printer,
  X,
  User,
  Hash,
  Calendar,
  LogOut
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const BillingPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [customer, setCustomer] = useState({ name: t('selectCustomerTitle'), phone: '', _id: '' });
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustModal, setShowNewCustModal] = useState(false);
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '', address: '', gstNumber: '' });
  const [billItems, setBillItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [invoiceId] = useState(`TRX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/products`);
      setProducts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCustomers(data);
      setCustomers(data);
      if (data.length > 0 && customer.name === t('selectCustomerTitle')) {
          setCustomer(data[0]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_URL}/api/customers`, newCustForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCustomers([...customers, data]);
      setCustomer(data);
      setShowNewCustModal(false);
      setNewCustForm({ name: '', phone: '', address: '', gstNumber: '' });
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating customer');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const addItem = (type) => {
    setBillItems([...billItems, {
      productId: '',
      productName: '',
      quantity: 0,
      unitPrice: 0,
      unit: 'kg',
      type, // 'sold' for new, 'bought' for waste
      subTotal: 0
    }]);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...billItems];
    const item = newItems[index];

    if (field === 'productId') {
      const product = products.find(p => p._id === value);
      item.productId = value;
      item.productName = product.name;
      item.unitPrice = product.price;
      item.unit = product.unit || 'kg';
    } else if (field === 'quantity' || field === 'unitPrice') {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }

    item.subTotal = item.quantity * item.unitPrice;
    setBillItems(newItems);
  };

  const removeItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalNew = billItems
      .filter(i => i.type === 'sold')
      .reduce((sum, i) => sum + i.subTotal, 0);
    const totalWaste = billItems
      .filter(i => i.type === 'bought')
      .reduce((sum, i) => sum + i.subTotal, 0);
    const subtotal = totalNew - totalWaste;
    const tax = gstEnabled ? subtotal * 0.18 : 0; // 18% GST
    const logistics = shippingEnabled ? parseFloat(shippingAmount) || 0 : 0;
    return {
      totalNew,
      totalWaste,
      subtotal,
      tax,
      logistics,
      net: subtotal + tax + logistics
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    if (!customer.name || billItems.length === 0) return alert(t('fillDetailsError'));
    setLoading(true);
    try {
      const transactionData = {
        customerName: customer.name,
        customerPhone: customer.phone,
        items: billItems,
        totalNewAmount: totals.totalNew,
        totalWasteAmount: totals.totalWaste,
        netAmount: totals.net,
        storeId: user.storeId,
        invoiceId: invoiceId
      };
      await axios.post(`${API_URL}/api/transactions`, transactionData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setLastTransaction(transactionData);
      setShowSuccessModal(true);
    } catch (error) {
      alert(t('errorGeneratingBill'));
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setBillItems([]);
    setShowSuccessModal(false);
    // Optionally regenerate invoice ID here if needed
  };

  return (
    <>
      <div className="flex flex-col md:flex-row bg-[var(--bg-main)] min-h-screen transition-colors duration-500 text-[var(--text-main)] pb-24 md:pb-0">
      {/* Middle Section: Bill Editor - Optimized for Space */}
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-[1200px] md:border-r border-slate-200 overflow-y-auto">

        {/* Compact Premium Transaction Header - Hidden Header info on mobile if redundant */}
        <div className="relative bg-slate-900 rounded-2xl md:rounded-[30px] p-4 md:p-6 overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-800 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[60px] -mr-32 -mt-32"></div>

            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6 space-y-2 md:space-y-0">
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">{t('liveTransaction')}</p>
                        <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none truncate max-w-[200px]">{customer.name}</h3>
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4 md:pl-6 md:border-l border-slate-700">
                        <div className="flex items-center space-x-2 text-slate-400">
                            <User size={12} className="text-red-500 md:w-[14px] md:h-[14px]" />
                            <span className="text-[10px] md:text-[11px] font-bold tracking-tight">{customer.phone || t('noPhone')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-400">
                            <Hash size={12} className="text-red-500 md:w-[14px] md:h-[14px]" />
                            <span className="text-[10px] md:text-[11px] font-bold tracking-tight">{invoiceId}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto md:space-x-3">
                    <button
                        onClick={() => setShowCustomerModal(true)}
                        className="px-4 md:px-5 py-2 md:py-2.5 bg-white hover:bg-red-500 text-slate-900 hover:text-white rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        {t('createNewCustomer')}
                    </button>
                    <div className="hidden md:block px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sales Section - Optimized for Multi-bill */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <ShoppingCart size={16} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{t('sales')}</h4>
                    </div>
                    <button onClick={() => addItem('sold')} className="px-3 py-1 bg-red-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-sm">
                        {t('addItemPlus')}
                    </button>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('item')}</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center w-28">{t('qty')}</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center w-20">{t('unit')}</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-right w-24">{t('subtotalTable')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {billItems.filter(i => i.type === 'sold').map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2">
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(billItems.indexOf(item), 'productId', e.target.value)}
                                            className="w-full bg-transparent text-slate-800 border-none outline-none text-[12px] font-bold cursor-pointer"
                                        >
                                            <option value="" disabled>Select...</option>
                                            {products.filter(p => p.category === 'new').map(p => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            step={item.unit === 'pcs' ? '1' : '0.001'}
                                            value={item.quantity || ''}
                                            onChange={(e) => updateItem(billItems.indexOf(item), 'quantity', e.target.value)}
                                            placeholder={item.unit === 'pcs' ? '0' : '0.000'}
                                            className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-slate-700 font-bold outline-none text-[12px] text-center"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            value={item.unit}
                                            onChange={(e) => updateItem(billItems.indexOf(item), 'unit', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded px-1 py-1 text-slate-700 font-bold outline-none text-[12px] text-center cursor-pointer"
                                        >
                                            <option value="kg">{t('kg')}</option>
                                            <option value="pcs">{t('piece')}</option>
                                            <option value="ton">{t('ton')}</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <span className="text-slate-900 font-black text-[12px]">₹{item.subTotal.toFixed(2)}</span>
                                            <button onClick={() => removeItem(billItems.indexOf(item))} className="p-1 text-slate-300 hover:text-red-500 transition-all">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {billItems.filter(i => i.type === 'sold').length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-5 py-10 text-center text-slate-400 text-xs font-bold uppercase tracking-widest italic opacity-50">{t('noProductsAdded')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Purchases Section - Optimized for Multi-bill */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <Recycle size={16} />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter">{t('purchases')}</h4>
                    </div>
                    <button onClick={() => addItem('bought')} className="px-3 py-1 bg-amber-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-amber-700 transition-all shadow-sm">
                        {t('addScrapPlus')}
                    </button>
                </div>

                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider">{t('material')}</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center w-28">{t('qty')}</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-center w-20">{t('unit')}</th>
                                <th className="px-3 py-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider text-right w-24">{t('subtotalTable')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {billItems.filter(i => i.type === 'bought').map((item, idx) => (
                                <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                    <td className="px-3 py-2">
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(billItems.indexOf(item), 'productId', e.target.value)}
                                            className="w-full bg-transparent text-slate-800 border-none outline-none text-[12px] font-bold cursor-pointer"
                                        >
                                            <option value="" disabled>Select...</option>
                                            {products.filter(p => p.category === 'waste').map(p => (
                                                <option key={p._id} value={p._id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="number"
                                            step={item.unit === 'pcs' ? '1' : '0.001'}
                                            value={item.quantity || ''}
                                            onChange={(e) => updateItem(billItems.indexOf(item), 'quantity', e.target.value)}
                                            placeholder={item.unit === 'pcs' ? '0' : '0.000'}
                                            className="w-full bg-slate-50 border border-slate-100 rounded px-2 py-1 text-slate-700 font-bold outline-none text-[12px] text-center"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            value={item.unit}
                                            onChange={(e) => updateItem(billItems.indexOf(item), 'unit', e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded px-1 py-1 text-slate-700 font-bold outline-none text-[11px] text-center cursor-pointer"
                                        >
                                            <option value="kg">{t('kg')}</option>
                                            <option value="pcs">{t('piece')}</option>
                                            <option value="ton">{t('ton')}</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <span className="text-amber-600 font-black text-[12px]">-₹{item.subTotal.toFixed(2)}</span>
                                            <button onClick={() => removeItem(billItems.indexOf(item))} className="p-1 text-slate-300 hover:text-red-500 transition-all">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {billItems.filter(i => i.type === 'bought').length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-3 py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest italic opacity-50">{t('noScrapAdded')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      {/* Right Sidebar: Order Summary */}
      <div className="w-full md:w-80 p-5 bg-white md:sticky md:top-0 md:h-screen flex flex-col border-t md:border-t-0 md:border-l border-slate-200 mb-20 md:mb-0">
        <h4 className="text-base font-black text-[var(--text-primary)] mb-4 tracking-tighter uppercase">{t('orderSummary')}</h4>

        <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500 tracking-tight">{t('totalSales')} (+)</span>
                <span className="text-red-600 font-black">₹{totals.totalNew.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-500 tracking-tight">{t('totalScrapBuy')} (-)</span>
                <span className="text-amber-600 font-black">-₹{totals.totalWaste.toFixed(2)}</span>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                    <span className="text-slate-400">{t('subtotal')}</span>
                    <span className="text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                {/* GST Tax - Optional Toggle */}
                <div className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setGstEnabled(!gstEnabled)}
                                className={`relative w-8 h-[18px] rounded-full transition-all duration-300 ${gstEnabled ? 'bg-red-500' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-300 ${gstEnabled ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('taxes')}</span>
                        </div>
                        <span className={`text-xs font-black ${gstEnabled ? 'text-slate-900' : 'text-slate-300'}`}>₹{totals.tax.toFixed(2)}</span>
                    </div>
                </div>

                {/* Shipping/Logistics - Optional Toggle */}
                <div className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 space-y-1.5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShippingEnabled(!shippingEnabled)}
                                className={`relative w-8 h-[18px] rounded-full transition-all duration-300 ${shippingEnabled ? 'bg-red-500' : 'bg-slate-300'}`}
                            >
                                <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow-sm transition-transform duration-300 ${shippingEnabled ? 'translate-x-[14px]' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('shippingLogistics')}</span>
                        </div>
                        <span className={`text-xs font-black ${shippingEnabled ? 'text-slate-900' : 'text-slate-300'}`}>₹{totals.logistics.toFixed(2)}</span>
                    </div>
                    {shippingEnabled && (
                        <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">₹</span>
                            <input
                                type="number"
                                value={shippingAmount}
                                onChange={(e) => setShippingAmount(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-slate-800 font-bold text-xs outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 p-5 rounded-2xl bg-red-600/5 border border-red-600/10 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <p className="text-[9px] font-black text-red-600 uppercase tracking-widest text-center mb-1">{t('netReceivable')}</p>
                <p className="text-3xl font-black text-slate-900 text-center tracking-tighter">₹{totals.net.toLocaleString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                <button onClick={handlePrint} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl space-y-2 transition-all group shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all text-slate-400">
                        <Printer size={16} />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">{t('printInvoice')}</span>
                </button>
                <button className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl space-y-2 transition-all group shadow-sm hover:shadow-lg hover:-translate-y-0.5">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all text-slate-400">
                        <CreditCard size={16} />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em]">{t('saveDraft')}</span>
                </button>
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full mt-auto py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-sm shadow-2xl shadow-red-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
            >
                <CheckIcon size={20} />
                <span>{loading ? t('finalizing') : t('finalizePay')}</span>
                <ArrowRight size={20} className="ml-1" />
            </button>
        </div>
      </div>
    </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white rounded-3xl p-10 relative shadow-2xl border border-slate-200">
                <button onClick={() => setShowCustomerModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{t('selectCustomer')}</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">{t('selectCustomerDesc')}</p>

                <div className="grid grid-cols-2 gap-4 mb-8 max-h-60 overflow-y-auto pr-2">
                    {customers.map(c => (
                        <button
                            key={c._id}
                            onClick={() => { setCustomer(c); setShowCustomerModal(false); }}
                            className={`p-4 rounded-2xl border flex items-start space-x-3 text-left transition-all ${customer._id === c._id ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-red-500/20'}`}
                        >
                            <User size={18} className={customer._id === c._id ? 'text-white' : 'text-red-500'} />
                            <div>
                                <p className="font-black text-sm leading-none">{c.name}</p>
                                <p className={`text-[10px] font-bold mt-1 uppercase ${customer._id === c._id ? 'text-white/70' : 'text-slate-400'}`}>{c.phone}</p>
                            </div>
                        </button>
                    ))}
                    {customers.length === 0 && <p className="col-span-2 text-center text-slate-400 py-4 font-bold uppercase text-[10px] tracking-widest">{t('noCustomersFound')}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <button onClick={() => { setShowCustomerModal(false); setShowNewCustModal(true); }} className="px-6 py-4 bg-slate-900 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-800 transition-all flex items-center justify-center space-x-2">
                        <Plus size={14} />
                        <span>{t('registerCustomer')}</span>
                    </button>
                    <button onClick={() => setShowCustomerModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black">{t('close')}</button>
                </div>
            </div>
        </div>
      )}

      {/* New Customer Modal */}
      {showNewCustModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white rounded-3xl p-10 relative shadow-2xl border border-slate-200">
                <button onClick={() => setShowNewCustModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{t('createNewCustomer')}</h3>
                <p className="text-slate-500 text-sm font-medium mb-8">{t('registerCustomerDesc')}</p>

                <form onSubmit={handleCreateCustomer} className="space-y-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('businessClientName')}</label>
                        <input
                            required
                            type="text"
                            placeholder={t('businessPlaceholder')}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                            value={newCustForm.name}
                            onChange={(e) => setNewCustForm({...newCustForm, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('phoneNumber')}</label>
                            <input
                                required
                                type="text"
                                placeholder="+91 00000 00000"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                                value={newCustForm.phone}
                                onChange={(e) => setNewCustForm({...newCustForm, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('gstNumberOptional')}</label>
                            <input
                                type="text"
                                placeholder="GSTIN-0000"
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold"
                                value={newCustForm.gstNumber}
                                onChange={(e) => setNewCustForm({...newCustForm, gstNumber: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('address')}</label>
                        <textarea
                            placeholder={t('addressPlaceholder')}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold h-24"
                            value={newCustForm.address}
                            onChange={(e) => setNewCustForm({...newCustForm, address: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button type="button" onClick={() => setShowNewCustModal(false)} className="px-6 py-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-2xl tracking-widest uppercase text-[10px] font-black hover:bg-slate-100 transition-colors">{t('cancel')}</button>
                        <button type="submit" className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20">{t('registerAndSelect')}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 no-print">
            <div className="w-full max-w-md bg-white rounded-[40px] p-12 text-center relative shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-slate-100">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-500/20">
                    <CheckIcon size={48} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{t('billGenerated')}</h3>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">{t('transactionProcessed')} <span className="text-slate-800 font-bold">#{lastTransaction?.invoiceId}</span></p>

                <div className="space-y-4">
                    <button
                        onClick={() => { handlePrint(); }}
                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black tracking-widest uppercase text-xs flex items-center justify-center space-x-3 hover:bg-slate-800 transition-all shadow-xl"
                    >
                        <Printer size={20} />
                        <span>{t('printPrintout')}</span>
                    </button>
                    <button
                        onClick={handleDone}
                        className="w-full py-5 bg-slate-50 text-slate-500 rounded-3xl font-black tracking-widest uppercase text-xs hover:bg-slate-100 transition-all"
                    >
                        {t('closeNewBill')}
                    </button>
                </div>
            </div>
        </div>
      )}

      <style>{`
          @media print {
              .no-print {
                  display: none !important;
              }
              body * {
                  visibility: hidden;
              }
              .flex-1.p-10.space-y-8, .flex-1.p-10.space-y-8 * {
                  visibility: visible !important;
              }
              .flex-1.p-10.space-y-8 {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  padding: 40px !important;
                  border: none !important;
                  background: white !important;
              }
              .fixed, .w-96, .p-2.bg-white, .opacity-0, button, select, input, .no-print {
                  display: none !important;
              }
              select, input {
                  border: none !important;
                  background: none !important;
                  appearance: none !important;
                  visibility: visible !important;
                  color: black !important;
                  font-weight: bold !important;
              }
              .bg-slate-50 {
                  background-color: transparent !important;
                  border-bottom: 1px solid #eee !important;
              }
              .rounded-3xl, .rounded-2xl {
                  border-radius: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
              }
              h3, h4, p, span {
                  color: #000 !important;
              }
              .text-red-600, .text-amber-600 {
                  color: #000 !important;
                  font-weight: bold !important;
              }
              table {
                  border-collapse: collapse !important;
                  width: 100% !important;
              }
              th {
                  border-bottom: 2px solid #000 !important;
                  color: #000 !important;
              }
              td {
                  border-bottom: 1px solid #eee !important;
                  color: #000 !important;
              }
              .shadow-sm, .shadow-lg, .shadow-2xl {
                  box-shadow: none !important;
              }
          }
      `}</style>
    </>
  );
};

const CheckIcon = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default BillingPage;
