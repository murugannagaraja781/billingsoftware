// Offline-first API utility
// Wraps axios calls with localStorage caching and sync queue

import axios from 'axios';
import API_URL from '../config';

// ===== SYNC QUEUE =====
const SYNC_QUEUE_KEY = 'rts_sync_queue';

const getSyncQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

const saveSyncQueue = (queue) => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

const addToSyncQueue = (entry) => {
  const queue = getSyncQueue();
  queue.push({
    id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    ...entry
  });
  saveSyncQueue(queue);
  return queue.length;
};

const removeFromSyncQueue = (id) => {
  const queue = getSyncQueue().filter(item => item.id !== id);
  saveSyncQueue(queue);
};

// ===== ONLINE CHECK =====
const isOnline = () => navigator.onLine;

// ===== CACHE HELPERS =====
const getCached = (cacheKey) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCache = (cacheKey, data) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    // localStorage full — clear old caches
    console.warn('localStorage full, clearing old caches');
    clearOldCaches();
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      // Still full, skip caching
    }
  }
};

const clearOldCaches = () => {
  const keysToKeep = ['user', SYNC_QUEUE_KEY, 'rts_invoice_header'];
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('rts_') && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// ===== OFFLINE API METHODS =====

/**
 * GET with offline fallback
 * Tries network first, falls back to localStorage cache
 */
const offlineGet = async (url, options = {}, cacheKey) => {
  const { headers = {}, timeout = 10000 } = options;

  if (isOnline()) {
    try {
      const response = await axios.get(url, {
        headers,
        timeout
      });
      if (cacheKey) {
        setCache(cacheKey, response.data);
      }
      return { data: response.data, fromCache: false };
    } catch (error) {
      // Network error — try cache
      if (cacheKey) {
        const cached = getCached(cacheKey);
        if (cached) {
          return { data: cached, fromCache: true };
        }
      }
      throw error;
    }
  } else {
    // Offline — use cache
    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        return { data: cached, fromCache: true };
      }
    }
    throw new Error('No internet and no cached data available');
  }
};

/**
 * POST with offline queue
 * Tries network first, queues in localStorage if offline
 */
const offlinePost = async (url, body, options = {}, queueConfig = null) => {
  const { headers = {} } = options;

  if (isOnline()) {
    try {
      const response = await axios.post(url, body, { headers, timeout: 15000 });
      return { data: response.data, queued: false };
    } catch (error) {
      // If network error (not server error), queue it
      if (!error.response && queueConfig) {
        const pendingCount = addToSyncQueue({
          method: 'POST',
          url,
          body,
          headers,
          ...queueConfig
        });
        return { data: { _id: `offline_${Date.now()}`, ...body }, queued: true, pendingCount };
      }
      throw error;
    }
  } else if (queueConfig) {
    // Offline — queue the request
    const pendingCount = addToSyncQueue({
      method: 'POST',
      url,
      body,
      headers,
      ...queueConfig
    });
    return { data: { _id: `offline_${Date.now()}`, ...body }, queued: true, pendingCount };
  } else {
    throw new Error('No internet connection');
  }
};

/**
 * PUT with offline queue
 */
const offlinePut = async (url, body, options = {}, queueConfig = null) => {
  const { headers = {} } = options;

  if (isOnline()) {
    try {
      const response = await axios.put(url, body, { headers, timeout: 15000 });
      return { data: response.data, queued: false };
    } catch (error) {
      if (!error.response && queueConfig) {
        const pendingCount = addToSyncQueue({
          method: 'PUT',
          url,
          body,
          headers,
          ...queueConfig
        });
        return { data: body, queued: true, pendingCount };
      }
      throw error;
    }
  } else if (queueConfig) {
    const pendingCount = addToSyncQueue({
      method: 'PUT',
      url,
      body,
      headers,
      ...queueConfig
    });
    return { data: body, queued: true, pendingCount };
  } else {
    throw new Error('No internet connection');
  }
};

/**
 * DELETE with offline queue
 */
const offlineDelete = async (url, options = {}, queueConfig = null) => {
  const { headers = {} } = options;

  if (isOnline()) {
    try {
      const response = await axios.delete(url, { headers, timeout: 15000 });
      return { data: response.data, queued: false };
    } catch (error) {
      if (!error.response && queueConfig) {
        addToSyncQueue({
          method: 'DELETE',
          url,
          headers,
          ...queueConfig
        });
        return { data: null, queued: true };
      }
      throw error;
    }
  } else if (queueConfig) {
    addToSyncQueue({
      method: 'DELETE',
      url,
      headers,
      ...queueConfig
    });
    return { data: null, queued: true };
  } else {
    throw new Error('No internet connection');
  }
};

// ===== SYNC ENGINE =====

/**
 * Process the sync queue — called when coming back online
 * Returns { synced: number, failed: number, errors: [] }
 */
const processSyncQueue = async (onProgress) => {
  const queue = getSyncQueue();
  if (queue.length === 0) return { synced: 0, failed: 0, errors: [] };

  const results = { synced: 0, failed: 0, errors: [] };

  for (const item of queue) {
    try {
      if (onProgress) onProgress(item, results.synced, queue.length);

      const config = { headers: item.headers, timeout: 15000 };

      switch (item.method) {
        case 'POST':
          await axios.post(item.url, item.body, config);
          break;
        case 'PUT':
          await axios.put(item.url, item.body, config);
          break;
        case 'DELETE':
          await axios.delete(item.url, config);
          break;
      }

      removeFromSyncQueue(item.id);
      results.synced++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        id: item.id,
        type: item.type || item.method,
        error: error.response?.data?.message || error.message
      });
    }
  }

  return results;
};

export {
  offlineGet,
  offlinePost,
  offlinePut,
  offlineDelete,
  processSyncQueue,
  getSyncQueue,
  isOnline,
  getCached,
  setCache,
  SYNC_QUEUE_KEY
};
