'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '../../components/AppLayout';
import { UserPermissions, fetchUserPermissions, hasPermission } from '../../utils/rbac';

interface DashboardMetrics {
  activeShipments: number;
  processingLots: number;
  monthlyRevenue: number;
}

interface QuickAction {
  title: string;
  description: string;
  href: string;
  color: string;
  module: string;
  action: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Create New Shipment',
    description: 'Start a new reverse logistics shipment',
    href: '/reverse-logistics/shipment-intake',
    color: 'bg-blue-600 hover:bg-blue-700',
    module: 'ReverseLogistics',
    action: 'Create'
  },
  {
    title: 'Start Processing Lot',
    description: 'Begin processing materials',
    href: '/processing/lots',
    color: 'bg-green-600 hover:bg-green-700',
    module: 'Processing',
    action: 'Read'
  },
  {
    title: 'Generate Report',
    description: 'Create compliance or analytics report',
    href: '/reports',
    color: 'bg-purple-600 hover:bg-purple-700',
    module: 'Reporting',
    action: 'Read'
  }
];

export default function Dashboard() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeShipments: 12,
    processingLots: 8,
    monthlyRevenue: 24500
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const permissions = await fetchUserPermissions(token);
          setUserPermissions(permissions);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome to your recycling lifecycle management platform
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
            Access Control Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Assigned Roles</h4>
              <div className="space-y-1">
                {userPermissions.roles.length > 0 ? (
                  userPermissions.roles.map((role: string, index: number) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">No roles assigned</span>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Available Permissions</h4>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {userPermissions.permissions.length} permissions across {
                  [...new Set(userPermissions.permissions.map(p => p.module))].length
                } modules
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📦</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Active Shipments
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {metrics.activeShipments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">⚙️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Processing Lots
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {metrics.processingLots}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Monthly Revenue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    ${metrics.monthlyRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              {quickActions
                .filter(action => hasPermission(userPermissions, action.module, action.action))
                .map((action, index) => (
                  <Link
                    key={index}
                    href={action.href}
                    className={`block w-full text-left px-4 py-3 rounded-md text-white font-medium transition-colors ${action.color}`}
                  >
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </Link>
                ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
              Account Information
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Name:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  System Administrator
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">admin@irevlogix.ai</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Client ID:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">ADMIN_CLIENT_001</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Legacy Roles:</span>
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {userPermissions.roles.join(', ') || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
