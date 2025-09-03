'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState('hero'); 

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              In this Privacy Policy we explain the information we collect about you, how we collect your information and how iRevLogix uses and shares your information with its subsidiaries and affiliates when you visit our website at irevlogix.ai. The information we collect are generally from all registered users.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Your Personal Data We Collect and How We Collect the Data</h2>
            <p className="text-gray-700 mb-6">
              In other to efficiently serve you we collect your personal data when you sign up as a registered user as well as when you sign in and routinely use iRevLogix.ai. This information includes contact or geographic and demographic data. We use cookies, your IP address, your telephone number among other unique identifiers to record your preferences so you can have a better user experience when you revisit iRevLogix.ai. We also collect related information from your companies.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Use Your Data That We Collect</h2>
            <p className="text-gray-700 mb-6">
              We use the information we collect to improve your usage experience on iRevLogix.ai. For example, the geographic and demographic data is used to ensure that you are invited to projects or bids for assets close to you. The information is also used to identify usage trends and prevent fraudulent usage of iRevLogix.ai. By filling out your information or data as requested for processing you consent to its usage as explained above in the United States and other countries where we provide our services to you.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">How We Share Your Data</h2>
            <p className="text-gray-700 mb-6">
              We may share your information collected with our service providers, affiliates and third party vendors who provide services necessary to complete your transaction or a request from you or as required by applicable law or a legal process as well as for your security and protection of lives. Moreover, we may share your de-identified data for reporting or analysis.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Data Security</h2>
            <p className="text-gray-700 mb-6">
              We will make the optimum effort to protect your data while stored or in transmission to avoid unauthorized access, unauthorized disclosure, theft, loss, damage, tampering or or destruction.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Promotional Email Options</h2>
            <p className="text-gray-700 mb-6">
              Our promotional emails provide very clear instructions to enable you opt out of receiving them. Note that other emails related to your account and our services to you will still be sent to you.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">iRevLogix Websites</h2>
            <p className="text-gray-700 mb-6">
              Note that any iRevLogix website listed as part of a campaign generally leads to the iRevLogix website. Hence the privacy policy outlined here will not apply on when you visit affiliate or third party websites nor will we be responsible for their privacy practices. Please read there privacy policy before entering any personal information. You also have the option to report abuses observed in iRevLogix website via the support email listed.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Change in Business Ownership</h2>
            <p className="text-gray-700 mb-6">
              If iRevLogix is acquired, you consent that your information will be transferred to the new owner so they can continue to provide you the same quality service that you enjoy today.
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
