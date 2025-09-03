'use client';

import Link from 'next/link';

export default function TermsOfService() {

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-green-600">iRevLogix</Link>
            </div>
            <Link
              href="/login"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section id="hero" className="pt-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Terms of Use
            </h1>
            <p className="text-xl text-gray-600">
              Please read these terms carefully before using our platform.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of iRevLogix Website Terms</h2>
            <p className="text-gray-700 mb-6">
              When &ldquo;iRevLogix&rdquo;, &ldquo;iRevLogix website&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo; is used in these Terms of Use it means xBusiness Services Corporation, the owner and trademark owner of the iRevLogix website.
            </p>
            <p className="text-gray-700 mb-6">
              PLEASE READ THESE TERMS OF USE CAREFULLY BEFORE USING THE WEBSITE. BY ACCESSING THE WEBSITE (OTHER THAN TO FIRST READ THESE TERMS OF USE) YOU AGREE TO COMPLY WITH THESE TERMS OF USE. IF YOU DO NOT AGREE TO THESE TERMS OF USE, YOU MAY NOT ACCESS THE WEBSITE. ANY SUCH CHANGES OR ADDITIONAL TERMS OF USE WILL BE POSTED ON THE WEBSITE AND WILL BECOME EFFECTIVE IMMEDIATELY UPON NOTIFICATION TO YOU. IF YOU DO NOT AGREE TO THESE TERMS OF USE YOU MAY NOT ACCESS THE WEBSITE.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Description of our Services</h2>
            <p className="text-gray-700 mb-6">
              <strong>a.</strong> When browsing the iRevLogix website, you agree to follow our instructions as outlined in the various pages that you will access.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>b.</strong> In order to use our website services you must be 18 years or older or If you are less than 18 years of age you must have the consent of your parents or legal guardian who will be responsible for your actions on the iRevLogix website.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>c.</strong> In order to become a registered user you will provide accurate registration information and update the registration information if it changes. The username and password combination you create during registration should be guarded and maintained confidential.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>d.</strong> As a registered user you will be able to perform various functions depending on your role and these functions enable you to collaborate in asset recovery and logistics projects. Access to perform these functions are granted for personal and non-commercial use.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>e.</strong> You agree not to use our website services to gain unauthorized access to confidential or proprietary data, harvest usernames and passwords for unauthorized or illegal usage, copy copyrighted content, overload or cause the force majeure of the iRevLogix website. Intentional or not you additionally agree not to conduct any investigation related to the functioning of the iRevLogix website that violates these terms of use or any law.
            </p>
            <p className="text-gray-700 mb-6">
              <strong>f.</strong> We will always indicate the applicable platform fees and government taxes, if any, related to setting up and using iRevLogix. You will be responsible to pay those fees and taxes or they may be deducted from your credit card debt at registration or it may be subject to a collection process.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Registered Membership Termination</h2>
            <p className="text-gray-700 mb-6">
              iRevLogix reserves the right to terminate your registered membership as a registered user at any time and at their sole discretion for violation or failure to follow or comply with this Terms of Use or for any other reason judged as being detrimental to iRevLogix.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. iRevLogix Disclaimer</h2>
            <p className="text-gray-700 mb-6">
              YOU EXPRESSLY AGREE THAT USE OF THE iRevLogix WEBSITE IS AT YOUR SOLE RISK. THE iRevLogix WEBSITE SERVICE AND CONTENT IS PROVIDED ON AN &ldquo;AS IS&rdquo; BASIS WITHOUT WARRANTY OF ANY KIND, EXPRESSED OR IMPLIED.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. iRevLogix Liability Limits</h2>
            <p className="text-gray-700 mb-6">
              iRevLogix, ITS OFFICERS, EMPLOYEES, MEMBERS, SUCCESSORS, AGENTS, AFFILIATES, SUBSIDIARIES, OR THEIR RELATED COMPANIES ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR EXEMPLARY DAMAGES ARISING OUT OF, RELATING TO, OR IN ANY WAY CONNECTED WITH THE iRevLogix WEBSITE OR THESE TERMS OF USE. YOUR SOLE REMEDY FOR DISSATISFACTION WITH THE iRevLogix WEBSITE, THESE TERMS OF USE, OR ANY CONTENT IS TO STOP USING THE WEBSITE. NOTWITHSTANDING ANYTHING TO THE CONTRARY MENTIONED HEREIN, UNDER NO CIRCUMSTANCES SHALL THE CUMULATIVE LIABILITY OF iRevLogix AND ITS OFFICERS, EMPLOYEES, MEMBERS, SUCCESSORS, AGENTS, AFFILIATES, SUBSIDIARIES, AND THEIR RELATED COMPANIES EXCEED THE TOTAL PAYMENTS RECEIVED FROM YOU FOR THE LAST MONTH COMPLETED OR IN PROGRESS. ADDITIONALLY YOU AGREE THAT ANY CAUSE OF ACTION ARISING OUT OF, RELATING TO, OR IN ANY WAY CONNECTED WITH ANY OF THE WEBSITE.
            </p>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">iRevLogix</h3>
              <p className="text-gray-400 mb-4">
                Revolutionizing recycling lifecycle management through innovative technology and AI-powered insights.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link href="/#services" className="text-gray-400 hover:text-white transition-colors">Services</Link></li>
                <li><Link href="/#ai-capability" className="text-gray-400 hover:text-white transition-colors">AI Features</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors">Login</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="/#contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/#about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 iRevLogix. All rights reserved. Revolutionizing recycling through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
