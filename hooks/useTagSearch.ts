// Unified Tag Search Hook
// Consolidates all tag search state and logic into a single source of truth

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Tag, TagSuggestion } from '@/lib/types'
import { apiClient } from '@/lib/api-client'
import { rankTags } from '@/lib/tag-ranking'

export interface TagSearchState {
  query: string
  suggestions: TagSuggestion[]
  isLoading: boolean
  isPending: boolean
  selectedIndex: number
}

export interface TagSearchActions {
  setQuery: (query: string) => void
  handleKeyDown: (e: React.KeyboardEvent) => void
  clearSearch: () => void
  resetSelection: () => void
}

export interface UseTagSearchOptions {
  brand: string | null
  selectedTags: Tag[]
  excludedTags: Tag[]
  onTagInclude?: (suggestion: TagSuggestion) => void
  onTagExclude?: (suggestion: TagSuggestion) => void
  onUnselectTag?: (tag: Tag) => void
  onClearBrand?: () => void
  currentEstimate?: string
  maxResults?: number
}

export interface UseTagSearchReturn {
  state: TagSearchState
  actions: TagSearchActions
  rankedSuggestions: Tag[]
  isCombinedLoading: boolean
}

// Debounce utility
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

// Helper function to convert TagSuggestion to Tag
function suggestionToTag(suggestion: TagSuggestion): Tag {
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
}

export function useTagSearch(options: UseTagSearchOptions): UseTagSearchReturn {
  const {
    brand,
    selectedTags,
    excludedTags,
    onTagInclude,
    onTagExclude,
    onUnselectTag,
    onClearBrand,
    currentEstimate = '0 kr',
    maxResults = 10
  } = options

  // Unified search state
  const [state, setState] = useState<TagSearchState>({
    query: '',
    suggestions: [],
    isLoading: false,
    isPending: false,
    selectedIndex: -1
  })

  // Debounced API fetching
  const debouncedFetchSuggestions = useCallback(
    debounce(async (queryString: string) => {
      if (!queryString.trim() || !brand) {
        setState(prev => ({
          ...prev,
          suggestions: [],
          isLoading: false,
          isPending: false
        }))
        return
      }

      setState(prev => ({ ...prev, isPending: false, isLoading: true }))

      try {
        const results = await apiClient.getTagSuggestions(
          queryString,
          brand,
          selectedTags,
          excludedTags
        )

        // Frontend filtering as safety net - exclude already selected/excluded tags
        const selectedTagNames = new Set(selectedTags.map(tag => tag.name.toLowerCase()))
        const excludedTagNames = new Set(excludedTags.map(tag => tag.name.toLowerCase()))

        const filteredResults = results.filter(tag =>
          !selectedTagNames.has(tag.tag_name.toLowerCase()) &&
          !excludedTagNames.has(tag.tag_name.toLowerCase())
        )

        setState(prev => ({
          ...prev,
          suggestions: filteredResults.slice(0, maxResults),
          isLoading: false
        }))
      } catch (error) {
        console.error('Failed to fetch tag suggestions:', error)
        setState(prev => ({
          ...prev,
          suggestions: [],
          isLoading: false
        }))
      }
    }, 200),
    [brand, selectedTags, excludedTags, maxResults]
  )

  // Query change handler
  const setQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      query,
      selectedIndex: -1,
      isPending: query.trim() ? true : false
    }))

    debouncedFetchSuggestions(query)
  }, [debouncedFetchSuggestions])

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Backspace':
        // If search field is empty, handle tag/brand removal
        if (state.query === '') {
          e.preventDefault()
          // First priority: remove tags if any exist
          if (selectedTags.length > 0 || excludedTags.length > 0) {
            // Create unified list and find the most recently added tag by timestamp
            const allTags = [...selectedTags, ...excludedTags]
            const mostRecentTag = allTags.reduce((latest, tag) => {
              return (!latest.addedAt || (tag.addedAt && tag.addedAt > latest.addedAt)) ? tag : latest
            }, allTags[0])

            onUnselectTag?.(mostRecentTag)
          } else if (brand) {
            // If no tags, clear brand
            onClearBrand?.()
          }
        }
        break

      case 'Escape':
        // Just clear any selection state, but don't interfere with search
        setState(prev => ({
          ...prev,
          selectedIndex: -1
        }))
        break
    }
  }, [state.query, selectedTags, excludedTags, brand, onUnselectTag, onClearBrand])


  // Clear search
  const clearSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      query: '',
      suggestions: [],
      selectedIndex: -1,
      isPending: false,
      isLoading: false
    }))
  }, [])

  // Reset selection (for external use)
  const resetSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: -1
    }))
  }, [])

  // Clear search when brand changes
  useEffect(() => {
    if (!brand) {
      clearSearch()
    }
  }, [brand, clearSearch])

  // Reset selected index when suggestions change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      selectedIndex: -1
    }))
  }, [state.suggestions.length, state.query])

  // Create ranked suggestions for display
  const rankedSuggestions = useMemo(() => {
    if (!state.suggestions.length || !currentEstimate) return []

    // Convert suggestions to Tag objects
    const searchTags = state.suggestions.map(suggestionToTag)

    // Apply ranking algorithm for consistent scoring
    const rankedTags = rankTags(
      searchTags,
      selectedTags,
      currentEstimate,
      undefined,
      'listing_count' // Use listing count ordering for search results
    )

    return rankedTags
  }, [state.suggestions, selectedTags, currentEstimate])

  // Combined loading state
  const isCombinedLoading = useMemo(() => {
    if (state.query.trim() && brand) {
      return state.isLoading || state.isPending
    }
    return false
  }, [state.isLoading, state.isPending, state.query, brand])

  const actions: TagSearchActions = {
    setQuery,
    handleKeyDown,
    clearSearch,
    resetSelection
  }

  return {
    state,
    actions,
    rankedSuggestions,
    isCombinedLoading
  }
}