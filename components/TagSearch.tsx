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
  // Refs
  const inputRef = useRef<HTMLInputElement>(null)

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
    }
  }))

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onSearchQueryChange(value)
  }

  // Handle form submission (prevent default but don't do anything special)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  // Don't render if no brand selected
  if (!brand) {
    return null
  }

  // Determine status text
  const statusText = isLoadingSuggestions ? 'Loading...' : ''

  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="border-b border-border-subtle">
        <div className="py-8pt px-12pt flex justify-between items-start font-sf-pro w-full">
          <div className="flex flex-col gap-0 flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              placeholder="search tags..."
              className="text-20pt font-medium text-text-primary bg-transparent border-none outline-none placeholder-text-secondary leading-1.2 m-0 w-full"
            />
            {statusText && (
              <span className="text-10pt font-light text-text-secondary leading-1.2">
                {statusText}
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  )
})