// Tag exclusion lists for brand data viewer
// Add tags you want to filter out from the display

const EXCLUDED_TAGS = [
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
  // GENERIC CLOTHING TERMS
  // ============================================

  // ============================================
  // COLORS (optional - comment out if you want to keep colors)
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
  // BRAND-SPECIFIC NOISE (add as needed)
  // ============================================

  // Add specific terms that are noise for certain brands
  // Example for Nike: "just", "do", "it" (from slogan)
  // Example for Adidas: "three", "stripes"
];

// Export for browser use (if using modules)
if (typeof module !== "undefined" && module.exports) {
  module.exports = EXCLUDED_TAGS;
}

// For direct script inclusion
if (typeof window !== "undefined") {
  window.EXCLUDED_TAGS = EXCLUDED_TAGS;
}
