'use client'

import { StackItem } from '@/components/StackItem'
import { SectionTitle } from '@/components/SectionTitle'
import { PriceDistributionChart } from '@/components/PriceDistributionChart'
import { BrandData, Listing } from '@/lib/types'
import { formatTagDisplay, calculatePriceImpactScore, calculateSimilarityPenalty } from '@/lib/tag-ranking'

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
  onClose
}: ExpandedDetailsViewProps) {

  return (
    <div className="fixed inset-0 z-50 bg-brand-darker overflow-y-auto">
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

        {/* Tags section header */}
        {(selectedTags.length > 0 || excludedTags.length > 0) && (
          <SectionTitle title="Tags" />
        )}

        {/* Selected Tags StackItems - Identical to main page */}
        {selectedTags.map(tag => {
          const originalEstimate = stats?.originalBrandEstimate || 0
          const otherSelectedTags = selectedTags.filter(t => t.name !== tag.name)
          const tagScore = originalEstimate > 0 ?
            Math.max(-10, Math.min(10,
              calculatePriceImpactScore(tag.median_price || 0, originalEstimate) +
              calculateSimilarityPenalty(tag.name, otherSelectedTags)
            )) : undefined

          return (
            <StackItem
              key={`selected-${tag.name}`}
              variant="selected-included"
              content={tag.name}
              details={formatTagDisplay(tag, tagScore)}
              className={tag.color}
              onClick={() => onUnselectTag?.(tag)}
              actions={[
                {
                  type: 'include',
                  onClick: () => onUnselectTag?.(tag),
                  title: `Unselect ${tag.name}`,
                  active: true
                },
                {
                  type: 'exclude',
                  onClick: () => onExcludeTag?.(tag),
                  title: `Exclude ${tag.name}`
                }
              ]}
            />
          )
        })}

        {/* Excluded Tags StackItems - Identical to main page */}
        {excludedTags.map(tag => {
          const originalEstimate = stats?.originalBrandEstimate || 0
          const otherSelectedTags = selectedTags
          const tagScore = originalEstimate > 0 ?
            Math.max(-10, Math.min(10,
              calculatePriceImpactScore(tag.median_price || 0, originalEstimate) +
              calculateSimilarityPenalty(tag.name, otherSelectedTags)
            )) : undefined

          return (
            <StackItem
              key={`excluded-${tag.name}`}
              variant="selected-excluded"
              content={tag.name}
              details={formatTagDisplay(tag, tagScore)}
              className={tag.color}
              onClick={() => onIncludeTag?.(tag)}
              actions={[
                {
                  type: 'include',
                  onClick: () => onIncludeTag?.(tag),
                  title: `Include ${tag.name}`
                },
                {
                  type: 'exclude',
                  onClick: () => onUnselectTag?.(tag),
                  title: `Unselect ${tag.name}`,
                  active: true
                }
              ]}
            />
          )
        })}

        {/* Estimate section with hover effect and click-to-close */}
        <div className="group">
          {/* Estimate section header with close action */}
          <SectionTitle
            title="Estimate"
            action={{
              text: 'Close details',
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
            <div className="col-span-5 pl-0">Title</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Condition</div>
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
                    const now = new Date()
                    const diffTime = Math.abs(now.getTime() - date.getTime())
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return `${diffDays} days ago`
                  } catch {
                    return 'Unknown'
                  }
                }

                // Get condition color
                const getConditionColor = (condition?: string) => {
                  if (!condition) return 'bg-gray-900 text-gray-300'
                  const cond = condition.toLowerCase()
                  if (cond.includes('new') || cond.includes('ny')) return 'bg-green-900 text-green-300'
                  if (cond.includes('like new') || cond.includes('som ny')) return 'bg-blue-900 text-blue-300'
                  if (cond.includes('good') || cond.includes('bra')) return 'bg-yellow-900 text-yellow-300'
                  if (cond.includes('fair') || cond.includes('ok')) return 'bg-orange-900 text-orange-300'
                  return 'bg-red-900 text-red-300'
                }

                return (
                  <div key={listing.id || index} className="grid grid-cols-12 gap-2 py-6pt pr-8pt border-b border-border-subtle hover:bg-brand-darker hover:bg-opacity-50 transition-colors">
                    <div className="col-span-5 pl-0">
                      <p className="text-10pt font-medium text-text-primary truncate" title={listing.title}>
                        {listing.title || 'Untitled listing'}
                      </p>
                      {listing.id && (
                        <p className="text-9pt text-text-secondary">ID: {listing.id}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <p className="text-10pt font-bold text-text-primary">
                        {listing.price || 'Price not available'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      {listing.condition && listing.condition.toLowerCase() !== 'unknown' && (
                        <span className={`text-9pt px-4pt py-1pt rounded ${getConditionColor(listing.condition)}`}>
                          {listing.condition}
                        </span>
                      )}
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