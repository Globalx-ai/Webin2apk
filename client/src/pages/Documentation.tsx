import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SupportInfo from "@/components/common/SupportInfo";

const Documentation = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-gray-500 mt-1">
          Learn how to use Web2APK to convert websites to Android apps
        </p>
      </div>

      <Tabs defaultValue="getting-started" className="mb-8">
        <TabsList className="grid grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="stores">App Stores</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="getting-started">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started with Web2APK</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Step 1: Enter Website Details</h3>
                <p className="text-gray-600">
                  Start by entering the URL of the website you want to convert into an Android app. Ensure the website is mobile-friendly for the best results. You'll also need to provide an app name and package name.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 2: Customize Your App</h3>
                <p className="text-gray-600">
                  Choose colors, upload an app icon, and customize the appearance of your app. The icon should be a high-resolution square image (recommended: 1024x1024 pixels).
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 3: Configure Technical Settings</h3>
                <p className="text-gray-600">
                  Set up Android permissions, app signing details, and optional monetization features. Most websites only need the INTERNET permission, but additional permissions may be required for specific features.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Step 4: Build and Download</h3>
                <p className="text-gray-600">
                  Generate your Android APK file and download it when the build is complete. The build process typically takes 2-3 minutes depending on the complexity of your app.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features and Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">WebView Customization</h3>
                <p className="text-gray-600">
                  Control WebView settings such as JavaScript, DOM storage, zoom controls, and caching. You can also inject custom CSS and JavaScript to enhance the web content within your app.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Offline Support</h3>
                <p className="text-gray-600">
                  Choose from different offline support options:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>None: No offline support, requires internet connection</li>
                  <li>Basic Cache: Stores recently visited pages for offline viewing</li>
                  <li>Progressive Web App (PWA): Utilizes the website's PWA capabilities if available</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">App Signing</h3>
                <p className="text-gray-600">
                  Automatically generates a keystore file for signing your app, which is required for publishing to app stores. The keystore and its credentials are important to preserve for future app updates.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Monetization</h3>
                <p className="text-gray-600">
                  Integrate Google AdMob to display banner and interstitial ads in your app. You'll need to create an AdMob account and add your AdMob IDs to enable this feature.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <Card>
            <CardHeader>
              <CardTitle>Publishing to App Stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Google Play Store</h3>
                <p className="text-gray-600">
                  To publish on the Google Play Store, you'll need:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>A Google Play Developer account ($25 one-time fee)</li>
                  <li>Your signed APK or AAB file (download from Web2APK after building)</li>
                  <li>App screenshots (minimum 2) in various sizes</li>
                  <li>App icon (automatically generated by Web2APK)</li>
                  <li>Privacy policy URL (required for all apps)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Amazon Appstore</h3>
                <p className="text-gray-600">
                  For the Amazon Appstore, you'll need:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>An Amazon Developer account (free)</li>
                  <li>Your signed APK file (download from Web2APK after building)</li>
                  <li>App screenshots in required dimensions</li>
                  <li>App icon in required dimensions (provided by Web2APK)</li>
                  <li>Privacy policy URL</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Samsung Galaxy Store</h3>
                <p className="text-gray-600">
                  For the Samsung Galaxy Store, you'll need:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
                  <li>A Samsung Developer account (free)</li>
                  <li>Your signed APK file (download from Web2APK after building)</li>
                  <li>App screenshots in required formats</li>
                  <li>App metadata including description and categories</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Important Notes</h3>
                <p className="text-gray-600">
                  Each app store has policies regarding WebView apps. Some may reject apps that simply wrap websites without adding significant functionality. Be sure to review each store's policies before submitting your app.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Can I convert any website to an app?</h3>
                <p className="text-gray-600">
                  Yes, you can convert most websites, but mobile-friendly and responsive websites work best. Some websites may have restrictions against being embedded in WebViews.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Do I need coding skills to use Web2APK?</h3>
                <p className="text-gray-600">
                  No coding skills are required. Our intuitive interface guides you through the entire process of creating an Android app from your website.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">What's the difference between APK and AAB?</h3>
                <p className="text-gray-600">
                  APK (Android Package) can be installed directly on Android devices. AAB (Android App Bundle) is the preferred format for Google Play Store submissions, as it optimizes the app size for each device.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Can I update my app after publishing?</h3>
                <p className="text-gray-600">
                  Yes. To update your app, you'll need to create a new build with Web2APK using the same package name and signing key, then submit the update to the app stores.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Will my app work offline?</h3>
                <p className="text-gray-600">
                  It depends on the offline support option you choose. With basic caching, recently visited pages may be available offline. PWA support offers better offline functionality if the website supports it.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Do you support iOS apps?</h3>
                <p className="text-gray-600">
                  Currently, Web2APK supports Android app creation only. iOS support may be added in future versions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SupportInfo />
    </>
  );
};

export default Documentation;
