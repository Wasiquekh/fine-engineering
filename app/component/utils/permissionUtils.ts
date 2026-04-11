// app/component/utils/permissionUtils.ts

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export const hasPermission = (permissions: Permission[] | null, permissionName: string): boolean => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissions.some(p => p.name === permissionName);
};

export const hasAnyPermission = (permissions: Permission[] | null, permissionNames: string[]): boolean => {
  if (!permissions || !Array.isArray(permissions)) return false;
  return permissionNames.some(name => permissions.some(p => p.name === name));
};

export const getFirstAvailableModulePath = (permissions: Permission[] | null): string | null => {
  console.log("========== getFirstAvailableModulePath ==========");
  console.log("Permissions received:", permissions);
  
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    console.log("No permissions found, returning null");
    return null;
  }
  
  console.log("User permission names:", permissions.map(p => p.name));
  
  // Priority order - jiska permission hoga wahi page pe jayega
  const modulePriority = [
    { permission: "dashboard.view", path: "/dashboard" },
    { permission: "material.movement.view", path: "/material-movement" },
    { permission: "production.planning.dashboard.view", path: "/section_production_planning/dashboard" },
    { permission: "production.planning.view", path: "/section_production_planning/production_planning" },
    { permission: "inventory1.view", path: "/section_inventory/inventory" },
    { permission: "inventory2.view", path: "/section_inventory/inventory_2" },
    { permission: "inventory3.view", path: "/section_inventory/inventory_3" },
    { permission: "production.1.view", path: "/section_production/production_module?assign_to=Usmaan" },
    { permission: "production.2.view", path: "/section_production/production_module?assign_to=Riyaaz" },
    { permission: "production.3.view", path: "/section_production/production_module?assign_to=Ramzaan" },
    { permission: "qc.view", path: "/qc" },
    { permission: "procurement.view", path: "/procurement/dashboard" },
    { permission: "user.management.view", path: "/user-management" },
  ];
  
  for (const module of modulePriority) {
    const hasPerm = hasPermission(permissions, module.permission);
    console.log(`Checking ${module.permission}: ${hasPerm}`);
    if (hasPerm) {
      console.log(`✅ Found first available module: ${module.permission} -> ${module.path}`);
      return module.path;
    }
  }
  
  console.log("❌ No modules found with permissions");
  return null;
};