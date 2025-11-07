// Next.js API Route for Brand Autocomplete via Tings Resale API
// Provides autocomplete suggestions for brand search

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { query } = body

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

    // Make request to Tings Resale API for brand autocomplete
    console.log('Brand Autocomplete API: Making request to Tings Resale API')
    console.log('Query:', query)

    const response = await fetch(apiUrl + '/get-brands-autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ query }),
    })

    if (!response.ok) {
      console.error('Tings API Error:', response.status, response.statusText)
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Brand Autocomplete API: Successfully received data from Tings API')
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
    console.error('Brand Autocomplete API Error:', error)
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