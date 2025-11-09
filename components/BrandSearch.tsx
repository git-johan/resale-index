'use client'

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { StackItem } from './StackItem'
import { apiClient } from '@/lib/api-client'
import { BrandSuggestion } from '@/lib/types'

export interface BrandSearchRef {
  focus: () => void
}

interface BrandSearchProps {
  loading?: boolean
  brand: string | null
  setBrand: (brand: string) => void
  clearBrand: () => void
}

export const BrandSearch = forwardRef<BrandSearchRef, BrandSearchProps>(function BrandSearch({
  loading = false,
  brand,
  setBrand,
  clearBrand
}, ref) {
  // Derive brandSearchActive from props - simple!
  const brandSearchActive = brand === null

  // Local input state for typing
  const [inputValue, setInputValue] = useState('')

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [isPendingSuggestions, setIsPendingSuggestions] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  // Debounced API call for autocomplete
  const debouncedFetchSuggestions = useCallback(
    debounce(async (queryString: string) => {
      if (!queryString.trim()) {
        setSuggestions([])
        setShowDropdown(false)
        setIsPendingSuggestions(false)
        return
      }

      // Clear pending state when debounce completes and API call starts
      setIsPendingSuggestions(false)
      setIsLoadingSuggestions(true)
      try {
        const results = await apiClient.getBrandSuggestions(queryString)
        // Limit to top 10 results
        setSuggestions(results.slice(0, 10))
        setShowDropdown(results.length > 0)
      } catch (error) {
        console.error('Failed to fetch brand suggestions:', error)
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setIsLoadingSuggestions(false)
      }
    }, 200),
    []
  )

  // Handle input changes - simple input behavior, no complex state clearing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    // Set pending state immediately if user is typing meaningful input
    if (value.trim()) {
      setIsPendingSuggestions(true)
    } else {
      setIsPendingSuggestions(false)
    }

    debouncedFetchSuggestions(value)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Don't submit while pending suggestions (debounce) or loading suggestions (API call)
    if (isPendingSuggestions || isLoadingSuggestions) {
      return
    }

    // Only allow submission if input matches an existing suggestion exactly
    const exactMatch = suggestions.find(s => s.brand.toLowerCase() === inputValue.trim().toLowerCase())
    if (exactMatch) {
      handleSuggestionSelect(exactMatch)
    }
    // No fallback - only validated brand names from suggestions are allowed
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: BrandSuggestion) => {
    setBrand(suggestion.brand)
    setInputValue('')
    setShowDropdown(false)
  }


  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowDropdown(false)
      }, 150)
  }

  // Handle brand click (to edit)
  const handleBrandClick = () => {
    // Populate input with current brand, then clear brand (which clears tags)
    setInputValue(brand || '')
    clearBrand()
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Handle input focus
  const handleInputFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowDropdown(true)
    }
  }


  return (
    <div ref={containerRef} className="sticky top-0 z-20 bg-brand-dark">
      {brandSearchActive ? (
        // Input State: Search with autocomplete
        <div className="relative">
          <form onSubmit={handleSubmit} className="bg-brand-darker" style={{ boxShadow: 'inset 0 0 0 2pt rgba(232, 232, 232, 0.1)' }}>
            <div className="py-8pt px-12pt flex justify-between items-start font-sf-pro w-full">
              <div className="flex flex-col gap-0 flex-1 min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  placeholder="add brand"
                  className={`text-20pt font-normal bg-transparent border-none outline-none placeholder-text-secondary leading-1.2 m-0 w-full ${
                    (isPendingSuggestions || isLoadingSuggestions)
                      ? 'text-text-secondary cursor-wait'
                      : 'text-text-primary'
                  }`}
                  autoFocus={brandSearchActive}
                />
              </div>
              {(isPendingSuggestions || isLoadingSuggestions) && (
                <div className="text-10pt font-normal text-text-primary flex-shrink-0 ml-15pt self-center">
                  searching
                </div>
              )}
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 z-30 bg-brand-darker"
              style={{ boxShadow: 'inset 2pt 0 0 0 rgba(232, 232, 232, 0.1), inset -2pt 0 0 0 rgba(232, 232, 232, 0.1), inset 0 -2pt 0 0 rgba(232, 232, 232, 0.1)' }}
            >
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.brand}
                  className="py-8pt px-12pt flex justify-between items-center font-sf-pro w-full text-20pt transition-colors duration-200 cursor-pointer font-normal text-text-secondary hover:font-semibold hover:text-text-primary hover:bg-black"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-center gap-10pt flex-1 min-w-0">
                    <h3 className="leading-1.2 m-0">
                      {suggestion.brand}
                    </h3>
                    <div className="flex flex-col items-start text-left">
                      <div className="text-10pt font-light leading-1.2 text-text-secondary">
                        {parseInt(suggestion.listing_count || '0').toLocaleString()} listings
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-8pt ml-15pt flex-shrink-0 items-start">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleSuggestionSelect(suggestion)
                      }}
                      className="text-10pt font-normal transition-colors duration-200 flex-shrink-0 text-text-primary cursor-pointer hover:underline"
                    >
                      select
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Results State: Selected brand with clear action
        <StackItem
          variant="brand"
          content={brand || ''}
          onClick={handleBrandClick}
          actions={[
            {
              type: 'link',
              text: 'clear',
              onClick: clearBrand,
              title: `Clear ${brand} filter`,
              disabled: loading
            }
          ]}
        />
      )}
    </div>
  )
})

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