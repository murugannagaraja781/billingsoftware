import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Recycle,
  Wallet,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  LayoutGrid,
  Search,
  Bell,
  Download,
  Trash2,
  Calendar
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user.token]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      await axios.delete(`${API_URL}/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchTransactions();
    } catch (error) {
      alert('Error deleting transaction');
    }
  };

  const totalSales = (transactions || []).reduce((sum, tx) => sum + (tx.totalNewAmount || 0), 0);
  const totalWaste = (transactions || []).reduce((sum, tx) => sum + (tx.totalWasteAmount || 0), 0);
  const netRevenue = (transactions || []).reduce((sum, tx) => sum + (tx.netAmount || 0), 0);

  const handleExport = () => {
    if (transactions.length === 0) return alert(t('noDataToExport'));

    // Create CSV content
    const headers = ['Date', 'Invoice ID', 'Customer', 'Phone', 'Sales (₹)', 'Scrap (₹)', 'Net (₹)'];
    const rows = transactions.map(tx => [
      new Date(tx.createdAt).toLocaleDateString(),
      tx.invoiceId,
      tx.customerName,
      tx.customerPhone,
      tx.totalNewAmount,
      tx.totalWasteAmount,
      tx.netAmount
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Industrial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    {
      label: t('totalSalesNew'),
      value: `₹${totalSales.toLocaleString()}`,
      icon: TrendingUp,
      color: 'blue',
      trend: t('live'),
      isUp: true
    },
    {
      label: t('wasteCollected'),
      value: `₹${totalWaste.toLocaleString()}`,
      icon: Recycle,
      color: 'emerald',
      trend: t('live'),
      isUp: true
    },
    {
      label: t('netRevenue'),
      value: `₹${netRevenue.toLocaleString()}`,
      icon: Wallet,
      color: 'amber',
      trend: t('live'),
      isUp: true
    },
    {
      label: t('activeStores'),
      value: t('mainUnit'),
      icon: Activity,
      color: 'rose',
      trend: t('live'),
      isUp: true
    }
  ];

  const recentActivity = transactions.slice(0, 5).map(tx => ({
    id: tx._id,
    type: tx.totalNewAmount > 0 ? 'sale' : 'scrap',
    title: tx.customerName,
    desc: `${tx.items.length} items processed - Total ₹${tx.netAmount}`,
    time: new Date(tx.createdAt).toLocaleDateString() + ' ' + new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    color: tx.totalNewAmount > 0 ? 'blue' : 'emerald'
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-main)] px-4 md:px-10 py-6 md:py-8 space-y-6 md:space-y-10 transition-colors duration-500">
      {/* Top Header - Hidden on mobile as it is in MainLayout */}
      <div className="hidden md:flex justify-between items-center">
        <div className="relative group w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500" size={18} />
            <input
                type="text"
                placeholder={t('searchAnalytics')}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-red-500/10 text-slate-700 text-sm font-medium transition-all shadow-sm"
            />
        </div>
        <div className="flex items-center space-x-4">
            <button
                onClick={() => window.location.href='/billing'}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-red-600/20"
            >
                <TrendingUp size={18} />
                <span className="text-sm">{t('newInvoice')}</span>
            </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
        <div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">{t('executiveOverview')}</h2>
            <p className="text-[var(--text-secondary)] mt-1 md:mt-2 text-xs md:text-base font-medium">{t('overviewDesc')}</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
            <button className="btn-secondary space-x-2 py-2 px-4 shadow-none">
                <Calendar size={18} className="text-slate-500" />
                <span className="text-sm">{t('last30Days')}</span>
            </button>
            <button onClick={handleExport} className="btn-secondary space-x-2 py-2 px-4 shadow-none hover:bg-red-50 hover:text-red-600 group">
                <Download size={18} className="text-slate-500 group-hover:text-red-500" />
                <span className="text-sm">{t('exportReport')}</span>
            </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="glass-card p-4 md:p-8 group hover:border-white/10 transition-all cursor-default">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-500 transition-colors`}>
                <stat.icon size={18} className="md:w-[22px] md:h-[22px]" />
              </div>
              <div className={`hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${stat.isUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                <span>{stat.trend}</span>
              </div>
            </div>
            <p className="text-[9px] md:text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-2 md:mb-3">{stat.label}</p>
            <p className="text-lg md:text-2xl font-black text-[var(--text-primary)]">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Activity and Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 space-y-4 md:space-y-0">
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">{t('salesVsRecyclingTrend')}</h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1">{t('trendDesc')}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('billing')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase">{t('scrap')}</span>
                    </div>
                </div>
            </div>

            {/* Visual placeholder for chart */}
            <div className="h-64 flex items-end justify-between px-2 pt-10">
                {[45, 60, 40, 80, 50, 70, 55].map((h, i) => (
                    <div key={i} className="flex flex-col items-center group flex-1">
                        <div className="relative w-full px-2 flex flex-col items-center">
                            <div className="w-10 bg-slate-800 rounded-t-lg absolute bottom-0"></div>
                            <div
                                style={{ height: `${h}%` }}
                                className="w-10 bg-red-600 rounded-t-lg z-10 hover:bg-red-500 transition-all cursor-pointer relative"
                            >
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/10 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">₹{h}k</div>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase mt-4 tracking-tighter">
                            {t(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'][i])}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-8">
            <h3 className="text-xl font-bold text-white mb-8">{t('recentActivity')}</h3>
            <div className="space-y-6">
                {recentActivity.map((act) => (
                    <div key={act.id} className="flex items-start space-x-4 group">
                        <div className={`mt-1 p-2 rounded-xl bg-${act.color}-500/10 text-${act.color}-500 group-hover:bg-${act.color}-500/20 transition-colors`}>
                            <Activity size={16} />
                        </div>
                        <div className="flex-1 pb-4 border-b border-slate-100 last:border-0 relative">
                            <h4 className="text-[13px] font-bold text-[var(--text-primary)] group-hover:text-red-500 transition-colors uppercase">{act.title}</h4>
                            <p className="text-[12px] text-slate-500 mt-0.5 font-medium">{act.desc}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 leading-none">{act.time}</p>

                            {(user.role === 'admin' || user.role === 'super_admin') && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(act.id); }}
                                    className="absolute right-0 top-0 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <button
                onClick={() => setShowAllTransactions(true)}
                className="w-full mt-6 py-3 bg-slate-900/50 hover:bg-slate-900 border border-white/5 rounded-2xl text-[11px] font-bold text-slate-400 uppercase tracking-widest transition-all"
            >
                {t('viewAllActivity')}
            </button>
        </div>
      </div>

      {/* Full Transaction History Modal */}
      {showAllTransactions && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl bg-white rounded-[32px] p-8 md:p-12 relative shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                <button
                    onClick={() => setShowAllTransactions(false)}
                    className="absolute top-8 right-8 text-slate-400 hover:text-red-500 transition-colors"
                >
                    <XIcon size={24} />
                </button>
                <div className="mb-8">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('billingHistory') || 'Billing History'}</h3>
                    <p className="text-slate-500 font-medium">{t('billingHistoryDesc') || 'Manage and view all generated invoices'}</p>
                </div>

                <div className="space-y-4">
                    {transactions.map((tx) => (
                        <div key={tx._id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 group">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{tx.customerName}</h4>
                                    <div className="flex items-center space-x-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                        <span>#{tx.invoiceId}</span>
                                        <span>•</span>
                                        <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-8 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('netAmount')}</p>
                                    <p className="text-lg font-black text-slate-900">₹{tx.netAmount.toLocaleString()}</p>
                                </div>

                                {(user.role === 'admin' || user.role === 'super_admin') && (
                                    <button
                                        onClick={() => handleDelete(tx._id)}
                                        className="p-3 bg-white hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl border border-slate-100 transition-all shadow-sm"
                                        title={t('delete')}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const XIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

export default Dashboard;
