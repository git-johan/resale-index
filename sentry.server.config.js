// This file configures the initialization of Sentry on the server side
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture unhandled promise rejections
  captureUnhandledRejections: true,

  beforeSend(event) {
    // Filter out non-essential server errors
    if (process.env.NODE_ENV === 'production') {
      // You can add server-specific filtering here
      return event
    }
    return event
  }
})