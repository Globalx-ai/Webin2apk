# Webin2Apk - Web to Mobile App Converter

An open-source full-stack web and mobile application that converts web content (URLs, HTML, PDF) into installable mobile applications for Android and iOS devices.

## Features

- **Multi-Source Conversion**: Convert web URLs, HTML code, and PDFs into mobile applications
- **Multi-Platform Support**: Generate both Android (APK) and iOS app bundles
- **Multi-Store Compatibility**: Support for Google Play, Amazon App Store, Samsung Galaxy Store, and Huawei AppGallery
- **App Customization**: Customize app name, package name, version, and app icon
- **AI-Powered Assistance**: Code auto-completion, validation, and optimization
- **PDF Conversion**: Convert PDF documents into functioning mobile applications
- **Preview Functionality**: Preview mobile apps before building
- **GitHub Integration**: Connect to GitHub repositories to save applications
- **User Management**: Authentication system with protected routes

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Mobile App Building**: Custom Android and iOS bundling tools
- **Payments**: Stripe integration (optional)
- **AI Integration**: OpenAI for code assistance

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- PostgreSQL database
- OpenAI API key (for AI features)
- Stripe account (for payment features, optional)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/webin2apk.git
   cd webin2apk
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Copy `.env.example` to `.env`
   - Fill in the required environment variables

4. Start the application
   ```
   npm run dev
   ```

## Environment Variables

See `.env.example` for all required environment variables.

## Directory Structure

- `/client` - Frontend React application
- `/server` - Backend Express application
- `/shared` - Shared types and schemas
- `/uploads` - Temporary file uploads
- `/downloads` - Generated APK and iOS bundles
- `/builds` - Build artifacts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
