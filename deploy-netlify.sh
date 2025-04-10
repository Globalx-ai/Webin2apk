#!/bin/bash

# Build the application
echo "Building the application..."
npm run build

# Create directories
mkdir -p .netlify

# Deploy to Netlify
echo "Deploying to Netlify..."
npx netlify deploy --prod

echo "Deployment complete!"