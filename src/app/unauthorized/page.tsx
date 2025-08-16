'use client';

import Link from 'next/link';
import AppLayout from '../../components/AppLayout';

export default function UnauthorizedPage() {
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-yellow-100">
              <div className="text-yellow-600 text-2xl">⚠</div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">Unauthorized</h1>
            <p className="mt-2 text-gray-600">
              You do not have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <div className="mt-6 flex items-center justify-center space-x-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
