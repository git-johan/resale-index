# Tings Resale Tags API Explorer

**Learn each API endpoint by seeing exactly how it works!**

This educational tool shows you:
- ✅ The exact HTTP request being made
- ✅ Request payload structure with parameter descriptions
- ✅ Headers and authentication
- ✅ Full API response structure

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run any command:
   ```bash
   node brand-query.js [endpoint] [parameters]
   ```

The script automatically loads your API credentials from `.env` using dotenv.

## API Endpoints Available

### 1. Brand Name Search (`/get-brands-autocomplete`)
```bash
node brand-query.js brands-autocomplete "nike"
```
**Purpose**: Find brand names matching your search
**Shows**: Exact request payload with `query` parameter

### 2. Product Listings (`/get-listings`)
```bash
node brand-query.js listings "Nike"
```
**Purpose**: Get actual product listings + market statistics
**Shows**: How to filter by brand, categories, tags, and search terms

### 3. Product Price Estimate (`/get-estimate-for-product`)
```bash
node brand-query.js estimate-product "Air Jordan 1" "Nike" "shoes"
```
**Purpose**: Price estimate for specific product + brand
**Shows**: Required vs optional parameters (`name`, `brand`, `category`)

### 4. Simple Price Estimate (`/get-estimate-new`)
```bash
node brand-query.js estimate-simple "Supreme Box Logo"
```
**Purpose**: Quick price estimate using just search term
**Shows**: Minimal request payload structure

### 5. Category Search (`/get-category-autocomplete`)
```bash
node brand-query.js categories-autocomplete "shoes"
```
**Purpose**: Find category names matching your search
**Shows**: Category search request structure

## What You'll Learn

Each command displays:

```
🏷️  ENDPOINT: /get-brands-autocomplete
📝 PURPOSE: Search for brand names that match your query

🌐 API CALL DETAILS:
   URL: http://176.9.36.10:3000/get-brands-autocomplete
   Method: POST
   Headers: {"Content-Type": "application/json", "api-key": "your-key"}
   Request Body: {
     "query": "nike"
   }
   Response Status: 200

📄 API RESPONSE:
[{"name": "nike", "listing_count": 193114}]
```

## Understanding the API

- **Authentication**: Uses `api-key` header
- **Method**: All endpoints use POST
- **Content-Type**: `application/json`
- **Required vs Optional**: Comments in code show parameter requirements
- **Response Format**: All return JSON

Perfect for learning the API structure before integrating into your own applications!

## API Documentation

See `docs/tings-resale-tags-api-docs.json` for the complete OpenAPI specification.