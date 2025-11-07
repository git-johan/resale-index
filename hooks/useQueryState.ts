// Simplified state management hook for brand search and tag selection
// Single source of truth without URL complexity

import { useState, useEffect, useCallback } from 'react'
import { Tag, BrandData, AsyncState } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

export interface QueryState {
  brand: string | null
  includedTags: Tag[]
  excludedTags: Tag[]
}

export interface UseQueryStateReturn {
  // Query state (what we send to API)
  query: QueryState

  // Results state (what we get from API)
  results: AsyncState<BrandData>

  // Actions
  setBrand: (brand: string) => void
  clearBrand: () => void
  includeTag: (tag: Tag) => void
  excludeTag: (tag: Tag) => void
  unselectTag: (tag: Tag) => void
  clearQuery: () => void
}

const initialQuery: QueryState = {
  brand: null,
  includedTags: [],
  excludedTags: []
}

const initialResults: AsyncState<BrandData> = {
  data: null,
  loading: false,
  error: null
}

export function useQueryState(): UseQueryStateReturn {
  // ===== QUERY STATE (User Intent) =====
  const [query, setQuery] = useState<QueryState>(initialQuery)

  // ===== RESULTS STATE (API Response) =====
  const [results, setResults] = useState<AsyncState<BrandData>>(initialResults)

  // ===== DATA FETCHING LOGIC =====
  const fetchBrandData = useCallback(async (currentQuery: QueryState) => {
    console.log('🔄 fetchBrandData called with:', currentQuery)

    // STEP 1: Handle empty brand case
    if (!currentQuery.brand) {
      console.log('❌ No brand, clearing results')
      setResults(initialResults)
      return
    }

    // STEP 2: Set loading state immediately
    console.log('⏳ Setting loading to true for brand:', currentQuery.brand)
    setResults(prev => ({
      data: null,        // Clear old data
      loading: true,
      error: null
    }))

    try {
      // STEP 3: Make API call
      console.log('🌐 Calling API for brand:', currentQuery.brand)
      const rawData = await apiClient.getBrandData(currentQuery.brand, {
        selectedTags: currentQuery.includedTags,
        excludedTags: currentQuery.excludedTags
      })

      // STEP 4: Transform data (add tag states)
      const tagsWithState = rawData.tags.map(tag => {
        const isSelected = currentQuery.includedTags.some(t => t.name === tag.name)
        const isExcluded = currentQuery.excludedTags.some(t => t.name === tag.name)

        let state: 'included' | 'excluded' | 'unselected' = 'unselected'
        if (isSelected) state = 'included'
        else if (isExcluded) state = 'excluded'

        return { ...tag, state }
      })

      console.log('✅ API success, tags found:', tagsWithState.length)
      console.log('📊 Raw data structure:', { hasStats: !!rawData.stats, hasListingsCount: !!rawData.listingsCount })

      // STEP 5: Update results state
      setResults({
        data: { ...rawData, tags: tagsWithState },
        loading: false,
        error: null
      })

      console.log('✅ Results state updated, loading set to false')
    } catch (err) {
      console.error('❌ API Error:', err)
      setResults({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data'
      })
    }
  }, [])

  // ===== EFFECTS (When query changes, update results) =====
  useEffect(() => {
    fetchBrandData(query)
  }, [query.brand, query.includedTags, query.excludedTags, fetchBrandData])

  // ===== ACTIONS (User Intent Updates) =====
  const setBrand = useCallback((brand: string) => {
    const normalizedBrand = brand.toLowerCase().trim()

    const newQuery: QueryState = {
      brand: normalizedBrand,
      includedTags: [],      // Clear tags when changing brand
      excludedTags: []       // Clear tags when changing brand
    }
    setQuery(newQuery)
  }, [])

  const clearBrand = useCallback(() => {
    console.log('🧹 Clearing brand and all state')
    setQuery(initialQuery)
    setResults(initialResults)
  }, [])

  const includeTag = useCallback((tag: Tag) => {
    console.log('➕ Including tag:', tag.name)
    setQuery(prev => ({
      ...prev,
      includedTags: [...prev.includedTags.filter(t => t.name !== tag.name), { ...tag, state: 'included' }],
      excludedTags: prev.excludedTags.filter(t => t.name !== tag.name)  // Remove from excluded
    }))
  }, [])

  const excludeTag = useCallback((tag: Tag) => {
    console.log('➖ Excluding tag:', tag.name)
    setQuery(prev => ({
      ...prev,
      excludedTags: [...prev.excludedTags.filter(t => t.name !== tag.name), { ...tag, state: 'excluded' }],
      includedTags: prev.includedTags.filter(t => t.name !== tag.name)  // Remove from included
    }))
  }, [])

  const unselectTag = useCallback((tag: Tag) => {
    console.log('❌ Unselecting tag:', tag.name)
    setQuery(prev => ({
      ...prev,
      includedTags: prev.includedTags.filter(t => t.name !== tag.name),
      excludedTags: prev.excludedTags.filter(t => t.name !== tag.name)
    }))
  }, [])

  const clearQuery = useCallback(() => {
    console.log('🧹 Clearing entire query and results')
    setQuery(initialQuery)
    setResults(initialResults)
  }, [])

  return {
    query,
    results,
    setBrand,
    clearBrand,
    includeTag,
    excludeTag,
    unselectTag,
    clearQuery
  }
}