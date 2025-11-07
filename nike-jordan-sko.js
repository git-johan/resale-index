#!/usr/bin/env node

// Load environment variables from .env file
require("dotenv").config();

const https = require("https");
const http = require("http");

// Environment variables
const API_URL = process.env.TINGS_RESALE_TAGS_URL;
const API_KEY = process.env.TINGS_RESALE_API_KEY;

if (!API_URL || !API_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   TINGS_RESALE_TAGS_URL - Base URL for the API");
  console.error("   TINGS_RESALE_API_KEY - API key for authentication");
  process.exit(1);
}

// Raw HTTP request function
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

async function getNikeJordanSkoListings() {
  console.log(`\n🏷️  ENDPOINT: /get-listings`);
  console.log(`📝 PURPOSE: Get Nike listings with Jordan and Sko tags`);
  console.log(`📋 Getting listings for brand: "nike" with tags: "jordan", "sko"`);

  // Build the exact request payload with your specific requirements
  const requestPayload = {
    brand: ["nike"],                      // Brand: nike
    tag: ["jordan", "sko"],              // Tags: jordan and sko
    usePostgres: true,                   // Default: use postgres
    listingsPerTagLimit: 0,              // Set to 0 as requested
    tagsLimit: 200,                      // Set to 200 as requested
    listingsSampleLimit: 1000            // New parameter as requested
  };

  const result = await makeRawRequest("/get-listings", requestPayload);

  // Show clean tag summary
  if (result && result.tags && Array.isArray(result.tags)) {
    console.log('\n📊 TAG SUMMARY (sorted by listing count):');
    console.log('─'.repeat(60));

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
      const rank = (index + 1).toString().padStart(3, ' ');
      const count = tag.count.toLocaleString().padStart(8, ' ');
      const medianPrice = tag.median_price.toString().padStart(8, ' ');
      console.log(`${rank}. ${tag.name.padEnd(25)} ${count} listings (median: ${medianPrice}kr)`);
    });

    console.log('─'.repeat(60));
    console.log(`Total tags found: ${sortedTags.length}`);
    console.log(`Total listings: ${sortedTags.reduce((sum, tag) => sum + tag.count, 0).toLocaleString()}`);
  }

  return result;
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Nike Jordan + Sko listings query...');

    const result = await getNikeJordanSkoListings();

    console.log("\n📄 FULL API RESPONSE:");
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}