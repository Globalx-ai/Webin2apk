import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function SigningCertificates() {
  const [activeTab, setActiveTab] = useState("ios");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [p12File, setP12File] = useState<File | null>(null);
  const [p12Password, setP12Password] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKeystorePassword, setShowKeystorePassword] = useState(false);
  const [showKeyPassword, setShowKeyPassword] = useState(false);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProfileFile(e.target.files[0]);
    }
  };

  const handleP12Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setP12File(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>App Signing Certificates</CardTitle>
        <CardDescription>
          Configure certificates to sign and publish your apps
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="ios">iOS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="android" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keystore">Upload Android Keystore</Label>
                <Input id="keystore" type="file" accept=".keystore,.jks" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keystorePassword">Keystore Password</Label>
                  <div className="relative">
                    <Input 
                      id="keystorePassword" 
                      type={showKeystorePassword ? "text" : "password"} 
                      placeholder="Enter keystore password" 
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowKeystorePassword(!showKeystorePassword)}
                    >
                      <span className="material-icons text-sm">
                        {showKeystorePassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keyAlias">Key Alias</Label>
                  <Input id="keyAlias" placeholder="Enter key alias" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keyPassword">Key Password</Label>
                  <div className="relative">
                    <Input 
                      id="keyPassword" 
                      type={showKeyPassword ? "text" : "password"} 
                      placeholder="Enter key password" 
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowKeyPassword(!showKeyPassword)}
                    >
                      <span className="material-icons text-sm">
                        {showKeyPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validityYears">Validity Years</Label>
                  <Input id="validityYears" type="number" defaultValue={25} min={1} max={100} />
                </div>
              </div>
              
              <Button className="mt-4">Save Android Signing Configuration</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="ios" className="space-y-4">
            <Alert className="mb-6">
              <AlertTitle>iOS Signing Requirements</AlertTitle>
              <AlertDescription>
                For iOS apps, you'll need an Apple Developer Certificate (.cer), 
                Provisioning Profile (.mobileprovision), and a private key (.p12) file. 
                These credentials are required for code signing before submitting to the App Store.
              </AlertDescription>
            </Alert>
            
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="item-1">
                <AccordionTrigger>How to get iOS certificates?</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2">
                    <li>Enroll in the Apple Developer Program ($99/year).</li>
                    <li>Create a Certificate Signing Request (CSR) using Keychain Access on a Mac.</li>
                    <li>Generate your Developer Certificate in the Apple Developer Portal.</li>
                    <li>Create an App ID for your application.</li>
                    <li>Create a Provisioning Profile linked to your App ID and certificate.</li>
                    <li>Export your private key as a .p12 file from Keychain Access.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="certificate">
                  Developer Certificate (.cer)
                </Label>
                <Input 
                  id="certificate" 
                  type="file" 
                  accept=".cer"
                  onChange={handleCertificateUpload}
                />
                {certificateFile && (
                  <p className="text-sm text-green-600">Uploaded: {certificateFile.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="profile">
                  Provisioning Profile (.mobileprovision)
                </Label>
                <Input 
                  id="profile" 
                  type="file" 
                  accept=".mobileprovision,.provisionprofile"
                  onChange={handleProfileUpload}
                />
                {profileFile && (
                  <p className="text-sm text-green-600">Uploaded: {profileFile.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="p12">
                  Private Key (.p12)
                </Label>
                <Input 
                  id="p12" 
                  type="file" 
                  accept=".p12"
                  onChange={handleP12Upload}
                />
                {p12File && (
                  <p className="text-sm text-green-600">Uploaded: {p12File.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="p12Password">P12 Password</Label>
                <div className="relative">
                  <Input 
                    id="p12Password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Enter P12 password"
                    value={p12Password}
                    onChange={(e) => setP12Password(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-icons text-sm">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              
              <Button 
                className="mt-4"
                disabled={!certificateFile || !profileFile || !p12File || !p12Password}
              >
                Save iOS Signing Configuration
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}