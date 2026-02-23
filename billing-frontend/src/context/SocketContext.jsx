import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!user) return;

        const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const socket = io(BACKEND_URL);
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('🔌 Socket connected');
            // Register this user
            socket.emit('register', {
                name: user.name,
                role: user.role,
                userId: user._id
            });
        });

        // Listen for new bill notifications (only admin/super_admin care)
        if (user.role === 'admin' || user.role === 'super_admin') {
            socket.on('new-bill', (data) => {
                console.log('🔔 New bill notification:', data);
                const notification = {
                    id: Date.now(),
                    ...data,
                    read: false
                };
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);

                // Play notification sound
                try {
                    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19teleVhaW5lMQBGb3JtYXRDaHVuawAQAAAAAgABACIiAABERAAABABAAGRhdGEi');
                    audio.volume = 0.3;
                    audio.play().catch(() => {});
                } catch (e) {}

                // Show browser notification
                if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                    new Notification('🧾 New Bill Created', {
                        body: `${data.managerName} - ₹${data.totalAmount?.toFixed(2)} | Customer: ${data.customerName}`,
                        icon: '/favicon.ico'
                    });
                }
            });
        }

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <SocketContext.Provider value={{ notifications, unreadCount, markAllRead, clearNotifications }}>
            {children}
        </SocketContext.Provider>
    );
};
