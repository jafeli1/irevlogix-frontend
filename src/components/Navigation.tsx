'use client';

import React, { useState, useEffect } from 'react';
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
      { name: 'Material Types', href: '/reverse-logistics/material-types', module: 'ReverseLogistics', action: 'Read' },
    ]
  },
  {
    name: 'AI - Operations',
    module: 'ProjectManagement',
    action: 'Read',
    icon: '✨',
    subItems: [
      { name: 'Returns Forecast', href: '/ai-operations/returns-forecast', module: 'ProjectManagement', action: 'Read' },
      { name: 'Contamination Analysis', href: '/ai-operations/contamination-analysis', module: 'ProjectManagement', action: 'Read' },
      { name: 'Optimal Disposition', href: '/ai-operations/optimal-disposition', module: 'ProjectManagement', action: 'Read' },
      { name: 'Material Classification', href: '/ai-operations/material-classification', module: 'ProjectManagement', action: 'Read' },
      { name: 'Quality Grade', href: '/ai-operations/quality-grade', module: 'ProjectManagement', action: 'Read' },
      { name: 'Vendor Performance', href: '/ai-operations/vendor-performance', module: 'ProjectManagement', action: 'Read' },
      { name: 'Asset Categorization', href: '/ai-operations/asset-categorization', module: 'ProjectManagement', action: 'Read' },
      { name: 'ESG Impact Forecaster', href: '/ai-operations/esg-impact-forecaster', module: 'ProjectManagement', action: 'Read' },
    ]
  },
  {
    name: 'Project Management',
    module: 'ProjectManagement',
    action: 'Read',
    icon: '📋',
    subItems: [
      { name: 'Contractor Technicians', href: '/project-management/contractor-technicians', module: 'ProjectManagement', action: 'Read' },
      { name: 'Reverse Requests', href: '/project-management/reverse-requests', module: 'ProjectManagement', action: 'Read' },
      { name: 'Recovery Requests', href: '/project-management/recovery-requests', module: 'ProjectManagement', action: 'Read' },
      { name: 'Freight Loss Damage Claims', href: '/project-management/freight-loss-damage-claims', module: 'ProjectManagement', action: 'Read' },
    ]
  },
  {
    name: 'Compliance Tracker',
    module: 'ProjectManagement',
    action: 'Read',
    icon: '✅',
    subItems: [
      { name: 'Documents Tracker', href: '/compliance-tracker/documents-tracker', module: 'ProjectManagement', action: 'Read' }
    ]
  },
  {
    name: 'Material Processing',
    module: 'Processing',
    action: 'Read',
    icon: '⚙️',
    subItems: [
      { name: 'Processing Lot', href: '/processing/lots', module: 'Processing', action: 'Read' },
    ]
  },
  {
    name: 'Downstream Materials',
    module: 'DownstreamMaterials',
    action: 'Read',
    icon: '📦',
    subItems: [
      { name: 'Processed Material', href: '/downstream/processedmaterial', module: 'DownstreamMaterials', action: 'Read' },
      { name: 'Vendor Management', href: '/downstream/vendors', module: 'DownstreamMaterials', action: 'Read' },
      { name: 'Vendor Facility', href: '/downstream/vendor-facility', module: 'DownstreamMaterials', action: 'Read' },
    ]
  },
  {
    name: 'Asset Recovery',
    module: 'AssetRecovery',
    action: 'Read',
    icon: '🔍',
    subItems: [
      { name: 'Asset Tracking', href: '/asset-recovery/asset-tracking', module: 'AssetRecovery', action: 'Read' },
      { name: 'Asset Intake', href: '/asset-recovery/asset-intake', module: 'AssetRecovery', action: 'Create' },
      { name: 'Asset Categories', href: '/asset-recovery/asset-categories', module: 'AssetRecovery', action: 'Read' },
      { name: 'Asset Tracking Statuses', href: '/asset-recovery/asset-tracking-statuses', module: 'AssetRecovery', action: 'Read' },
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
      { name: 'Standard Reports', href: '/reports/standard', module: 'Reporting', action: 'Create' },
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
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Navigation({ currentPath, isCollapsed, onToggleCollapse }: NavigationProps) {
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

  const canShow = (module?: string, action?: string) => {
    if (!module || !action) return true;
    return hasPermission(userPermissions, module, action);
  };
  if (isLoading) {
    return (
      <nav className={`bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
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
    canShow(item.module, item.action)
  );

  return (
    <nav className={`bg-white dark:bg-gray-800 shadow-sm border-r border-gray-200 dark:border-gray-700 h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/dashboard"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPath === '/dashboard'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            } ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? 'Dashboard' : ''}
          >
            <span className={isCollapsed ? '' : 'mr-3'}>🏠</span>
            {!isCollapsed && 'Dashboard'}
          </Link>
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <svg
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="space-y-1">
          {visibleItems.map((item) => (
            <div key={item.name}>
              {item.subItems ? (
                <div>
                  <button
                    onClick={() => !isCollapsed && toggleModule(item.name)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    }`}
                    title={isCollapsed ? item.name : ''}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                      <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                      {!isCollapsed && item.name}
                    </div>
                    {!isCollapsed && (
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
                    )}
                  </button>
                  
                  {!isCollapsed && expandedModules.has(item.name) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.subItems
                        .filter(subItem => canShow(subItem.module, subItem.action))
                        .map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            prefetch={false}
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
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.name : ''}
                >
                  <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!isCollapsed && item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
