#!/usr/bin/env node

/**
 * Test script to check the actual response format of autocomplete APIs
 * Run with: node test-api-responses.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3003';

async function makeRequest(path, body = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);

    console.log(`\n🔍 Testing: ${path}`);
    console.log(`📦 Body:`, body);

    const options = {
      hostname: 'localhost',
      port: 3003,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function testBrandAutocomplete() {
  console.log('\n=== TESTING BRAND AUTOCOMPLETE API ===');

  const testQueries = ['Nike', 'Jordan', 'Adidas', 'norrø', 'a'];

  for (const query of testQueries) {
    try {
      const response = await makeRequest('/api/brands/autocomplete', { query });

      console.log(`📝 Query: "${query}"`);
      console.log(`📊 Status: ${response.status}`);

      if (response.parseError) {
        console.log(`❌ Parse Error: ${response.parseError}`);
        console.log(`📄 Raw Data: ${response.data}`);
      } else {
        console.log(`📋 Response Type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
        console.log(`📏 Length: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);

        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`🔍 First item structure:`, JSON.stringify(response.data[0], null, 2));
          console.log(`🔍 First item keys:`, Object.keys(response.data[0]));
          if (response.data.length > 1) {
            console.log(`🔍 Second item structure:`, JSON.stringify(response.data[1], null, 2));
          }
        } else {
          console.log(`📋 Full response:`, JSON.stringify(response.data, null, 2));
        }
      }

      console.log('─'.repeat(60));
    } catch (error) {
      console.log(`❌ Error for query "${query}": ${error.message}`);
      console.log('─'.repeat(60));
    }
  }
}

async function testTagAutocomplete() {
  console.log('\n=== TESTING TAG AUTOCOMPLETE API ===');

  const testCases = [
    { query: 'jakke', brand: ['norrøna'], selectedTags: [], excludedTags: [] },
    { query: 'falke', brand: ['norrøna'], selectedTags: [], excludedTags: [] },
    { query: 'goretex', brand: ['norrøna'], selectedTags: ['falketind'], excludedTags: [] },
    { query: 'pro', brand: ['norrøna'], selectedTags: ['falketind', 'goretex'], excludedTags: [] },
    { query: 'nike', brand: ['Nike'], selectedTags: [], excludedTags: [] }
  ];

  for (const testCase of testCases) {
    try {
      const response = await makeRequest('/api/get-tags-autocomplete', testCase);

      console.log(`📝 Query: "${testCase.query}" | Brand: [${testCase.brand.join(', ')}] | Selected: [${testCase.selectedTags.join(', ')}]`);
      console.log(`📊 Status: ${response.status}`);

      if (response.parseError) {
        console.log(`❌ Parse Error: ${response.parseError}`);
        console.log(`📄 Raw Data: ${response.data}`);
      } else {
        console.log(`📋 Response Type: ${Array.isArray(response.data) ? 'Array' : typeof response.data}`);
        console.log(`📏 Length: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);

        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`🔍 First item structure:`, JSON.stringify(response.data[0], null, 2));
          console.log(`🔍 First item keys:`, Object.keys(response.data[0]));
          if (response.data.length > 1) {
            console.log(`🔍 Second item structure:`, JSON.stringify(response.data[1], null, 2));
          }
        } else {
          console.log(`📋 Full response:`, JSON.stringify(response.data, null, 2));
        }
      }

      console.log('─'.repeat(60));
    } catch (error) {
      console.log(`❌ Error for query "${testCase.query}": ${error.message}`);
      console.log('─'.repeat(60));
    }
  }
}

async function main() {
  console.log('🚀 Starting API Response Format Testing...');
  console.log(`🌐 Base URL: ${BASE_URL}`);

  try {
    await testBrandAutocomplete();
    await testTagAutocomplete();

    console.log('\n✅ Testing completed! Check the output above to see response formats.');
    console.log('\n📝 Next steps:');
    console.log('1. Compare the actual response structure with TypeScript types in lib/types.ts');
    console.log('2. Update types and API client if needed');
    console.log('3. Update components if response format changed');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}