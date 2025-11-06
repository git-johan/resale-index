#!/usr/bin/env node

// Load environment variables from .env file
require("dotenv").config();

const https = require("https");
const http = require("http");
const readline = require("readline");

// Environment variables
const API_URL = process.env.TINGS_RESALE_TAGS_URL;
const API_KEY = process.env.TINGS_RESALE_API_KEY;

if (!API_URL || !API_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   TINGS_RESALE_TAGS_URL - Base URL for the API");
  console.error("   TINGS_RESALE_API_KEY - API key for authentication");
  process.exit(1);
}

// Raw HTTP request function - shows exactly what's happening
function makeRawRequest(endpoint, requestPayload) {
  return new Promise((resolve, reject) => {
    console.log(`\n🌐 API CALL DETAILS:`);
    console.log(`   URL: ${API_URL}${endpoint}`);
    console.log(`   Method: POST`);
    console.log(
      `   Headers: {"Content-Type": "application/json", "api-key": "${API_KEY}"}`,
    );
    console.log(`   Request Body: ${JSON.stringify(requestPayload, null, 2)}`);

    const url = new URL(endpoint, API_URL);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;
    const postData = JSON.stringify(requestPayload);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
        "api-key": API_KEY,
      },
    };

    const req = client.request(options, (res) => {
      console.log(`   Response Status: ${res.statusCode}`);

      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// =====================================================
// API ENDPOINT FUNCTIONS - Each shows exactly what it does
// =====================================================

async function getBrandsAutocomplete(query, categoryFilter = null) {
  console.log(`\n🏷️  ENDPOINT: /get-brands-autocomplete`);
  console.log(`📝 PURPOSE: Search for brand names that match your query`);
  console.log(`🔍 Searching for brands matching: "${query}"`);

  // Build the exact request payload as per API spec
  const requestPayload = {
    query: query, // REQUIRED: string - search term for brand names
  };

  // Optional: filter by category
  if (categoryFilter) {
    requestPayload.category = [categoryFilter]; // OPTIONAL: array of strings
    console.log(`   📂 Filtering by category: "${categoryFilter}"`);
  }

  const result = await makeRawRequest(
    "/get-brands-autocomplete",
    requestPayload,
  );
  return result;
}

async function getListings(brand, options = {}) {
  console.log(`\n🏷️  ENDPOINT: /get-listings`);
  console.log(`📝 PURPOSE: Get actual product listings and market statistics`);
  console.log(`📋 Getting listings for brand: "${brand}"`);

  // Build the exact request payload as per API spec
  const requestPayload = {
    brand: [brand], // REQUIRED: array of strings
    usePostgres: true, // OPTIONAL: boolean, default true
    listingsPerTagLimit: options.limit || 1, // OPTIONAL: number, default 1000
    tagsLimit: 100, // OPTIONAL: number, default 100
  };

  // You can also add these optional filters:
  if (options.category) {
    requestPayload.category = options.category; // OPTIONAL: array of strings
  }
  if (options.categoryExclude) {
    requestPayload.categoryExclude = options.categoryExclude; // OPTIONAL: array of strings
  }
  if (options.tag) {
    requestPayload.tag = options.tag; // OPTIONAL: array of strings
  }
  if (options.tagExclude) {
    requestPayload.tagExclude = options.tagExclude; // OPTIONAL: array of strings
  }
  if (options.query) {
    requestPayload.query = options.query; // OPTIONAL: string - text search
  }

  const result = await makeRawRequest("/get-listings", requestPayload);

  // Show clean tag summary at the end
  if (result && result.tags && Array.isArray(result.tags)) {
    console.log('\n📊 TAG SUMMARY (sorted by listing count):');
    console.log('─'.repeat(50));

    // Sort tags by listing count (descending)
    const sortedTags = result.tags
      .map(tag => ({
        name: tag.tag_name,
        count: parseInt(tag.listing_count) || 0,
        median_price: tag.median_price || 'N/A',
        average_price: tag.average_price || 'N/A'
      }))
      .sort((a, b) => b.count - a.count);

    sortedTags.forEach((tag, index) => {
      const rank = (index + 1).toString().padStart(2, ' ');
      const count = tag.count.toLocaleString().padStart(8, ' ');
      const medianPrice = tag.median_price.toString().padStart(6, ' ');
      console.log(`${rank}. ${tag.name.padEnd(20)} ${count} listings (median: ${medianPrice}kr)`);
    });

    console.log('─'.repeat(50));
    console.log(`Total tags found: ${sortedTags.length}`);
    console.log(`Total listings: ${sortedTags.reduce((sum, tag) => sum + tag.count, 0).toLocaleString()}`);
  }

  return result;
}

async function getEstimateForProduct(productName, brand, category = null) {
  console.log(`\n🏷️  ENDPOINT: /get-estimate-for-product`);
  console.log(`📝 PURPOSE: Get price estimate for a specific product`);
  console.log(`💰 Getting price estimate for: "${productName}" by ${brand}`);

  // Build the exact request payload as per API spec
  const requestPayload = {
    name: productName, // REQUIRED: string - product name
    brand: brand, // OPTIONAL: string - brand name
  };

  if (category) {
    requestPayload.category = category; // OPTIONAL: string - category
    console.log(`   📂 In category: "${category}"`);
  }

  const result = await makeRawRequest(
    "/get-estimate-for-product",
    requestPayload,
  );
  return result;
}

async function getEstimateNew(searchTerm) {
  console.log(`\n🏷️  ENDPOINT: /get-estimate-new`);
  console.log(`📝 PURPOSE: Simple price estimation using just a search term`);
  console.log(`💰 Getting price estimate for: "${searchTerm}"`);

  // Build the exact request payload as per API spec
  const requestPayload = {
    searchTerm: searchTerm, // REQUIRED: string - what you're looking for
  };

  const result = await makeRawRequest("/get-estimate-new", requestPayload);
  return result;
}

async function getCategoryAutocomplete(query) {
  console.log(`\n🏷️  ENDPOINT: /get-category-autocomplete`);
  console.log(`📝 PURPOSE: Search for category names that match your query`);
  console.log(`🔍 Searching for categories matching: "${query}"`);

  // Build the exact request payload as per API spec
  const requestPayload = {
    query: query, // REQUIRED: string - search term for categories
  };

  const result = await makeRawRequest(
    "/get-category-autocomplete",
    requestPayload,
  );
  return result;
}

// =====================================================
// ENHANCED CLI UTILITIES
// =====================================================

// Parse command line arguments for advanced filtering
function parseAdvancedArgs(args) {
  const options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith('--tags=')) {
      options.tags = arg.substring(7).split(',').map(s => s.trim()).filter(s => s);
    } else if (arg.startsWith('--exclude=')) {
      options.exclude = arg.substring(10).split(',').map(s => s.trim()).filter(s => s);
    } else if (arg.startsWith('--category=')) {
      options.category = [arg.substring(11).trim()];
    } else if (arg.startsWith('--query=')) {
      options.query = arg.substring(8).trim();
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.substring(8));
    } else if (!arg.startsWith('--')) {
      // Non-flag arguments
      if (!options.positional) options.positional = [];
      options.positional.push(arg);
    }
  }

  return options;
}

// Enhanced listings function with multi-tag support
async function getListingsAdvanced(brand, options = {}) {
  console.log(`\n🏷️  ENDPOINT: /get-listings (ADVANCED)`);
  console.log(`📝 PURPOSE: Get product listings with advanced filtering`);
  console.log(`📋 Getting listings for brand: "${brand}"`);

  // Build the exact request payload as per API spec
  const requestPayload = {
    brand: [brand],                               // REQUIRED: array of strings
    usePostgres: true,                           // OPTIONAL: boolean, default true
    listingsPerTagLimit: options.limit || 50,   // OPTIONAL: number, default 1000
    tagsLimit: 100                               // OPTIONAL: number, default 100
  };

  // Add advanced filtering options
  if (options.tags && options.tags.length > 0) {
    requestPayload.tag = options.tags;
    console.log(`   🏷️  Including tags: ${options.tags.join(', ')}`);
  }

  if (options.exclude && options.exclude.length > 0) {
    requestPayload.tagExclude = options.exclude;
    console.log(`   🚫 Excluding tags: ${options.exclude.join(', ')}`);
  }

  if (options.category && options.category.length > 0) {
    requestPayload.category = options.category;
    console.log(`   📂 Category filter: ${options.category[0]}`);
  }

  if (options.query) {
    requestPayload.query = options.query;
    console.log(`   🔍 Text search: "${options.query}"`);
  }

  const result = await makeRawRequest("/get-listings", requestPayload);

  // Show clean tag summary at the end (same as before)
  if (result && result.tags && Array.isArray(result.tags)) {
    console.log('\n📊 TAG SUMMARY (sorted by listing count):');
    console.log('─'.repeat(50));

    const sortedTags = result.tags
      .map(tag => ({
        name: tag.tag_name,
        count: parseInt(tag.listing_count) || 0,
        median_price: tag.median_price || 'N/A',
        average_price: tag.average_price || 'N/A'
      }))
      .sort((a, b) => b.count - a.count);

    sortedTags.forEach((tag, index) => {
      const rank = (index + 1).toString().padStart(2, ' ');
      const count = tag.count.toLocaleString().padStart(8, ' ');
      const medianPrice = tag.median_price.toString().padStart(6, ' ');
      console.log(`${rank}. ${tag.name.padEnd(20)} ${count} listings (median: ${medianPrice}kr)`);
    });

    console.log('─'.repeat(50));
    console.log(`Total tags found: ${sortedTags.length}`);
    console.log(`Total listings: ${sortedTags.reduce((sum, tag) => sum + tag.count, 0).toLocaleString()}`);
  }

  return result;
}

// Interactive mode using readline
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  console.log('\n🔍 INTERACTIVE MODE - Advanced Brand Search');
  console.log('=========================================');

  try {
    const brand = await question('Brand name: ');
    if (!brand.trim()) {
      console.log('❌ Brand name is required');
      rl.close();
      return;
    }

    const tags = await question('Include tags (comma-separated, optional): ');
    const exclude = await question('Exclude tags (comma-separated, optional): ');
    const category = await question('Category filter (optional): ');
    const query = await question('Text search (optional): ');
    const limit = await question('Results per tag (default 50): ');

    console.log('\n🚀 Executing search...');

    const options = {};
    if (tags.trim()) options.tags = tags.split(',').map(s => s.trim()).filter(s => s);
    if (exclude.trim()) options.exclude = exclude.split(',').map(s => s.trim()).filter(s => s);
    if (category.trim()) options.category = [category.trim()];
    if (query.trim()) options.query = query.trim();
    if (limit.trim() && !isNaN(parseInt(limit))) options.limit = parseInt(limit);

    const result = await getListingsAdvanced(brand.trim(), options);

    console.log('\n📄 API RESPONSE:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🏷️  Tings Resale Tags API Explorer - Learn Each Endpoint

This tool shows you exactly how each API endpoint works:
- What URL is called
- What request payload is sent
- What headers are used
- What the response looks like

Available Commands:

🔍 INTERACTIVE MODE (recommended for complex searches):
   node brand-query.js interactive
   → Step-by-step guided search with multi-tag filtering

📋 BASIC ENDPOINTS:
1. node brand-query.js brands-autocomplete "nike"
   → Search for brand names matching a query

2. node brand-query.js listings "Nike"
   → Get basic product listings + market stats for a brand

3. node brand-query.js estimate-product "Air Jordan 1" "Nike" ["category"]
   → Get price estimate for specific product + brand + optional category

4. node brand-query.js estimate-simple "Nike Air Jordan 1"
   → Simple price estimate using just a search term

5. node brand-query.js categories-autocomplete "shoes"
   → Search for category names matching a query

🚀 ADVANCED LISTINGS (multi-tag filtering):
   node brand-query.js listings-advanced "Nike" --tags="air,sko" --exclude="str,brukt" --limit=100
   → Advanced filtering with multiple tags, exclusions, categories

Examples:
   node brand-query.js listings-advanced "Nike" --tags="air,sko"
   node brand-query.js listings-advanced "Adidas" --tags="ultraboost" --exclude="str,36,37,38"
   node brand-query.js listings-advanced "Nike" --query="jordan" --category="shoes" --limit=200

Parameters for listings-advanced:
   --tags=tag1,tag2     → Include items with ALL these tags (AND logic)
   --exclude=tag1,tag2  → Exclude items with any of these tags
   --category="name"    → Filter by category name
   --query="text"       → Text search within results
   --limit=50           → Max results per tag (default: 50)

Environment: ${API_URL} (from .env file)
`);
    process.exit(0);
  }

  const [endpoint, ...params] = args;

  try {
    let result;

    switch (endpoint) {
      case "interactive":
        await interactiveMode();
        return; // Exit after interactive mode

      case "brands-autocomplete":
        if (params.length < 1) {
          throw new Error(
            'Query required: node brand-query.js brands-autocomplete "nike"',
          );
        }
        result = await getBrandsAutocomplete(params[0], params[1]);
        break;

      case "listings":
        if (params.length < 1) {
          throw new Error(
            'Brand required: node brand-query.js listings "Nike"',
          );
        }
        result = await getListings(params[0]);
        break;

      case "listings-advanced":
        if (params.length < 1) {
          throw new Error(
            'Brand required: node brand-query.js listings-advanced "Nike" --tags="air,sko"',
          );
        }

        // Parse all arguments including flags
        const allArgs = [endpoint, ...params];
        const parsedOptions = parseAdvancedArgs(allArgs);

        if (!parsedOptions.positional || parsedOptions.positional.length < 2) {
          throw new Error(
            'Brand required: node brand-query.js listings-advanced "Nike" --tags="air,sko"',
          );
        }

        const brandName = parsedOptions.positional[1]; // positional[0] is "listings-advanced"
        result = await getListingsAdvanced(brandName, parsedOptions);
        break;

      case "estimate-product":
        if (params.length < 2) {
          throw new Error(
            'Product name and brand required: node brand-query.js estimate-product "Air Jordan 1" "Nike"',
          );
        }
        result = await getEstimateForProduct(params[0], params[1], params[2]);
        break;

      case "estimate-simple":
        if (params.length < 1) {
          throw new Error(
            'Search term required: node brand-query.js estimate-simple "Nike Air Jordan 1"',
          );
        }
        result = await getEstimateNew(params[0]);
        break;

      case "categories-autocomplete":
        if (params.length < 1) {
          throw new Error(
            'Query required: node brand-query.js categories-autocomplete "shoes"',
          );
        }
        result = await getCategoryAutocomplete(params[0]);
        break;

      default:
        throw new Error(
          `Unknown endpoint: ${endpoint}\nRun without arguments to see available endpoints.`,
        );
    }

    // Output formatted JSON
    console.log("\n📄 API RESPONSE:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
