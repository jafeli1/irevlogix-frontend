'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { hasPermission, fetchUserPermissions } from '../../../utils/rbac';

export default function AdminRolesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPerms = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const perms = await fetchUserPermissions(token);
        if (!hasPermission(perms, 'Administration', 'Read')) {
          router.push('/unauthorized');
          return;
        }
      } catch {
        router.push('/login');
        return;
      } finally {
        setChecking(false);
      }
    };
    checkPerms();
  }, [router]);

  if (checking) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto mt-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="mt-2 text-gray-600">This section is coming soon.</p>
        </div>
      </div>
    </AppLayout>
  );
}
