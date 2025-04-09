import { useState } from "react";
import { SigningCertificates } from "@/components/ios/SigningCertificates";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Footer } from "@/components/layout/Footer";

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
        </TabsContent>
      </Tabs>
    </div>
  );
}