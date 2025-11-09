'use client'

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import { StackItem } from './StackItem'
import { apiClient } from '@/lib/api-client'
import { TagSuggestion, Tag } from '@/lib/types'

export interface TagSearchRef {
  focus: () => void
}

interface TagSearchProps {
  brand: string                    // Required - only show when brand selected
  selectedTags: Tag[]              // For API scoping
  excludedTags: Tag[]              // For API scoping
  onTagInclude: (suggestion: TagSuggestion) => void
  onTagExclude: (suggestion: TagSuggestion) => void
  // Search state management (controlled by parent)
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  suggestions: TagSuggestion[]
  isLoadingSuggestions: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export const TagSearch = forwardRef<TagSearchRef, TagSearchProps>(function TagSearch({
  brand,
  selectedTags,
  excludedTags,
  onTagInclude,
  onTagExclude,
  searchQuery,
  onSearchQueryChange,
  suggestions,
  isLoadingSuggestions,
  onKeyDown
}, ref) {
  // State for focus management
  const [isFocused, setIsFocused] = useState(false)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  // Auto-focus the input when component mounts and brand is available (desktop only)
  useEffect(() => {
    if (brand && inputRef.current) {
      // Check if device is mobile - prevent auto-focus on mobile to avoid keyboard popup
      const isMobile = typeof window !== 'undefined' && (
        window.matchMedia('(max-width: 768px)').matches ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      )

      if (!isMobile) {
        inputRef.current.focus()
      }
    }
  }, [brand])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onSearchQueryChange(value)
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true)
  }

  // Handle input blur
  const handleInputBlur = () => {
    setIsFocused(false)
  }

  // Handle form submission (prevent default but don't do anything special)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // If we have search text and suggestions, select first one
    if (searchQuery.trim() && suggestions.length > 0) {
      const firstSuggestion = suggestions[0]
      onTagInclude(firstSuggestion)
      onSearchQueryChange('') // Clear search
    }
  }

  // Don't render if no brand selected
  if (!brand) {
    return null
  }

  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className={`bg-brand-darker ${
        isFocused || searchQuery.trim() ? 'border-2 border-border-active' : 'border-2 border-transparent'
      }`}>
        <div className="py-8pt px-12pt flex justify-between items-start font-sf-pro w-full">
          <div className="flex flex-col gap-0 flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={onKeyDown}
              placeholder="search tags..."
              className="text-20pt font-medium text-text-primary bg-transparent border-none outline-none placeholder-text-secondary placeholder:font-light leading-1.2 m-0 w-full"
            />
          </div>
          {isLoadingSuggestions && (
            <div className="text-10pt font-normal text-text-primary flex-shrink-0 ml-15pt self-center">
              Searching
            </div>
          )}
        </div>
      </form>
    </div>
  )
})