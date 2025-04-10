# Deployment Guide for Webin2APK

## Deploying to Replit
1. Click "Deploy" in the Replit interface
2. Select "Cloudrun" as the deployment target
3. Once deployed, your app will be available at: https://skill-share-network-globalxspace.replit.app

## Deploying to Netlify
If you want to deploy to Netlify manually:
1. Sign up for a Netlify account
2. Install Netlify CLI: `npm install -g netlify-cli`
3. Run: `netlify login`
4. Run: `netlify deploy --prod`

## Troubleshooting
If your deployment is not working:
1. Check if environment variables are properly set
2. Ensure DATABASE_URL is correctly set
3. Verify SESSION_SECRET is properly configured
