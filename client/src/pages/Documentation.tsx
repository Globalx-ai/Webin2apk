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
              <CardTitle>Step-by-Step App Store Publishing Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-3">Google Play Store</h3>
                <p className="text-gray-600 mb-3">
                  Follow these steps to publish your app on the Google Play Store:
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Create a Developer Account</strong>
                    <p className="mt-1">Sign up for a Google Play Developer account at <a href="https://play.google.com/console/signup" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">play.google.com/console</a> ($25 one-time fee).</p>
                  </li>
                  <li>
                    <strong>Prepare Required Assets</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>AAB file (download from Web2APK)</li>
                      <li>High-resolution icon (512x512 PNG)</li>
                      <li>Feature graphic (1024x500 PNG)</li>
                      <li>Screenshots (minimum 2) for phone, 7-inch tablet, and 10-inch tablet</li>
                      <li>Privacy policy URL</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Create New App</strong>
                    <p className="mt-1">In the Google Play Console, click "Create app" and follow the prompts to set up your app listing.</p>
                  </li>
                  <li>
                    <strong>App Content and Store Listing</strong>
                    <p className="mt-1">Fill in your app's description, category, contact details, and upload all required graphic assets.</p>
                  </li>
                  <li>
                    <strong>App Release</strong>
                    <p className="mt-1">Upload your AAB file under "Production," "Open testing," or "Internal testing" track.</p>
                  </li>
                  <li>
                    <strong>Content Rating</strong>
                    <p className="mt-1">Complete the content rating questionnaire.</p>
                  </li>
                  <li>
                    <strong>Pricing & Distribution</strong>
                    <p className="mt-1">Set your app as free or paid, and select countries for distribution.</p>
                  </li>
                  <li>
                    <strong>App Review</strong>
                    <p className="mt-1">Submit for review. Google typically takes 1-3 days to review new apps.</p>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Amazon Appstore</h3>
                <p className="text-gray-600 mb-3">
                  Follow these steps to publish your app on the Amazon Appstore:
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Create a Developer Account</strong>
                    <p className="mt-1">Sign up for an Amazon Developer account at <a href="https://developer.amazon.com/apps-and-games" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">developer.amazon.com</a> (free).</p>
                  </li>
                  <li>
                    <strong>Prepare Required Assets</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>APK file (download from Web2APK)</li>
                      <li>App icon (512x512 PNG)</li>
                      <li>Screenshots (minimum 3) for phone and tablet</li>
                      <li>Promotional image (1280x720 JPG or PNG)</li>
                      <li>Privacy policy URL</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Add New App</strong>
                    <p className="mt-1">In the Amazon Developer Console, click "Add New App" and select Android.</p>
                  </li>
                  <li>
                    <strong>General Information</strong>
                    <p className="mt-1">Fill in app title, category, description, and keywords.</p>
                  </li>
                  <li>
                    <strong>Upload APK</strong>
                    <p className="mt-1">Upload your APK file from Web2APK.</p>
                  </li>
                  <li>
                    <strong>Content Rating</strong>
                    <p className="mt-1">Complete the content rating questionnaire.</p>
                  </li>
                  <li>
                    <strong>Upload Images</strong>
                    <p className="mt-1">Upload your app icon, screenshots, and promotional images.</p>
                  </li>
                  <li>
                    <strong>Pricing & Availability</strong>
                    <p className="mt-1">Set your app as free or paid, and select countries for distribution.</p>
                  </li>
                  <li>
                    <strong>Submit for Review</strong>
                    <p className="mt-1">Amazon typically takes 5-7 days to review new apps.</p>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Samsung Galaxy Store</h3>
                <p className="text-gray-600 mb-3">
                  Follow these steps to publish your app on the Samsung Galaxy Store:
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Create a Seller Office Account</strong>
                    <p className="mt-1">Register at <a href="https://seller.samsungapps.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">seller.samsungapps.com</a> (free).</p>
                  </li>
                  <li>
                    <strong>Prepare Required Assets</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>APK file (download from Web2APK)</li>
                      <li>App icon (512x512 PNG)</li>
                      <li>Screenshots (minimum 2) for each supported device type</li>
                      <li>Promotional banner (1280x720 PNG)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Create New Application</strong>
                    <p className="mt-1">In the Seller Portal, navigate to "Apps" and click "Add New Application."</p>
                  </li>
                  <li>
                    <strong>Binary Upload</strong>
                    <p className="mt-1">Upload your APK file and configure supported devices.</p>
                  </li>
                  <li>
                    <strong>App Information</strong>
                    <p className="mt-1">Enter app name, description, category, and keywords.</p>
                  </li>
                  <li>
                    <strong>Upload Images</strong>
                    <p className="mt-1">Upload your app icon, screenshots, and promotional images.</p>
                  </li>
                  <li>
                    <strong>Pricing & Distribution</strong>
                    <p className="mt-1">Set your app as free or paid, and select countries for distribution.</p>
                  </li>
                  <li>
                    <strong>Submit for Review</strong>
                    <p className="mt-1">Samsung typically takes 3-5 days to review new apps.</p>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Huawei AppGallery</h3>
                <p className="text-gray-600 mb-3">
                  Follow these steps to publish your app on Huawei AppGallery:
                </p>
                <ol className="list-decimal pl-6 space-y-3 text-gray-600">
                  <li>
                    <strong>Create a Developer Account</strong>
                    <p className="mt-1">Register at <a href="https://developer.huawei.com/consumer/en/console" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">developer.huawei.com</a> (free).</p>
                  </li>
                  <li>
                    <strong>Prepare Required Assets</strong>
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>APK file (download from Web2APK)</li>
                      <li>App icon (1024x1024 PNG)</li>
                      <li>Screenshots (minimum 2) for phone and tablet</li>
                      <li>App introduction file/video (optional)</li>
                      <li>Privacy policy document</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Create New App</strong>
                    <p className="mt-1">In the AppGallery Connect console, select "My apps" and click "Add app."</p>
                  </li>
                  <li>
                    <strong>App Information</strong>
                    <p className="mt-1">Enter app name, description, and language details.</p>
                  </li>
                  <li>
                    <strong>Upload APK</strong>
                    <p className="mt-1">Upload your APK file in the "Release" section.</p>
                  </li>
                  <li>
                    <strong>App Configuration</strong>
                    <p className="mt-1">Configure app pricing, age rating, and countries for distribution.</p>
                  </li>
                  <li>
                    <strong>Submit for Review</strong>
                    <p className="mt-1">Huawei typically takes 3-5 days to review new apps.</p>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Other App Stores</h3>
                <p className="text-gray-600 mb-3">
                  Web2APK also supports submission to these additional stores:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>
                    <strong>Xiaomi GetApps</strong> - Register at <a href="https://developer.xiaomi.com/console" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">developer.xiaomi.com</a>
                  </li>
                  <li>
                    <strong>OPPO App Market</strong> - Register at <a href="https://developers.oppomobile.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">developers.oppomobile.com</a>
                  </li>
                  <li>
                    <strong>Vivo App Store</strong> - Register at <a href="https://dev.vivo.com.cn" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">dev.vivo.com.cn</a>
                  </li>
                  <li>
                    <strong>F-Droid</strong> - Open source apps only. Submit at <a href="https://f-droid.org/docs/Submitting_to_F-Droid_Quick_Start_Guide" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">f-droid.org</a>
                  </li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium mb-2 text-blue-800">Important Notes</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-600">
                  <li>Each app store has specific policies regarding WebView apps. Some may reject apps that simply wrap websites without adding significant functionality.</li>
                  <li>Always ensure you have permission to create an app from the website content.</li>
                  <li>Keep your keystore file safe - you'll need it for future updates.</li>
                  <li>For all stores, custom app icons and well-written descriptions significantly increase the chance of approval.</li>
                  <li>Consider adding offline capabilities, push notifications, or other native features to improve the likelihood of app approval.</li>
                </ul>
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
