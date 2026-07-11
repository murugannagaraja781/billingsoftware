import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { processSyncQueue, getSyncQueue, isOnline as checkOnline } from '../utils/offlineApi';

const OfflineContext = createContext();

export const OfflineProvider = ({ children }) => {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(getSyncQueue().length);
  const [syncResult, setSyncResult] = useState(null);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const syncTimeoutRef = useRef(null);
  const bannerTimeoutRef = useRef(null);

  // Update pending count periodically
  const refreshPendingCount = useCallback(() => {
    setPendingCount(getSyncQueue().length);
  }, []);

  // Auto-sync when coming back online
  const syncNow = useCallback(async () => {
    if (syncing) return;
    const queue = getSyncQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    try {
      const result = await processSyncQueue((item, done, total) => {
        // Progress callback
        setPendingCount(total - done - 1);
      });

      setSyncResult(result);
      setPendingCount(getSyncQueue().length);

      // Clear sync result after 4 seconds
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = setTimeout(() => {
        setSyncResult(null);
      }, 4000);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowBanner(false);
      // Auto-sync after a short delay to let connection stabilize
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        syncNow();
      }, 2000);
    };

    const handleOffline = () => {
      setOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending count every 5 seconds
    const interval = setInterval(refreshPendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current);
    };
  }, [syncNow, refreshPendingCount]);

  return (
    <OfflineContext.Provider value={{ online, syncing, pendingCount, syncNow, syncResult, refreshPendingCount }}>
      {children}

      {/* Offline Banner */}
      {showBanner && !online && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.02em',
          boxShadow: '0 4px 20px rgba(217, 119, 6, 0.4)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span style={{ fontSize: '18px' }}>📴</span>
          <span>Offline Mode — Bills will sync when internet returns</span>
          {pendingCount > 0 && (
            <span style={{
              background: 'rgba(255,255,255,0.25)',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '800'
            }}>
              {pendingCount} pending
            </span>
          )}
        </div>
      )}

      {/* Syncing Banner */}
      {syncing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
          color: '#fff',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span className="animate-spin" style={{ display: 'inline-block', fontSize: '18px' }}>⟳</span>
          <span>Syncing {pendingCount} pending items...</span>
        </div>
      )}

      {/* Sync Complete Banner */}
      {syncResult && !syncing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: syncResult.failed > 0
            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
            : 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: '700',
          boxShadow: syncResult.failed > 0
            ? '0 4px 20px rgba(217, 119, 6, 0.4)'
            : '0 4px 20px rgba(5, 150, 105, 0.4)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span style={{ fontSize: '18px' }}>{syncResult.failed > 0 ? '⚠️' : '✅'}</span>
          <span>
            {syncResult.synced > 0 && `${syncResult.synced} items synced successfully`}
            {syncResult.failed > 0 && ` • ${syncResult.failed} failed`}
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
