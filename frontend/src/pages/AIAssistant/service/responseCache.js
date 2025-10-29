// utils/responseCache.js

/**
 * Response cache with timestamp-based expiry
 * Reduces API calls by caching similar queries
 */

const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached responses

// In-memory cache structure
const responseCache = new Map();

/**
 * Generate a normalized cache key from user message
 */
const generateCacheKey = (message) => {
  // Normalize the message: lowercase, trim, remove extra spaces
  const normalized = message
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove special characters
  
  // Create a simple hash for shorter keys
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `${hash}_${normalized.substring(0, 50)}`;
};

/**
 * Check if a message is similar to a cached message
 */
const findSimilarCacheKey = (message) => {
  const normalized = message.toLowerCase().trim();
  
  // Check for exact normalized match first
  for (const [key, value] of responseCache.entries()) {
    if (key.includes(normalized.substring(0, 30))) {
      if (Date.now() - value.timestamp < CACHE_DURATION) {
        return key;
      }
    }
  }
  
  return null;
};

/**
 * Get cached response if available and not expired
 */
export const getCachedResponse = (message) => {
  try {
    // Clean expired entries first
    cleanExpiredCache();
    
    // Try exact match
    const cacheKey = generateCacheKey(message);
    if (responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Cache hit (exact):', cacheKey);
        cached.hits = (cached.hits || 0) + 1;
        return cached.response;
      } else {
        responseCache.delete(cacheKey);
      }
    }
    
    // Try similar match
    const similarKey = findSimilarCacheKey(message);
    if (similarKey && responseCache.has(similarKey)) {
      const cached = responseCache.get(similarKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('Cache hit (similar):', similarKey);
        cached.hits = (cached.hits || 0) + 1;
        return cached.response;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached response:', error);
    return null;
  }
};

/**
 * Cache a response for future use
 */
export const setCachedResponse = (message, response) => {
  try {
    // Enforce cache size limit
    if (responseCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entries (by timestamp)
      const sortedEntries = Array.from(responseCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest 20% of entries
      const toRemove = Math.floor(MAX_CACHE_SIZE * 0.2);
      for (let i = 0; i < toRemove; i++) {
        responseCache.delete(sortedEntries[i][0]);
      }
    }
    
    const cacheKey = generateCacheKey(message);
    responseCache.set(cacheKey, {
      response: response,
      timestamp: Date.now(),
      originalMessage: message,
      hits: 0
    });
    
    console.log('Response cached:', cacheKey);
    console.log('Current cache size:', responseCache.size);
  } catch (error) {
    console.error('Error caching response:', error);
  }
};

/**
 * Clean expired cache entries
 */
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp >= CACHE_DURATION) {
      responseCache.delete(key);
    }
  }
};

/**
 * Clear all cached responses
 */
export const clearCache = () => {
  responseCache.clear();
  console.log('Cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  cleanExpiredCache();
  
  let totalHits = 0;
  let oldestTimestamp = Date.now();
  let newestTimestamp = 0;
  
  responseCache.forEach((value) => {
    totalHits += value.hits || 0;
    oldestTimestamp = Math.min(oldestTimestamp, value.timestamp);
    newestTimestamp = Math.max(newestTimestamp, value.timestamp);
  });
  
  return {
    size: responseCache.size,
    maxSize: MAX_CACHE_SIZE,
    totalHits: totalHits,
    cacheDuration: CACHE_DURATION / 1000 / 60, // in minutes
    oldestEntry: oldestTimestamp !== Date.now() ? new Date(oldestTimestamp).toLocaleString() : 'N/A',
    newestEntry: newestTimestamp !== 0 ? new Date(newestTimestamp).toLocaleString() : 'N/A'
  };
};

// Auto-cleanup interval (run every 5 minutes)
setInterval(() => {
  cleanExpiredCache();
  console.log('Cache auto-cleanup completed. Current size:', responseCache.size);
}, 1000 * 60 * 5);

export default {
  getCachedResponse,
  setCachedResponse,
  clearCache,
  getCacheStats
};