'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { StackItem } from '@/components/StackItem'
import { SectionTitle } from '@/components/SectionTitle'
import { TagSearch, TagSearchRef } from '@/components/TagSearch'
import { PriceDistributionChart } from '@/components/PriceDistributionChart'
import { BrandData, Listing, TagSuggestion, Tag } from '@/lib/types'
import { formatTagDisplay, calculatePriceImpactScore, rankTags, getScoreColor } from '@/lib/tag-ranking'

export interface ExpandedDetailsViewProps {
  // Brand data
  brand?: string
  onClearBrand?: () => void

  // Tags data
  selectedTags?: any[]
  excludedTags?: any[]
  onUnselectTag?: (tag: any) => void
  onIncludeTag?: (tag: any) => void
  onExcludeTag?: (tag: any) => void

  // Estimate data
  stats: BrandData['stats']
  listingsCount: number

  // Listings data
  listings: Listing[]
  detailedListingsLoading?: boolean
  detailedListingsError?: string | null
  onLoadDetailedListings?: () => void

  // Close handler
  onClose: () => void

  // Tag search props
  tagSearchQuery?: string
  onTagSearchQueryChange?: (query: string) => void
  tagSearchSuggestions?: TagSuggestion[]
  isLoadingTagSuggestions?: boolean
  tagSearchSelectedIndex?: number
  onTagInclude?: (suggestion: TagSuggestion) => void
  onTagExclude?: (suggestion: TagSuggestion) => void
  onTagSearchKeyDown?: (e: React.KeyboardEvent) => void
}

export function ExpandedDetailsView({
  brand,
  onClearBrand,
  selectedTags = [],
  excludedTags = [],
  onUnselectTag,
  onIncludeTag,
  onExcludeTag,
  stats,
  listingsCount,
  listings,
  detailedListingsLoading = false,
  detailedListingsError = null,
  onLoadDetailedListings,
  onClose,
  // Tag search props
  tagSearchQuery = '',
  onTagSearchQueryChange,
  tagSearchSuggestions = [],
  isLoadingTagSuggestions = false,
  tagSearchSelectedIndex = -1,
  onTagInclude: onTagIncludeFromSearch,
  onTagExclude: onTagExcludeFromSearch,
  onTagSearchKeyDown
}: ExpandedDetailsViewProps) {
  // No longer need local search state - using unified state from parent

  // Helper function to convert TagSuggestion to Tag (same as main page)
  const suggestionToTag = useCallback((suggestion: TagSuggestion): Tag => {
    const p25 = parseFloat(suggestion.p25_price || '0')
    const p75 = parseFloat(suggestion.p75_price || '0')
    // Only create price range if we have meaningful price data
    const hasValidPrices = p25 > 0 || p75 > 0

    return {
      name: suggestion.tag_name,
      state: 'unselected' as const,
      listing_count: parseInt(suggestion.listing_count || '0'),
      median_price: parseFloat(suggestion.median_price || '0'),
      p25_price: p25,
      p75_price: p75,
      price_range: hasValidPrices ? `${suggestion.p25_price || 0}-${suggestion.p75_price || 0}kr` : undefined,
      isSearchResult: true
    }
  }, [])

  // Keyboard navigation is now handled by the unified hook passed via onTagSearchKeyDown

  // Transform and rank tag search suggestions (same pipeline as main page)
  const rankedTagSuggestions = useMemo(() => {
    if (!tagSearchSuggestions.length || !stats?.estimate) return []

    // Convert suggestions to Tag objects
    const searchTags = tagSearchSuggestions.map(suggestionToTag)

    // Apply ranking algorithm (same as main page)
    const rankedTags = rankTags(
      searchTags,
      selectedTags || [],
      stats.estimate,
      undefined,
      'listing_count' // Use listing count ordering for consistency
    )

    return rankedTags // Show all for consistency with main view navigation
  }, [tagSearchSuggestions, suggestionToTag, selectedTags, stats?.estimate])

  return (
    <div className="fixed inset-0 z-50 bg-brand-dark overflow-y-auto">
      {/* All Content Flows Together - No Fixed Headers */}
      <div>
        {/* Brand StackItem - Identical to main page */}
        {brand && (
          <StackItem
            variant="brand"
            content={brand}
            onClick={() => {}} // No-op, brand is not clickable in expanded view
            actions={[
              {
                type: 'link',
                text: 'Clear',
                onClick: onClearBrand || (() => {}),
                title: `Clear ${brand} filter`
              }
            ]}
          />
        )}


        {/* Selected Tags in chronological order - Same as main page */}
        {[...selectedTags, ...excludedTags]
          .sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0)) // Sort by timestamp
          .map(tag => {
            // Use stored score if available, otherwise calculate score using original estimate baseline
            let tagScore = tag.rankScore

            if (tagScore === undefined) {
              const currentEstimate = parseFloat((stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
              tagScore = currentEstimate > 0 ?
                calculatePriceImpactScore(tag.median_price || 0, currentEstimate) : undefined
              // Update color based on calculated score
              if (tagScore !== undefined) {
                tag.color = getScoreColor(tagScore)
              }
            }

            const isIncluded = tag.state === 'included'
            const isExcluded = tag.state === 'excluded'

            return (
              <StackItem
                key={`${tag.state}-${tag.name}`}
                variant={isIncluded ? "selected-included" : "selected-excluded"}
                content={tag.name}
                details={formatTagDisplay(tag, tagScore)}
                className={tag.color}
                onClick={() => isIncluded ? onUnselectTag?.(tag) : onIncludeTag?.(tag)}
                actions={[
                  {
                    type: 'include',
                    onClick: () => isIncluded ? onUnselectTag?.(tag) : onIncludeTag?.(tag),
                    title: isIncluded ? `Unselect ${tag.name}` : `Include ${tag.name}`,
                    active: isIncluded
                  },
                  {
                    type: 'exclude',
                    onClick: () => isExcluded ? onUnselectTag?.(tag) : onExcludeTag?.(tag),
                    title: isExcluded ? `Unselect ${tag.name}` : `Exclude ${tag.name}`,
                    active: isExcluded
                  }
                ]}
              />
            )
          })}

        {/* Tag Search - Available in expanded view for adding more tags */}
        {brand && onTagSearchQueryChange && (
          <div className="bg-brand-dark">
            <TagSearch
              brand={brand}
              selectedTags={selectedTags}
              excludedTags={excludedTags}
              onTagInclude={onTagIncludeFromSearch || (() => {})}
              onTagExclude={onTagExcludeFromSearch || (() => {})}
              searchQuery={tagSearchQuery}
              onSearchQueryChange={onTagSearchQueryChange}
              suggestions={tagSearchSuggestions}
              isLoadingSuggestions={isLoadingTagSuggestions}
              onKeyDown={onTagSearchKeyDown}
            />
          </div>
        )}

        {/* Tag Search Results - Top 3 inline results */}
        {brand && rankedTagSuggestions.length > 0 && (
          <div className="bg-brand-dark">
            {rankedTagSuggestions.map((tag, index) => {
              // Convert Tag back to TagSuggestion for handlers compatibility
              const originalSuggestion = tagSearchSuggestions.find(s => s.tag_name === tag.name)

              return (
                <div
                  key={tag.name}
                >
                  <StackItem
                    variant="unselected"
                    content={tag.name}
                    details={formatTagDisplay(tag, tag.rankScore)}
                    className={`
                      ${index === tagSearchSelectedIndex ? 'bg-brand-darker' : ''}
                      ${tag.color || ''}
                    `.trim()}
                    onClick={() => originalSuggestion && onTagIncludeFromSearch?.(originalSuggestion)}
                    actions={[
                      {
                        type: 'include',
                        onClick: () => originalSuggestion && onTagIncludeFromSearch?.(originalSuggestion),
                        title: `Include ${tag.name}`
                      },
                      {
                        type: 'exclude',
                        onClick: () => originalSuggestion && onTagExcludeFromSearch?.(originalSuggestion),
                        title: `Exclude ${tag.name}`
                      }
                    ]}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Estimate section with hover effect and click-to-close - Sticky when scrolled */}
        <div className="group sticky top-0 z-10 bg-brand-dark">
          {/* Estimate section header with close action */}
          <SectionTitle
            title="Estimate"
            action={{
              text: 'Close',
              onClick: onClose
            }}
            showTopBorder
            enableGroupHover
          />

          {/* Estimate StackItem - Clickable to close */}
          <StackItem
            variant="estimate"
            content={stats.estimate}
            details={`${stats.estimateRange} • ${listingsCount.toLocaleString('nb-NO')} listings`}
            onClick={onClose}
          />
        </div>

        {/* Details Content Section */}
        <div className="space-y-0">
        {/* Price Analysis Section */}
        <div className="bg-brand-darker px-12pt py-8pt">
          <h4 className="text-13pt font-medium text-text-primary mb-8pt">Price Analysis</h4>

          {/* Price Distribution Chart */}
          {listings.length > 0 ? (
            <PriceDistributionChart listings={listings} height={160} />
          ) : detailedListingsLoading ? (
            <div className="h-40 bg-brand-darker rounded border border-border-subtle flex items-center justify-center mb-12pt">
              <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : detailedListingsError ? (
            <div className="h-40 bg-brand-darker rounded border border-border-subtle flex items-center justify-center mb-12pt">
              <p className="text-10pt text-red-400">Failed to load chart data</p>
            </div>
          ) : (
            <div
              className="h-40 bg-brand-darker rounded border border-border-subtle flex items-center justify-center mb-12pt cursor-pointer hover:bg-opacity-80 transition-colors"
              onClick={onLoadDetailedListings}
            >
              <p className="text-10pt text-text-secondary">Click to load price distribution data</p>
            </div>
          )}

        </div>

        {/* Detailed Listings Table */}
        <div className="bg-brand-darker px-12pt py-8pt">
          <h4 className="text-13pt font-medium text-text-primary mb-8pt">
            Listings ({listings.length > 0 ? listings.length.toLocaleString('nb-NO') : listingsCount.toLocaleString('nb-NO')} total)
          </h4>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 pb-8pt border-b border-border-subtle text-9pt font-medium text-text-secondary">
            <div className="col-span-6 pl-0">Title</div>
            <div className="col-span-3">Price</div>
            <div className="col-span-3">Date</div>
          </div>

          {/* Listings Data */}
          <div className="space-y-0">
            {detailedListingsError ? (
              <div className="py-12 text-center">
                <p className="text-10pt text-red-400 mb-2">Failed to load detailed listings</p>
                <p className="text-9pt text-text-secondary mb-4">{detailedListingsError}</p>
                {onLoadDetailedListings && (
                  <button
                    onClick={onLoadDetailedListings}
                    className="text-9pt text-blue-400 underline hover:text-blue-300 transition-colors"
                  >
                    Try again
                  </button>
                )}
              </div>
            ) : detailedListingsLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-10pt text-text-secondary">Loading detailed listings...</p>
              </div>
            ) : listings.length > 0 ? (
              (() => {
                console.log(`ExpandedDetailsView: Displaying ${listings.length} listings`)
                return listings
              })()
                .sort((a, b) => {
                  // Sort by most recent first - try multiple date fields
                  const getDateValue = (listing: any) => {
                    const dateStr = listing.lastUpdatedAt || listing.date || listing.created_at || listing.date_listed
                    if (!dateStr) return 0

                    const parsed = Date.parse(dateStr)
                    return isNaN(parsed) ? 0 : parsed
                  }

                  const dateA = getDateValue(a)
                  const dateB = getDateValue(b)

                  // If both have valid dates, sort by date (most recent first)
                  if (dateA && dateB) return dateB - dateA

                  // Put listings with dates before those without
                  if (dateA && !dateB) return -1
                  if (!dateA && dateB) return 1

                  return 0 // Both have no dates
                })
                .map((listing, index) => {
                // Format date
                const formatDate = (dateString?: string) => {
                  if (!dateString) return 'Unknown'
                  try {
                    const date = new Date(dateString)
                    // Format as DD.MM.YYYY (Norwegian/European format)
                    return date.toLocaleDateString('no-NO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                  } catch {
                    return 'Unknown'
                  }
                }

                return (
                  <div key={listing.id || index} className="grid grid-cols-12 gap-2 py-6pt pr-8pt border-b border-border-subtle hover:bg-brand-darker hover:bg-opacity-50 transition-colors">
                    <div className="col-span-6 pl-0">
                      <p className="text-10pt font-medium text-text-primary truncate" title={listing.title}>
                        {listing.title || 'Untitled listing'}
                      </p>
                      {listing.id && (
                        <p className="text-9pt text-text-secondary">ID: {listing.id}</p>
                      )}
                    </div>
                    <div className="col-span-3">
                      <p className="text-10pt font-bold text-text-primary">
                        {listing.price || 'Price not available'}
                      </p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-9pt text-text-secondary">{formatDate(listing.lastUpdatedAt || listing.date)}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div
                className="py-12 text-center cursor-pointer bg-brand-darker hover:bg-opacity-80 rounded transition-colors"
                onClick={onLoadDetailedListings}
              >
                <p className="text-10pt text-text-secondary">No detailed listings available</p>
                <p className="text-9pt text-text-secondary mt-2">Click to load listings data</p>
              </div>
            )}
          </div>

        </div>

        {/* Additional spacing for better scroll experience */}
        <div className="h-24"></div>
        </div>
      </div>
    </div>
  )
}