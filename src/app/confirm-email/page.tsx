'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ConfirmEmail() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid confirmation link');
        return;
      }

      try {
        const response = await fetch('https://irevlogix-backend.onrender.com/api/auth/confirm-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.message || 'Email confirmation failed');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    confirmEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className={`mx-auto h-12 w-12 flex items-center justify-center rounded-full ${
            status === 'success' ? 'bg-green-100 dark:bg-green-900' : 
            status === 'error' ? 'bg-red-100 dark:bg-red-900' : 
            'bg-blue-100 dark:bg-blue-900'
          }`}>
            <div className={`text-2xl ${
              status === 'success' ? 'text-green-600 dark:text-green-400' : 
              status === 'error' ? 'text-red-600 dark:text-red-400' : 
              'text-blue-600 dark:text-blue-400'
            }`}>
              {status === 'loading' ? '⏳' : status === 'success' ? '✓' : '✗'}
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            {status === 'loading' ? 'Confirming Email...' : 
             status === 'success' ? 'Email Confirmed!' : 
             'Confirmation Failed'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
          {status !== 'loading' && (
            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {status === 'success' ? 'Sign In' : 'Back to Login'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
