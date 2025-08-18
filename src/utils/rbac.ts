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
  const m = module.toLowerCase();
  const a = action.toLowerCase();
  return userPermissions.permissions.some(p => p.module?.toLowerCase() === m && p.action?.toLowerCase() === a);
};

export const hasAnyPermission = (userPermissions: UserPermissions, permissions: Array<{module: string, action: string}>): boolean => {
  return permissions.some(p => hasPermission(userPermissions, p.module, p.action));
};

export const getModulePermissions = (userPermissions: UserPermissions, module: string): Permission[] => {
  const m = module.toLowerCase();
  return userPermissions.permissions.filter(p => p.module?.toLowerCase() === m);
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

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const rawRoles = userData?.roles ?? [];
    let userRoles: string[] = [];

    type UserRoleLike = string | { name?: string | null };
    if (Array.isArray(rawRoles)) {
      const rolesArr = rawRoles as UserRoleLike[];
      if (rolesArr.length > 0 && typeof rolesArr[0] === 'string') {
        userRoles = rolesArr as string[];
      } else {
        userRoles = rolesArr
          .map(r => (typeof r === 'string' ? r : r?.name ?? ''))
          .filter((v): v is string => Boolean(v));
      }
    } else if (typeof rawRoles === 'string') {
      userRoles = [rawRoles];
    }

    const userRolesLC = userRoles.map(r => (r || '').toLowerCase());

    const permissions: Permission[] = [];
    roles.forEach(role => {
      if (userRolesLC.includes((role.name || '').toLowerCase())) {
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
    const rawRoles = userData?.roles ?? [];
    let userRoles: string[] = [];

    type UserRoleLike = string | { name?: string | null };
    if (Array.isArray(rawRoles)) {
      const rolesArr = rawRoles as UserRoleLike[];
      if (rolesArr.length > 0 && typeof rolesArr[0] === 'string') {
        userRoles = rolesArr as string[];
      } else {
        userRoles = rolesArr
          .map(r => (typeof r === 'string' ? r : r?.name ?? ''))
          .filter((v): v is string => Boolean(v));
      }
    } else if (typeof rawRoles === 'string') {
      userRoles = [rawRoles];
    }

    const userRolesLC = userRoles.map(r => (r || '').toLowerCase());

    const isAdmin =
      userRolesLC.includes('administrator'.toLowerCase()) ||
      userRolesLC.includes('system administrator'.toLowerCase());

    if (isAdmin) {
      const adminPermissions = generateAdminPermissions();
      return { roles: userRoles, permissions: adminPermissions };
    }
    
    return { roles: userRoles, permissions: [] };
  }
};

const generateAdminPermissions = (): Permission[] => {
  const modules = ['ReverseLogistics', 'Processing', 'DownstreamMaterials', 'AssetRecovery', 'Reporting', 'Administration', 'KnowledgeBase', 'Training', 'ProjectManagement'];
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
