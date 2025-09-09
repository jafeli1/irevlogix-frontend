'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/AppLayout';
import { UserPermissions, fetchUserPermissions, hasPermission } from '../../../utils/rbac';

interface ReportCategory {
  name: string;
  reports: ReportItem[];
}

interface ReportItem {
  title: string;
  description: string;
  href: string;
}

const reportCategories: ReportCategory[] = [
  {
    name: 'Financial Reports',
    reports: [
      {
        title: 'Profitability by Lot',
        description: 'Summarizes total revenue, processing costs, and net profit for each processing lot',
        href: '/reports/standard/profitability-by-lot'
      },
      {
        title: 'Vendor Revenue & Cost',
        description: 'Details the revenue generated from each downstream vendor and compares it against associated costs',
        href: '/reports/standard/vendor-revenue-cost'
      },
      {
        title: 'Financial Summary',
        description: 'A high-level report showing total revenue, costs, and profit over a specified period',
        href: '/reports/standard/financial-summary'
      }
    ]
  },
  {
    name: 'Operational Reports',
    reports: [
      {
        title: 'Asset Disposition Summary',
        description: 'Tracks the final disposition of all assets (e.g., total number of items sent for recycling, resale, or refurbishment)',
        href: '/reports/standard/asset-disposition-summary'
      },
      {
        title: 'Processing Lot Throughput',
        description: 'Measures the average time from a lot\'s creation to its final disposition, segmented by material type',
        href: '/reports/standard/processing-lot-throughput'
      },
      {
        title: 'Inventory Status Report',
        description: 'Provides a current snapshot of all items and materials in inventory, categorized by their status (e.g., pending processing, ready for sale)',
        href: '/reports/standard/inventory-status-report'
      },
      {
        title: 'Compliance & Certification Audit',
        description: 'Lists all assets that have undergone a data destruction or recycling process and are awaiting a certificate',
        href: '/reports/standard/compliance-certification-audit'
      }
    ]
  },
  {
    name: 'Environmental, Social, and Governance (ESG) Reports',
    reports: [
      {
        title: 'Waste Diversion & Landfill Avoidance',
        description: 'Quantifies the total weight of materials diverted from landfills, broken down by material type (e.g., plastics, metals, paper)',
        href: '/reports/standard/waste-diversion-landfill-avoidance'
      },
      {
        title: 'Resource Conservation',
        description: 'Estimates the amount of raw materials (e.g., trees, ore) saved by the recycling efforts',
        href: '/reports/standard/resource-conservation'
      }
    ]
  }
];

export default function StandardReportsPage() {
  const router = useRouter();
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({ roles: [], permissions: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadPermissions = async () => {
      try {
        const permissions = await fetchUserPermissions(token);
        setUserPermissions(permissions);
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPermissions();
  }, [router]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedReport('');
  };

  const handleReportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedReport(e.target.value);
  };

  const handleGenerateReport = () => {
    if (selectedReport) {
      router.push(selectedReport);
    }
  };

  const getSelectedCategoryReports = () => {
    const category = reportCategories.find(cat => cat.name === selectedCategory);
    return category ? category.reports : [];
  };

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

  if (!hasPermission(userPermissions, 'Reporting', 'Create')) {
    return (
      <AppLayout>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            You don&apos;t have permission to access Standard Reports.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Standard Reports</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate predefined reports with parameter filters, on-screen preview, and downloadable spreadsheets
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a category...</option>
                  {reportCategories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="report" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  id="report"
                  value={selectedReport}
                  onChange={handleReportChange}
                  disabled={!selectedCategory}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select a report...</option>
                  {getSelectedCategoryReports().map((report) => (
                    <option key={report.href} value={report.href}>
                      {report.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={!selectedReport}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Generate Report
                </button>
              </div>
            </div>

            {selectedCategory && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Available Reports in {selectedCategory}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getSelectedCategoryReports().map((report) => (
                    <div
                      key={report.href}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(report.href)}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {report.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
