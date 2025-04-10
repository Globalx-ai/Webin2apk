# Netlify Manual Deployment Instructions

Follow these steps to deploy your application to Netlify with proper SPA routing:

## 1. Build the application with redirects

Run:
```bash
./netlify-build.sh
```

This will build the application and add the necessary redirect rules.

## 2. Deploy to Netlify

Run:
```bash
npx netlify deploy --prod
```

Follow the prompts to:
- Log in to Netlify (if needed)
- Select your team
- Choose to create a new site or select an existing one
- Confirm the deploy path as "dist"

## 3. Verify your deployment

Once deployed, Netlify will provide a URL for your site. Visit this URL to verify that:
- The site loads correctly
- Navigation works as expected
- API routes work properly

## Troubleshooting

If you encounter 404 errors:
1. Check your Netlify site settings
2. Go to "Site settings" > "Build & deploy" > "Continuous deployment"
3. Verify the "Build command" is set to `./netlify-build.sh`
4. Verify the "Publish directory" is set to `dist`
5. Trigger a new deploy