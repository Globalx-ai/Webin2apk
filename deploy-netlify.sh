#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create directories
mkdir -p .netlify

# Ensure _redirects file is copied to dist directory
echo "Copying _redirects file to dist directory..."
cp client/public/_redirects dist/

# Create a fallback _redirects file in case it wasn't already present
echo "/api/*  /.netlify/functions/api/:splat  200" > dist/_redirects
echo "/*    /index.html   200" >> dist/_redirects

# Deploy to Netlify with specific site name
echo "Deploying to Netlify..."
# Try to use the site name webin2apk if it exists
NETLIFY_SITE_ID=$(npx netlify sites:list | grep webin2apk | awk '{print $1}')

if [ -n "$NETLIFY_SITE_ID" ]; then
  echo "Found existing site: webin2apk - Using site ID: $NETLIFY_SITE_ID"
  npx netlify deploy --prod --site-id $NETLIFY_SITE_ID
else
  echo "Site 'webin2apk' not found, creating new site..."
  npx netlify sites:create --name webin2apk
  npx netlify deploy --prod --site-name webin2apk
fi

echo "Deployment complete! Site should be available at https://webin2apk.netlify.app"
echo "If the site is not accessible, please check your Netlify account and verify domain settings."