// Next.js API Route for Tag Autocomplete via Tings Resale API
// Provides autocomplete suggestions for tag search scoped by brand and current selections

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const {
      query,
      brand,
      tag = [],
      tagExclude = [],
      category = [],
      categoryExclude = [],
      limit = 20
    } = body

    // Validate required parameters
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      )
    }

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

    // Make request to Tings Resale API for tag autocomplete
    console.log('Tag Autocomplete API: Making request to Tings Resale API')
    console.log('Query:', query, 'Brand:', brand, 'Selected tags:', tag, 'Excluded tags:', tagExclude)

    const requestData = {
      query,
      brand: Array.isArray(brand) ? brand : [brand],
      tag,
      tagExclude,
      category,
      categoryExclude,
      limit
    }

    const response = await fetch(apiUrl + '/get-tags-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestData),
    })

    if (!response.ok) {
      console.error('Tings API Error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Tag Autocomplete API: Successfully received data from Tings API')
    console.log('Suggestions count:', data?.length || 0)

    // Return the data with CORS headers for development
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Tag Autocomplete API Error:', error)
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