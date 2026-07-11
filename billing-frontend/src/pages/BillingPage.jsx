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
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import { offlineGet, offlinePost, offlineDelete } from '../utils/offlineApi';

const BillingPage = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('rts_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem('rts_billing_customer');
    return saved ? JSON.parse(saved) : { name: t('selectCustomerTitle'), phone: '', _id: '' };
  });
  const [customers, setCustomers] = useState(() => {
    const saved = localStorage.getItem('rts_customers');
    return saved ? JSON.parse(saved) : [];
  });
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
  const [invoiceHeader, setInvoiceHeader] = useState(() => {
    const saved = localStorage.getItem('rts_invoice_header');
    return saved ? JSON.parse(saved) : {
      companyName: 'RTS Plastics',
      storeSubtitle: 'Main Plastic Factory',
      address: 'Industrial Area 4, Chennai, Tamil Nadu, India',
      contact: 'Tel: +91 44 2250 1234 | Email: billing@rtsplastics.in',
      taxId: 'GSTIN: 33AAAAA1111A1Z1',
      bankName: 'State Bank of India',
      bankAccNo: '31234567890',
      bankIfsc: 'SBIN0001234',
      paymentTerms: 'Terms: Net 15 days'
    };
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
    fetchStoreDetails();
  }, []);

  const fetchStoreDetails = async () => {
    try {
      const result = await offlineGet(`${API_URL}/api/stores`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }, 'rts_stores');
      const data = result.data;
      if (user.storeId && data.length > 0) {
        const myStore = data.find(s => s._id === user.storeId);
        if (myStore) {
          const updatedHeader = {
            ...invoiceHeader,
            storeSubtitle: myStore.name,
            address: myStore.location || invoiceHeader.address
          };
          setInvoiceHeader(updatedHeader);
          localStorage.setItem('rts_invoice_header', JSON.stringify(updatedHeader));
        }
      }
    } catch (error) {
      console.error('Error fetching store details:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const result = await offlineGet(`${API_URL}/api/products`, {}, 'rts_products');
      setProducts(result.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const result = await offlineGet(`${API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }, 'rts_customers');
      const data = result.data;
      setCustomers(data);
      if (data.length > 0 && (customer.name === t('selectCustomerTitle') || customer._id === '')) {
          const defaultCust = data.find(c => c.name.toLowerCase().includes('thangavel')) || data[0];
          setCustomer(defaultCust);
          localStorage.setItem('rts_billing_customer', JSON.stringify(defaultCust));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const result = await offlinePost(`${API_URL}/api/customers`, newCustForm, {
        headers: { Authorization: `Bearer ${user.token}` }
      }, { type: 'create_customer' });
      const data = result.data;
      setCustomers([...customers, data]);
      setCustomer(data);
      setShowNewCustModal(false);
      setNewCustForm({ name: '', phone: '9876543210', address: '', gstNumber: '' });
      if (result.queued) {
        alert('Customer saved offline — will sync when internet returns');
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Error creating customer');
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
      const result = await offlinePost(`${API_URL}/api/transactions`, transactionData, {
        headers: { Authorization: `Bearer ${user.token}` }
      }, { type: 'create_transaction' });
      setLastTransaction(result.data || { ...transactionData, _id: result.data?._id || 'temp-' + Date.now() });
      setShowSuccessModal(true);
      if (result.queued) {
        // Save offline transaction to local transactions list too
        const cachedTxns = JSON.parse(localStorage.getItem('rts_transactions') || '[]');
        cachedTxns.unshift({ ...transactionData, _id: result.data._id, createdAt: new Date().toISOString(), _offline: true });
        localStorage.setItem('rts_transactions', JSON.stringify(cachedTxns));
      }
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

  const handleDeleteLastTransaction = async () => {
    if (!lastTransaction || !lastTransaction._id) return;
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await offlineDelete(`${API_URL}/api/transactions/${lastTransaction._id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      }, { type: 'delete_transaction' });
      
      // Update cached transactions in localStorage
      const cached = JSON.parse(localStorage.getItem('rts_transactions') || '[]');
      localStorage.setItem('rts_transactions', JSON.stringify(cached.filter(tx => tx._id !== lastTransaction._id)));
      
      alert('Bill deleted successfully');
      setShowSuccessModal(false);
      setLastTransaction(null);
      setBillItems([]);
    } catch (error) {
      alert('Error deleting bill');
    }
  };

  const getPrintConfig = () => {
    return {
      cols: 1,
      fontSize: '11px',
      thFontSize: '10px',
      paddingY: '3px',
      paddingX: '4px',
      headerMb: '8px',
      headerPb: '8px',
      infoGridMb: '8px',
      tableMb: '8px',
      customerCardPadding: '4px',
      showLogo: true,
      logoSize: '30px',
      footerMt: '16px',
      totalsContainerWidth: '180px',
      totalsRowSpacing: '3px',
      thinBorders: true,
      headerTitleSize: '15px',
      subtitleSize: '11px'
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
                    {(user.role === 'admin' || user.role === 'super_admin') && (
                        <button
                            onClick={handleDeleteLastTransaction}
                            className="w-full py-5 bg-rose-50 text-rose-600 rounded-3xl font-black tracking-widest uppercase text-xs flex items-center justify-center space-x-3 hover:bg-rose-100 transition-all border border-rose-200/50"
                        >
                            <Trash2 size={20} />
                            <span>{t('deleteInvoice') || 'Delete Invoice'}</span>
                        </button>
                    )}
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
                className="hidden print:block bg-white text-black font-sans"
                style={{ fontSize: printConfig.fontSize, width: '80mm', maxWidth: '80mm' }}
              >
                  <div className="invoice-container">
                      {/* Centered Receipt Header - Minimal Estimate Only */}
                      <div 
                        className="invoice-header text-center border-b border-dashed border-slate-400"
                        style={{ 
                          marginBottom: printConfig.headerMb,
                          paddingBottom: printConfig.headerPb
                        }}
                      >
                          <h2 className="font-black uppercase tracking-widest py-0.5" style={{ fontSize: '13px' }}>Estimate</h2>
                      </div>

                      {/* Compact Receipt Info */}
                      <div 
                        className="invoice-info text-left space-y-0.5 border-b border-dashed border-slate-400 pb-1.5"
                        style={{ marginBottom: printConfig.infoGridMb }}
                      >
                          <div><span className="font-bold">{t('customer')}:</span> {customer.name}</div>
                          {customer.phone && <div><span className="font-bold">{t('phoneNumber')}:</span> {customer.phone}</div>}
                          <div><span className="font-bold">{t('billedBy') || 'Billed By'}:</span> {user.name}</div>
                          <div><span className="font-bold">Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
                          <div><span className="font-bold">Invoice ID:</span> {invoiceId}</div>
                      </div>

                      {/* 4-Column Compact Table */}
                      <div className="invoice-table-wrapper" style={{ marginBottom: printConfig.tableMb }}>
                          <table className="w-full text-left print-table border-collapse">
                              <thead>
                                  <tr className="border-b border-dashed border-slate-400 invoice-table-hdr">
                                      <th className="py-1 px-0.5 font-black uppercase text-left" style={{ fontSize: printConfig.thFontSize, width: '45%' }}>{t('item')}</th>
                                      <th className="py-1 px-0.5 font-black uppercase text-center" style={{ fontSize: printConfig.thFontSize, width: '15%' }}>{t('qty')}</th>
                                      <th className="py-1 px-0.5 font-black uppercase text-right" style={{ fontSize: printConfig.thFontSize, width: '20%' }}>{t('price')}</th>
                                      <th className="py-1 px-0.5 font-black uppercase text-right" style={{ fontSize: printConfig.thFontSize, width: '20%' }}>{t('subtotalTable')}</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-dashed divide-slate-200">
                                  {billItems.map((item, idx) => (
                                      <tr key={idx} className="font-bold invoice-table-row">
                                          <td className="uppercase break-words leading-tight py-1 px-0.5" style={{ fontSize: printConfig.fontSize }}>
                                              {item.productName}
                                          </td>
                                          <td className="text-center py-1 px-0.5" style={{ fontSize: printConfig.fontSize }}>
                                              {Number(item.quantity).toFixed(2)} <span style={{ fontSize: '8px', textTransform: 'uppercase' }}>{item.unit}</span>
                                          </td>
                                          <td className="text-right py-1 px-0.5" style={{ fontSize: printConfig.fontSize }}>
                                              ₹{item.unitPrice.toFixed(2)}
                                          </td>
                                          <td className="text-right py-1 px-0.5" style={{ fontSize: printConfig.fontSize }}>
                                              {item.type === 'bought' ? '-' : ''}₹{item.subTotal.toFixed(2)}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>

                      {/* Totals Section */}
                      <div className="invoice-totals-wrapper border-t border-dashed border-slate-400 pt-2 flex justify-end">
                          <div className="totals-container" style={{ width: '100%', maxWidth: '200px' }}>
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
                                className="flex justify-between items-center font-black border-t border-dashed border-slate-200 pt-1 subtotal-row"
                                style={{ fontSize: printConfig.fontSize, marginBottom: printConfig.totalsRowSpacing }}
                              >
                                  <span className="uppercase">{t('subtotal')}</span>
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
                                className="flex justify-between items-center font-black border-t border-slate-900 pt-1 mt-1 net-row"
                                style={{ fontSize: `calc(${printConfig.fontSize} * 1.3)` }}
                              >
                                  <span className="uppercase">{t('netReceivable')}</span>
                                  <span>₹{totals.net.toFixed(2)}</span>
                              </div>
                          </div>
                      </div>


                  </div>
              </div>
          );
      })()}

      <style>{`
          @media print {
              html, body {
                  height: auto !important;
                  min-height: auto !important;
                  overflow: initial !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
              }
              @page {
                  size: 80mm auto;
                  margin: 0 !important;
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
                  width: 80mm !important;
                  max-width: 80mm !important;
                  display: block !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                  color: black !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
              }
              
              /* Safe left/right padding to prevent names getting cut off on 80mm roll */
              #printable-invoice .invoice-container {
                  padding-top: 1mm !important;
                  padding-bottom: 2mm !important;
                  padding-left: 6mm !important;
                  padding-right: 6mm !important;
                  box-sizing: border-box !important;
                  width: 80mm !important;
                  max-width: 80mm !important;
              }
              
              #printable-invoice {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }

              #printable-invoice .border-slate-400,
              #printable-invoice .border-slate-300,
              #printable-invoice .border-slate-200,
              #printable-invoice .border-slate-900,
              #printable-invoice .border-black,
              #printable-invoice .border-t,
              #printable-invoice .border-b {
                  border-color: #cbd5e1 !important;
                  border-width: 1px !important;
              }

              #printable-invoice .print-table {
                  width: 100% !important;
                  table-layout: fixed !important;
                  border-collapse: collapse !important;
                  border: none !important;
              }

              #printable-invoice .print-table th,
              #printable-invoice .print-table td {
                  border: none !important;
                  border-bottom: 1px dashed #cbd5e1 !important;
              }

              #printable-invoice .print-table th {
                  border-bottom: 1px dashed #475569 !important;
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
