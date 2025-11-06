// Next.js API Route for Tings Resale API proxy
// Replaces the old server.js proxy functionality

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()

    // Get environment variables
    const apiUrl = process.env.TINGS_RESALE_TAGS_URL
    const apiKey = process.env.TINGS_RESALE_API_KEY

    if (!apiUrl || !apiKey) {
      console.error('Missing environment variables:', { apiUrl: !!apiUrl, apiKey: !!apiKey })
      return NextResponse.json(
        { error: 'API configuration missing' },
        { status: 500 }
      )
    }

    // Make request to Tings Resale API
    console.log('API Proxy: Making request to Tings Resale API')
    console.log('Request body:', JSON.stringify(body, null, 2))

    const response = await fetch(apiUrl + '/get-listings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('Tings API Error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('API Proxy: Successfully received data from Tings API')
    console.log('API Response structure:', {
      hasListingsCount: 'listingsCount' in data,
      hasTags: 'tags' in data,
      tagsCount: data.tags?.length || 0,
      firstTag: data.tags?.[0] || null,
      firstTagProperties: Object.keys(data.tags?.[0] || {}),
      otherFields: Object.keys(data).filter(key => !['tags', 'listingsCount'].includes(key))
    })

    // Log the first tag completely
    if (data.tags?.[0]) {
      console.log('First tag object:', JSON.stringify(data.tags[0], null, 2))
    }

    // Return the data with CORS headers for development
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('API Proxy Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  )
}