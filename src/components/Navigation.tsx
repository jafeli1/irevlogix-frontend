'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserPermissions, fetchUserPermissions, hasPermission } from '../utils/rbac';

interface NavigationSubItem {
  name: string;
  href: string;
  module: string;
  action: string;
}

interface NavigationItem {
  name: string;
  href?: string;
  module: string;
  action: string;
  icon: string;
  subItems?: NavigationSubItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Reverse Logistics',
    module: 'ReverseLogistics',
    action: 'Read',
    icon: '🔄',
    subItems: [
      { name: 'Dashboard', href: '/reverse-logistics/dashboard', module: 'ReverseLogistics', action: 'Read' },
      { name: 'Shipment Intake', href: '/reverse-logistics/shipment-intake', module: 'ReverseLogistics', action: 'Create' },
      { name: 'Shipment Details', href: '/reverse-logistics/shipment-detail', module: 'ReverseLogistics', action: 'Read' },
    ]
  },
  {
    name: 'Material Processing',
    module: 'Processing',
    action: 'Read',
    icon: '⚙️',
    subItems: [
      { name: 'Processing Lots', href: '/processing/lots', module: 'Processing', action: 'Read' },
      { name: 'Lot Details', href: '/processing/lot-detail', module: 'Processing', action: 'Read' },
    ]
  },
  {
    name: 'Downstream Materials',
    module: 'DownstreamMaterials',
    action: 'Read',
    icon: '📦',
    subItems: [
      { name: 'Inventory', href: '/downstream/inventory', module: 'DownstreamMaterials', action: 'Read' },
      { name: 'Vendor Management', href: '/downstream/vendors', module: 'DownstreamMaterials', action: 'Read' },
    ]
  },
  {
    name: 'Asset Recovery',
    module: 'AssetRecovery',
    action: 'Read',
    icon: '🔍',
    subItems: [
      { name: 'Tracking', href: '/asset-recovery/tracking', module: 'AssetRecovery', action: 'Read' },
      { name: 'Intake & Audit', href: '/asset-recovery/intake-audit', module: 'AssetRecovery', action: 'Create' },
      { name: 'Asset Details', href: '/asset-recovery/asset-detail', module: 'AssetRecovery', action: 'Read' },
    ]
  },
  {
    name: 'Reporting',
    module: 'Reporting',
    action: 'Read',
    icon: '📊',
    subItems: [
      { name: 'Dashboards', href: '/reports/dashboards', module: 'Reporting', action: 'Read' },
      { name: 'Custom Reports', href: '/reports/custom', module: 'Reporting', action: 'Create' },
    ]
  },
  {
    name: 'Administration',
    module: 'Administration',
    action: 'Read',
    icon: '⚙️',
    subItems: [
      { name: 'Settings', href: '/admin/settings', module: 'Administration', action: 'Read' },
      { name: 'Clients', href: '/admin/clients', module: 'Administration', action: 'Read' },
      { name: 'Users', href: '/admin/users', module: 'Administration', action: 'Read' },
      { name: 'Roles', href: '/admin/roles', module: 'Administration', action: 'Read' },
    ]
  },
  {
    name: 'Knowledge Base',
    href: '/knowledge-base',
    module: 'KnowledgeBase',
    action: 'Read',
    icon: '📚'
  },
  {
    name: 'Training',
    href: '/training',
    module: 'Training',
    action: 'Read',
    icon: '🎓'
  },
];

interface NavigationProps {
  currentPath: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

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

  const toggleModule = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleName)) {
      newExpanded.delete(moduleName);
    } else {
      newExpanded.add(moduleName);
    }
    setExpandedModules(newExpanded);
  };

  if (isLoading) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 w-64">
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            {[...Array(8)].map((_, i) => (
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
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 w-64 h-full overflow-y-auto">
      <div className="p-4">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPath === '/dashboard'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <span className="mr-3">🏠</span>
            Dashboard / Home
          </Link>
        </div>

        <div className="space-y-1">
          {visibleItems.map((item) => (
            <div key={item.name}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => toggleModule(item.name)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        expandedModules.has(item.name) ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {expandedModules.has(item.name) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems
                        .filter(subItem => hasPermission(userPermissions, subItem.module, subItem.action))
                        .map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                              currentPath === subItem.href || currentPath.startsWith(subItem.href)
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPath === item.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
