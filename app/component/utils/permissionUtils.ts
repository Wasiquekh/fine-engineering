// utils/permissionUtils.ts
interface Permission {
    id: string;
    name: string;
    description: string;
  }
  
  export const hasPermission = (
    permissions: Permission[] | null,
    permissionName: string
  ): boolean => {
    if (!permissions) return false;
    return permissions.some(p => p.name === permissionName);
  };
  
  export const hasAnyPermission = (
    permissions: Permission[] | null,
    permissionNames: string[]
  ): boolean => {
    if (!permissions) return false;
    return permissionNames.some(name => permissions.some(p => p.name === name));
  };