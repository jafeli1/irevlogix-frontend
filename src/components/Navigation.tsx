'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPermissions, fetchUserPermissions, hasPermission } from '../utils/rbac';

interface NavigationItem {
  name: string;
  href: string;
  module: string;
  action: string;
  icon?: string;
}

const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', module: 'Dashboard', action: 'Read', icon: '📊' },
  { name: 'Reverse Logistics', href: '/reverse-logistics/dashboard', module: 'ReverseLogistics', action: 'Read', icon: '🔄' },
  { name: 'Asset Recovery', href: '/asset-recovery/tracking', module: 'AssetRecovery', action: 'Read', icon: '🔍' },
  { name: 'Processing', href: '/processing/lots', module: 'Processing', action: 'Read', icon: '⚙️' },
  { name: 'Knowledge Base', href: '/knowledge-base', module: 'KnowledgeBase', action: 'Read', icon: '📚' },
  { name: 'Admin Settings', href: '/admin/settings', module: 'Administration', action: 'Read', icon: '⚙️' },
];

interface NavigationProps {
  currentPath: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const permissions = await fetchUserPermissions(token);
        setUserPermissions(permissions);
      }
      setIsLoading(false);
    };

    loadPermissions();
  }, []);

  if (isLoading) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 w-64">
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  const visibleItems = navigationItems.filter(item => 
    hasPermission(userPermissions, item.module, item.action)
  );

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 w-64">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Navigation</h2>
        <ul className="space-y-2">
          {visibleItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPath === item.href
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
