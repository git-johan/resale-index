// This file configures the initialization of Sentry on the browser/client side
// import * as Sentry from '@sentry/nextjs'

// TEMPORARILY DISABLED - Sentry may be causing mobile browser issues
// Uncomment below to re-enable Sentry

/*
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture unhandled promise rejections
  captureUnhandledRejections: true,

  // Session Replay
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  // You can remove this option if you're not planning to use the Sentry Webpack Plugin
  // This sets the sample rate to be 10%. You may want this to be 100% while in development and sample at a lower rate in production
  beforeSend(event) {
    // Filter out non-essential errors in production
    if (process.env.NODE_ENV === 'production') {
      // Filter out ResizeObserver errors (common false positive)
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop limit exceeded')) {
        return null
      }
    }
    return event
  }
})
*/