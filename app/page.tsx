'use client'

import { useState, useEffect, useCallback, useRef, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StackItem } from '@/components/StackItem'
import { BrandSearch, BrandSearchRef } from '@/components/BrandSearch'
import { TagSearch, TagSearchRef } from '@/components/TagSearch'
import { ExpandedDetailsView } from '@/components/ExpandedDetailsView'
import { useQueryState } from '@/hooks/useQueryState'
import { useTagSearch } from '@/hooks/useTagSearch'
import { rankTags, formatTagDisplay, calculatePriceImpactScore, getScoreColor } from '@/lib/tag-ranking'
import { apiClient } from '@/lib/api-client'
import { Listing, AsyncState, TagSuggestion, Tag } from '@/lib/types'

function HomePageContent() {
  const [isEstimateExpanded, setIsEstimateExpanded] = useState(false)
  const [estimateStickyMode, setEstimateStickyMode] = useState<'tags' | 'top'>('tags')

  // Preserve previous stats while new data loads to prevent black screen
  const [preservedStats, setPreservedStats] = useState<any>(null)

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

  // Ref for BrandSearch component to control focus
  const brandSearchComponentRef = useRef<BrandSearchRef>(null)

  // Helper function to detect mobile devices
  const isMobileDevice = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 768px)').matches ||
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  // Use simplified query state
  const {
    query,
    results: { data, loading, error },
    setBrand,
    clearBrand: originalClearBrand,
    includeTag,
    excludeTag,
    unselectTag
  } = useQueryState()

  // Custom clearBrand that focuses brand search after clearing (desktop only)
  const clearBrand = useCallback(() => {
    originalClearBrand()

    // Focus brand search input after clearing (desktop only)
    if (!isMobileDevice()) {
      setTimeout(() => {
        brandSearchComponentRef.current?.focus()
      }, 0)
    }
  }, [originalClearBrand, isMobileDevice])

  // Unified tag search state
  const tagSearch = useTagSearch({
    brand: query.brand,
    selectedTags: query.includedTags,
    excludedTags: query.excludedTags,
    onTagInclude: undefined, // Will be set below
    onTagExclude: undefined, // Will be set below
    onUnselectTag: unselectTag,
    onClearBrand: clearBrand,
    currentEstimate: data?.stats?.estimate || '0 kr',
    maxResults: 10
  })

  // Helper functions for tag search integration with automatic search clearing
  const handleTagIncludeFromSearch = useCallback((suggestion: TagSuggestion) => {
    // Calculate score for new tag based on current estimate
    const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
    const medianPrice = parseFloat(suggestion.median_price || '0')

    let rankScore: number | undefined = undefined
    let color: string | undefined = undefined
    if (currentEstimate > 0 && medianPrice > 0) {
      rankScore = calculatePriceImpactScore(medianPrice, currentEstimate)
      color = getScoreColor(rankScore)
    }

    const tag: Tag = {
      name: suggestion.tag_name,
      state: 'unselected',
      listing_count: parseInt(suggestion.listing_count || '0'),
      median_price: medianPrice,
      p25_price: parseFloat(suggestion.p25_price || '0'),
      p75_price: parseFloat(suggestion.p75_price || '0'),
      price_range: `${suggestion.p25_price || 0}-${suggestion.p75_price || 0}kr`,
      isSearchResult: true,
      rankScore: rankScore,
      color: color
    }
    includeTag(tag)
    // Clear search field after adding tag
    tagSearch.actions.clearSearch()
    // Refocus input for next search (desktop only)
    if (!isMobileDevice()) {
      setTimeout(() => tagSearchComponentRef.current?.focus(), 0)
    }
  }, [includeTag, data?.stats?.estimate, query.includedTags, tagSearch.actions, isMobileDevice])

  const handleTagExcludeFromSearch = useCallback((suggestion: TagSuggestion) => {
    // Calculate score for new tag based on current estimate
    const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
    const medianPrice = parseFloat(suggestion.median_price || '0')

    let rankScore: number | undefined = undefined
    let color: string | undefined = undefined
    if (currentEstimate > 0 && medianPrice > 0) {
      rankScore = calculatePriceImpactScore(medianPrice, currentEstimate)
      color = getScoreColor(rankScore)
    }

    const tag: Tag = {
      name: suggestion.tag_name,
      state: 'unselected',
      listing_count: parseInt(suggestion.listing_count || '0'),
      median_price: medianPrice,
      p25_price: parseFloat(suggestion.p25_price || '0'),
      p75_price: parseFloat(suggestion.p75_price || '0'),
      price_range: `${suggestion.p25_price || 0}-${suggestion.p75_price || 0}kr`,
      isSearchResult: true,
      rankScore: rankScore,
      color: color
    }
    excludeTag(tag)
    // Clear search field after adding tag
    tagSearch.actions.clearSearch()
    // Refocus input for next search (desktop only)
    if (!isMobileDevice()) {
      setTimeout(() => tagSearchComponentRef.current?.focus(), 0)
    }
  }, [excludeTag, data?.stats?.estimate, query.includedTags, tagSearch.actions, isMobileDevice])

  // Debug logging for loading state
  console.log('🖥️ Page render - loading:', loading, 'data:', !!data, 'query.brand:', query.brand)

  // Clear detailed listings when query changes
  useEffect(() => {
    setDetailedListings({ data: null, loading: false, error: null })
  }, [query])

  // Only close expanded view when brand changes, not when tags change
  useEffect(() => {
    setIsEstimateExpanded(false)
    setPreservedStats(null) // Clear preserved stats when brand changes
  }, [query.brand])


  // Preserve stats when available to prevent black screen during reloads
  useEffect(() => {
    if (data?.stats) {
      setPreservedStats(data.stats)
    }
  }, [data?.stats])

  // Get current stats for rendering (use preserved if current is null)
  const currentStats = data?.stats || (isEstimateExpanded ? preservedStats : null)

  // Helper function to calculate score for selected tags
  const calculateTagScore = (tag: any, originalEstimate: number) => {
    return calculatePriceImpactScore(tag.median_price || 0, originalEstimate)
  }

  // Load detailed listings function
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

  // Auto-reload detailed listings when tags change while in expanded view
  useEffect(() => {
    if (isEstimateExpanded && query.brand && data?.stats) {
      // Small delay to let the main data load first
      const timeoutId = setTimeout(async () => {
        if (!query.brand) return

        setDetailedListings(prev => ({ ...prev, loading: true, error: null }))

        try {
          console.log('Auto-reloading detailed listings for:', query.brand, { selectedTags: query.includedTags, excludedTags: query.excludedTags })
          const response = await apiClient.getDetailedListings(query.brand, {
            selectedTags: query.includedTags,
            excludedTags: query.excludedTags
          })

          setDetailedListings({
            data: response.listings,
            loading: false,
            error: null
          })

          console.log('Auto-reloaded detailed listings:', response.listings.length)
        } catch (error) {
          console.error('Failed to auto-reload detailed listings:', error)
          setDetailedListings({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load detailed listings'
          })
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [query.includedTags, query.excludedTags, isEstimateExpanded, query.brand, data?.stats])

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

  // Old search logic has been moved to the unified useTagSearch hook

  // Old tag conversion and handlers have been moved to the unified useTagSearch hook

  // Focus tag search when brand is selected (desktop only)
  useEffect(() => {
    if (query.brand && tagSearchComponentRef.current && !isMobileDevice()) {
      setTimeout(() => {
        tagSearchComponentRef.current?.focus()
      }, 100) // Small delay to ensure component is mounted
    }
  }, [query.brand, isMobileDevice])

  // Create merged tag list combining search results with main tag list
  const mergedTagList = useMemo(() => {
    if (!query.brand) return []

    // If no main data loaded yet, return empty (show loading)
    if (!data?.tags) return []

    // Get filtered and ranked main tag list
    const mainTagList = rankTags(
      data.tags.filter(tag => tag.state === 'unselected'),
      query.includedTags,
      data.stats?.estimate || '0 kr',
      undefined,
      'listing_count' // Use listing count for main list to maintain current behavior
    )

    // Get ranked search suggestions from unified hook
    const rankedSearchTags = tagSearch.rankedSuggestions
    const isSearchActive = tagSearch.state.query.trim().length > 0

    // If user is not searching, just return main tags
    if (!isSearchActive) {
      return mainTagList.map(tag => ({ ...tag, isSearchResult: false }))
    }

    // If user is searching, merge search results with main tags
    const mergedTags: Tag[] = []
    const addedTagNames = new Set<string>()

    // Add ranked search results first
    rankedSearchTags.forEach(tag => {
      // Try to find matching tag in main list for better data
      const mainListMatch = mainTagList.find(mainTag =>
        mainTag.name.toLowerCase() === tag.name.toLowerCase()
      )

      if (mainListMatch && mainListMatch.median_price && tag.median_price && mainListMatch.median_price > tag.median_price) {
        // Use main list data if it has more complete/better price data, but mark as search result
        mergedTags.push({
          ...mainListMatch,
          isSearchResult: true
        })
      } else {
        // Use search result data (already transformed and ranked)
        mergedTags.push(tag)
      }

      addedTagNames.add(tag.name.toLowerCase())
    })

    // Add remaining main list tags (excluding duplicates)
    mainTagList.forEach(tag => {
      if (!addedTagNames.has(tag.name.toLowerCase())) {
        mergedTags.push({ ...tag, isSearchResult: false })
      }
    })

    return mergedTags
  }, [data?.tags, query.brand, query.includedTags, tagSearch.rankedSuggestions, tagSearch.state.query, data?.stats?.estimate])

  // Combined loading state - show loading until both main data and search suggestions are ready
  const isCombinedLoading = useMemo(() => {
    // If user is searching and we have a brand
    if (tagSearch.state.query.trim() && query.brand) {
      // Show loading if main data is loading OR tag suggestions are loading/pending
      return loading || tagSearch.isCombinedLoading
    }
    // If not searching, just show main data loading
    return loading
  }, [loading, tagSearch.isCombinedLoading, tagSearch.state.query, query.brand])

  // Use unified keyboard navigation from hook (handles all keyboard logic internally)

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-brand-dark">
      {!isEstimateExpanded ? (
        <>
          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Header with T Symbol and Text - Scrolls away */}
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

            {/* Unified Brand Component - Stays sticky on scroll */}
            <div ref={brandRef} className="sticky top-0 z-20">
              <BrandSearch
                ref={brandSearchComponentRef}
                loading={loading}
                brand={query.brand}
                setBrand={setBrand}
                clearBrand={clearBrand}
              />
            </div>

            {/* Selected Tags - Scrollable below brand in chronological order */}
            {(query.includedTags.length > 0 || query.excludedTags.length > 0) && (
              <div
                ref={selectedTagsRef}
                className="bg-brand-darker"
              >
                {/* Create unified chronological list of all selected tags */}
                {[...query.includedTags, ...query.excludedTags]
                  .sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0)) // Sort by timestamp
                  .map(tag => {
                    // Use stored score if available, otherwise calculate score using current estimate baseline
                    let tagScore = tag.rankScore

                    if (tagScore === undefined) {
                      const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
                      tagScore = currentEstimate > 0 ? calculateTagScore(tag, currentEstimate) : undefined
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
                        onClick={() => isIncluded ? unselectTag(tag) : includeTag(tag)}
                        actions={[
                          {
                            type: 'include',
                            onClick: () => isIncluded ? unselectTag(tag) : includeTag(tag),
                            title: isIncluded ? `Unselect ${tag.name}` : `Include ${tag.name}`,
                            active: isIncluded
                          },
                          {
                            type: 'exclude',
                            onClick: () => isExcluded ? unselectTag(tag) : excludeTag(tag),
                            title: isExcluded ? `Unselect ${tag.name}` : `Exclude ${tag.name}`,
                            active: isExcluded
                          }
                        ]}
                      />
                    )
                  })}
              </div>
            )}

            {/* Tag Search - Sticky below brand */}
            {query.brand && (
              <div ref={tagSearchRef} className="sticky z-10" style={{ top: `${brandHeight}px` }}>
                <TagSearch
                  ref={tagSearchComponentRef}
                  brand={query.brand}
                  selectedTags={query.includedTags}
                  excludedTags={query.excludedTags}
                  onTagInclude={handleTagIncludeFromSearch}
                  onTagExclude={handleTagExcludeFromSearch}
                  searchQuery={tagSearch.state.query}
                  onSearchQueryChange={tagSearch.actions.setQuery}
                  suggestions={tagSearch.state.suggestions}
                  isLoadingSuggestions={tagSearch.isCombinedLoading}
                  onKeyDown={tagSearch.actions.handleKeyDown}
                />
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

            {/* Loading state for main tag fetching */}
            {isCombinedLoading && query.brand && (
              <div className="py-12pt px-12pt">
                <div className="text-text-secondary text-14pt">
                  Loading tags...
                </div>
              </div>
            )}

            {/* Unified Tag List - Merged search results and main tags */}
            {!isCombinedLoading && mergedTagList.length > 0 && (
              <div>
                {mergedTagList.map((tag, index) => {
                  // Check if this tag is from search results
                  const isSearchResult = tag.isSearchResult

                  // Click handlers use direct tag inclusion/exclusion
                  const handleClick = () => {
                    includeTag(tag)
                    // Clear search only if this was a search result tag
                    if (tag.isSearchResult) {
                      tagSearch.actions.clearSearch()
                    }
                    // Refocus for next search (desktop only)
                    if (!isMobileDevice()) {
                      setTimeout(() => tagSearchComponentRef.current?.focus(), 0)
                    }
                  }

                  const handleExcludeClick = () => {
                    excludeTag(tag)
                    // Clear search only if this was a search result tag
                    if (tag.isSearchResult) {
                      tagSearch.actions.clearSearch()
                    }
                    // Refocus for next search (desktop only)
                    if (!isMobileDevice()) {
                      setTimeout(() => tagSearchComponentRef.current?.focus(), 0)
                    }
                  }

                  return (
                    <StackItem
                      key={`merged-${tag.name}-${index}`}
                      variant="unselected"
                      content={tag.name}
                      details={formatTagDisplay(tag, tag.rankScore)}
                      className={tag.color || ''}
                      onClick={handleClick}
                      actions={[
                        {
                          type: 'include',
                          onClick: handleClick,
                          title: `Include ${tag.name}`
                        },
                        {
                          type: 'exclude',
                          onClick: handleExcludeClick,
                          title: `Exclude ${tag.name}`
                        }
                      ]}
                    />
                  )
                })}
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
          {currentStats && (
            <div className="flex-shrink-0">
              {/* Estimate section - two StackItems side by side */}
              <div className="border-t border-border-subtle bg-brand-darker flex">
                {/* Left: Estimate value and details */}
                <div className="flex-1">
                  <StackItem
                    variant="estimate"
                    content={currentStats.estimate}
                    details={`${currentStats.estimateRange} • ${data?.listingsCount?.toLocaleString('nb-NO') || 0} listings`}
                    onClick={handleEstimateToggle}
                  />
                </div>

                {/* Right: Details button with same styling as estimate */}
                <div className="flex-shrink-0">
                  <StackItem
                    variant="estimate"
                    content="Details"
                    onClick={handleEstimateToggle}
                    className="text-right"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        currentStats && (
          <ExpandedDetailsView
                brand={query.brand || ''}
                onClearBrand={clearBrand}
                selectedTags={query.includedTags}
                excludedTags={query.excludedTags}
                onUnselectTag={unselectTag}
                onIncludeTag={includeTag}
                onExcludeTag={excludeTag}
                stats={currentStats}
                listingsCount={data?.listingsCount || 0}
                listings={detailedListings.data || []}
                detailedListingsLoading={detailedListings.loading}
                detailedListingsError={detailedListings.error}
                onLoadDetailedListings={loadDetailedListings}
                onClose={handleEstimateToggle}
                // Tag search props
                tagSearchQuery={tagSearch.state.query}
                onTagSearchQueryChange={tagSearch.actions.setQuery}
                tagSearchSuggestions={tagSearch.state.suggestions}
                isLoadingTagSuggestions={tagSearch.isCombinedLoading}
                onTagInclude={handleTagIncludeFromSearch}
                onTagExclude={handleTagExcludeFromSearch}
                onTagSearchKeyDown={tagSearch.actions.handleKeyDown}
              />
        )
      )}
    </div>
  )
}


export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-dark flex items-center justify-center text-text-primary">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}