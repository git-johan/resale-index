# Resale Index

A professional resale value index application for streetwear and sneaker brands. Built with Next.js, featuring smart tag ranking and comprehensive price analysis.

## 🌟 Features

- **Brand Search**: Search and analyze resale values for popular brands (Nike, Adidas, Supreme, etc.)
- **Smart Tag Filtering**: Include/exclude tags with intelligent ranking and similarity penalties
- **Price Analysis**: Comprehensive price statistics with distribution charts
- **Mobile-First Design**: Responsive layout optimized for all devices
- **Real-time URL Sync**: Share filtered searches with URL parameters
- **Expanded Details View**: In-depth analysis with listings and price charts

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 with App Router
- **Styling**: TailwindCSS
- **Charts**: Chart.js with react-chartjs-2
- **API**: External Tings Resale Tags API
- **Deployment**: Railway with automatic CI/CD

### Application Structure
```
resale-index/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (proxy to external API)
│   ├── globals.css        # Global styles
│   └── page.tsx          # Main application page
├── components/            # React components
│   ├── ExpandedDetailsView.tsx
│   ├── PriceDistributionChart.tsx
│   └── StackItem.tsx
├── hooks/                 # Custom React hooks
│   ├── useBrandData.ts
│   └── useTagSelection.ts
├── lib/                   # Utilities and types
│   ├── api-client.ts
│   ├── tag-ranking.ts
│   └── types.ts
└── docs/                  # API documentation
```

## 🚀 Production Deployment

### Live Application
- **Production URL**: [analytics.tings.com](https://analytics.tings.com)
- **Hosting**: Railway
- **Domain**: Custom domain with automatic SSL

### Deployment Architecture
```
GitHub (Source) → Railway (Build & Deploy) → analytics.tings.com (Live)
```

### Automatic Deployment Process
1. **Code Push**: `git push origin master`
2. **Railway Detection**: Automatically detects new commits
3. **Build Process**:
   - `npm install` (install dependencies)
   - `npm run build` (build Next.js application)
   - `npm start` (start production server)
4. **Live Update**: Zero-downtime deployment to resale.tings.com
5. **Timeline**: 3-5 minutes from push to live

### Environment Variables (Production)
```env
TINGS_RESALE_TAGS_URL=https://cceas.zrok.tings.com
TINGS_RESALE_API_KEY=long-horse-running-forever-accross-the-borderless-sea
NODE_ENV=production
```

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
1. **Clone Repository**
   ```bash
   git clone https://github.com/git-johan/resale-index.git
   cd resale-index
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local`:
   ```env
   TINGS_RESALE_TAGS_URL=https://cceas.zrok.tings.com
   TINGS_RESALE_API_KEY=long-horse-running-forever-accross-the-borderless-sea
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Application runs on http://localhost:3003

### Development Workflow

#### Daily Development
1. **Local Development**
   ```bash
   npm run dev  # Start development server on port 3003
   ```

2. **External Testing with ngrok**
   ```bash
   ngrok http 3003  # Get public URL for testing
   ```

3. **Deploy to Production**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin master  # Automatic deployment triggers
   ```

#### Branch-Based Development (Recommended for Features)
```bash
# Create feature branch
git checkout -b feature/new-feature

# Develop and test locally
npm run dev

# Commit changes
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create Pull Request on GitHub
# Merge to master → Automatic deployment
```

### Available Scripts
```bash
npm run dev         # Start development server (port 3003)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
```

## 📊 API Integration

### External API
- **Base URL**: https://cceas.zrok.tings.com
- **Endpoint**: `/get-listings`
- **Method**: POST
- **Authentication**: API Key in headers

### API Client
The application uses a custom API client (`lib/api-client.ts`) that:
- Proxies requests through Next.js API routes
- Handles authentication with API keys
- Processes and transforms API responses
- Implements error handling and retries

### Example API Request
```javascript
const response = await apiClient.getBrandData('nike', {
  selectedTags: [],
  excludedTags: [],
  usePostgres: true
})
```

## 🎨 UI/UX Features

### Component System
- **StackItem**: Unified component with 8 variants for consistent styling
- **Responsive Design**: Mobile-first approach with proper touch targets
- **Dark Theme**: Professional dark color scheme
- **Typography**: SF Pro font system for iOS-like experience

### Interactive Features
- **Real-time Tag Filtering**: Include/exclude tags with immediate feedback
- **URL State Management**: Shareable URLs with filter parameters
- **Expandable Details**: Full-screen view with price analysis
- **Smart Tag Ranking**: Intelligent sorting based on price impact and similarity

### Performance Optimizations
- **Next.js App Router**: Optimized routing and rendering
- **Component Optimization**: Efficient re-rendering with proper state management
- **Image Optimization**: Next.js automatic image optimization
- **Bundle Optimization**: Tree shaking and code splitting

## 🔧 Railway Configuration

### Project Setup
1. **Connect Repository**: Railway auto-detects Next.js projects
2. **Build Configuration**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Node Version: 18+
3. **Environment Variables**: Set in Railway dashboard
4. **Domain Configuration**: Custom domain with automatic SSL

### Build Process
Railway automatically:
- Installs dependencies
- Builds Next.js application
- Optimizes for production
- Starts production server
- Handles health checks

### Monitoring & Logs
- **Live Logs**: Available in Railway dashboard
- **Build Logs**: Detailed build process information
- **Error Tracking**: Integrated with application logging
- **Uptime Monitoring**: Built-in health checks

## 📈 Monitoring & Analytics

### Error Tracking (Sentry)

#### Setup Instructions
1. **Create Sentry Account**: Visit [sentry.io](https://sentry.io) and create a free account
2. **Create Project**:
   - Choose "React" as platform
   - Project name: "resale-index"
   - Copy the DSN URL provided

3. **Configure Environment Variables in Railway**:
   ```env
   SENTRY_DSN=https://[your-dsn]@sentry.io/[project-id]
   SENTRY_ORG=your-organization-slug
   SENTRY_PROJECT=resale-index
   ```

4. **Features**:
   - Client and server-side error tracking
   - Email notifications for new errors
   - Transaction monitoring and performance insights
   - Session replay for debugging
   - Release tracking with source maps

#### Error Filtering
- Filters out ResizeObserver false positives
- Production optimized with 10% transaction sampling
- Unhandled promise rejection capturing
- Environment-based configuration

### Uptime Monitoring (UptimeRobot)

#### Setup Instructions
1. **Create Account**: Visit [uptimerobot.com](https://uptimerobot.com) and sign up (free tier available)
2. **Add Monitor**:
   - Monitor Type: HTTP(s)
   - Friendly Name: "Resale Index - Analytics"
   - URL: `https://analytics.tings.com`
   - Monitoring Interval: 5 minutes
3. **Configure Alerts**:
   - Email notifications for downtime
   - SMS alerts (paid tier)
   - Slack/Discord webhook integration

#### Monitoring Features
- 5-minute interval health checks
- Global monitoring locations
- Public status pages
- 50 monitors on free tier
- 99.9% uptime SLA tracking

### Performance Monitoring

#### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds
- **Cumulative Layout Shift (CLS)**: < 0.1

#### Bundle Analysis
```bash
# Analyze bundle size
npm run build
npx @next/bundle-analyzer
```

#### API Performance Monitoring
- Response time tracking via Sentry
- Error rate monitoring
- External API dependency tracking
- Database query performance (if applicable)

## 🛡️ Security

### Security Headers
Configured in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: origin-when-cross-origin

### API Security
- API keys stored as environment variables
- Server-side API proxy to hide credentials
- Input validation and sanitization
- Rate limiting through hosting provider

### SSL/TLS
- Automatic SSL certificate provisioning
- HTTPS-only redirects
- TLS 1.2+ enforcement
- Security headers implementation

## 🔄 Deployment Troubleshooting

### Common Build Issues

#### Build Fails
```bash
# Check locally first
npm run build

# Common fixes:
npm install          # Update dependencies
npm update           # Update to latest versions
rm -rf node_modules  # Clean install
npm install
```

#### Environment Variable Issues
1. Verify variables in Railway dashboard
2. Check variable names match `.env.local`
3. Ensure no trailing spaces or quotes
4. Restart deployment after changes

#### API Connection Issues
1. Test API endpoint accessibility
2. Verify API key validity
3. Check network connectivity from Railway
4. Review application logs for errors

### Rollback Procedure

#### Quick Rollback (Railway Dashboard)
1. Go to Deployments tab
2. Find last working deployment
3. Click "Redeploy"
4. Verify functionality

#### Code Rollback
```bash
# Find problematic commit
git log --oneline

# Revert specific commit
git revert [commit-hash]
git push origin master

# Railway auto-deploys reverted version
```

### Performance Issues
1. **Check Railway metrics**: CPU, memory usage
2. **Review API response times**: External API performance
3. **Optimize bundle size**: `npm run build` analysis
4. **Enable CDN**: Cloudflare for global performance

## 📋 Maintenance

### Regular Tasks

#### Daily (2 minutes)
- Check Railway dashboard for errors
- Monitor uptime alerts
- Review performance metrics

#### Weekly (15 minutes)
- Update dependencies: `npm update`
- Review error logs in Sentry
- Check application performance
- Test critical user paths

#### Monthly (30 minutes)
- Major dependency updates
- Security audit: `npm audit`
- Performance optimization review
- Backup critical configurations

### Scaling Considerations
- **Traffic Growth**: Railway auto-scaling available
- **Database Needs**: Consider adding Redis for caching
- **CDN**: Add Cloudflare for global performance
- **Monitoring**: Upgrade to paid tiers for advanced features

## 🤝 Contributing

### Development Process
1. Fork the repository
2. Create feature branch
3. Develop with proper testing
4. Submit pull request
5. Code review and merge

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for clear history

### Testing
- Local testing required before push
- Production testing after deployment
- User acceptance testing for major features
- Performance testing for optimizations

## 📞 Support

### Resources
- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **API Documentation**: See `/docs` folder

### Contact
- **Issues**: GitHub Issues for bug reports
- **Features**: GitHub Discussions for feature requests
- **Deployment**: Railway support for hosting issues

---

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/git-johan/resale-index.git
cd resale-index
npm install

# Create environment file
echo "TINGS_RESALE_TAGS_URL=https://cceas.zrok.tings.com" > .env.local
echo "TINGS_RESALE_API_KEY=long-horse-running-forever-accross-the-borderless-sea" >> .env.local

# Start development
npm run dev

# Deploy to production
git add .
git commit -m "Initial setup"
git push origin master
```

Your application will be live at [analytics.tings.com](https://analytics.tings.com) within 5 minutes! 🎉