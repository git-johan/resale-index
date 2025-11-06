# Brand Data Web Viewer

A simple HTML page that displays comprehensive brand data from the Tings Resale Tags API.

## Features

- **URL-based brand selection** - Add `?brand=nike` to view any brand
- **Complete brand overview** - Shows all tags, statistics, and listings
- **Raw HTML styling** - No external CSS, just browser defaults with basic tables
- **All brand data** - Tags ranked by popularity, complete listings with images
- **Real-time API data** - Fresh data directly from the API

## Files

- `brand-viewer.html` - The main web page (works standalone)
- `server.js` - Local development server (solves CORS issues)

## Usage

### Option 1: Local Development Server (Recommended)

```bash
# Start the server
npm run server

# Open in browser
http://localhost:8080?brand=nike
```

The server automatically proxies API calls to avoid CORS issues.

### Option 2: Direct HTML File

Open `brand-viewer.html` directly in your browser:
```
file:///path/to/brand-viewer.html?brand=nike
```

**Note**: This may have CORS issues depending on your browser settings.

## Examples

Try these URLs:

- `http://localhost:8080?brand=nike` - Nike products
- `http://localhost:8080?brand=adidas` - Adidas products
- `http://localhost:8080?brand=balenciaga` - Balenciaga products
- `http://localhost:8080?brand=puma` - Puma products

## What You'll See

### 1. Brand Statistics
- Total listings count
- Price ranges (median, average, P25-P75)
- Total market volume

### 2. Tags Table
All tags ranked by listing count showing:
- Tag name (e.g., "air", "sko", "str")
- Number of listings per tag
- Price statistics per tag
- Market volume per tag

### 3. Complete Listings
All available product listings with:
- Product images (60x60px thumbnails)
- Product titles
- Prices (highlighted in bold)
- Condition (NEW, USED, USED_NICELY)
- Categories
- Last updated dates

## Technical Details

- **Pure HTML + JavaScript** - No frameworks or external dependencies
- **API Integration** - Direct calls to Tings Resale Tags API
- **CORS Handling** - Local server proxies requests when needed
- **Auto-detection** - Switches between direct API and proxy based on hostname
- **Error Handling** - Shows helpful error messages for API failures

## Data Source

All data comes from the Tings Resale Tags API endpoints:
- `/get-listings` - Primary data source for tags and listings
- Auto-loads up to 1000 listings per tag
- Shows up to 200 tags per brand

Perfect for exploring the resale market data for any brand!