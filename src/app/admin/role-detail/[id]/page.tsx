'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../../components/AppLayout';
import { hasPermission, fetchUserPermissions, UserPermissions } from '../../../../utils/rbac';

interface Role {
  id: number;
  name: string;
  description: string;
  isSystemRole: boolean;
  dateCreated: string;
  dateUpdated: string;
  createdBy: number;
  updatedBy: number;
  rolePermissions: RolePermission[];
  assignedUsers: AssignedUser[];
}

interface RolePermission {
  id: number;
  permissionId: number;
  permission: Permission;
}

interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string;
}

interface AssignedUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

interface PermissionsByModule {
  [module: string]: Permission[];
}

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;
  const isNewRole = roleId === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'permissions' | 'users'>('permissions');
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());
  const [showAddUser, setShowAddUser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        const userPermissions = await fetchUserPermissions(token);
        setPermissions(userPermissions);
        if (!hasPermission(userPermissions, 'Administration', 'Read')) {
          router.push('/unauthorized');
          return;
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        router.push('/login');
        return;
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [router]);

  const fetchRole = useCallback(async () => {
    if (isNewRole) return;
    
    try {
      const response = await fetch(`/api/admin/roles/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch role');
      }

      const roleData: Role = await response.json();
      setRole(roleData);
      setFormData({
        name: roleData.name,
        description: roleData.description || ''
      });
      setSelectedPermissions(new Set(roleData.rolePermissions.map(rp => rp.permissionId)));
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  }, [roleId, isNewRole]);

  const fetchAllPermissions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      }

      const data = await response.json();
      setAllPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users?pageSize=1000', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading && permissions && hasPermission(permissions, 'Administration', 'Read')) {
      fetchRole();
      fetchAllPermissions();
      fetchAllUsers();
    }
  }, [loading, permissions, fetchRole, fetchAllPermissions, fetchAllUsers]);

  const groupPermissionsByModule = (permissions: Permission[]): PermissionsByModule => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as PermissionsByModule);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    setSelectedPermissions((prev: Set<number>) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(permissionId);
      } else {
        newSet.delete(permissionId);
      }
      return newSet;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setSuccessMessage('');

    try {
      const url = isNewRole ? '/api/admin/roles' : `/api/admin/roles/${roleId}`;
      const method = isNewRole ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to save role');
      }

      if (isNewRole) {
        const newRole = await response.json();
        router.push(`/admin/role-detail/${newRole.id}`);
        return;
      }

      if (!isNewRole && selectedPermissions.size > 0) {
        const permissionsResponse = await fetch(`/api/admin/roles/${roleId}/permissions`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPermissions)
          })
        });

        if (!permissionsResponse.ok) {
          throw new Error('Failed to update permissions');
        }
      }

      setSuccessMessage('Role saved successfully!');
      fetchRole();
    } catch (error) {
      console.error('Error saving role:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save role' });
    } finally {
      setSaving(false);
    }
  };

  const assignUserToRole = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error('Failed to assign user to role');
      }

      setShowAddUser(false);
      fetchRole();
    } catch (error) {
      console.error('Error assigning user:', error);
    }
  };

  const removeUserFromRole = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to remove user from role');
      }

      fetchRole();
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!permissions || !hasPermission(permissions, 'Administration', 'Read')) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-xl">Access Denied: You do not have permission to view this page.</div>
        </div>
      </AppLayout>
    );
  }

  const permissionsByModule = groupPermissionsByModule(allPermissions);
  const availableUsers = allUsers.filter((user: User) => 
    !role?.assignedUsers.some((assignedUser: AssignedUser) => assignedUser.id === user.id)
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isNewRole ? 'Add New Role' : 'Role Details'}
          </h1>
          <Link
            href="/admin/roles"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Roles
          </Link>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {successMessage}
          </div>
        )}

        {errors.submit && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter role name"
                required
                disabled={role?.isSystemRole}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter role description"
                disabled={role?.isSystemRole}
              />
            </div>
          </div>

          {!isNewRole && role && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-sm text-gray-900">{formatDate(role.dateCreated)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                <p className="text-sm text-gray-900">{formatDate(role.dateUpdated)}</p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving || role?.isSystemRole}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : (isNewRole ? 'Create Role' : 'Update Role')}
            </button>
          </div>
        </form>

        {!isNewRole && role && (
          <>
            <div className="flex items-center gap-2 border-b mb-6">
              <button 
                className={`px-4 py-2 ${activeTab === "permissions" ? "border-b-2 border-blue-600" : ""}`} 
                onClick={() => setActiveTab("permissions")}
              >
                Permissions
              </button>
              <button 
                className={`px-4 py-2 ${activeTab === "users" ? "border-b-2 border-blue-600" : ""}`} 
                onClick={() => setActiveTab("users")}
              >
                Assigned Users
              </button>
            </div>

            {activeTab === "permissions" && (
              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(([module, modulePermissions]) => (
                  <div key={module} className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">{module}</h3>
                    <div className="space-y-3">
                      {modulePermissions.map((permission: Permission) => (
                        <div key={permission.id} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`permission-${permission.id}`}
                            checked={selectedPermissions.has(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            disabled={role.isSystemRole}
                          />
                          <label htmlFor={`permission-${permission.id}`} className="ml-3 text-sm">
                            <span className="font-medium">{permission.name}</span>
                            <span className="text-gray-500"> ({permission.action})</span>
                            {permission.description && (
                              <span className="block text-gray-400 text-xs">{permission.description}</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {!role.isSystemRole && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Assigned Users ({role.assignedUsers.length})</h3>
                    {!role.isSystemRole && (
                      <button
                        onClick={() => setShowAddUser(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Add User
                      </button>
                    )}
                  </div>

                  {role.assignedUsers.length === 0 ? (
                    <p className="text-gray-500">No users assigned to this role.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            {!role.isSystemRole && (
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {role.assignedUsers.map((user: AssignedUser) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              {!role.isSystemRole && (
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => removeUserFromRole(user.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {showAddUser && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                      <div className="mt-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add User to Role</h3>
                        <div className="max-h-60 overflow-y-auto">
                          {availableUsers.length === 0 ? (
                            <p className="text-gray-500">No available users to assign.</p>
                          ) : (
                            <div className="space-y-2">
                              {availableUsers.map((user: User) => (
                                <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                                  <div>
                                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                  <button
                                    onClick={() => assignUserToRole(user.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Add
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => setShowAddUser(false)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
