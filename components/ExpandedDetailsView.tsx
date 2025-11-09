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
        {/* Header with T Symbol and Text - Same as main page */}
        <div className="py-8pt px-12pt flex items-center font-sf-pro w-full text-24pt font-semibold bg-brand-dark border-b border-border-subtle" style={{color: 'rgba(232, 232, 232, 0.8)'}}>
          <div className="flex items-center gap-10pt">
            {/* T Symbol - 24pt height */}
            <div className="h-6 flex items-center">
              <svg width="14" height="24" viewBox="0 0 14 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.000976562 17.0493H12.5108C13.2785 17.0493 13.9008 17.6716 13.9008 18.4393V22.2012C13.9008 23.1942 13.0958 23.9992 12.1028 23.9992H6.95089C3.11256 23.9992 0.000976562 20.8876 0.000976562 17.0493Z" fill="rgba(232, 232, 232, 0.6)"/>
                <path d="M13.8999 10.6929L13.8999 7.56556C13.8999 6.84811 13.3183 6.26651 12.6009 6.26651L11.6219 6.26651C9.21839 6.26651 7.27 4.31811 7.27 1.91465L7.27 1.29905C7.27 0.581604 6.6884 -3.15225e-07 5.97095 -3.46585e-07L1.29917 -5.50795e-07C0.581728 -5.82156e-07 0.000123952 0.581604 0.000123921 1.29905L0.000123769 4.76448L0.000123517 10.5413C0.000123482 11.3425 0.649586 11.992 1.45074 11.992L12.6009 11.992C13.3183 11.992 13.8999 11.4104 13.8999 10.6929Z" fill="rgba(232, 232, 232, 0.5)"/>
                <foreignObject x="-2.59712" y="1.68901" width="17.8105" height="24.9091"><div xmlns="http://www.w3.org/1999/xhtml" style={{backdropFilter:'blur(1.3px)', clipPath:'url(#bgblur_0_71_430_clip_path)', height:'100%', width:'100%'}}></div></foreignObject>
                <path data-figma-bg-blur-radius="2.5981" d="M0.0517578 4.28711C4.03952 4.28713 7.27246 7.52005 7.27246 11.5078V16.9854H7.27148V18.4824C7.27148 21.4714 9.64861 23.9029 12.6152 23.9951C12.59 23.9965 12.5646 24 12.5391 24H6.96484C3.11879 23.9999 0.000976562 20.8812 0.000976562 17.0352V4.33789C0.000976562 4.30986 0.0237319 4.28711 0.0517578 4.28711Z" fill="rgba(232, 232, 232, 0.7)"/>
                <defs>
                  <clipPath id="bgblur_0_71_430_clip_path" transform="translate(2.59712 -1.68901)">
                    <path d="M0.0517578 4.28711C4.03952 4.28713 7.27246 7.52005 7.27246 11.5078V16.9854H7.27148V18.4824C7.27148 21.4714 9.64861 23.9029 12.6152 23.9951C12.59 23.9965 12.5646 24 12.5391 24H6.96484C3.11879 23.9999 0.000976562 20.8812 0.000976562 17.0352V4.33789C0.000976562 4.30986 0.0237319 4.28711 0.0517578 4.28711Z"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
            {/* Text with 10pt gap - 24pt font */}
            <h1 className="leading-1.2 m-0 font-semibold text-24pt">resale analytics</h1>
          </div>
        </div>

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

        {/* Estimate section - Sticky when scrolled */}
        <div className="sticky top-0 z-10 bg-brand-dark">
          {/* Estimate section - two StackItems side by side */}
          <div className="bg-brand-darker flex">
            {/* Left: Estimate value and details */}
            <div className="flex-1">
              <StackItem
                variant="estimate"
                content={stats.estimate}
                details={`${stats.estimateRange} • ${listingsCount.toLocaleString('nb-NO')} listings`}
                onClick={onClose}
              />
            </div>

            {/* Right: Close button with same styling as estimate */}
            <div className="flex-shrink-0">
              <StackItem
                variant="estimate"
                content="Close"
                onClick={onClose}
                className="text-right"
              />
            </div>
          </div>
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