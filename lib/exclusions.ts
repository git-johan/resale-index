// Tag exclusion lists for brand data viewer
// Converted from exclusions.js to TypeScript

export const EXCLUDED_TAGS = [
  // ============================================
  // SIZES AND MEASUREMENTS
  // ============================================

  // Generic size terms
  "str",
  "størrelse",
  "size",
  "strl",
  "s",
  "m",
  "l",
  "xl",
  "xxl",
  "xs",
  "xxs",

  // Shoe sizes (European)
  "35",
  "35.5",
  "36",
  "36.5",
  "37",
  "37.5",
  "38",
  "38.5",
  "39",
  "39.5",
  "40",
  "40.5",
  "41",
  "41.5",
  "42",
  "42.5",
  "43",
  "43.5",
  "44",
  "44.5",
  "45",
  "45.5",
  "46",
  "46.5",
  "47",
  "47.5",
  "48",
  "48.5",
  "49",
  "50",

  // Half sizes
  "365",
  "375",
  "385",
  "395",
  "405",
  "415",
  "425",
  "435",
  "445",
  "455",

  // Size combinations (Norwegian)
  "str 35",
  "str 36",
  "str 37",
  "str 38",
  "str 39",
  "str 40",
  "str 41",
  "str 42",
  "str 43",
  "str 44",
  "str 45",
  "str 46",
  "str 47",
  "str 48",
  "str s",
  "str m",
  "str l",
  "str xl",
  "str xxl",
  "str xs",
  "str 365",
  "str 375",
  "str 385",
  "str 395",
  "str 405",
  "str 415",
  "str 425",
  "str 435",
  "str 445",

  // Clothing sizes
  "small",
  "medium",
  "large",
  "extra large",
  "sko str",
  "fotballsko str",
  "joggesko str",
  "treningssko str",

  // ============================================
  // GENERIC DESCRIPTORS & COMMON WORDS
  // ============================================

  // Norwegian generic terms
  "i",
  "på",
  "til",
  "fra",
  "med",
  "uten",
  "og",
  "eller",
  "som",
  "av",
  "for",
  "nye",
  "ny",
  "brukt",
  "pent",
  "godt",
  "lite",
  "helt",
  "fin",
  "flott",
  "pen",
  "selges",
  "kjøpt",
  "kr",
  "nok",
  "pris",
  "billig",
  "dyr",

  // Demographics
  "herre",
  "dame",
  "barn",
  "jente",
  "gutt",
  "unisex",
  "voksen",
  "baby",
  "junior",

  // ============================================
  // NUMBERS (often not meaningful for brand analysis)
  // ============================================
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "30",
  "50",
  "100",
  "200",
  "500",
  "1000",

  // ============================================
  // COLORS
  // ============================================
  "svart",
  "hvit",
  "blå",
  "rød",
  "grønn",
  "gul",
  "rosa",
  "lilla",
  "grå",
  "brun",
  "orange",
  "black",
  "white",
  "blue",
  "red",
  "green",
  "yellow",
  "pink",
  "purple",
  "gray",
  "grey",
  "brown",
  "orange",
  "navy",
  "beige",
  "cream",
  "gold",
  "silver",

  // ============================================
  // QUANTITIES & PACKAGING
  // ============================================
  "stk",
  "pak",
  "sett",
  "par",
  "pakke",
  "bundle",
  "lot",
  "1stk",
  "2stk",
  "3stk",
  "4stk",
  "5stk",

  // ============================================
  // CONDITION TERMS
  // ============================================
  "ubrukt",
  "brukt",
  "slitt",
  "ødelagt",
  "reparert",
  "vintage",
  "retro",
  "new",
  "used",
  "worn",
  "damaged",
  "broken",
  "mint",
  "excellent",
  "good",
  "fair",
  "poor",

  // ============================================
  // SIZE INDICATORS
  // ============================================
  "us",
  "eu",
  "eur",
  "strls",
] as const

/**
 * Check if a tag should be excluded from display
 */
export function isTagExcluded(tagName: string): boolean {
  if (!tagName || typeof tagName !== 'string') {
    return false
  }

  const lowerTag = tagName.toLowerCase().trim()

  // Exact match check first
  if (EXCLUDED_TAGS.includes(lowerTag as any)) {
    return true
  }

  // Pattern-based exclusions

  // Any tag starting with "str" or "strl" followed by space and number (e.g. "str 26", "strl 31")
  if (/^(str|strl)\s+\d+/.test(lowerTag)) {
    return true
  }

  // Any tag that is just "str" or "strl" + number without space (e.g. "str26", "strl31")
  if (/^(str|strl)\d+$/.test(lowerTag)) {
    return true
  }

  // Any tag starting with "str" or "strl" followed by space and any word (e.g. "str us", "strl xl")
  if (/^(str|strl)\s+\w+/.test(lowerTag)) {
    return true
  }

  // Any tag with number followed by "str" (e.g. "3 str", "26 str")
  if (/^\d+\s+str$/.test(lowerTag)) {
    return true
  }

  // Any tag that is just number + "str" without space (e.g. "3str", "26str")
  if (/^\d+str$/.test(lowerTag)) {
    return true
  }

  // Any tag containing parentheses (e.g. "air jordan (1)", "dunk (low)")
  if (/[()]/.test(lowerTag)) {
    return true
  }

  // Any tag with letters followed by space and "str" (e.g. "us str", "xl str")
  if (/^[a-z]+\s+str$/.test(lowerTag)) {
    return true
  }

  // US shoe sizes without space (e.g. "us5", "us11", "us9")
  if (/^us\d+$/.test(lowerTag)) {
    return true
  }

  // US shoe sizes with space (e.g. "us 5", "us 11", "us 9")
  if (/^us\s+\d+$/.test(lowerTag)) {
    return true
  }

  // EU shoe sizes without space (e.g. "eu44", "eu31", "eu39")
  if (/^eu\d+$/.test(lowerTag)) {
    return true
  }

  // EU shoe sizes with space (e.g. "eu 44", "eu 31", "eu 39")
  if (/^eu\s+\d+$/.test(lowerTag)) {
    return true
  }

  // EUR shoe sizes without space (e.g. "eur44", "eur31", "eur39")
  if (/^eur\d+$/.test(lowerTag)) {
    return true
  }

  // EUR shoe sizes with space (e.g. "eur 44", "eur 31", "eur 39")
  if (/^eur\s+\d+$/.test(lowerTag)) {
    return true
  }

  // Any tag containing "størrelse" (Norwegian for "size")
  if (lowerTag.includes('størrelse')) {
    return true
  }

  // Any tag containing "billig" or variations (Norwegian for "cheap")
  if (lowerTag.includes('billig')) {
    return true
  }

  // Any tag containing "str" followed by space and number (e.g. "i str 385", "sko str 42")
  if (/str\s+\d+/.test(lowerTag)) {
    return true
  }

  // Any tag containing "str" followed directly by number (e.g. "istr385", "skostr42")
  if (/str\d+/.test(lowerTag)) {
    return true
  }

  return false
}

/**
 * Filter out excluded tags from a list
 */
export function filterExcludedTags<T extends { name: string }>(tags: T[]): T[] {
  return tags.filter(tag => !isTagExcluded(tag.name))
}

export default EXCLUDED_TAGS