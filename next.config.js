const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TINGS_RESALE_TAGS_URL: process.env.TINGS_RESALE_TAGS_URL,
    TINGS_RESALE_API_KEY: process.env.TINGS_RESALE_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
  },
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  dryRun: process.env.NODE_ENV !== 'production',
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)