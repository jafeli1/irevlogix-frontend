export interface Permission {
  id: number;
  name: string;
  module: string;
  action: string;
  description?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  rolePermissions: RolePermission[];
}

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  permission: Permission;
}

export interface UserPermissions {
  roles: string[];
  permissions: Permission[];
}

export const hasPermission = (userPermissions: UserPermissions, module: string, action: string): boolean => {
  return userPermissions.permissions.some(p => p.module === module && p.action === action);
};

export const hasAnyPermission = (userPermissions: UserPermissions, permissions: Array<{module: string, action: string}>): boolean => {
  return permissions.some(p => hasPermission(userPermissions, p.module, p.action));
};

export const getModulePermissions = (userPermissions: UserPermissions, module: string): Permission[] => {
  return userPermissions.permissions.filter(p => p.module === module);
};

export const fetchUserPermissions = async (token: string): Promise<UserPermissions> => {
  try {
    const rolesResponse = await fetch('https://irevlogix-backend.onrender.com/api/admin/roles', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!rolesResponse.ok) {
      throw new Error('Failed to fetch roles');
    }

    const roles: Role[] = await rolesResponse.json();
    const userRoles = JSON.parse(localStorage.getItem('user') || '{}').roles || [];
    
    const permissions: Permission[] = [];
    roles.forEach(role => {
      if (userRoles.includes(role.name)) {
        role.rolePermissions.forEach(rp => {
          if (!permissions.find(p => p.id === rp.permission.id)) {
            permissions.push(rp.permission);
          }
        });
      }
    });

    return { roles: userRoles, permissions };
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const userRoles = Array.isArray(userData.roles) ? userData.roles : [userData.roles].filter(Boolean);
    
    const isAdmin =
      userRoles.includes('Administrator') ||
      userRoles.includes('System Administrator');
    
    if (isAdmin) {
      const adminPermissions = generateAdminPermissions();
      return { roles: userRoles, permissions: adminPermissions };
    }
    
    return { roles: userRoles, permissions: [] };
  }
};

const generateAdminPermissions = (): Permission[] => {
  const modules = ['ReverseLogistics', 'Processing', 'DownstreamMaterials', 'AssetRecovery', 'Reporting', 'Administration', 'KnowledgeBase', 'Training'];
  const actions = ['Read', 'Create', 'Update', 'Delete'];
  
  const permissions: Permission[] = [];
  let id = 1;
  
  modules.forEach(module => {
    actions.forEach(action => {
      permissions.push({
        id: id++,
        name: `${module} ${action}`,
        module,
        action,
        description: `${action} access for ${module} module`
      });
    });
  });
  
  return permissions;
};
