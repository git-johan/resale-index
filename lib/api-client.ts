// API Client for React/Next.js
// Extracted from vanilla JS apiService.js

import { BrandData, TagOptions, DetailedListingsResponse, Listing, BrandSuggestion, TagSuggestion, Tag } from './types'

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
      listingsPerTagLimit: 0, // Optimized for bandwidth - no listings in summary view
      usePostgres: true // Required for proper data
    }

    const rawData = await this.request('/listings', requestData)

    // Transform the raw API response to our expected format
    return this.transformBrandData(brandName, rawData, selectedTags, excludedTags)
  }

  /**
   * Get brand autocomplete suggestions
   */
  async getBrandSuggestions(query: string): Promise<BrandSuggestion[]> {
    // Don't make API calls for empty queries
    if (!query || query.trim().length === 0) {
      return []
    }

    const requestData = {
      query: query.trim()
    }

    const rawData = await this.request('/brands/autocomplete', requestData)

    // API returns array of BrandSuggestion objects directly
    return rawData || []
  }

  /**
   * Get tag autocomplete suggestions scoped to brand and current selections
   */
  async getTagSuggestions(
    query: string,
    brand: string,
    selectedTags: Tag[],
    excludedTags: Tag[]
  ): Promise<TagSuggestion[]> {
    // Don't make API calls for empty queries
    if (!query || query.trim().length === 0) {
      return []
    }

    const requestData = {
      query: query.trim(),
      brand: [brand],
      tag: selectedTags.map(t => t.name),
      tagExclude: excludedTags.map(t => t.name),
      category: [],
      categoryExclude: [],
      limit: 20
    }

    const rawData = await this.request('/get-tags-autocomplete', requestData)

    // Simple mapping from API response
    return rawData?.map((tag: any) => ({
      name: tag.tag_name,
      listing_count: parseInt(tag.listing_count)
    })).filter((tag: TagSuggestion) => tag.name) || []
  }

  /**
   * Get detailed listings for "See all details" functionality
   * Fetches up to 100k listings with full data
   */
  async getDetailedListings(brandName: string, options: TagOptions): Promise<DetailedListingsResponse> {
    const {
      selectedTags = [],
      excludedTags = []
    } = options

    const requestData = {
      brand: [brandName], // API expects brand as array
      tag: selectedTags.map(t => t.name), // Include tag names
      tagExclude: excludedTags.map(t => t.name), // Exclude tag names
      tagsLimit: 200,
      listingsPerTagLimit: 0, // Don't want per-tag breakdown
      listingsSampleLimit: 100000, // Get ALL listings for entire filter
      sampleLimit: 100000, // Try alternative parameter name
      maxListings: 100000, // Try another alternative
      limit: 100000, // Try simple limit
      usePostgres: true // Required for proper data
    }

    console.log('API: Fetching detailed listings for', brandName, 'with options:', options)

    // Clear cache for detailed listings to get fresh data with new limits
    this.cache.clear()

    const rawData = await this.request('/listings', requestData)

    // Transform and return the detailed response
    return this.transformDetailedListings(rawData)
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

    // Extract listings from response
    const listings = rawData.listings?.map((listing: any) => ({
      id: listing.id || listing.listing_id,
      title: listing.title || listing.name || listing.listing_title,
      price: listing.price ? `${listing.price} kr` : listing.price_string,
      condition: listing.condition || listing.state,
      date: listing.created_at || listing.date_listed,
      url: listing.url || listing.listing_url,
      image: listing.image_url || listing.thumbnail_url,
      brand: listing.brand,
      tags: listing.tags || []
    })).filter((listing: any) => listing.id || listing.title) || []

    return {
      brand: brandName,
      listingsCount: parseInt(rawData.stats?.listing_count || '0'),
      tags,
      listings,
      stats: {
        estimate: `${currentMedianPrice} kr`,
        estimateRange: `${rawData.stats?.p25_price || 0} - ${rawData.stats?.p75_price || 0} kr`,
        originalBrandEstimate
      }
    }
  }

  /**
   * Transform raw API response to DetailedListingsResponse format
   */
  private transformDetailedListings(rawData: any): DetailedListingsResponse {
    // Debug: Log the response structure to understand where listings are
    console.log('API Response for detailed listings:', {
      hasListings: 'listings' in rawData,
      hasListingsSample: 'listingsSample' in rawData,
      topLevelKeys: Object.keys(rawData),
      listingsCount: rawData.listings?.length || 0,
      listingsSampleCount: rawData.listingsSample?.length || 0,
      sampleListingsCount: rawData.sampleListings?.length || 0,
      statsListingCount: rawData.stats?.listing_count || 'unknown',
      firstTag: rawData.tags?.[0] ? {
        tagName: rawData.tags[0].tag_name,
        listingsInTag: rawData.tags[0].listings?.length || 0
      } : null,
      allTagListingsCounts: rawData.tags?.map((tag: any) => ({
        name: tag.tag_name,
        listingsCount: tag.listings?.length || 0
      })) || []
    })

    // Try to find listings in various possible locations
    let rawListings = rawData.listings || rawData.listingsSample || rawData.sampleListings || []

    // If no direct listings, check if they're nested in tags or other structures
    if (rawListings.length === 0 && rawData.tags?.length > 0) {
      // Check if listings are in the first tag (for debugging)
      console.log('No top-level listings found. Checking first tag:', rawData.tags[0])
    }

    // Extract listings with comprehensive data
    const listings: Listing[] = rawListings?.map((listing: any) => ({
      id: listing.id || listing.listing_id,
      title: listing.title || listing.name || listing.listing_title,
      price: listing.price ? `${listing.price} kr` : listing.price_string,
      condition: listing.condition || listing.state,
      date: listing.created_at || listing.date_listed,
      lastUpdatedAt: listing.last_updated_at || listing.updated_at || listing.lastUpdatedAt,
      url: listing.url || listing.listing_url,
      image: listing.image_url || listing.thumbnail_url,
      brand: listing.brand,
      tags: listing.tags || []
    })).filter((listing: any) => listing.id || listing.title) || []

    // Extract stats
    const stats = {
      listing_count: rawData.stats?.listing_count || '0',
      median_price: rawData.stats?.median_price || '0',
      p25_price: rawData.stats?.p25_price || '0',
      p75_price: rawData.stats?.p75_price || '0',
      average_price: rawData.stats?.average_price,
      volume: rawData.stats?.volume
    }

    // Extract tags with their listings
    const tags = rawData.tags?.map((tag: any) => ({
      tag_name: tag.tag_name || '',
      listing_count: tag.listing_count || '0',
      median_price: tag.median_price || '0',
      p25_price: tag.p25_price || '0',
      p75_price: tag.p75_price || '0',
      average_price: tag.average_price,
      volume: tag.volume,
      listings: tag.listings || []
    })) || []

    console.log(`API: Transformed ${listings.length} detailed listings from raw data:`, {
      rawListingsLength: rawListings?.length || 0,
      listingsLength: listings.length,
      statsListingCount: rawData.stats?.listing_count,
      firstFewListings: listings.slice(0, 3).map(l => ({ title: l.title, date: l.date, lastUpdatedAt: l.lastUpdatedAt }))
    })

    return {
      listings,
      stats,
      tags
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