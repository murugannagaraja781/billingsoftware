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
  const [newCustForm, setNewCustForm] = useState({ name: '', phone: '9876543210', address: '', gstNumber: '' });
  const [billItems, setBillItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [invoiceId] = useState(`TRX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [invoiceHeader, setInvoiceHeader] = useState({
    companyName: 'RTS Plastics',
    storeSubtitle: 'Main Plastic Factory',
    address: 'Industrial Area 4, Chennai, Tamil Nadu, India',
    contact: 'Tel: +91 44 2250 1234 | Email: billing@rtsplastics.in',
    taxId: 'GSTIN: 33AAAAA1111A1Z1',
    bankName: 'State Bank of India',
    bankAccNo: '31234567890',
    bankIfsc: 'SBIN0001234',
    paymentTerms: 'Terms: Net 15 days'
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchStoreDetails();
  }, []);

  const fetchStoreDetails = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (user.storeId && data.length > 0) {
        const myStore = data.find(s => s._id === user.storeId);
        if (myStore) {
          setInvoiceHeader(prev => ({
            ...prev,
            storeSubtitle: myStore.name,
            address: myStore.location || prev.address
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
    }
  };

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
      if (data.length > 0 && (customer.name === t('selectCustomerTitle') || customer._id === '')) {
          const defaultCust = data.find(c => c.name.toLowerCase().includes('thangavel')) || data[0];
          setCustomer(defaultCust);
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
      setNewCustForm({ name: '', phone: '9876543210', address: '', gstNumber: '' });
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
    if (!customer.name || !customer.name.trim() || billItems.length === 0) return alert(t('fillDetailsError'));
    
    // Check if customer is just placeholder and fallback to "Thangavel"
    let activeCustomer = customer;
    if (customer.name === t('selectCustomerTitle')) {
        const defaultCust = customers.find(c => c.name.toLowerCase().includes('thangavel')) || customers[0];
        if (defaultCust) {
            activeCustomer = defaultCust;
            setCustomer(defaultCust);
        } else {
            return alert("Please select a customer first.");
        }
    }

    // Check if any product is not selected or quantity is invalid
    for (const item of billItems) {
        if (!item.productId) {
            return alert("Please select a product / material for all rows.");
        }
        if (item.quantity <= 0) {
            return alert(`Please enter a quantity greater than 0 for ${item.productName || 'all items'}.`);
        }
    }

    setLoading(true);
    try {
      const transactionData = {
        customerName: activeCustomer.name,
        customerPhone: activeCustomer.phone,
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
      console.error("Bill generation error:", error);
      const errMsg = error.response?.data?.message || error.message;
      alert(`${t('errorGeneratingBill')}: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setBillItems([]);
    setShowSuccessModal(false);
    // Optionally regenerate invoice ID here if needed
  };

  const getPrintConfig = () => {
    const len = billItems.length;
    const cols = 1;
    let fontSize = '11px';
    let thFontSize = '9px';
    let paddingY = '8px';
    let paddingX = '8px';
    let headerMb = '16px';
    let headerPb = '16px';
    let infoGridMb = '16px';
    let tableMb = '16px';
    let customerCardPadding = '12px';
    let showLogo = true;
    let logoSize = '48px';
    let footerMt = '40px';
    let totalsContainerWidth = '224px';
    let totalsRowSpacing = '8px';
    let thinBorders = false;
    let headerTitleSize = '24px';
    let subtitleSize = '14px';

    if (len > 500) {
      fontSize = '3.5px';
      thFontSize = '3.2px';
      paddingY = '0.2px';
      paddingX = '1px';
      headerMb = '2px';
      headerPb = '2px';
      infoGridMb = '2px';
      tableMb = '2px';
      customerCardPadding = '2px';
      showLogo = false;
      footerMt = '4px';
      totalsContainerWidth = '140px';
      totalsRowSpacing = '1px';
      thinBorders = true;
      headerTitleSize = '10px';
      subtitleSize = '7px';
    } else if (len > 250) {
      fontSize = '4.5px';
      thFontSize = '4.0px';
      paddingY = '0.4px';
      paddingX = '2px';
      headerMb = '4px';
      headerPb = '4px';
      infoGridMb = '4px';
      tableMb = '4px';
      customerCardPadding = '4px';
      showLogo = false;
      footerMt = '8px';
      totalsContainerWidth = '160px';
      totalsRowSpacing = '2px';
      thinBorders = true;
      headerTitleSize = '12px';
      subtitleSize = '8px';
    } else if (len > 120) {
      fontSize = '6.0px';
      thFontSize = '5.5px';
      paddingY = '0.8px';
      paddingX = '3px';
      headerMb = '6px';
      headerPb = '6px';
      infoGridMb = '6px';
      tableMb = '6px';
      customerCardPadding = '6px';
      showLogo = false;
      footerMt = '12px';
      totalsContainerWidth = '180px';
      totalsRowSpacing = '3px';
      thinBorders = true;
      headerTitleSize = '14px';
      subtitleSize = '9px';
    } else if (len > 50) {
      fontSize = '8.0px';
      thFontSize = '7.5px';
      paddingY = '1.5px';
      paddingX = '4px';
      headerMb = '8px';
      headerPb = '8px';
      infoGridMb = '8px';
      tableMb = '8px';
      customerCardPadding = '8px';
      showLogo = false;
      footerMt = '16px';
      totalsContainerWidth = '200px';
      totalsRowSpacing = '4px';
      thinBorders = true;
      headerTitleSize = '18px';
      subtitleSize = '11px';
    } else if (len > 25) {
      fontSize = '9.5px';
      thFontSize = '9.0px';
      paddingY = '3.0px';
      paddingX = '6px';
      headerMb = '12px';
      headerPb = '12px';
      infoGridMb = '12px';
      tableMb = '12px';
      customerCardPadding = '10px';
      showLogo = true;
      logoSize = '32px';
      footerMt = '24px';
      totalsContainerWidth = '220px';
      totalsRowSpacing = '6px';
      thinBorders = false;
      headerTitleSize = '20px';
      subtitleSize = '12px';
    } else {
      fontSize = '12px';
      thFontSize = '10px';
      paddingY = '6px';
      paddingX = '8px';
      headerMb = '16px';
      headerPb = '16px';
      infoGridMb = '16px';
      tableMb = '16px';
      customerCardPadding = '12px';
      showLogo = true;
      logoSize = '44px';
      footerMt = '32px';
      totalsContainerWidth = '224px';
      totalsRowSpacing = '8px';
      thinBorders = false;
      headerTitleSize = '24px';
      subtitleSize = '14px';
    }

    return {
      cols,
      fontSize,
      thFontSize,
      paddingY,
      paddingX,
      headerMb,
      headerPb,
      infoGridMb,
      tableMb,
      customerCardPadding,
      showLogo,
      logoSize,
      footerMt,
      totalsContainerWidth,
      totalsRowSpacing,
      thinBorders,
      headerTitleSize,
      subtitleSize
    };
  };

  const chunkArray = (arr, numChunks) => {
    if (numChunks <= 1) return [arr];
    const chunks = [];
    const itemsPerChunk = Math.ceil(arr.length / numChunks);
    for (let i = 0; i < numChunks; i++) {
      const chunk = arr.slice(i * itemsPerChunk, (i + 1) * itemsPerChunk);
      if (chunk.length > 0) {
        chunks.push(chunk);
      }
    }
    return chunks;
  };

  const getA4CompactClass = () => {
    const len = billItems.length;
    if (len > 75) return 'a4-nano-compact';
    if (len > 50) return 'a4-micro-compact';
    if (len > 25) return 'a4-ultra-compact';
    if (len > 10) return 'a4-compact';
    return '';
  };

  return (
    <>
      <div className="flex flex-col md:flex-row bg-[var(--bg-main)] min-h-screen transition-colors duration-500 text-[var(--text-main)] pb-24 md:pb-0 no-print">
      {/* Middle Section: Bill Editor - Optimized for Space */}
      <div className="flex-1 p-4 md:p-6 space-y-4 max-w-[1200px] md:border-r border-slate-200 overflow-y-auto">

        {/* Compact Premium Transaction Header - Hidden Header info on mobile if redundant */}
        <div className="relative bg-slate-900 rounded-2xl md:rounded-[30px] p-4 md:p-6 overflow-hidden shadow-xl shadow-slate-900/10 border border-slate-800 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[60px] -mr-32 -mt-32"></div>

            <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex flex-col md:flex-row items-start md:items-center md:space-x-6 space-y-2 md:space-y-0">
                    <div>
                        <p className="text-[8px] md:text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">{t('liveTransaction')}</p>
                        <input
                            type="text"
                            value={customer.name === t('selectCustomerTitle') ? '' : customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            placeholder={t('selectCustomerTitle')}
                            className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-red-500 text-xl md:text-2xl font-black text-white tracking-tighter leading-none focus:outline-none w-full max-w-[250px] transition-all pb-1"
                        />
                    </div>

                    <div className="flex items-center space-x-3 md:space-x-4 md:pl-6 md:border-l border-slate-700">
                        <div className="flex items-center space-x-2 text-slate-400">
                            <User size={12} className="text-red-500 md:w-[14px] md:h-[14px]" />
                            <input
                                type="text"
                                value={customer.phone}
                                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                                placeholder={t('phoneNumber')}
                                className="bg-transparent border-b border-dashed border-slate-700 hover:border-slate-500 focus:border-red-500 text-[10px] md:text-[11px] font-bold text-slate-200 tracking-tight focus:outline-none w-28 transition-all pb-0.5"
                            />
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
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-base font-black text-[var(--text-primary)] tracking-tighter uppercase">{t('orderSummary')}</h4>
          <button 
            onClick={() => setShowSettingsModal(true)} 
            className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-all"
          >
            Edit Header
          </button>
        </div>

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

      {/* Invoice Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 no-print">
            <div className="w-full max-w-lg bg-white rounded-3xl p-8 md:p-10 relative shadow-2xl border border-slate-200">
                <button onClick={() => setShowSettingsModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{t('invoicePrintDetails')}</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">{t('customizePrintDesc')}</p>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('companyName')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-xs"
                                value={invoiceHeader.companyName}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, companyName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('branchSubtitle')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-xs"
                                value={invoiceHeader.storeSubtitle}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, storeSubtitle: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('address')}</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-xs"
                            value={invoiceHeader.address}
                            onChange={(e) => setInvoiceHeader({...invoiceHeader, address: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('contactDetails')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-xs"
                                value={invoiceHeader.contact}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, contact: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('taxIdGstin')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-xs"
                                value={invoiceHeader.taxId}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, taxId: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-2"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('bankDetailsPrint')}</p>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 col-span-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('bankName')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-[11px]"
                                value={invoiceHeader.bankName}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, bankName: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1 col-span-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('accountNo')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-[11px]"
                                value={invoiceHeader.bankAccNo}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, bankAccNo: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1 col-span-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('ifscCode')}</label>
                            <input
                                type="text"
                                className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-[11px]"
                                value={invoiceHeader.bankIfsc}
                                onChange={(e) => setInvoiceHeader({...invoiceHeader, bankIfsc: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('termsNote')}</label>
                        <input
                            type="text"
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 font-bold text-xs"
                            value={invoiceHeader.paymentTerms}
                            onChange={(e) => setInvoiceHeader({...invoiceHeader, paymentTerms: e.target.value})}
                        />
                    </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={() => setShowSettingsModal(false)} 
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl tracking-widest uppercase text-[10px] font-black shadow-lg shadow-red-600/20"
                    >
                        {t('applyDetails')}
                    </button>
                </div>
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



      {/* Printable Invoice - Hidden in UI, Visible in Print */}
      {(() => {
          const printConfig = getPrintConfig();
          return (
              <div 
                id="printable-invoice" 
                className={`hidden print:block bg-white text-black font-sans ${getA4CompactClass()}`}
                style={{ fontSize: printConfig.fontSize }}
              >
                  <div className="invoice-container">
                      <div 
                        className="invoice-header flex justify-between items-start border-b border-slate-900"
                        style={{ 
                          marginBottom: printConfig.headerMb,
                          paddingBottom: printConfig.headerPb
                        }}
                      >
                          <div className="flex items-center space-x-4">
                              {printConfig.showLogo && (
                                  <div className="bg-white overflow-hidden logo-wrapper" style={{ width: printConfig.logoSize, height: printConfig.logoSize }}>
                                      <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                                  </div>
                              )}
                              <div>
                                  <h1 className="font-black uppercase tracking-tighter" style={{ fontSize: printConfig.headerTitleSize }}>{invoiceHeader.companyName}</h1>
                                  <p className="font-bold text-slate-600 uppercase tracking-widest leading-tight store-subtitle" style={{ fontSize: printConfig.subtitleSize }}>{invoiceHeader.storeSubtitle}</p>
                                  <p className="text-slate-500 leading-tight store-address" style={{ fontSize: `calc(${printConfig.fontSize} * 0.9)`, marginTop: '4px' }}>
                                      {invoiceHeader.address} | {invoiceHeader.contact}<br />
                                      {invoiceHeader.taxId}
                                  </p>
                              </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-0.5" style={{ fontSize: printConfig.fontSize }}>
                              <h2 className="font-black uppercase tracking-tight mb-1" style={{ fontSize: `calc(${printConfig.headerTitleSize} * 0.8)` }}>{t('printInvoice')}</h2>
                              <p className="font-bold invoice-meta-row"><span className="text-slate-400 uppercase tracking-wider text-[8px]">Invoice No:</span> #{invoiceId}</p>
                              <p className="font-bold invoice-meta-row"><span className="text-slate-400 uppercase tracking-wider text-[8px]">Date:</span> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                              <p className="font-bold invoice-meta-row"><span className="text-slate-400 uppercase tracking-wider text-[8px]">Due Date:</span> {new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          </div>
                      </div>

                      <div 
                        className="invoice-info-grid grid grid-cols-2 gap-4"
                        style={{ marginBottom: printConfig.infoGridMb }}
                      >
                          <div className="customer-card bg-slate-50 rounded-lg border border-slate-100" style={{ padding: printConfig.customerCardPadding }}>
                              <p className="font-black uppercase text-slate-400 tracking-widest" style={{ fontSize: `calc(${printConfig.fontSize} * 0.75)`, marginBottom: '2px' }}>{t('customer')}</p>
                              <p className="font-black customer-name" style={{ fontSize: `calc(${printConfig.fontSize} * 1.15)` }}>{customer.name}</p>
                              <p className="font-bold text-slate-600 customer-phone" style={{ fontSize: printConfig.fontSize }}>{customer.phone}</p>
                              {customer.address && <p className="text-slate-500 leading-tight customer-address" style={{ fontSize: `calc(${printConfig.fontSize} * 0.9)`, marginTop: '2px' }}>{customer.address}</p>}
                          </div>
                          <div className="billed-by-card flex flex-col justify-end text-right space-y-1">
                              <p className="font-black uppercase text-slate-400 tracking-widest" style={{ fontSize: `calc(${printConfig.fontSize} * 0.75)` }}>{t('billedBy') || 'Billed By'}</p>
                              <p className="font-bold uppercase" style={{ fontSize: printConfig.fontSize }}>{user.name}</p>
                          </div>
                      </div>

                      <div className="invoice-table-wrapper" style={{ marginBottom: printConfig.tableMb }}>
                          <table className="w-full text-left print-table">
                              <thead>
                                  <tr className="border-b border-slate-900 bg-slate-50 invoice-table-hdr">
                                      <th className="py-1 px-1 font-black uppercase tracking-widest text-center" style={{ fontSize: printConfig.thFontSize, width: '8%' }}>Item #</th>
                                      <th className="py-1 px-1 font-black uppercase tracking-widest text-left" style={{ fontSize: printConfig.thFontSize, width: '42%' }}>{t('item')}</th>
                                      <th className="py-1 px-1 font-black uppercase tracking-widest text-center" style={{ fontSize: printConfig.thFontSize, width: '10%' }}>{t('qty')}</th>
                                      <th className="py-1 px-1 font-black uppercase tracking-widest text-center" style={{ fontSize: printConfig.thFontSize, width: '10%' }}>{t('unit')}</th>
                                      <th className="py-1 px-1 font-black uppercase tracking-widest text-right" style={{ fontSize: printConfig.thFontSize, width: '15%' }}>{t('price')}</th>
                                      <th className="py-1 px-1 font-black uppercase tracking-widest text-right" style={{ fontSize: printConfig.thFontSize, width: '15%' }}>{t('subtotalTable')}</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {billItems.map((item, idx) => (
                                      <tr key={idx} className="font-bold border-b border-slate-50 invoice-table-row">
                                          <td className="text-center" style={{ padding: `${printConfig.paddingY} ${printConfig.paddingX}` }}>{idx + 1}</td>
                                          <td className="uppercase break-words leading-tight" style={{ padding: `${printConfig.paddingY} ${printConfig.paddingX}` }}>{item.productName}</td>
                                          <td className="text-center" style={{ padding: `${printConfig.paddingY} ${printConfig.paddingX}` }}>{item.quantity}</td>
                                          <td className="text-center uppercase" style={{ padding: `${printConfig.paddingY} ${printConfig.paddingX}` }}>{item.unit}</td>
                                          <td className="text-right" style={{ padding: `${printConfig.paddingY} ${printConfig.paddingX}` }}>₹{item.unitPrice.toFixed(2)}</td>
                                          <td className="text-right" style={{ padding: `${printConfig.paddingY} ${printConfig.paddingX}` }}>
                                              {item.type === 'bought' ? '-' : ''}₹{item.subTotal.toFixed(2)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      <div className="invoice-totals-wrapper flex justify-between items-start pt-2 border-t border-slate-900">
                          {/* Bottom Left: Payment Details */}
                          <div className="payment-details-wrapper text-left text-slate-600 font-bold" style={{ fontSize: `calc(${printConfig.fontSize} * 0.95)`, maxWidth: '280px', marginTop: '4px' }}>
                              <p className="font-black uppercase tracking-widest text-slate-900" style={{ fontSize: `calc(${printConfig.fontSize} * 0.85)`, marginBottom: '4px' }}>Payment/Bank Details:</p>
                              <p className="font-semibold text-slate-700">Bank Name: {invoiceHeader.bankName}</p>
                              <p className="font-semibold text-slate-700">A/C No: {invoiceHeader.bankAccNo}</p>
                              <p className="font-semibold text-slate-700">IFSC: {invoiceHeader.bankIfsc}</p>
                              <p className="text-slate-500 italic mt-1 font-medium">{invoiceHeader.paymentTerms}</p>
                          </div>

                          {/* Bottom Right: Totals */}
                          <div className="totals-container" style={{ width: printConfig.totalsContainerWidth }}>
                              <div 
                                className="flex justify-between items-center font-bold uppercase text-slate-500 total-row"
                                style={{ fontSize: `calc(${printConfig.fontSize} * 0.95)`, marginBottom: printConfig.totalsRowSpacing }}
                              >
                                  <span>{t('totalSales')}</span>
                                  <span>₹{totals.totalNew.toFixed(2)}</span>
                              </div>
                              <div 
                                className="flex justify-between items-center font-bold uppercase text-slate-500 total-row"
                                style={{ fontSize: `calc(${printConfig.fontSize} * 0.95)`, marginBottom: printConfig.totalsRowSpacing }}
                              >
                                  <span>{t('totalScrapBuy')}</span>
                                  <span>-₹{totals.totalWaste.toFixed(2)}</span>
                              </div>
                              <div 
                                className="flex justify-between items-center font-black border-t border-slate-100 pt-1 subtotal-row"
                                style={{ fontSize: printConfig.fontSize, marginBottom: printConfig.totalsRowSpacing }}
                              >
                                  <span className="uppercase tracking-widest">{t('subtotal')}</span>
                                  <span>₹{totals.subtotal.toFixed(2)}</span>
                              </div>
                              {gstEnabled && (
                                  <div 
                                    className="flex justify-between items-center font-bold uppercase text-slate-500 gst-row"
                                    style={{ fontSize: `calc(${printConfig.fontSize} * 0.95)`, marginBottom: printConfig.totalsRowSpacing }}
                                  >
                                      <span>{t('taxes')}</span>
                                      <span>₹{totals.tax.toFixed(2)}</span>
                                  </div>
                              )}
                              {shippingEnabled && (
                                  <div 
                                    className="flex justify-between items-center font-bold uppercase text-slate-500 shipping-row"
                                    style={{ fontSize: `calc(${printConfig.fontSize} * 0.95)`, marginBottom: printConfig.totalsRowSpacing }}
                                  >
                                      <span>{t('shippingLogistics')}</span>
                                      <span>₹{totals.logistics.toFixed(2)}</span>
                                  </div>
                              )}
                              <div 
                                className="flex justify-between items-center font-black border-t border-black pt-1 mt-1 net-row"
                                style={{ fontSize: `calc(${printConfig.fontSize} * 1.35)` }}
                              >
                                  <span className="uppercase tracking-tighter">{t('netReceivable')}</span>
                                  <span>₹{totals.net.toFixed(2)}</span>
                              </div>
                          </div>
                      </div>

                      <div 
                        className="invoice-footer border-t border-slate-100 text-center"
                        style={{ marginTop: printConfig.footerMt, paddingTop: `calc(${printConfig.footerMt} * 0.5)` }}
                      >
                          <p className="font-black uppercase tracking-[0.2em] text-slate-400 italic" style={{ fontSize: `calc(${printConfig.fontSize} * 0.8)` }}>Thank you for choosing {invoiceHeader.companyName}</p>
                      </div>
                  </div>
              </div>
          );
      })()}

      <style>{`
          @media print {
              html, body {
                  height: 100% !important;
                  overflow: hidden !important;
                  margin: 0 !important;
                  padding: 0 !important;
              }
              @page {
                  size: A4;
                  margin: 0.2cm !important;
              }
              body * {
                  visibility: hidden !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              #printable-invoice, #printable-invoice * {
                  visibility: visible !important;
              }
              #printable-invoice {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  display: block !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                  color: black !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
              }
              
              /* Remove extra padding around invoice container inside 0.2cm margin, but leave top spacing */
              #printable-invoice .invoice-container {
                  padding-top: 15px !important;
                  padding-bottom: 0 !important;
                  padding-left: 0 !important;
                  padding-right: 0 !important;
              }
              
              /* Force webkit and standard browsers to render background colors in print */
              #printable-invoice {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }

              /* Thin borders in print */
              #printable-invoice .border-slate-900,
              #printable-invoice .border-black,
              #printable-invoice .border-b-2,
              #printable-invoice .border-t-2,
              #printable-invoice .border-t,
              #printable-invoice .border-b {
                  border-color: #cbd5e1 !important;
                  border-width: 1px !important;
              }

              /* Print table properties to maintain compact columns & spreadsheet grid look */
              #printable-invoice .print-table {
                  width: 100% !important;
                  max-width: 600px !important;
                  table-layout: fixed !important;
                  margin-left: 0 !important;
                  margin-right: auto !important;
                  border-collapse: collapse !important;
                  border: 1px solid #cbd5e1 !important;
              }

              #printable-invoice .print-table th,
              #printable-invoice .print-table td {
                  border: 1px solid #cbd5e1 !important;
              }

              /* A4 Dynamic Scaling to fit up to 100 items on a single page */
              
              /* Level 1: 11 - 25 items */
              .a4-compact {
                  font-size: 9.5px !important;
              }
              .a4-compact td, .a4-compact th {
                  padding-top: 2px !important;
                  padding-bottom: 2px !important;
                  padding-left: 4px !important;
                  padding-right: 4px !important;
              }
              .a4-compact .mb-4, .a4-compact .mb-6 {
                  margin-bottom: 8px !important;
              }
              .a4-compact .mt-10 {
                  margin-top: 15px !important;
              }
              .a4-compact h1 {
                  font-size: 18px !important;
              }
              .a4-compact .p-6 {
                  padding: 10px !important;
              }

              /* Level 2: 26 - 50 items */
              .a4-ultra-compact {
                  font-size: 8px !important;
              }
              .a4-ultra-compact td, .a4-ultra-compact th {
                  padding-top: 1px !important;
                  padding-bottom: 1px !important;
                  padding-left: 2px !important;
                  padding-right: 2px !important;
              }
              .a4-ultra-compact .mb-4, .a4-ultra-compact .mb-6 {
                  margin-bottom: 4px !important;
              }
              .a4-ultra-compact .mt-10 {
                  margin-top: 10px !important;
              }
              .a4-ultra-compact h1 {
                  font-size: 14px !important;
              }
              .a4-ultra-compact .p-6 {
                  padding: 5px !important;
              }

              /* Level 3: 51 - 75 items */
              .a4-micro-compact {
                  font-size: 6.8px !important;
              }
              .a4-micro-compact td, .a4-micro-compact th {
                  padding-top: 0.5px !important;
                  padding-bottom: 0.5px !important;
                  padding-left: 1px !important;
                  padding-right: 1px !important;
                  line-height: 1.1 !important;
              }
              .a4-micro-compact .mb-4, .a4-micro-compact .mb-6 {
                  margin-bottom: 2px !important;
              }
              .a4-micro-compact .mt-10 {
                  margin-top: 5px !important;
              }
              .a4-micro-compact h1 {
                  font-size: 10px !important;
              }
              .a4-micro-compact .p-6 {
                  padding: 2px !important;
              }
              .a4-micro-compact .logo-wrapper {
                  display: none !important;
              }
              .a4-micro-compact .customer-card {
                  padding: 4px !important;
              }

              /* Level 4: 76 - 100+ items */
              .a4-nano-compact {
                  font-size: 5.5px !important;
              }
              .a4-nano-compact td, .a4-nano-compact th {
                  padding-top: 0.1px !important;
                  padding-bottom: 0.1px !important;
                  padding-left: 0.5px !important;
                  padding-right: 0.5px !important;
                  line-height: 1.0 !important;
              }
              .a4-nano-compact .mb-4, .a4-nano-compact .mb-6 {
                  margin-bottom: 1px !important;
              }
              .a4-nano-compact .mt-10 {
                  margin-top: 1px !important;
              }
              .a4-nano-compact h1 {
                  font-size: 8px !important;
                  line-height: 1.0 !important;
              }
              .a4-nano-compact h2 {
                  font-size: 7px !important;
                  line-height: 1.0 !important;
              }
              .a4-nano-compact .p-6 {
                  padding: 0px !important;
              }
              .a4-nano-compact .logo-wrapper {
                  display: none !important;
              }
              .a4-nano-compact .customer-card {
                  padding: 2px !important;
              }
              .a4-nano-compact .grid {
                  gap: 4px !important;
              }
              .a4-nano-compact .totals-container {
                  width: 140px !important;
              }
              .a4-nano-compact .totals-container > * + * {
                  margin-top: 1px !important;
              }
              .a4-nano-compact .net-row {
                  font-size: 7px !important;
                  margin-top: 2px !important;
                  padding-top: 2px !important;
              }
              
              .no-print, .fixed, button, select, input {
                  display: none !important;
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
