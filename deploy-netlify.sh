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

# Deploy to Netlify
echo "Deploying to Netlify..."
npx netlify deploy --prod

echo "Deployment complete!"