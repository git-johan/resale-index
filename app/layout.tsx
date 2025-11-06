import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tings Resale Index',
  description: 'Second hand estimates for any product',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-dark font-sf-pro text-white leading-1.2">
        {children}
      </body>
    </html>
  )
}