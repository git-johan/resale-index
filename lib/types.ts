// TypeScript interfaces for the unified StackItem component system

export type StackItemVariant =
  | 'brand-search'
  | 'brand'
  | 'brand-searching'
  | 'selected-included'
  | 'selected-excluded'
  | 'unselected'
  | 'estimate'

export type ActionType = 'include' | 'exclude' | 'link'

export interface Action {
  type: ActionType
  text?: string
  onClick: () => void
  active?: boolean
  title?: string
}

export interface StackItemProps {
  variant: StackItemVariant
  content: string
  details?: string
  actions?: Action[]
  className?: string
  onClick?: () => void
}

export interface Tag {
  name: string
  price_range?: string
  state: 'included' | 'excluded' | 'unselected'
  // Additional fields for ranking algorithm
  listing_count?: number
  median_price?: number
  p25_price?: number
  p75_price?: number
  color?: string
}

export interface BrandData {
  brand: string
  listingsCount: number
  tags: Tag[]
  stats: {
    estimate: string
    estimateRange: string
    originalBrandEstimate?: number
  }
}

export interface TagOptions {
  selectedTags: Tag[]
  excludedTags: Tag[]
}