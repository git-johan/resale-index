// Hook for fetching brand data with caching
// Uses the apiClient to fetch and manage brand data

import { useState, useEffect } from 'react'
import { BrandData, Tag } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

export interface UseBrandDataOptions {
  selectedTags: Tag[]
  excludedTags: Tag[]
}

export interface UseBrandDataReturn {
  data: BrandData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useBrandData(
  brand: string,
  options: UseBrandDataOptions
): UseBrandDataReturn {
  const [data, setData] = useState<BrandData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!brand || typeof brand !== 'string' || !brand.trim()) {
      setData(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const rawData = await apiClient.getBrandData(brand, options)

      // Keep all tags (exclusions will be ranked at bottom instead of filtered out)
      const allTags = rawData.tags || []

      // Update tag states based on current selections
      const tagsWithState = allTags.map(tag => {
        const isSelected = options.selectedTags.some(t => t.name === tag.name)
        const isExcluded = options.excludedTags.some(t => t.name === tag.name)

        let state: 'included' | 'excluded' | 'unselected' = 'unselected'
        if (isSelected) state = 'included'
        else if (isExcluded) state = 'excluded'

        return { ...tag, state }
      })

      setData({
        ...rawData,
        tags: tagsWithState
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brand data')
      console.error('Error fetching brand data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when brand or tag selections change
  useEffect(() => {
    fetchData()
  }, [brand, options.selectedTags, options.excludedTags])

  const refetch = () => {
    fetchData()
  }

  return {
    data,
    loading,
    error,
    refetch
  }
}