#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Copy the _redirects file to the dist directory
echo "Copying _redirects file to dist directory..."
cp public/_redirects dist/ 2>/dev/null || true

# Make sure the _redirects file exists
echo "Ensuring _redirects file exists..."
echo "/api/*  /.netlify/functions/api/:splat  200" > dist/_redirects
echo "/*    /index.html   200" >> dist/_redirects

echo "Build completed!"