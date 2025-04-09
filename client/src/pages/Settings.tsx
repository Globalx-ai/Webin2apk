import { useState } from "react";
import { SigningCertificates } from "@/components/ios/SigningCertificates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="mb-6 grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="certificates">Signing Certificates</TabsTrigger>
          <TabsTrigger value="distribution">App Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your profile and account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" placeholder="Your username" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="Your email address" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input id="company" placeholder="Your company name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="Your phone number" />
              </div>
              
              <div className="pt-4 border-t mt-4">
                <h3 className="font-medium mb-3">Billing Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address1">Address Line 1</Label>
                    <Input id="address1" placeholder="Street address" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input id="address2" placeholder="Apt, Suite, Unit, etc." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="City" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input id="state" placeholder="State/Province" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipcode">Postal/ZIP Code</Label>
                    <Input id="zipcode" placeholder="Postal/ZIP Code" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="Country" />
                  </div>
                </div>
              </div>
              
              <Button className="mt-4">Save Changes</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" placeholder="Enter current password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="Enter new password" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm new password" />
              </div>
              
              <Button className="mt-4">Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="certificates" className="space-y-6">
          <SigningCertificates />
        </TabsContent>
        
        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Store Distribution</CardTitle>
              <CardDescription>
                Configure settings for publishing your apps to app stores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Play Store Account</Label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Enter Google Play Developer email" />
                  <Button>Connect</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Apple App Store Connect</Label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="Enter App Store Connect email" />
                  <Button>Connect</Button>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <Label>Default App Distribution Platform</Label>
                <RadioGroup defaultValue="google-play">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="google-play" id="google-play" />
                    <Label htmlFor="google-play">Google Play Store</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="app-store" id="app-store" />
                    <Label htmlFor="app-store">Apple App Store</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both Platforms</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="mt-4 space-y-2">
                <Label>Additional App Stores</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="amazon" className="rounded border-gray-300" />
                    <Label htmlFor="amazon">Amazon App Store</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="samsung" className="rounded border-gray-300" />
                    <Label htmlFor="samsung">Samsung Galaxy Store</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="huawei" className="rounded border-gray-300" />
                    <Label htmlFor="huawei">Huawei AppGallery</Label>
                  </div>
                </div>
              </div>
              
              <Button className="mt-6">Save Distribution Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>App Store Publishing Guides</CardTitle>
              <CardDescription>
                Step-by-step guides for publishing to various app stores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border p-4 rounded-lg">
                  <h3 className="text-lg font-medium flex items-center">
                    <span className="material-icons mr-2 text-green-600">android</span>
                    Google Play Store
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 mb-3">
                    Follow these steps to publish your Android app to the Google Play Store.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                      <p>Create a Google Play Developer account and pay the one-time $25 registration fee</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                      <p>Generate a signed APK or App Bundle using the "Build APK" option in your project</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                      <p>Add your app's title, description, category, and content rating in the Google Play Console</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                      <p>Upload your APK/Bundle, screenshots, feature graphic, and app icon</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">5</span>
                      <p>Set up pricing and distribution options, then submit for review</p>
                    </div>
                  </div>
                  <Button className="mt-4" variant="outline" size="sm">
                    <span className="material-icons mr-2 text-sm">download</span>
                    Download Complete Guide
                  </Button>
                </div>

                <div className="border p-4 rounded-lg">
                  <h3 className="text-lg font-medium flex items-center">
                    <span className="material-icons mr-2 text-gray-800">phone_iphone</span>
                    Apple App Store
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 mb-3">
                    Follow these steps to publish your iOS app to the Apple App Store.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                      <p>Enroll in the Apple Developer Program for $99/year</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                      <p>Create an App ID and certificates in the Apple Developer Portal</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                      <p>Generate your iOS app bundle from your project settings</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">4</span>
                      <p>Create a new app in App Store Connect and configure metadata</p>
                    </div>
                    <div className="flex">
                      <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">5</span>
                      <p>Upload your build using Xcode or Transporter, then submit for review</p>
                    </div>
                  </div>
                  <Button className="mt-4" variant="outline" size="sm">
                    <span className="material-icons mr-2 text-sm">download</span>
                    Download Complete Guide
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-medium">Amazon App Store</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Distribute your app to Amazon Fire devices.
                    </p>
                    <Button className="mt-3" variant="outline" size="sm">
                      View Publishing Guide
                    </Button>
                  </div>
                  
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-medium">Samsung Galaxy Store</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Reach Samsung device users globally.
                    </p>
                    <Button className="mt-3" variant="outline" size="sm">
                      View Publishing Guide
                    </Button>
                  </div>
                  
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-medium">Huawei AppGallery</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Distribute to Huawei devices worldwide.
                    </p>
                    <Button className="mt-3" variant="outline" size="sm">
                      View Publishing Guide
                    </Button>
                  </div>
                  
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-lg font-medium">Other App Stores</h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Additional distribution channels.
                    </p>
                    <Button className="mt-3" variant="outline" size="sm">
                      View All Guides
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}