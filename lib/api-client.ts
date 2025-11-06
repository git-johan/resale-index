// API Client for React/Next.js
// Extracted from vanilla JS apiService.js

import { BrandData, TagOptions } from './types'

interface CacheEntry {
  data: any
  timestamp: number
}

class ApiClient {
  private cache = new Map<string, CacheEntry>()
  private readonly cacheTimeout = 5 * 60 * 1000 // 5 minutes
  private originalBrandEstimates = new Map<string, number>() // Store original brand estimates

  /**
   * Create cache key for request
   */
  private createCacheKey(endpoint: string, data: any): string {
    return `${endpoint}_${JSON.stringify(data)}`
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheEntry: CacheEntry): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheTimeout
  }

  /**
   * Generic API request method with caching and error handling
   */
  private async request(endpoint: string, data: any = {}): Promise<any> {
    const cacheKey = this.createCacheKey(endpoint, data)

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      if (this.isCacheValid(cached)) {
        console.log('API: Using cached data for', endpoint)
        return cached.data
      }
    }

    try {
      console.log('API: Fetching', endpoint, data)

      const response = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const responseData = await response.json()

      // Cache successful response
      this.cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      })

      console.log('API: Successfully fetched', endpoint, `(${JSON.stringify(responseData).length} chars)`)
      return responseData

    } catch (error) {
      console.error('API: Error fetching', endpoint, (error as Error).message)
      throw new Error(`Failed to fetch data: ${(error as Error).message}`)
    }
  }

  /**
   * Get brand data with tags and listings
   */
  async getBrandData(brandName: string, options: TagOptions): Promise<BrandData> {
    const {
      selectedTags = [],
      excludedTags = []
    } = options

    const requestData = {
      brand: [brandName], // API expects brand as array
      tag: selectedTags.map(t => t.name), // Include tag names
      tagExclude: excludedTags.map(t => t.name), // Exclude tag names
      tagsLimit: 500,
      listingsPerTagLimit: 0,
      usePostgres: true // Required for proper data
    }

    const rawData = await this.request('/listings', requestData)

    // Transform the raw API response to our expected format
    return this.transformBrandData(brandName, rawData, selectedTags, excludedTags)
  }

  /**
   * Transform raw API response to BrandData format
   */
  private transformBrandData(brandName: string, rawData: any, selectedTags: any[], excludedTags: any[]): BrandData {
    // Extract tags from response and add state information
    const tags = rawData.tags?.map((tag: any) => ({
      name: tag.tag_name || '',
      price_range: `${tag.p25_price || 0} - ${tag.p75_price || 0} kr`,
      state: 'unselected' as const,
      // Preserve additional fields for ranking algorithm
      listing_count: parseInt(tag.listing_count || '0'),
      median_price: parseFloat(tag.median_price || '0'),
      p25_price: parseFloat(tag.p25_price || '0'),
      p75_price: parseFloat(tag.p75_price || '0')
    })).filter((tag: any) => tag.name && typeof tag.name === 'string') || []

    const currentMedianPrice = parseFloat(rawData.stats?.median_price || '0')

    // Store original brand estimate if this is a brand-only query (no tags selected)
    const isOriginalBrandQuery = selectedTags.length === 0 && excludedTags.length === 0
    if (isOriginalBrandQuery && currentMedianPrice > 0) {
      this.originalBrandEstimates.set(brandName.toLowerCase(), currentMedianPrice)
    }

    // Get stored original brand estimate for scoring baseline
    const originalBrandEstimate = this.originalBrandEstimates.get(brandName.toLowerCase())

    return {
      brand: brandName,
      listingsCount: parseInt(rawData.stats?.listing_count || '0'),
      tags,
      stats: {
        estimate: `${currentMedianPrice} kr`,
        estimateRange: `${rawData.stats?.p25_price || 0} - ${rawData.stats?.p75_price || 0} kr`,
        originalBrandEstimate
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('API: Cache cleared')
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    const validEntries = Array.from(this.cache.values())
      .filter(entry => this.isCacheValid(entry))

    return {
      totalEntries: this.cache.size,
      validEntries: validEntries.length,
      expiredEntries: this.cache.size - validEntries.length
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()