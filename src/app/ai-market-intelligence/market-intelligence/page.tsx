'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../utils/rbac';

export default function MarketIntelligencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const userPermissions = await fetchUserPermissions(token);
      setPermissions(userPermissions);
      setLoading(false);
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!permissions || !hasPermission(permissions, 'ProjectManagement', 'Read')) {
    return (
      <AppLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">You don&apos;t have permission to view this page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            AI Driven Recyclable Product Analysis and Market Intelligence
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Objective</h2>
          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
            <li>
              Analyze and outline the components of a recyclable product so the actual value of each recyclable component is evident and you can maximize your ROI.
            </li>
            <li>
              Remove reliance on manual market research for recyclable product resale values by automatically determining Estimated Resale Value for each component.
            </li>
            <li>
              Facilitate the optimization of sales channels for processed materials by automatically determining Expected Sales Price Per Unit.
            </li>
            <li>
              Automatically generate dynamic sales channel recommendations by suggesting recyclers or downstream vendors for the products or components.
            </li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
