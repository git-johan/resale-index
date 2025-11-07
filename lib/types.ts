// TypeScript interfaces for the unified StackItem component system

export type StackItemVariant =
  | 'brand-search'
  | 'brand'
  | 'brand-searching'
  | 'selected-included'
  | 'selected-excluded'
  | 'unselected'
  | 'estimate'
  | 'subtitle'

export type ActionType = 'include' | 'exclude' | 'link'

export interface Action {
  type: ActionType
  text?: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
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

export interface Listing {
  id?: string
  title?: string
  price?: string
  condition?: string
  date?: string
  lastUpdatedAt?: string
  url?: string
  image?: string
  brand?: string
  tags?: string[]
}

export interface BrandSuggestion {
  name: string
  listing_count: number
}

export interface TagSuggestion {
  name: string
  listing_count: number
}

export interface BrandData {
  brand: string
  listingsCount: number
  tags: Tag[]
  listings: Listing[]
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

// Detailed listings types for "See all details" functionality
export interface DetailedListingsState {
  loading: boolean
  error: string | null
  listings: Listing[]
  totalCount: number
  lastFetched: Date | null
}

export interface DetailedBrandData extends BrandData {
  detailedListings: DetailedListingsState
}

// API response types for detailed listings
export interface DetailedListingsResponse {
  listings: Listing[]
  stats: {
    listing_count: string
    median_price: string
    p25_price: string
    p75_price: string
    average_price?: string
    volume?: string
  }
  tags: Array<{
    tag_name: string
    listing_count: string
    median_price: string
    p25_price: string
    p75_price: string
    average_price?: string
    volume?: string
    listings?: Listing[]
  }>
}

// Loading states for UI components
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}