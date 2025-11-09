// Pure Price Impact Tag Ranking Algorithm
// Ranks tags based on price impact relative to current estimate

import { Tag } from './types'
import { isTagExcluded } from './exclusions'

interface TagWithScore extends Tag {
  rankScore: number
  priceImpactPercentage: number  // Raw percentage for sorting within buckets
  color?: string
}


/**
 * Calculate price impact score (-10 to +10 points) - Pure price impact with truly exceptional +10
 */
function calculatePriceImpactScore(tagMedianPrice: number, currentEstimate: number): number {
  if (currentEstimate === 0) return 0

  const percentageChange = ((tagMedianPrice - currentEstimate) / currentEstimate) * 100

  // Map percentage changes - +10 is truly exceptional (5x+ price increase)
  if (percentageChange >= 400) return 10     // Truly exceptional (+400%+ / 5x price)
  if (percentageChange >= 200) return 8      // Very rare/expensive (+200% to +400% / 3x-5x)
  if (percentageChange >= 100) return 6      // Premium items (+100% to +200% / 2x-3x)
  if (percentageChange >= 50) return 4       // High-end (+50% to +100% / 1.5x-2x)
  if (percentageChange >= 20) return 2       // Moderate premium (+20% to +50%)
  if (percentageChange >= -20) return 0      // Neutral (±20%)
  if (percentageChange >= -50) return -2     // Moderate discount (-20% to -50%)
  if (percentageChange >= -60) return -4     // High discount (-50% to -60%)
  if (percentageChange >= -70) return -6     // Very high discount (-60% to -70%)
  if (percentageChange >= -80) return -8     // Extreme discount (-70% to -80%)
  return -10                                 // Truly exceptional discount (-80%+ / 1/10th price)
}



/**
 * Calculate overall score for a tag (-10 to +10) - Pure price impact only
 * Returns raw price impact percentage for sorting within buckets
 */
function calculateTagScore(
  tag: Tag,
  currentEstimate: number
): { score: number; priceImpactPercentage: number } {
  const tagMedianPrice = tag.median_price || 0
  const priceImpactScore = calculatePriceImpactScore(tagMedianPrice, currentEstimate)

  // Calculate raw price impact percentage for sorting
  const priceImpactPercentage = currentEstimate === 0 ? 0
    : ((tagMedianPrice - currentEstimate) / currentEstimate) * 100

  // Pure price impact score only
  return {
    score: Math.max(-10, Math.min(10, priceImpactScore)),
    priceImpactPercentage: Math.abs(priceImpactPercentage) // Use absolute value for sorting
  }
}

/**
 * Get text color based on rank score
 */
function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600 font-semibold'   // Exceptional positive (dark green)
  if (score >= 5) return 'text-green-500 font-medium'     // High positive (green)
  if (score >= 2) return 'text-green-400'                 // Medium positive (light green)
  if (score >= -1) return 'text-gray-400'                 // Neutral (gray)
  if (score >= -4) return 'text-orange-400'               // Medium negative (light orange)
  if (score >= -7) return 'text-orange-500 font-medium'   // High negative (orange)
  return 'text-red-500 font-semibold'                     // Exceptional negative (red)
}

/**
 * Format listing count in a readable way (e.g., 9.9k, 1.2k)
 */
function formatListingCount(count: number): string {
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return count.toString()
}

/**
 * Format tag display information with score, price range (p25-p75), and listing count
 */
export function formatTagDisplay(tag: Tag, score?: number): string {
  const scoreText = score !== undefined
    ? (score >= 0 ? `+${score.toFixed(1)}` : `${score.toFixed(1)}`)
    : null

  const p25Price = tag.p25_price || 0
  const p75Price = tag.p75_price || 0
  const listingCount = tag.listing_count || 0

  const parts = []
  if (scoreText) parts.push(scoreText)

  // Only show price range if we have meaningful price data
  if (p25Price > 0 || p75Price > 0) {
    parts.push(`${p25Price}-${p75Price}kr`)
  }

  parts.push(`${formatListingCount(listingCount)} listings`)

  return parts.join(' | ')
}

/**
 * Extract core terms from a tag name, removing common modifiers
 */
function extractCoreTerms(tagName: string): string[] {
  const name = tagName.toLowerCase().trim()
  // Split into words and filter out very short words and pure numbers
  const words = name.split(/[\s\-_]+/).filter(word =>
    word.length > 2 &&
    !/^\d+$/.test(word) // Remove pure numbers
  )
  return words
}

/**
 * Check if two tags share the same core product (e.g., both are alphafly variants)
 */
function sharesCoreProduct(tag1: TagWithScore, tag2: TagWithScore): boolean {
  const terms1 = extractCoreTerms(tag1.name)
  const terms2 = extractCoreTerms(tag2.name)

  // Must have at least one core term
  if (terms1.length === 0 || terms2.length === 0) return false

  // Check if they share a significant core term (alphafly, vaporfly, etc.)
  const sharedTerms = terms1.filter(term => terms2.includes(term))

  // Must share at least one meaningful term and have similar pricing
  if (sharedTerms.length > 0) {
    const price1 = tag1.median_price || 0
    const price2 = tag2.median_price || 0

    // If both have prices, they should be very similar (within 10%)
    if (price1 > 0 && price2 > 0) {
      const priceDiff = Math.abs(price1 - price2) / Math.max(price1, price2)
      return priceDiff < 0.1
    }

    // If no price data, assume they're related
    return true
  }

  return false
}

/**
 * Check if a tag should be marked as verbose (longer variant of a shorter similar tag)
 */
function isVerboseTag(tag: TagWithScore, allTags: TagWithScore[]): boolean {
  const tagName = tag.name.toLowerCase().trim()


  // Skip very short tags
  if (tagName.length <= 4) return false

  // Find all tags that share the same core product
  const similarTags = allTags.filter(otherTag =>
    otherTag.name !== tag.name && sharesCoreProduct(tag, otherTag)
  )

  // If no similar tags exist, this tag is not verbose
  if (similarTags.length === 0) return false

  // Check if there's a shorter tag in the similar group
  const shorterSimilarTags = similarTags.filter(otherTag =>
    otherTag.name.length < tag.name.length
  )

  // If there's at least one shorter similar tag, this one is verbose
  return shorterSimilarTags.length > 0
}

/**
 * Sort tags by rank score first (pure price impact), then listing count, then name length (shorter = better)
 */
function sortByRankScoreThenListingCount(tags: TagWithScore[]): TagWithScore[] {
  return [...tags].sort((a, b) => {
    // Primary sort: Rank score (highest first) - pure price impact score
    const rankScoreDiff = b.rankScore - a.rankScore
    if (Math.abs(rankScoreDiff) > 0.1) return rankScoreDiff

    // Secondary sort: Price impact percentage (highest first) for similar scores
    const priceImpactDiff = b.priceImpactPercentage - a.priceImpactPercentage
    if (Math.abs(priceImpactDiff) > 1) return priceImpactDiff

    // Tertiary sort: Listing count (highest first)
    const listingCountDiff = (b.listing_count || 0) - (a.listing_count || 0)
    if (Math.abs(listingCountDiff) > 50) return listingCountDiff

    // Final tie-breaker: Name length (shorter first) - prefer "alphafly" over "air zoom alphafly"
    return a.name.length - b.name.length
  })
}


/**
 * Main ranking function: ranks tags by price impact buckets or pure listing count
 */
export function rankTags(
  unselectedTags: Tag[],
  selectedTags: Tag[],
  currentEstimateString: string,
  originalBrandEstimate?: number,
  sortBy: 'smart' | 'listing_count' = 'smart'
): Tag[] {
  // Parse current estimate (remove "kr" and convert to number)
  const currentEstimate = parseFloat(currentEstimateString.replace(/[^\d.]/g, '')) || 0

  // Calculate scores for all tags based on pure price impact vs current estimate
  const tagsWithScores: TagWithScore[] = unselectedTags.map(tag => {
    const { score, priceImpactPercentage } = calculateTagScore(tag, currentEstimate)
    return {
      ...tag,
      rankScore: score,
      priceImpactPercentage
    }
  })

  // Handle different sorting modes
  if (sortBy === 'listing_count') {
    // Pure listing count sorting - filter only excluded tags, sort by listing count
    const filteredTags = tagsWithScores.filter(tag => !isTagExcluded(tag.name))

    // Sort PURELY by listing count (highest to lowest) - ignore all other factors
    const rankedTags = [...filteredTags].sort((a, b) => {
      const listingCountA = a.listing_count || 0
      const listingCountB = b.listing_count || 0

      // Pure listing count sort HIGH TO LOW - no thresholds, no fallbacks
      if (listingCountB !== listingCountA) {
        return listingCountB - listingCountA  // HIGH to LOW: B-A gives descending order
      }

      // Only use name as final tie-breaker for identical counts
      return a.name.localeCompare(b.name)
    })

    // Update price_range to show rank score and listing count
    return rankedTags.map(tag => ({
      ...tag,
      price_range: formatTagDisplay(tag, tag.rankScore),
      color: getScoreColor(tag.rankScore)
    }))
  }

  // Default: Use smart algorithm with buckets - show all tags regardless of polarity
  // Filter only excluded tags - show all others including negative impact tags
  const filteredTags = tagsWithScores.filter(tag => !isTagExcluded(tag.name))

  // Separate verbose tags to put at bottom
  const verboseTags: TagWithScore[] = []
  const normalTags: TagWithScore[] = []

  filteredTags.forEach(tag => {
    if (isVerboseTag(tag, filteredTags)) {
      verboseTags.push(tag)
    } else {
      normalTags.push(tag)
    }
  })

  // Define score buckets for the normal tags
  const buckets: { [key: string]: TagWithScore[] } = {
    S: [], // Perfect ±10: Highest impact
    A: [], // ±8-9: Exceptional impact
    B: [], // ±5-7: High impact
    C: [], // ±2-4: Medium impact
    D: [], // ±0-1: Neutral/minimal impact
  }

  // Distribute normal tags into score buckets based on absolute score value
  normalTags.forEach(tag => {
    const absScore = Math.abs(tag.rankScore)

    // All tags (positive and negative) are bucketed by absolute score value
    if (absScore >= 10) buckets.S.push(tag)      // Perfect ±10: Highest impact
    else if (absScore >= 8) buckets.A.push(tag)  // ±8-9: Exceptional impact
    else if (absScore >= 5) buckets.B.push(tag)  // ±5-7: High impact
    else if (absScore >= 2) buckets.C.push(tag)  // ±2-4: Medium impact
    else buckets.D.push(tag)                     // ±0-1: Neutral/minimal impact
  })

  // Sort by pure price impact score within each bucket, then by listing count
  const rankedTags = [
    ...sortByRankScoreThenListingCount(buckets.S),  // Perfect ±10: Highest impact
    ...sortByRankScoreThenListingCount(buckets.A),  // ±8-9: Exceptional impact
    ...sortByRankScoreThenListingCount(buckets.B),  // ±5-7: High impact
    ...sortByRankScoreThenListingCount(buckets.C),  // ±2-4: Medium impact
    ...sortByRankScoreThenListingCount(buckets.D),  // ±0-1: Neutral/minimal impact
    ...sortByRankScoreThenListingCount(verboseTags)  // Verbose tags
    // Excluded tags completely removed - not shown at all
  ]

  // Update price_range to show rank score, average price, and listing count
  return rankedTags.map(tag => ({
    ...tag,
    price_range: formatTagDisplay(tag, tag.rankScore),
    color: getScoreColor(tag.rankScore)
  }))
}

/**
 * Export utility functions for testing and components
 */
export {
  calculatePriceImpactScore,
  getScoreColor
}