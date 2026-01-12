/**
 * Terminal dimension cache - VSCode pattern
 * Caches terminal dimensions to avoid expensive DOM measurements
 */

interface CachedDimensions {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  timestamp: number;
}

class TerminalDimensionCache {
  private static _cache: CachedDimensions | null = null;
  private static readonly CACHE_TTL = 1000; // 1 second

  /**
   * Get cached dimensions if still valid
   */
  static get(): CachedDimensions | null {
    if (!this._cache) return null;

    const age = Date.now() - this._cache.timestamp;
    if (age > this.CACHE_TTL) {
      this._cache = null;
      return null;
    }

    return this._cache;
  }

  /**
   * Set cached dimensions
   */
  static set(dims: Omit<CachedDimensions, 'timestamp'>): void {
    this._cache = {
      ...dims,
      timestamp: Date.now()
    };
  }

  /**
   * Clear cached dimensions
   */
  static clear(): void {
    this._cache = null;
  }

  /**
   * Check if cache is valid
   */
  static isValid(): boolean {
    if (!this._cache) return false;
    const age = Date.now() - this._cache.timestamp;
    return age <= this.CACHE_TTL;
  }
}

export default TerminalDimensionCache;
