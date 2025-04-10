#!/bin/bash

# Build the application
echo "Building application..."
npm run build

# Create the netlify.toml file if it doesn't exist
if [ ! -f netlify.toml ]; then
  echo "Creating netlify.toml..."
  cat > netlify.toml << 'EOL'
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[dev]
  command = "npm run dev"
  port = 5000
  targetPort = 5000

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions."api"]
  node_bundler = "esbuild"
  included_files = ["dist/**"]
EOL
fi

# Create .netlify directory if it doesn't exist
mkdir -p .netlify

# Create the Netlify site configuration
cat > .netlify/state.json << 'EOL'
{
  "siteId": "webin2apk"
}
EOL

# Ensure _redirects file is in the build output
echo "Copying _redirects file to dist directory..."
cp client/public/_redirects dist/ 2>/dev/null || true

# Create a _redirects file if it wasn't copied
echo "Creating fallback _redirects file in dist directory..."
echo "/api/*  /.netlify/functions/api/:splat  200" > dist/_redirects
echo "/*    /index.html   200" >> dist/_redirects

echo "Deployment preparation complete. You can now deploy using:"
echo "npx netlify deploy --prod"