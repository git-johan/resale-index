import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tings Analytics',
  description: 'Professional resale value analytics for streetwear and sneakers. Get instant price estimates with smart tag filtering.',
  keywords: ['resale', 'analytics', 'streetwear', 'sneakers', 'price estimates', 'tings'],
  authors: [{ name: 'Tings' }],

  // Favicon and app icons
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },

  // Open Graph for social sharing (Facebook, LinkedIn, etc.)
  openGraph: {
    title: 'Tings Analytics',
    description: 'Professional resale value analytics for streetwear and sneakers. Get instant price estimates with smart tag filtering.',
    url: 'https://analytics.tings.com',
    siteName: 'Tings Analytics',
    images: [
      {
        url: '/social-share.png',
        width: 1200,
        height: 630,
        alt: 'Tings Analytics - Resale Value Analytics',
      },
    ],
    locale: 'nb_NO',
    type: 'website',
  },

  // Twitter Card for Twitter sharing
  twitter: {
    card: 'summary_large_image',
    title: 'Tings Analytics',
    description: 'Professional resale value analytics for streetwear and sneakers.',
    images: ['/social-share.png'],
    creator: '@tings', // Add your Twitter handle if you have one
  },

  // Additional metadata
  robots: {
    index: true,
    follow: true,
  },

  // Canonical URL
  metadataBase: new URL('https://analytics.tings.com'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-dark font-sf-pro text-text-primary leading-1.2">
        {children}
      </body>
    </html>
  )
}