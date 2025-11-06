'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StackItem } from '@/components/StackItem'
import { useTagSelection } from '@/hooks/useTagSelection'
import { useBrandData } from '@/hooks/useBrandData'
import { rankTags, formatTagDisplay, calculatePriceImpactScore, calculateSimilarityPenalty } from '@/lib/tag-ranking'

function HomePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [brandInput, setBrandInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)

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
    if (urlBrand && typeof urlBrand === 'string') {
      setBrand(urlBrand.toLowerCase())
      setBrandInput(urlBrand.toLowerCase())
    }
  }, [searchParams, setBrand])

  // Update URL when brand changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (brand) {
      params.set('brand', brand)
    } else {
      params.delete('brand')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [brand, router, searchParams])

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
    setIsEditing(false)
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

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Unified Brand Component - Fixed Header */}
      <div className="sticky top-0 z-50 bg-brand-dark">
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
        ) : loading ? (
          // Searching State: Brand name + "searching" on the right
          <div className="border-b border-border-subtle py-8pt px-12pt flex justify-between items-center font-sf-pro w-full text-20pt font-bold text-text-primary bg-brand-darker" onClick={handleBrandClick}>
            <h3 className="leading-1.2 m-0">{brand}</h3>
            <p className="text-10pt font-normal text-text-secondary">searching</p>
          </div>
        ) : (
          // Results State: Brand name + listings + clear
          <div className="border-b border-border-subtle py-8pt px-12pt flex justify-between items-center font-sf-pro w-full bg-brand-darker" onClick={handleBrandClick}>
            <div className="flex items-center gap-15pt">
              <h3 className="text-20pt font-bold text-text-primary leading-1.2 m-0">{brand}</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleClearBrand()
              }}
              className="text-10pt font-normal text-text-secondary underline hover:text-text-primary transition-colors"
              title={`Clear ${brand} filter`}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Selected Tags - Fixed under brand */}
      {(selectedTags.length > 0 || excludedTags.length > 0) && (
        <div className="sticky top-[50px] z-30 bg-brand-dark border-b border-border-subtle">
          {selectedTags.map(tag => {
            // Calculate score for this selected tag using original brand baseline
            const originalEstimate = data?.stats?.originalBrandEstimate || 0
            const otherSelectedTags = selectedTags.filter(t => t.name !== tag.name)
            const tagScore = originalEstimate > 0 ? calculateTagScore(tag, originalEstimate, otherSelectedTags) : undefined

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
            // Calculate score for this excluded tag using original brand baseline
            const originalEstimate = data?.stats?.originalBrandEstimate || 0
            const otherSelectedTags = selectedTags // Exclude tags don't count each other for similarity
            const tagScore = originalEstimate > 0 ? calculateTagScore(tag, originalEstimate, otherSelectedTags) : undefined

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
        <div className="pb-32">
          {rankTags(
              data.tags.filter(tag => tag.state === 'unselected'),
              selectedTags,
              data.stats?.estimate || '0 kr',
              data.stats?.originalBrandEstimate
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

      {/* Estimate - Fixed Bottom */}
      {data?.stats && (
        <div className="fixed bottom-0 left-0 right-0 z-20 py-8pt px-12pt flex justify-between items-center font-sf-pro w-full bg-brand-darker border-t border-border-subtle">
          <h3 className="text-20pt font-bold text-text-primary leading-1.2 m-0">{data.stats.estimate}</h3>
          <div className="flex flex-col items-end gap-1 text-right">
            <p className="text-10pt font-normal text-text-secondary leading-1.2 m-0">{data.stats.estimateRange}</p>
            <p className="text-10pt font-normal text-text-secondary leading-1.2 m-0">{(data?.listingsCount || 0).toLocaleString('nb-NO')} listings</p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Show estimate details')
              }}
              className="text-10pt font-normal text-text-secondary underline hover:text-text-primary cursor-pointer transition-colors"
              title="Show estimate details"
            >
              See all details
            </a>
          </div>
        </div>
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