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
  // UPDATED WITH NEW PERMISSION STRUCTURE
  const modulePriority = [
    // Dashboard
    { permission: "dashboard.view", path: "/dashboard" },
    
    // Material Movement
    { permission: "material.movement.view", path: "/material-movement" },
    
    // Production Planning Dashboard
    { permission: "production.planning.dashboard.view", path: "/section_production_planning/dashboard" },
    
    // Production Planning
    { permission: "productionplanning.view", path: "/section_production_planning/production_planning" },
    
    // Inventory 1 (Material Data)
    { permission: "material.data.view", path: "/section_inventory/inventory" },
    { permission: "inventory1.view", path: "/section_inventory/inventory" },
    
    // Inventory 2
    { permission: "inventory2.view", path: "/section_inventory/inventory_2" },
    
    // Inventory 3
    { permission: "inventory3.view", path: "/section_inventory/inventory_3" },
    
    // Production 1 (Usmaan) - No Kanban, No PO
    { permission: "production1.view", path: "/section_production/production_module?assign_to=Usmaan" },
    { permission: "production1.eqp.job.view", path: "/section_production/production_module?assign_to=Usmaan&client=Amar%20Equipment" },
    { permission: "production1.bio.job.view", path: "/section_production/production_module?assign_to=Usmaan&client=Amar%20Biosystem" },
    
    // Production 2 (Riyaaz) - With Kanban & PO
    { permission: "production2.view", path: "/section_production/production_module?assign_to=Riyaaz" },
    { permission: "production2.eqp.job.view", path: "/section_production/production_module?assign_to=Riyaaz&client=Amar%20Equipment" },
    { permission: "production2.bio.job.view", path: "/section_production/production_module?assign_to=Riyaaz&client=Amar%20Biosystem" },
    
    // Production 3 (Ramzan) - With Kanban & PO
    { permission: "production3.view", path: "/section_production/production_module?assign_to=Ramzan" },
    { permission: "production3.eqp.job.view", path: "/section_production/production_module?assign_to=Ramzan&client=Amar%20Equipment" },
    { permission: "production3.bio.job.view", path: "/section_production/production_module?assign_to=Ramzan&client=Amar%20Biosystem" },
    
    // QC
    { permission: "qc.view", path: "/qc" },
    { permission: "qc.eqp.view", path: "/qc?client=Amar%20Equipment" },
    { permission: "qc.bio.view", path: "/qc?client=Amar%20Biosystem" },
    
    // Procurement
    { permission: "procurement.view", path: "/procurement/dashboard" },
    
    // User Management
    { permission: "usermanagement.view", path: "/user-management" },
    { permission: "user.management.view", path: "/user-management" }, // fallback for old permission
    
    // Review (as fallback)
    { permission: "review.view", path: "/review" },
    { permission: "production1.eqp.review.view", path: "/review?assign_to=Usmaan" },
    { permission: "production2.eqp.review.view", path: "/review?assign_to=Riyaaz" },
    { permission: "production3.eqp.review.view", path: "/review?assign_to=Ramzan" },
    
    // PP Vendor
    { permission: "pp.vendor.outgoing.view", path: "/section_production_planning/vendors/outgoing" },
    { permission: "pp.vendor.incoming.view", path: "/section_production_planning/vendors/incoming" },
    
    // Outsource
    { permission: "outsource.view", path: "/section_production_planning/vendors/outsource" },
    
    // Category
    { permission: "category.view", path: "/section_production_planning/category" },
    
    // PP Equipment (Amar Equipment)
    { permission: "pp.equipment.view", path: "/section_production_planning/production_planning?client=Amar%20Equipment" },
    { permission: "pp.eqp.job.view", path: "/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Equipment" },
    { permission: "pp.eqp.tso.view", path: "/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Equipment" },
    { permission: "pp.eqp.kanban.view", path: "/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Equipment" },
    { permission: "pp.eqp.po.view", path: "/section_production_planning/po-services?client=Amar%20Equipment" },
    { permission: "pp.eqp.notok.view", path: "/section_production_planning/pp_not-ok?client=Amar%20Equipment" },
    { permission: "pp.eqp.welding.outgoing.view", path: "/section_production_planning/welding/outgoing?client=Amar%20Equipment" },
    
    // PP Biosystem (Amar Biosystem)
    { permission: "pp.biosystem.view", path: "/section_production_planning/production_planning?client=Amar%20Biosystem" },
    { permission: "pp.bio.job.view", path: "/section_production_planning/production_planning?filter=JOB_SERVICE&client=Amar%20Biosystem" },
    { permission: "pp.bio.tso.view", path: "/section_production_planning/production_planning?filter=TSO_SERVICE&client=Amar%20Biosystem" },
    { permission: "pp.bio.kanban.view", path: "/section_production_planning/production_planning?filter=KANBAN&client=Amar%20Biosystem" },
    { permission: "pp.bio.po.view", path: "/section_production_planning/po-services?client=Amar%20Biosystem" },
    { permission: "pp.bio.notok.view", path: "/section_production_planning/pp_not-ok?client=Amar%20Biosystem" },
    { permission: "pp.bio.welding.outgoing.view", path: "/section_production_planning/welding/outgoing?client=Amar%20Biosystem" },
  ];
  
  for (const module of modulePriority) {
    const hasPerm = hasPermission(permissions, module.permission);
    console.log(`Checking ${module.permission}: ${hasPerm}`);
    if (hasPerm) {
      console.log(`✅ Found first available module: ${module.permission} -> ${module.path}`);
      return module.path;
    }
  }
  
  // Check for any production permission dynamically
  const productionPermissions = permissions.filter(p => 
    p.name.startsWith("production") && p.name.endsWith(".view")
  );
  
  if (productionPermissions.length > 0) {
    console.log(`Found production permissions:`, productionPermissions.map(p => p.name));
    // Default to Production 1 with Usmaan
    return "/section_production/production_module?assign_to=Usmaan";
  }
  
  // Check for any QC permission dynamically
  const qcPermissions = permissions.filter(p => 
    p.name.startsWith("qc") && p.name.endsWith(".view")
  );
  
  if (qcPermissions.length > 0) {
    console.log(`Found QC permissions:`, qcPermissions.map(p => p.name));
    return "/qc";
  }
  
  console.log("❌ No modules found with permissions");
  return null;
};

// Helper function to get user's default client (Equipment or Biosystem)
export const getDefaultClient = (permissions: Permission[] | null): string | null => {
  if (!permissions) return null;
  
  const hasEqpPermissions = permissions.some(p => 
    p.name.includes(".eqp.") || p.name === "pp.equipment.view" || p.name === "amar-equipment.view"
  );
  
  const hasBioPermissions = permissions.some(p => 
    p.name.includes(".bio.") || p.name === "pp.biosystem.view" || p.name === "amar-bio.view"
  );
  
  if (hasEqpPermissions && !hasBioPermissions) return "Amar Equipment";
  if (hasBioPermissions && !hasEqpPermissions) return "Amar Biosystem";
  return null; // Both or none
};

// Helper function to get user's default production assignee
export const getDefaultAssignee = (permissions: Permission[] | null): string | null => {
  if (!permissions) return null;
  
  if (hasPermission(permissions, "production1.view") || 
      hasPermission(permissions, "production1.eqp.job.view") ||
      hasPermission(permissions, "production1.bio.job.view")) {
    return "Usmaan";
  }
  
  if (hasPermission(permissions, "production2.view") || 
      hasPermission(permissions, "production2.eqp.job.view") ||
      hasPermission(permissions, "production2.bio.job.view")) {
    return "Riyaaz";
  }
  
  if (hasPermission(permissions, "production3.view") || 
      hasPermission(permissions, "production3.eqp.job.view") ||
      hasPermission(permissions, "production3.bio.job.view")) {
    return "Ramzan";
  }
  
  return null;
};