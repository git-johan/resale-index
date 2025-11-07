'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StackItem } from '@/components/StackItem'
import { BrandSearch } from '@/components/BrandSearch'
import { TagSearch, TagSearchRef } from '@/components/TagSearch'
import { ExpandedDetailsView } from '@/components/ExpandedDetailsView'
import { SectionTitle } from '@/components/SectionTitle'
import { useQueryState } from '@/hooks/useQueryState'
import { rankTags, formatTagDisplay, calculatePriceImpactScore, calculateSimilarityPenalty } from '@/lib/tag-ranking'
import { apiClient } from '@/lib/api-client'
import { Listing, AsyncState, TagSuggestion, Tag } from '@/lib/types'

function HomePageContent() {
  const [isEstimateExpanded, setIsEstimateExpanded] = useState(false)
  const [estimateStickyMode, setEstimateStickyMode] = useState<'tags' | 'top'>('tags')

  // Detailed listings state
  const [detailedListings, setDetailedListings] = useState<AsyncState<Listing[]>>({
    data: null,
    loading: false,
    error: null
  })

  // Ref for measuring selected tags position for estimate expansion
  const selectedTagsRef = useRef<HTMLDivElement>(null)

  // Ref and state for dynamic brand height measurement
  const brandRef = useRef<HTMLDivElement>(null)
  const [brandHeight, setBrandHeight] = useState(50) // fallback value

  // Ref and state for dynamic selected tags height measurement
  const [selectedTagsHeight, setSelectedTagsHeight] = useState(0) // 0 when no selected tags

  // Ref and state for dynamic tag search height measurement
  const tagSearchRef = useRef<HTMLDivElement>(null)
  const [tagSearchHeight, setTagSearchHeight] = useState(0) // 0 when not visible

  // Ref for TagSearch component to control focus
  const tagSearchComponentRef = useRef<TagSearchRef>(null)

  // Tag search state
  const [tagSearchQuery, setTagSearchQuery] = useState('')
  const [tagSearchSuggestions, setTagSearchSuggestions] = useState<TagSuggestion[]>([])
  const [isLoadingTagSuggestions, setIsLoadingTagSuggestions] = useState(false)
  const [isPendingTagSuggestions, setIsPendingTagSuggestions] = useState(false)
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1)

  // Use simplified query state
  const {
    query,
    results: { data, loading, error },
    setBrand,
    clearBrand,
    includeTag,
    excludeTag,
    unselectTag
  } = useQueryState()

  // Debug logging for loading state
  console.log('🖥️ Page render - loading:', loading, 'data:', !!data, 'query.brand:', query.brand)

  // Clear detailed listings when query changes
  useEffect(() => {
    setDetailedListings({ data: null, loading: false, error: null })
    setIsEstimateExpanded(false)
  }, [query])

  // Helper function to calculate score for selected tags
  const calculateTagScore = (tag: any, originalEstimate: number, otherSelectedTags: any[]) => {
    const priceImpactScore = calculatePriceImpactScore(tag.median_price || 0, originalEstimate)
    const similarityPenalty = calculateSimilarityPenalty(tag.name, otherSelectedTags)
    return Math.max(-10, Math.min(10, priceImpactScore + similarityPenalty))
  }

  // Handle estimate panel expansion
  const handleEstimateToggle = () => {
    const willExpand = !isEstimateExpanded
    setIsEstimateExpanded(willExpand)

    // Auto-load detailed listings when opening expanded view
    if (willExpand && detailedListings.data === null && !detailedListings.loading && query.brand) {
      loadDetailedListings()
    }
  }

  // Handle estimate panel sticky mode changes
  const handleEstimateStickyModeChange = (mode: 'tags' | 'top') => {
    setEstimateStickyMode(mode)
  }

  // Load detailed listings
  const loadDetailedListings = useCallback(async () => {
    if (!query.brand) return

    setDetailedListings(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('Loading detailed listings for:', query.brand, { selectedTags: query.includedTags, excludedTags: query.excludedTags })
      const response = await apiClient.getDetailedListings(query.brand, {
        selectedTags: query.includedTags,
        excludedTags: query.excludedTags
      })

      setDetailedListings({
        data: response.listings,
        loading: false,
        error: null
      })

      console.log('Loaded detailed listings:', response.listings.length)
    } catch (error) {
      console.error('Failed to load detailed listings:', error)
      setDetailedListings({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load detailed listings'
      })
    }
  }, [query.brand, query.includedTags, query.excludedTags])


  // Measure brand height dynamically
  useEffect(() => {
    if (brandRef.current) {
      setBrandHeight(brandRef.current.offsetHeight)
    }
  }, [query.brand, loading]) // Re-measure when brand content changes

  // Measure selected tags height dynamically
  useEffect(() => {
    if (selectedTagsRef.current && (query.includedTags.length > 0 || query.excludedTags.length > 0)) {
      setSelectedTagsHeight(selectedTagsRef.current.offsetHeight)
    } else {
      setSelectedTagsHeight(0) // No height when no selected tags
    }
  }, [query.includedTags, query.excludedTags, loading]) // Re-measure when tags change

  // Measure tag search height dynamically
  useEffect(() => {
    if (tagSearchRef.current && query.brand) {
      setTagSearchHeight(tagSearchRef.current.offsetHeight)
    } else {
      setTagSearchHeight(0) // No height when not visible
    }
  }, [query.brand, loading]) // Re-measure when brand changes

  // Debounced API call for tag autocomplete
  const debouncedFetchTagSuggestions = useCallback(
    debounce(async (queryString: string) => {
      if (!queryString.trim() || !query.brand) {
        setTagSearchSuggestions([])
        setIsPendingTagSuggestions(false)
        return
      }

      // Clear pending state when debounce completes and API call starts
      setIsPendingTagSuggestions(false)
      setIsLoadingTagSuggestions(true)
      try {
        const results = await apiClient.getTagSuggestions(queryString, query.brand, query.includedTags, query.excludedTags)
        setTagSearchSuggestions(results)
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error)
        setTagSearchSuggestions([])
      } finally {
        setIsLoadingTagSuggestions(false)
      }
    }, 50),
    [query.brand, query.includedTags, query.excludedTags]
  )

  // Handle tag search query changes
  const handleTagSearchQueryChange = useCallback((newQuery: string) => {
    setTagSearchQuery(newQuery)

    // Set pending state immediately if user is typing meaningful input
    if (newQuery.trim()) {
      setIsPendingTagSuggestions(true)
    } else {
      setIsPendingTagSuggestions(false)
    }

    debouncedFetchTagSuggestions(newQuery)
  }, [debouncedFetchTagSuggestions])

  // Helper function to convert TagSuggestion to Tag
  const suggestionToTag = useCallback((suggestion: TagSuggestion): Tag => ({
    name: suggestion.name,
    state: 'unselected' as const,
    listing_count: suggestion.listing_count,
    price_range: `${suggestion.listing_count} listings`,
  }), [])

  // Handle tag include from search
  const handleTagInclude = useCallback((suggestion: TagSuggestion) => {
    const tag = suggestionToTag(suggestion)
    includeTag(tag)
  }, [includeTag, suggestionToTag])

  // Handle tag exclude from search
  const handleTagExclude = useCallback((suggestion: TagSuggestion) => {
    const tag = suggestionToTag(suggestion)
    excludeTag(tag)
    // Clear search after selection and focus input for more searching
    setTagSearchQuery('')
    setTagSearchSuggestions([])
    setSelectedResultIndex(-1)
    // Focus tag search for continued searching
    setTimeout(() => {
      tagSearchComponentRef.current?.focus()
    }, 0)
  }, [excludeTag, suggestionToTag])

  // Update include handler to also clear search and focus
  const handleTagIncludeUpdated = useCallback((suggestion: TagSuggestion) => {
    const tag = suggestionToTag(suggestion)
    includeTag(tag)
    // Clear search after selection and focus input for more searching
    setTagSearchQuery('')
    setTagSearchSuggestions([])
    setSelectedResultIndex(-1)
    // Focus tag search for continued searching
    setTimeout(() => {
      tagSearchComponentRef.current?.focus()
    }, 0)
  }, [includeTag, suggestionToTag])

  // Focus tag search when brand is selected
  useEffect(() => {
    if (query.brand && tagSearchComponentRef.current) {
      setTimeout(() => {
        tagSearchComponentRef.current?.focus()
      }, 100) // Small delay to ensure component is mounted
    }
  }, [query.brand])

  // Handle keyboard navigation for search results
  const handleTagSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    const visibleSuggestions = tagSearchSuggestions.slice(0, 3)

    if (visibleSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedResultIndex(prev =>
          prev < visibleSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedResultIndex(prev =>
          prev > 0 ? prev - 1 : visibleSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedResultIndex >= 0 && selectedResultIndex < visibleSuggestions.length) {
          handleTagIncludeUpdated(visibleSuggestions[selectedResultIndex])
        }
        break
      case 'Escape':
        setSelectedResultIndex(-1)
        setTagSearchSuggestions([])
        setTagSearchQuery('')
        break
    }
  }, [tagSearchSuggestions, selectedResultIndex, handleTagIncludeUpdated])

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedResultIndex(-1)
  }, [tagSearchSuggestions])

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-brand-dark">
      {!isEstimateExpanded ? (
        <>
          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Unified Brand Component */}
            <div ref={brandRef} className="sticky top-0 z-20">
              <BrandSearch
                loading={loading}
                brand={query.brand}
                setBrand={setBrand}
                clearBrand={clearBrand}
              />
            </div>

            {/* Selected Tags - Sticky below brand */}
            {(query.includedTags.length > 0 || query.excludedTags.length > 0) && (
              <div
                ref={selectedTagsRef}
                className="sticky bg-brand-darker z-15"
                style={{ top: `${brandHeight}px` }}
              >
                {query.includedTags.map(tag => {
                  // Calculate score for this selected tag using current estimate baseline
                  const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
                  const otherSelectedTags = query.includedTags.filter(t => t.name !== tag.name)
                  const tagScore = currentEstimate > 0 ? calculateTagScore(tag, currentEstimate, otherSelectedTags) : undefined

                  return (
                    <StackItem
                      key={`selected-${tag.name}`}
                      variant="selected-included"
                      content={tag.name}
                      details={formatTagDisplay(tag, tagScore)}
                      className={tag.color}
                      onClick={() => unselectTag(tag)}
                      actions={[
                        {
                          type: 'include',
                          onClick: () => unselectTag(tag),
                          title: `Unselect ${tag.name}`,
                          active: true
                        },
                        {
                          type: 'exclude',
                          onClick: () => excludeTag(tag),
                          title: `Exclude ${tag.name}`
                        }
                      ]}
                    />
                  )
                })}

                {query.excludedTags.map(tag => {
                  // Calculate score for this excluded tag using current estimate baseline
                  const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
                  const otherSelectedTags = query.includedTags // Exclude tags don't count each other for similarity
                  const tagScore = currentEstimate > 0 ? calculateTagScore(tag, currentEstimate, otherSelectedTags) : undefined

                  return (
                    <StackItem
                      key={`excluded-${tag.name}`}
                      variant="selected-excluded"
                      content={tag.name}
                      details={formatTagDisplay(tag, tagScore)}
                      className={tag.color}
                      onClick={() => includeTag(tag)}
                      actions={[
                        {
                          type: 'include',
                          onClick: () => includeTag(tag),
                          title: `Include ${tag.name}`
                        },
                        {
                          type: 'exclude',
                          onClick: () => unselectTag(tag),
                          title: `Unselect ${tag.name}`,
                          active: true
                        }
                      ]}
                    />
                  )
                })}
              </div>
            )}

            {/* Tag Search - Sticky below selected tags */}
            {query.brand && (
              <div ref={tagSearchRef} className="sticky z-10" style={{ top: `${brandHeight + selectedTagsHeight}px` }}>
                <TagSearch
                  ref={tagSearchComponentRef}
                  brand={query.brand}
                  selectedTags={query.includedTags}
                  excludedTags={query.excludedTags}
                  onTagInclude={handleTagIncludeUpdated}
                  onTagExclude={handleTagExclude}
                  searchQuery={tagSearchQuery}
                  onSearchQueryChange={handleTagSearchQueryChange}
                  suggestions={tagSearchSuggestions}
                  isLoadingSuggestions={isLoadingTagSuggestions}
                  onKeyDown={handleTagSearchKeyDown}
                />
              </div>
            )}

            {/* Tag Search Results - Inline below tag search */}
            {query.brand && tagSearchSuggestions.length > 0 && (
              <div>
                {tagSearchSuggestions.slice(0, 3).map((suggestion, index) => (
                  <StackItem
                    key={suggestion.name}
                    variant="unselected"
                    content={suggestion.name}
                    details={`${suggestion.listing_count} listings`}
                    onClick={() => handleTagIncludeUpdated(suggestion)}
                    className={index === selectedResultIndex ? 'bg-brand-darker' : ''}
                    actions={[
                      {
                        type: 'include',
                        onClick: () => handleTagIncludeUpdated(suggestion),
                        title: `Include ${suggestion.name}`
                      },
                      {
                        type: 'exclude',
                        onClick: () => handleTagExclude(suggestion),
                        title: `Exclude ${suggestion.name}`
                      }
                    ]}
                  />
                ))}
              </div>
            )}

      {/* Error State */}
      {error && (
        <div className="pt-32 px-15pt">
          <div className="p-15pt text-red-400 bg-red-900 bg-opacity-20 rounded-md">
            <p className="text-18pt font-300">Error loading data:</p>
            <p className="text-11pt font-300 mt-8pt">{error}</p>
          </div>
        </div>
      )}

            {/* Unselected Tags - Scrollable */}
            {!loading && data && data.tags && (
              <div>
          {rankTags(
              data.tags.filter(tag => tag.state === 'unselected'),
              query.includedTags,
              data.stats?.estimate || '0 kr',
              undefined,
              'listing_count'
            ).map(tag => (
              <StackItem
                key={`unselected-${tag.name}`}
                variant="unselected"
                content={tag.name}
                details={tag.price_range}
                className={tag.color}
                onClick={() => includeTag(tag)}
                actions={[
                  {
                    type: 'include',
                    onClick: () => includeTag(tag),
                    title: `Include ${tag.name}`
                  },
                  {
                    type: 'exclude',
                    onClick: () => excludeTag(tag),
                    title: `Exclude ${tag.name}`
                  }
                ]}
              />
            ))}
              </div>
            )}

            {/* Show message when no tags available */}
            {!loading && (!data || !data.tags || data.tags.length === 0) && query.brand && (
              <div className="py-12pt px-12pt">
                <div className="text-text-secondary text-14pt">
                  No tags found for "{query.brand}"
                </div>
              </div>
            )}
          </div>

          {/* Footer Section - Estimate */}
          {data?.stats && (
            <div className="flex-shrink-0 group">
              {/* Estimate section header with aligned action */}
              <SectionTitle
                title="Estimate"
                action={{
                  text: 'See all details',
                  onClick: handleEstimateToggle
                }}
                showTopBorder
                enableGroupHover
              />

              {/* Estimate card */}
              <div>
                <StackItem
                  variant="estimate"
                  content={data.stats.estimate}
                  details={`${data.stats.estimateRange} • ${data.listingsCount.toLocaleString('nb-NO')} listings`}
                  onClick={handleEstimateToggle}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        data?.stats && (
          <ExpandedDetailsView
                brand={query.brand || ''}
                onClearBrand={clearBrand}
                selectedTags={query.includedTags}
                excludedTags={query.excludedTags}
                onUnselectTag={unselectTag}
                onIncludeTag={includeTag}
                onExcludeTag={excludeTag}
                stats={data.stats}
                listingsCount={data.listingsCount}
                listings={detailedListings.data || []}
                detailedListingsLoading={detailedListings.loading}
                detailedListingsError={detailedListings.error}
                onLoadDetailedListings={loadDetailedListings}
                onClose={handleEstimateToggle}
              />
        )
      )}
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-dark flex items-center justify-center text-text-primary">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}