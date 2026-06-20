class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in the cache with a Time-To-Live (TTL)
   * @param {string} key - The cache key
   * @param {any} value - The value to store
   * @param {number} ttlSeconds - Time to live in seconds
   */
  set(key, value, ttlSeconds) {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Retrieve a value from the cache. Returns null if missing or expired.
   * @param {string} key - The cache key
   * @returns {any|null} The cached value or null
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  /**
   * Manually delete an item from the cache
   * @param {string} key - The cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }
}

// Export a singleton instance
const cache = new SimpleCache();
export { SimpleCache };
export default cache;
