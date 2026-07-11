import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';
import API_URL from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Try online login first
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password }, {
        timeout: 10000
      });
      React.startTransition(() => {
        setUser(data);
      });
      localStorage.setItem('user', JSON.stringify(data));
      // Save credentials for offline login (simple hash for security)
      localStorage.setItem('rts_offline_creds', JSON.stringify({
        email,
        passwordHash: btoa(email + ':' + password), // Simple encoding for offline check
        userData: data
      }));
      return { success: true };
    } catch (error) {
      // If network error (not server rejection), try offline login
      if (!error.response && !navigator.onLine) {
        return offlineLogin(email, password);
      }
      // Check if it's a timeout/network error even when "online" (slow internet)
      if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
        return offlineLogin(email, password);
      }
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const offlineLogin = (email, password) => {
    try {
      const savedCreds = localStorage.getItem('rts_offline_creds');
      if (!savedCreds) {
        return { success: false, message: 'No internet. Please login online first to enable offline access.' };
      }
      const creds = JSON.parse(savedCreds);
      const inputHash = btoa(email + ':' + password);
      
      if (creds.email === email && creds.passwordHash === inputHash) {
        const userData = creds.userData;
        React.startTransition(() => {
          setUser(userData);
        });
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, offline: true };
      }
      return { success: false, message: 'Invalid credentials (offline mode)' };
    } catch {
      return { success: false, message: 'Offline login failed' };
    }
  };

  const logout = () => {
    React.startTransition(() => {
      setUser(null);
    });
    localStorage.removeItem('user');
    // Don't remove offline_creds — keep them for future offline login
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
