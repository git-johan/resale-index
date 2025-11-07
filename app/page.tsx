'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StackItem } from '@/components/StackItem'
import { ExpandedDetailsView } from '@/components/ExpandedDetailsView'
import { useTagSelection } from '@/hooks/useTagSelection'
import { useBrandData } from '@/hooks/useBrandData'
import { rankTags, formatTagDisplay, calculatePriceImpactScore, calculateSimilarityPenalty } from '@/lib/tag-ranking'
import { apiClient } from '@/lib/api-client'
import { Listing, AsyncState } from '@/lib/types'

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [brandInput, setBrandInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isEstimateExpanded, setIsEstimateExpanded] = useState(false)
  const [estimateStickyMode, setEstimateStickyMode] = useState<'tags' | 'top'>('tags')

  // URL tag selection state
  const [urlTagError, setUrlTagError] = useState<string | null>(null)
  const [pendingUrlTags, setPendingUrlTags] = useState<{included: string[], excluded: string[]}>({included: [], excluded: []})

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

  const {
    brand,
    setBrand,
    selectedTags,
    excludedTags,
    includeTag,
    excludeTag,
    unselectTag,
    clearBrand
  } = useTagSelection()

  const { data, loading, error } = useBrandData(brand, { selectedTags, excludedTags })

  // Read URL parameters on mount
  useEffect(() => {
    const urlBrand = searchParams.get('brand')
    const urlTags = searchParams.get('tags')
    const urlExclude = searchParams.get('exclude')

    // Set brand
    if (urlBrand && typeof urlBrand === 'string') {
      setBrand(urlBrand.toLowerCase())
      setBrandInput(urlBrand.toLowerCase())
    }

    // Parse tag parameters
    const includedTagNames = urlTags ?
      urlTags.split(',').map(tag => decodeURIComponent(tag.trim())).filter(Boolean) : []
    const excludedTagNames = urlExclude ?
      urlExclude.split(',').map(tag => decodeURIComponent(tag.trim())).filter(Boolean) : []

    // Store pending tags for later processing when brand data loads
    if (includedTagNames.length > 0 || excludedTagNames.length > 0) {
      setPendingUrlTags({
        included: includedTagNames,
        excluded: excludedTagNames
      })
    }
  }, [searchParams, setBrand])

  // Process pending URL tags when brand data loads
  useEffect(() => {
    if (!data?.tags || !pendingUrlTags.included.length && !pendingUrlTags.excluded.length) {
      return
    }

    const invalidTags: string[] = []
    const validIncludedTags: typeof data.tags = []
    const validExcludedTags: typeof data.tags = []

    // Match included tag names to Tag objects
    pendingUrlTags.included.forEach(tagName => {
      const matchedTag = data.tags.find(tag =>
        tag.name.toLowerCase() === tagName.toLowerCase()
      )
      if (matchedTag) {
        validIncludedTags.push(matchedTag)
      } else {
        invalidTags.push(tagName)
      }
    })

    // Match excluded tag names to Tag objects
    // Note: excluded tags may not be found in the response since they are excluded by design
    pendingUrlTags.excluded.forEach(tagName => {
      const matchedTag = data.tags.find(tag =>
        tag.name.toLowerCase() === tagName.toLowerCase()
      )
      if (matchedTag) {
        validExcludedTags.push(matchedTag)
      }
      // Don't add excluded tags to invalidTags - they may be missing by design
    })

    // Apply valid tag selections
    validIncludedTags.forEach(tag => includeTag(tag))
    validExcludedTags.forEach(tag => excludeTag(tag))

    // Show error for invalid included tags only
    if (invalidTags.length > 0) {
      setUrlTagError(`Some included tags not found for ${brand}: ${invalidTags.join(', ')}`)
      setTimeout(() => setUrlTagError(null), 5000) // Auto-dismiss after 5 seconds
    }

    // Clear pending tags
    setPendingUrlTags({included: [], excluded: []})
  }, [data?.tags, pendingUrlTags, includeTag, excludeTag, brand])

  // Update URL when brand or tag selections change (real-time sync)
  useEffect(() => {
    const params = new URLSearchParams()

    // Add brand parameter
    if (brand) {
      params.set('brand', brand)
    }

    // Add tags parameter (included tags)
    if (selectedTags.length > 0) {
      const encodedTags = selectedTags
        .map(tag => encodeURIComponent(tag.name))
        .join(',')
      params.set('tags', encodedTags)
    }

    // Add exclude parameter (excluded tags)
    if (excludedTags.length > 0) {
      const encodedExcludeTags = excludedTags
        .map(tag => encodeURIComponent(tag.name))
        .join(',')
      params.set('exclude', encodedExcludeTags)
    }

    // Update URL with debouncing to prevent excessive history entries
    const timeoutId = setTimeout(() => {
      const newUrl = params.toString()
      const currentUrl = searchParams.toString()
      if (newUrl !== currentUrl) {
        router.replace(`?${newUrl}`, { scroll: false })
      }
    }, 100) // 100ms debounce

    return () => clearTimeout(timeoutId)
  }, [brand, selectedTags, excludedTags, router, searchParams])

  const handleBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (brandInput && typeof brandInput === 'string' && brandInput.trim()) {
      setBrand(brandInput.trim().toLowerCase())
      setIsEditing(false)
    }
  }

  const handleClearBrand = () => {
    clearBrand()
    setBrandInput('')
    setIsEditing(true)
    setIsEstimateExpanded(false)
  }

  const handleBrandClick = () => {
    setIsEditing(true)
    setBrandInput(brand || '')
  }

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
    if (willExpand && detailedListings.data === null && !detailedListings.loading && brand) {
      loadDetailedListings()
    }
  }

  // Handle estimate panel sticky mode changes
  const handleEstimateStickyModeChange = (mode: 'tags' | 'top') => {
    setEstimateStickyMode(mode)
  }

  // Load detailed listings
  const loadDetailedListings = useCallback(async () => {
    if (!brand) return

    setDetailedListings(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('Loading detailed listings for:', brand, { selectedTags, excludedTags })
      const response = await apiClient.getDetailedListings(brand, { selectedTags, excludedTags })

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
  }, [brand, selectedTags, excludedTags])

  // Clear detailed listings when brand or tag selections change
  useEffect(() => {
    setDetailedListings({ data: null, loading: false, error: null })
  }, [brand, selectedTags, excludedTags])

  // Measure brand height dynamically
  useEffect(() => {
    if (brandRef.current) {
      setBrandHeight(brandRef.current.offsetHeight)
    }
  }, [brand, isEditing, loading]) // Re-measure when brand content changes

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-brand-dark">
      {!isEstimateExpanded ? (
        <>
          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto">
            {/* Unified Brand Component */}
            <div ref={brandRef} className="sticky top-0 z-20 bg-brand-dark">
          {!brand || isEditing ? (
            // Input State: Direct inline editing
            <form onSubmit={handleBrandSubmit} className="border-b border-border-subtle bg-brand-darker">
              <div className="py-8pt px-12pt flex justify-between items-start font-sf-pro w-full">
                <div className="flex flex-col gap-0 flex-1 min-w-0">
                  <input
                    type="text"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    placeholder="enter brand"
                    className="text-20pt font-bold text-text-primary bg-transparent border-none outline-none placeholder-text-secondary leading-1.2 m-0 w-full"
                    autoFocus={isEditing}
                    onBlur={() => {
                      if (!brandInput.trim()) {
                        setIsEditing(false)
                      }
                    }}
                  />
                </div>
              </div>
            </form>
          ) : (
            // Results State: Brand name + listings + clear
            <StackItem
              variant="brand"
              content={brand}
              onClick={handleBrandClick}
              actions={[
                {
                  type: 'link',
                  text: 'Clear',
                  onClick: handleClearBrand,
                  title: `Clear ${brand} filter`,
                  disabled: loading
                }
              ]}
            />
          )}
            </div>

            {/* Tags Section - Always visible */}
            <div
              ref={selectedTagsRef}
              className={`sticky z-10 ${(selectedTags.length > 0 || excludedTags.length > 0) ? 'bg-brand-darker' : ''}`}
              style={{ top: `${brandHeight}px` }}
            >
              {/* Tags section header - always visible */}
              <StackItem
                variant="subtitle"
                content={loading ? "Loading tags..." : "Tags"}
              />

              {/* Selected Tags - only when they exist */}
              {selectedTags.map(tag => {
            // Calculate score for this selected tag using current estimate baseline
            const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
            const otherSelectedTags = selectedTags.filter(t => t.name !== tag.name)
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

          {excludedTags.map(tag => {
            // Calculate score for this excluded tag using current estimate baseline
            const currentEstimate = parseFloat((data?.stats?.estimate || '0 kr').replace(/[^\d.]/g, '')) || 0
            const otherSelectedTags = selectedTags // Exclude tags don't count each other for similarity
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

            {/* URL Tag Error */}
      {urlTagError && (
        <div className="sticky top-0 z-40 bg-brand-dark border-b border-red-900">
          <div className="py-8pt px-12pt bg-red-900 bg-opacity-20">
            <p className="text-11pt font-normal text-red-400">{urlTagError}</p>
          </div>
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
            {data && data.tags && !loading && (
              <div>
          {rankTags(
              data.tags.filter(tag => tag.state === 'unselected'),
              selectedTags,
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
          </div>

          {/* Footer Section - Estimate */}
          {data?.stats && (
            <div className="flex-shrink-0">
              {/* Estimate section header */}
              <div className="border-t border-border-subtle bg-brand-darker">
                <StackItem
                  variant="subtitle"
                  content="Estimate"
                />
              </div>

              {/* Estimate card */}
              <div>
              <StackItem
                variant="estimate"
                content={data.stats.estimate}
                details={`${data.stats.estimateRange} • ${data.listingsCount.toLocaleString('nb-NO')} listings`}
                onClick={handleEstimateToggle}
                actions={[
                  {
                    type: 'link',
                    text: 'See all details',
                    onClick: handleEstimateToggle,
                    title: 'Show estimate details'
                  }
                ]}
              />
              </div>
            </div>
          )}
        </>
      ) : (
        data?.stats && (
          <ExpandedDetailsView
                brand={brand}
                onClearBrand={handleClearBrand}
                selectedTags={selectedTags}
                excludedTags={excludedTags}
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-dark flex items-center justify-center text-text-primary">Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}