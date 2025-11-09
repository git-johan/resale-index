'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import { Listing } from '@/lib/types'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ScatterController
)

interface PriceDistributionChartProps {
  listings: Listing[]
  height?: number
  estimateValue?: string // The estimate value to show as horizontal line
  estimateRange?: string // The estimate range to determine point colors
}

interface ScatterDataPoint {
  x: number
  y: number
  title: string
}

// Helper function to parse estimate range (e.g., "1750-2799kr" -> { min: 1750, max: 2799 })
function parseEstimateRange(rangeStr?: string): { min: number, max: number } | null {
  if (!rangeStr) return null

  // Match pattern like "1750-2799kr" or "1 750 - 2 799 kr"
  const match = rangeStr.match(/(\d+(?:\s?\d+)*)\s*-\s*(\d+(?:\s?\d+)*)/);
  if (!match) return null

  const min = parseFloat(match[1].replace(/\s/g, ''))
  const max = parseFloat(match[2].replace(/\s/g, ''))

  if (isNaN(min) || isNaN(max)) return null

  return { min, max }
}

export function PriceDistributionChart({ listings, height = 160, estimateValue, estimateRange }: PriceDistributionChartProps) {
  // Transform listings data to chart data
  const chartData = useMemo(() => {
    const withinRangePoints: ScatterDataPoint[] = []
    const outsideRangePoints: ScatterDataPoint[] = []
    const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000) // 365 days in milliseconds

    // Parse the estimate range
    const range = parseEstimateRange(estimateRange)

    // Process each listing
    listings.forEach((listing) => {
      // Parse price: "1800 kr" or "2 500 kr" -> 1800, 2500
      const price = parsePrice(listing.price)

      // Parse date
      const date = parseDate(listing)

      // Only include valid data points that are within the last 365 days
      if (price !== null && date !== null && date >= oneYearAgo) {
        const dataPoint = {
          x: date,
          y: price,
          title: listing.title || 'Untitled listing'
        }

        // Check if price is within estimate range
        if (range && price >= range.min && price <= range.max) {
          withinRangePoints.push(dataPoint)
        } else {
          outsideRangePoints.push(dataPoint)
        }
      }
    })

    // Parse estimate value for horizontal line
    const estimatePrice = estimateValue ? parsePrice(estimateValue) : null
    const estimateLineData: any[] = []

    // Add estimate line if we have both estimate and data points
    const allDataPoints = [...withinRangePoints, ...outsideRangePoints]
    if (estimatePrice && allDataPoints.length > 0) {
      const minDate = Math.min(...allDataPoints.map(p => p.x))
      const maxDate = Math.max(...allDataPoints.map(p => p.x))

      estimateLineData.push(
        { x: minDate, y: estimatePrice },
        { x: maxDate, y: estimatePrice }
      )
    }

    const datasets: any[] = []

    // Add dataset for points within estimate range (white)
    if (withinRangePoints.length > 0) {
      datasets.push({
        label: 'Within Range',
        data: withinRangePoints,
        backgroundColor: '#ffffff', // white for within range
        borderColor: 'transparent',
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#ffffff',
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        showLine: false,
        type: 'scatter' as const
      })
    }

    // Add dataset for points outside estimate range (light gray)
    if (outsideRangePoints.length > 0) {
      datasets.push({
        label: 'Outside Range',
        data: outsideRangePoints,
        backgroundColor: '#9a9a9a', // brand-gray for outside range (lighter)
        borderColor: 'transparent',
        pointRadius: 4,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#9a9a9a', // brand-gray
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        showLine: false,
        type: 'scatter' as const
      })
    }

    // Add estimate line dataset
    if (estimateLineData.length > 0) {
      datasets.push({
        label: 'Estimate',
        data: estimateLineData,
        backgroundColor: '#ffffff',
        borderColor: '#ffffff', // white line
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 1,
        showLine: true,
        type: 'line' as const,
        tension: 0, // Straight line
      })
    }

    return { datasets }
  }, [listings, estimateValue, estimateRange])

  // Chart configuration
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Hide legend for clean look
      },
      tooltip: {
        backgroundColor: '#2c2c2c', // border-subtle
        titleColor: '#ffffff',
        bodyColor: '#9a9a9a', // brand-gray
        borderColor: '#2c2c2c',
        borderWidth: 1,
        cornerRadius: 4,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            // Check if this is the estimate line by dataset label
            if (context.dataset.label === 'Estimate') {
              const price = context.parsed.y
              return `Estimate: ${price} kr`
            }

            // Regular listing data point
            const dataPoint = context.raw as ScatterDataPoint
            const price = context.parsed.y
            const date = new Date(context.parsed.x)
            const formattedDate = date.toLocaleDateString('nb-NO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
            return [
              dataPoint.title,
              `${price} kr - ${formattedDate}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const,
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy',
            year: 'yyyy'
          }
        },
        grid: {
          color: '#2c2c2c', // border-subtle hairlines
          lineWidth: 1
        },
        ticks: {
          color: '#787878', // text-secondary
          font: {
            size: 10
          },
          maxTicksLimit: 5
        },
        border: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#2c2c2c', // border-subtle hairlines
          lineWidth: 1
        },
        ticks: {
          color: '#787878', // text-secondary
          font: {
            size: 10
          },
          callback: function(value: any) {
            return `${value} kr`
          },
          maxTicksLimit: 6
        },
        border: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest' as const
    },
    onHover: (event: any, activeElements: any) => {
      const target = event.native?.target
      if (target) {
        target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default'
      }
    }
  }), [])

  // Helper function to parse price strings
  function parsePrice(priceStr?: string): number | null {
    if (!priceStr) return null

    // Match digits with optional spaces: "1800", "2 500", "12500"
    const match = priceStr.match(/(\d+(?:\s?\d+)*)/);
    if (!match) return null

    // Remove spaces and convert to number
    const priceNumber = parseFloat(match[1].replace(/\s/g, ''))
    return isNaN(priceNumber) ? null : priceNumber
  }

  // Helper function to parse dates
  function parseDate(listing: Listing): number | null {
    const dateStr = listing.lastUpdatedAt || listing.date
    if (!dateStr) return null

    const timestamp = Date.parse(dateStr)
    return isNaN(timestamp) ? null : timestamp
  }

  // Handle empty state
  if (!listings || listings.length === 0) {
    return (
      <div className="h-40 bg-brand-darker rounded border border-border-subtle flex items-center justify-center">
        <p className="text-10pt text-text-secondary">No listings available for chart</p>
      </div>
    )
  }

  // Check if we have valid data points
  const validDataPoints = chartData.datasets.reduce((total, dataset) => {
    return dataset.label !== 'Estimate' ? total + dataset.data.length : total
  }, 0)
  if (validDataPoints === 0) {
    return (
      <div className="h-40 bg-brand-darker rounded border border-border-subtle flex items-center justify-center">
        <p className="text-10pt text-text-secondary">No valid price/date data for chart</p>
      </div>
    )
  }

  return (
    <div style={{ height: `${height}px` }} className="bg-transparent">
      <Scatter data={chartData} options={chartOptions} />
    </div>
  )
}