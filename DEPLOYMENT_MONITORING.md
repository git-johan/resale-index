# Monitoring Setup Guide

This document contains the specific steps to complete your monitoring setup for analytics.tings.com.

## 🚨 Sentry Error Tracking Setup

### Step 1: Create Sentry Account & Project
1. Visit [sentry.io](https://sentry.io) and create a free account
2. Click "Create Project"
3. Choose "React" as the platform
4. Project name: `resale-index`
5. Team/Organization: Use default or create `tings-analytics`
6. **Copy the DSN URL** provided (looks like: `https://abc123@o4505...ingest.sentry.io/456789`)

### Step 2: Add Environment Variables in Railway
1. Go to your Railway dashboard
2. Select your resale-index project
3. Go to "Variables" tab
4. Add these environment variables:
   ```
   SENTRY_DSN=https://[your-actual-dsn]@o[org-id].[region].sentry.io/[project-id]
   SENTRY_ORG=your-organization-slug
   SENTRY_PROJECT=resale-index
   ```

### Step 3: Test Sentry Integration
After adding the environment variables, Railway will automatically redeploy. You can test error tracking by:
1. Going to analytics.tings.com
2. Triggering an error (e.g., search for an invalid brand)
3. Check Sentry dashboard for the error report

## 📈 UptimeRobot Monitoring Setup

### Step 1: Create UptimeRobot Account
1. Visit [uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account (50 monitors included)
3. Verify your email address

### Step 2: Add Monitor
1. Click "Add New Monitor"
2. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `Resale Index - Analytics`
   - **URL**: `https://analytics.tings.com`
   - **Monitoring Interval**: 5 minutes
   - **Monitor Timeout**: 30 seconds

### Step 3: Configure Alerts
1. In the monitor settings, go to "Alert Contacts"
2. Add your email for downtime notifications
3. Optional: Add SMS alerts (paid feature)
4. Optional: Add Slack/Discord webhook integration

### Step 4: Create Public Status Page (Optional)
1. Go to "Public Status Pages"
2. Create a new page: `tings-analytics-status`
3. Add your monitor to the page
4. Share the public URL for transparency

## 🔍 Verification Steps

### Sentry Verification
1. Check Railway logs for successful Sentry initialization
2. Look for "Sentry initialized" messages
3. Test error capturing by visiting analytics.tings.com/nonexistent-page
4. Verify error appears in Sentry dashboard within 1-2 minutes

### UptimeRobot Verification
1. Monitor should show "Up" status within 5 minutes
2. Check that analytics.tings.com is accessible from multiple locations
3. Verify email alerts are working (you can test by pausing the monitor temporarily)

## 📊 Expected Results

### Sentry Dashboard
- Real-time error tracking
- Performance monitoring
- Session replays for debugging
- Release tracking with deployments

### UptimeRobot Dashboard
- 99.9%+ uptime tracking
- Response time monitoring
- Downtime alerts via email
- Historical uptime statistics

## 🚀 Next Steps After Setup

1. **Monitor for 24 hours** to ensure everything is working
2. **Configure alert thresholds** in Sentry for error rates
3. **Set up performance budgets** for Core Web Vitals
4. **Test alerting** by temporarily breaking something

## ⚠️ Important Notes

- **Free Tiers**: Both Sentry and UptimeRobot offer generous free tiers suitable for this application
- **Privacy**: No user data is sent to monitoring services, only error reports and uptime checks
- **Performance**: Monitoring adds minimal overhead to your application
- **Security**: DSN and monitoring credentials are environment variables, not exposed in code

## 🆘 Troubleshooting

### Sentry Not Working
- Check environment variables in Railway dashboard
- Verify DSN format is correct
- Check Railway deployment logs for Sentry errors
- Ensure project is configured for "React" platform in Sentry

### UptimeRobot False Positives
- Verify analytics.tings.com is accessible from your location
- Check Railway deployment status
- Adjust monitor timeout if needed (increase to 60 seconds)
- Verify URL is exactly `https://analytics.tings.com` (no trailing slash)

---

**Total Setup Time**: ~15 minutes
**Monitoring Coverage**: 24/7 error tracking + uptime monitoring
**Cost**: Free (with option to upgrade for advanced features)