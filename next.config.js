/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TINGS_RESALE_TAGS_URL: process.env.TINGS_RESALE_TAGS_URL,
    TINGS_RESALE_API_KEY: process.env.TINGS_RESALE_API_KEY,
  },
}

module.exports = nextConfig