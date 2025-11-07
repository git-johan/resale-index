'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
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
  TimeScale,
  Title,
  Tooltip,
  Legend,
  ScatterController
)

interface PriceDistributionChartProps {
  listings: Listing[]
  height?: number
}

interface ScatterDataPoint {
  x: number
  y: number
  title: string
}

export function PriceDistributionChart({ listings, height = 160 }: PriceDistributionChartProps) {
  // Transform listings data to chart data
  const chartData = useMemo(() => {
    const dataPoints: ScatterDataPoint[] = []

    // Process each listing
    listings.forEach((listing) => {
      // Parse price: "1800 kr" or "2 500 kr" -> 1800, 2500
      const price = parsePrice(listing.price)

      // Parse date
      const date = parseDate(listing)

      // Only include valid data points
      if (price !== null && date !== null) {
        dataPoints.push({
          x: date,
          y: price,
          title: listing.title || 'Untitled listing'
        })
      }
    })

    return {
      datasets: [
        {
          label: 'Listing Prices',
          data: dataPoints,
          backgroundColor: '#787878', // text-secondary gray
          borderColor: 'transparent',
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#9a9a9a', // brand-gray
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0,
        }
      ]
    }
  }, [listings])

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
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy'
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
  const validDataPoints = chartData.datasets[0].data.length
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