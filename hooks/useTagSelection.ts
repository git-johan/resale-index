// Hook for managing tag selection state
// Extracted from vanilla JS app.js logic

import { useState, useCallback } from 'react'
import { Tag } from '@/lib/types'

export interface UseTagSelectionReturn {
  brand: string
  setBrand: (brand: string) => void
  selectedTags: Tag[]
  excludedTags: Tag[]
  includeTag: (tag: Tag) => void
  excludeTag: (tag: Tag) => void
  unselectTag: (tag: Tag) => void
  clearBrand: () => void
  clearAllTags: () => void
  getTagState: (tagName: string) => 'included' | 'excluded' | 'unselected'
}

export function useTagSelection(initialBrand?: string): UseTagSelectionReturn {
  const [brand, setBrandState] = useState(initialBrand || '')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [excludedTags, setExcludedTags] = useState<Tag[]>([])

  // Set brand and clear existing tags if brand is changing
  const setBrand = useCallback((newBrand: string) => {
    const normalizedNewBrand = newBrand.toLowerCase().trim()
    const normalizedCurrentBrand = brand.toLowerCase().trim()

    // Only clear tags if we're actually changing to a different brand
    if (normalizedNewBrand !== normalizedCurrentBrand && normalizedCurrentBrand !== '') {
      setSelectedTags([])
      setExcludedTags([])
    }

    setBrandState(normalizedNewBrand)
  }, [brand])

  // Include a tag (add to selected, remove from excluded)
  const includeTag = useCallback((tag: Tag) => {
    setSelectedTags(prev => {
      // Remove if already exists, then add with included state
      const filtered = prev.filter(t => t.name !== tag.name)
      return [...filtered, { ...tag, state: 'included' }]
    })
    setExcludedTags(prev => prev.filter(t => t.name !== tag.name))
  }, [])

  // Exclude a tag (add to excluded, remove from selected)
  const excludeTag = useCallback((tag: Tag) => {
    setExcludedTags(prev => {
      // Remove if already exists, then add with excluded state
      const filtered = prev.filter(t => t.name !== tag.name)
      return [...filtered, { ...tag, state: 'excluded' }]
    })
    setSelectedTags(prev => prev.filter(t => t.name !== tag.name))
  }, [])

  // Unselect a tag (remove from both selected and excluded)
  const unselectTag = useCallback((tag: Tag) => {
    setSelectedTags(prev => prev.filter(t => t.name !== tag.name))
    setExcludedTags(prev => prev.filter(t => t.name !== tag.name))
  }, [])

  // Clear brand and all tags
  const clearBrand = useCallback(() => {
    setBrandState('')
    setSelectedTags([])
    setExcludedTags([])
  }, [])

  // Clear all tag selections but keep brand
  const clearAllTags = useCallback(() => {
    setSelectedTags([])
    setExcludedTags([])
  }, [])

  // Get the current state of a specific tag
  const getTagState = useCallback((tagName: string): 'included' | 'excluded' | 'unselected' => {
    if (selectedTags.some(t => t.name === tagName)) return 'included'
    if (excludedTags.some(t => t.name === tagName)) return 'excluded'
    return 'unselected'
  }, [selectedTags, excludedTags])

  return {
    brand,
    setBrand,
    selectedTags,
    excludedTags,
    includeTag,
    excludeTag,
    unselectTag,
    clearBrand,
    clearAllTags,
    getTagState
  }
}