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

  /**
   * Check if a key exists and is not expired (does not delete expired entries)
   * @param {string} key - The cache key
   * @returns {boolean} True if exists and not expired
   */
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    return Date.now() <= item.expiresAt;
  }

  /**
   * Check if a key is expired or missing
   * @param {string} key - The cache key
   * @returns {boolean} True if expired or missing
   */
  isExpired(key) {
    const item = this.cache.get(key);
    if (!item) return true;
    return Date.now() > item.expiresAt;
  }

  /**
   * Get the number of non-expired entries in the cache
   * @returns {number} The count of active entries
   */
  get size() {
    let count = 0;
    const now = Date.now();
    for (const item of this.cache.values()) {
      if (now <= item.expiresAt) {
        count++;
      }
    }
    return count;
  }
}

// Export a singleton instance
const cache = new SimpleCache();
export { SimpleCache };
export default cache;
