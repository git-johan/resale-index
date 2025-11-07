// Smart Tag Ranking Algorithm
// Ranks tags based on price impact, listing count, and similarity to selected tags

import { Tag } from './types'
import { isTagExcluded } from './exclusions'

interface TagWithScore extends Tag {
  rankScore: number
  priceImpactPercentage: number  // Raw percentage for sorting within buckets
  color?: string
}

/**
 * Calculate Levenshtein distance between two strings (for fuzzy matching)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() =>
    Array(str1.length + 1).fill(null)
  )

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

/**
 * Calculate similarity percentage between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  const maxLength = Math.max(str1.length, str2.length)
  return maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100
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
 * Calculate similarity penalty (0 to -6 points) - Aggressive penalty for strong diversity
 */
function calculateSimilarityPenalty(tagName: string, selectedTags: Tag[]): number {
  if (selectedTags.length === 0) return 0

  let maxSimilarity = 0

  for (const selectedTag of selectedTags) {
    const similarity = calculateSimilarity(tagName, selectedTag.name)
    maxSimilarity = Math.max(maxSimilarity, similarity)
  }

  // Apply graduated penalties based on similarity - stronger penalties for diversity
  if (maxSimilarity >= 85) return -6  // Extremely similar (85%+) - heavy penalty
  if (maxSimilarity >= 70) return -4  // Very similar (70-85%) - strong penalty
  if (maxSimilarity >= 55) return -2  // Somewhat similar (55-70%) - moderate penalty
  if (maxSimilarity >= 40) return -1  // Slightly similar (40-55%) - light penalty
  return 0                            // Not similar (<40%) - no penalty
}

/**
 * Calculate overall score for a tag (-10 to +10) - Pure price impact + strong similarity penalty
 * Similarity penalties now range from -6 to 0, providing aggressive tag separation
 * Also returns raw price impact percentage for sorting within buckets
 */
function calculateTagScore(
  tag: Tag,
  currentEstimate: number,
  selectedTags: Tag[]
): { score: number; priceImpactPercentage: number } {
  const tagMedianPrice = tag.median_price || 0
  const priceImpactScore = calculatePriceImpactScore(tagMedianPrice, currentEstimate)
  const similarityPenalty = calculateSimilarityPenalty(tag.name, selectedTags)

  // Calculate raw price impact percentage for sorting
  const priceImpactPercentage = currentEstimate === 0 ? 0
    : ((tagMedianPrice - currentEstimate) / currentEstimate) * 100

  // Pure price impact score with similarity penalty
  const totalScore = priceImpactScore + similarityPenalty

  return {
    score: Math.max(-10, Math.min(10, totalScore)),
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
  parts.push(`${p25Price}-${p75Price}kr`)
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
 * Sort tags by rank score first (includes similarity penalties), then listing count, then name length (shorter = better)
 */
function sortByRankScoreThenListingCount(tags: TagWithScore[]): TagWithScore[] {
  return [...tags].sort((a, b) => {
    // Primary sort: Rank score (highest first) - this includes similarity penalties
    const rankScoreDiff = b.rankScore - a.rankScore
    if (Math.abs(rankScoreDiff) > 0.5) return rankScoreDiff // Respect similarity penalties

    // Secondary sort: Price impact percentage (highest first) for similar scores
    const priceImpactDiff = b.priceImpactPercentage - a.priceImpactPercentage
    if (Math.abs(priceImpactDiff) > 5) return priceImpactDiff

    // Tertiary sort: Listing count (highest first)
    const listingCountDiff = (b.listing_count || 0) - (a.listing_count || 0)
    if (Math.abs(listingCountDiff) > 100) return listingCountDiff // Only if significant difference

    // Final tie-breaker: Name length (shorter first) - prefer "alphafly" over "air zoom alphafly"
    return a.name.length - b.name.length
  })
}

/**
 * Filter and limit negative vs positive tags (minimal negative, mostly positive)
 */
function filterTagsByPolarity(tagsWithScores: TagWithScore[]): TagWithScore[] {
  // Separate positive and negative tags (respecting -10 to +10 range)
  const positiveTags = tagsWithScores.filter(tag => tag.rankScore >= 0)
  const negativeTags = tagsWithScores.filter(tag => tag.rankScore < 0)

  // For negative tags, be very selective - only high listing count OR high impact
  const qualityNegativeTags = negativeTags.filter(tag => {
    const listingCount = tag.listing_count || 0
    const score = tag.rankScore

    // Only include negative tags if they have:
    // 1. High listing count (>=200) for reliability, OR
    // 2. Very high negative impact (score <= -8) with decent listings (>=50)
    return (listingCount >= 200) || (score <= -8 && listingCount >= 50)
  })

  // Sort each group by absolute score magnitude, then listing count
  const sortedPositive = positiveTags.sort((a, b) => {
    const scoreDiff = b.rankScore - a.rankScore
    if (Math.abs(scoreDiff) > 1) return scoreDiff
    return (b.listing_count || 0) - (a.listing_count || 0)
  })

  const sortedNegative = qualityNegativeTags.sort((a, b) => {
    const scoreDiff = a.rankScore - b.rankScore // More negative = higher priority
    if (Math.abs(scoreDiff) > 1) return scoreDiff
    return (b.listing_count || 0) - (a.listing_count || 0)
  })

  // Much more aggressive: max 10 negative tags, rest positive
  const totalToShow = Math.min(150, tagsWithScores.length) // Cap at 150 total tags
  const maxNegativeToShow = Math.min(10, sortedNegative.length) // Max 10 negative tags
  const positiveToShow = totalToShow - maxNegativeToShow

  // Take only the best negative tags and mostly positive
  const selectedNegative = sortedNegative.slice(0, maxNegativeToShow)
  const selectedPositive = sortedPositive.slice(0, positiveToShow)

  return [...selectedPositive, ...selectedNegative]
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

  // Use original brand baseline for consistent scoring, fallback to current estimate
  const baselineForScoring = originalBrandEstimate || currentEstimate

  // Calculate scores for all tags based on pure price impact vs original baseline
  const tagsWithScores: TagWithScore[] = unselectedTags.map(tag => {
    const { score, priceImpactPercentage } = calculateTagScore(tag, baselineForScoring, selectedTags)
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

  // Default: Use smart algorithm with buckets and advanced filtering
  // Filter by polarity (20% negative, 80% positive) and apply listing count penalties
  const filteredTags = filterTagsByPolarity(tagsWithScores)

  // Separate exclusions and verbose tags to put at bottom
  const exclusions: TagWithScore[] = []
  const verboseTags: TagWithScore[] = []
  const normalTags: TagWithScore[] = []

  filteredTags.forEach(tag => {
    if (isTagExcluded(tag.name)) {
      exclusions.push(tag)
    } else if (isVerboseTag(tag, filteredTags)) {
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

  // Distribute normal tags into score buckets with negative tag spreading
  const negativeCounts = { S: 0, A: 0, B: 0, C: 0, D: 0 }
  const maxNegativePerBucket = 2

  normalTags.forEach(tag => {
    const score = tag.rankScore
    const absScore = Math.abs(score)
    const isNegative = score < 0

    // For negative tags, try to spread them across buckets (max 2 per bucket)
    if (isNegative) {
      if (absScore >= 10 && negativeCounts.S < maxNegativePerBucket) {
        buckets.S.push(tag)
        negativeCounts.S++
      } else if (absScore >= 8 && negativeCounts.A < maxNegativePerBucket) {
        buckets.A.push(tag)
        negativeCounts.A++
      } else if (absScore >= 5 && negativeCounts.B < maxNegativePerBucket) {
        buckets.B.push(tag)
        negativeCounts.B++
      } else if (absScore >= 2 && negativeCounts.C < maxNegativePerBucket) {
        buckets.C.push(tag)
        negativeCounts.C++
      } else if (negativeCounts.D < maxNegativePerBucket) {
        buckets.D.push(tag)
        negativeCounts.D++
      }
      // If all buckets are full of negatives, skip this negative tag
    } else {
      // Positive tags follow normal distribution
      if (absScore >= 10) buckets.S.push(tag)      // Perfect +10: Highest impact
      else if (absScore >= 8) buckets.A.push(tag)  // +8-9: Exceptional impact
      else if (absScore >= 5) buckets.B.push(tag)  // +5-7: High impact
      else if (absScore >= 2) buckets.C.push(tag)  // +2-4: Medium impact
      else buckets.D.push(tag)                     // +0-1: Neutral/minimal impact
    }
  })

  // Sort by rank score (with similarity penalties) within each bucket, then by listing count
  const rankedTags = [
    ...sortByRankScoreThenListingCount(buckets.S),  // Perfect ±10: Highest impact
    ...sortByRankScoreThenListingCount(buckets.A),  // ±8-9: Exceptional impact
    ...sortByRankScoreThenListingCount(buckets.B),  // ±5-7: High impact
    ...sortByRankScoreThenListingCount(buckets.C),  // ±2-4: Medium impact
    ...sortByRankScoreThenListingCount(buckets.D),  // ±0-1: Neutral/minimal impact
    ...sortByRankScoreThenListingCount(verboseTags)  // Verbose tags
    // Exclusions completely removed - not shown at all
  ]

  // Update price_range to show rank score, average price, and listing count
  return rankedTags.map(tag => ({
    ...tag,
    price_range: formatTagDisplay(tag, tag.rankScore),
    color: getScoreColor(tag.rankScore)
  }))
}

/**
 * Export utility functions for testing
 */
export {
  calculatePriceImpactScore,
  calculateSimilarityPenalty,
  calculateSimilarity
}