// app/constants/routePermissions.ts
export const routePermissions: Record<string, string | string[]> = {
    // Dashboard
    "/dashboard": "dashboard.view",
    
    // Material Movement
    "/material-movement": "material.movement.view",
    
    // Inventory
    "/inventory": "inventory.view",
    "/inventory_material_approve": "inventory.view",
    
    // Production Planning
    "/production_planning": "production.planning.view",
    "/vendors": "vendors.view",
    "/category": "category.view",
    "/po-services": "po.view",
    "/pp_not-ok": "not-ok.view",
    
    // Production
    "/production_module": ["production.1.view", "production.view"],
    "/production_module_2": ["production.2.view", "production.view"],
    "/production_module_3": ["production.3.view", "production.view"],
    
    // QC
    "/qc": "qc.view",
    
    // User Management
    "/user-management": "user.management.view",
    "/user-activity": "user.management.view",
    "/role-management": "roles.view",
    "/permission-management": "permissions.view",
    "/useradd": "users.view",
    
    // Review
    "/review": "review.view",
    
    // Kanban
    "/kanban_approve": "kanban.view",
    "/kanban_details": "kanban.view",
    
    // TSO
    "/tso_approve": "tso-service.view",
    "/tso_details": "tso-service.view",
    
    // Machine
    "/machine_category": "machine.view",
    "/machine_category(kanban)": "machine.view",
    "/machine_category(tso)": "machine.view",
    
    // Other
    "/cards": "dashboard.view",
    "/customerdetails": "dashboard.view",
    "/payment-terminal": "material.movement.view",
    "/point-of-services": "material.movement.view",
    "/qrcode": "profile.view",
    "/setting": "system.settings.view",
    "/transaction": "material.movement.view",
  };
  
  export const getRoutePermission = (pathname: string): string | string[] | null => {
    // Exact match
    if (routePermissions[pathname]) {
      return routePermissions[pathname];
    }
    
    // Check for dynamic routes
    for (const route in routePermissions) {
      if (pathname.startsWith(route)) {
        return routePermissions[route];
      }
    }
    
    return null;
  };