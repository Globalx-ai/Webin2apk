#!/bin/bash

# Build the application
echo "Building application..."
npm run build

# Prepare the dist directory for testing
echo "Setting up dist directory and _redirects file..."
mkdir -p dist

# Ensure _redirects file is copied to dist directory
echo "Copying _redirects file to dist directory..."
cp client/public/_redirects dist/ 2>/dev/null || true

# Create a fallback _redirects file in case it wasn't already present
echo "/api/*  /.netlify/functions/api/:splat  200" > dist/_redirects
echo "/*    /index.html   200" >> dist/_redirects

# Ensure the Netlify functions directory exists
mkdir -p netlify/functions

# Check if the api.ts file exists in netlify/functions
if [ -f netlify/functions/api.ts ]; then
  echo "✓ Netlify API function exists"
else
  echo "✗ Missing netlify/functions/api.ts - this is required"
  exit 1
fi

# Check if netlify.toml exists
if [ -f netlify.toml ]; then
  echo "✓ netlify.toml configuration file exists"
else
  echo "✗ Missing netlify.toml - this is required"
  exit 1
fi

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL environment variable is not set"
else
  echo "✓ DATABASE_URL is set"
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "⚠️ SESSION_SECRET environment variable is not set"
else
  echo "✓ SESSION_SECRET is set"
fi

echo ""
echo "✓ Deployment verification complete. Your application is ready to deploy."
echo "Run './deploy-netlify.sh' to deploy to Netlify."