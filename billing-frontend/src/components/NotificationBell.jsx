import React, { useState, useEffect } from 'react';
import { Bell, X, Receipt, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { notifications, unreadCount, markAllRead, clearNotifications } = useSocket();
    const [showPanel, setShowPanel] = useState(false);

    // Only show for admin/super_admin
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return null;

    // Request browser notification permission
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (diff < 60) return t('justNow');
        if (diff < 3600) return `${Math.floor(diff/60)}${t('minAgo')}`;
        if (diff < 86400) return `${Math.floor(diff/3600)}${t('hoursAgo')}`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    return (
        <>
            {/* Bell Icon - Fixed Position */}
            <div className="fixed top-4 right-4 z-[100]">
                <button
                    onClick={() => { setShowPanel(!showPanel); if (!showPanel) markAllRead(); }}
                    className="relative p-3 bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                >
                    <Bell size={20} className={unreadCount > 0 ? 'text-red-600 animate-bounce' : 'text-slate-500'} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-600/30">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notification Panel */}
            {showPanel && (
                <div className="fixed top-16 right-4 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] overflow-hidden animate-in">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center space-x-2">
                            <Bell size={16} className="text-red-600" />
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">{t('notifications')}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearNotifications}
                                    className="text-[9px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider"
                                >
                                    {t('clearAll')}
                                </button>
                            )}
                            <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                                <X size={14} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto max-h-[60vh]">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell size={32} className="text-slate-200 mx-auto mb-3" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('noNotifications')}</p>
                                <p className="text-[10px] text-slate-300 mt-1">{t('noNotificationsDesc')}</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-red-50/50 border-l-4 border-l-red-500' : ''}`}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="p-2 bg-red-100 rounded-xl shrink-0">
                                            <Receipt size={16} className="text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-slate-800 leading-tight">
                                                🧾 {notif.managerName || t('manager')} {t('createdBill')}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                {t('customer')}: <span className="font-bold">{notif.customerName}</span>
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-black text-red-600">
                                                    ₹{notif.totalAmount?.toFixed(2)}
                                                </span>
                                                <div className="flex items-center space-x-1 text-slate-400">
                                                    <Clock size={10} />
                                                    <span className="text-[9px] font-bold">{formatTime(notif.timestamp)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Overlay to close */}
            {showPanel && (
                <div className="fixed inset-0 z-[99]" onClick={() => setShowPanel(false)} />
            )}
        </>
    );
};

export default NotificationBell;
