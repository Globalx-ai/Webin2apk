import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">About Webin2Apk</h1>
        
        <div className="space-y-12">
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Mission</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Webin2Apk is dedicated to making mobile app development accessible to everyone. 
              Our platform transforms web content into professional mobile applications with just a few clicks, 
              eliminating the steep learning curve typically associated with app development.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Company Information</h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-medium mb-2">SDSV TRADE TECH LLP</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    LLPIN: AAY-8970<br />
                    Incorporated in India
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Contact Information</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Email: contact@webin2apk.com<br />
                    Support: support@webin2apk.com
                  </p>
                </div>
              </div>
            </Card>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">What We Do</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Website to App Conversion</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Transform your website into a native mobile application without coding skills.
                </p>
              </Card>
              
              <Card className="p-6 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M21 7v6h-6" /><path d="M3 17v-6h6" /><path d="m21 7-9 9-9-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">PDF/HTML Conversion</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Convert PDF documents and HTML files into interactive mobile applications.
                </p>
              </Card>
              
              <Card className="p-6 flex flex-col items-center text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-2">AI-Powered Code Generation</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate and optimize app code using our advanced AI technology.
                </p>
              </Card>
            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Story</h2>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Founded in 2023, SDSV TRADE TECH LLP identified a significant gap in the market: 
              while businesses increasingly need mobile applications, the development process remained 
              complex, expensive, and time-consuming. Our team of experienced developers and designers 
              came together to create Webin2Apk, a platform that democratizes app development.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              Today, we serve clients worldwide, helping businesses, entrepreneurs, educational institutions, 
              and content creators extend their digital presence to mobile platforms quickly and affordably.
            </p>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Our Values</h2>
            <ul className="space-y-3 list-disc pl-6 text-lg text-gray-700 dark:text-gray-300">
              <li><span className="font-medium">Accessibility:</span> Making app development accessible to everyone regardless of technical skill.</li>
              <li><span className="font-medium">Innovation:</span> Constantly improving our technology to provide cutting-edge solutions.</li>
              <li><span className="font-medium">Quality:</span> Ensuring our converted applications meet high standards of performance and user experience.</li>
              <li><span className="font-medium">Support:</span> Providing excellent customer support throughout the app creation process.</li>
              <li><span className="font-medium">Affordability:</span> Keeping our services cost-effective for businesses of all sizes.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}