#!/bin/bash

# This script prepares the app for deployment and improves accessibility

# 1. Build the app
echo "Building the application..."
npm run build

# 2. Ensure _redirects file exists
echo "Setting up redirect rules..."
echo "/api/*  /.netlify/functions/api/:splat  200" > dist/_redirects
echo "/*    /index.html   200" >> dist/_redirects

# 3. Copy downloads directory to public directory
echo "Making APK files accessible..."
mkdir -p dist/public/downloads
cp -R dist/public/downloads/* dist/downloads/ 2>/dev/null || true

# 4. Create a simple start script
echo "Creating start script..."
echo '#!/bin/bash
node dist/index.js
' > start.sh
chmod +x start.sh

# 5. Create deployment guide
echo "Creating deployment guide..."
cat > DEPLOYMENT.md << 'EOL'
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
EOL

echo "Deployment preparation complete!"
echo "Your app can now be deployed to make it accessible."

# 6. Provide direct access to latest APK files
echo "Latest APK files are available at:"
ls -lh dist/public/downloads/